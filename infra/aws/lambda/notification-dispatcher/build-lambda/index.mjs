import { PrismaClient } from '@prisma/client';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const prisma = new PrismaClient();
const sns = new SNSClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const ses = new SESv2Client({ region: process.env.AWS_REGION || 'ap-southeast-1' });

function parseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return `+84${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

function combineDateAndTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const date =
    dateValue instanceof Date
      ? dateValue.toISOString().slice(0, 10)
      : String(dateValue).slice(0, 10);

  const timeRaw = String(timeValue).trim();
  const time = timeRaw.length >= 5 ? timeRaw.slice(0, 5) : timeRaw;

  // Asia/Ho_Chi_Minh UTC+7
  const iso = `${date}T${time}:00+07:00`;
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDateTimeVN(date) {
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

async function fetchRecipients(filters = {}) {
  const roles = filters.roles?.length ? filters.roles : undefined;
  const userIds = filters.userIds?.length ? filters.userIds : undefined;

  const users = await prisma.user.findMany({
    where: {
      ...(roles ? { role: { in: roles } } : {}),
      ...(userIds ? { id: { in: userIds } } : {}),
      personalInfo: {
        isNot: null
      }
    },
    select: {
      id: true,
      username: true,
      role: true,
      personalInfo: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      }
    }
  });

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    name: [user.personalInfo?.firstName, user.personalInfo?.lastName].filter(Boolean).join(' ').trim(),
    email: user.personalInfo?.email || null,
    phone: normalizePhone(user.personalInfo?.phone || null)
  }));
}

async function fetchUpcomingTimeBlockReminders({ minutesAhead = 30, lookbackMinutes = 5 }) {
  const now = new Date();
  const windowStart = new Date(now.getTime() + (minutesAhead - lookbackMinutes) * 60 * 1000);
  const windowEnd = new Date(now.getTime() + minutesAhead * 60 * 1000);

  const dateStart = windowStart.toISOString().slice(0, 10);
  const dateEnd = windowEnd.toISOString().slice(0, 10);
  const candidateDates = dateStart === dateEnd ? [dateStart] : [dateStart, dateEnd];

  const blocks = await prisma.timeBlock.findMany({
    where: {
      date: {
        in: candidateDates
      }
    },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      startTime: true,
      endTime: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          personalInfo: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }
    }
  });

  const reminders = [];

  for (const block of blocks) {
    const startAt = combineDateAndTime(block.date, block.startTime);
    if (!startAt) continue;

    if (startAt >= windowStart && startAt <= windowEnd) {
      const email = block.user?.personalInfo?.email || null;
      if (!email) continue;

      reminders.push({
        timeBlockId: block.id,
        userId: block.userId,
        username: block.user?.username || null,
        email,
        name: [block.user?.personalInfo?.firstName, block.user?.personalInfo?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim(),
        title: block.title || 'Lịch học / sự kiện',
        description: block.description || '',
        date: block.date,
        startTime: block.startTime,
        endTime: block.endTime,
        startAt
      });
    }
  }

  return reminders;
}

async function wasReminderSent({ userId, timeBlockId, channel, type }) {
  const existing = await prisma.notificationDelivery.findUnique({
    where: {
      userId_timeBlockId_channel_type: {
        userId,
        timeBlockId,
        channel,
        type
      }
    }
  });

  return !!existing;
}

async function markReminderSent({ userId, timeBlockId, channel, type }) {
  await prisma.notificationDelivery.create({
    data: {
      userId,
      timeBlockId,
      channel,
      type
    }
  });
}

function buildReminderEmail(reminder, minutesAhead) {
  const displayName = reminder.name || reminder.username || 'bạn';
  const startText = formatDateTimeVN(reminder.startAt);

  return {
    subject: `Nhắc lịch: "${reminder.title}" bắt đầu sau ${minutesAhead} phút`,
    message:
      `Xin chào ${displayName},\n\n` +
      `Đây là email nhắc lịch cho sự kiện/lịch học "${reminder.title}".\n` +
      `Thời gian bắt đầu: ${startText}\n` +
      (reminder.endTime ? `Thời gian kết thúc: ${String(reminder.endTime)}\n` : '') +
      (reminder.description ? `Mô tả: ${reminder.description}\n` : '') +
      `\nVui lòng kiểm tra ứng dụng Student Timetable để xem chi tiết.\n`
  };
}

async function sendSms(phoneNumber, message) {
  await sns.send(
    new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message
    })
  );
}

async function sendEmail(email, subject, message) {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) {
    throw new Error('SES_FROM_EMAIL is required for email delivery');
  }

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: {
        ToAddresses: [email]
      },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: {
            Text: { Data: message }
          }
        }
      }
    })
  );
}

async function handleTimeBlockReminders(payload) {
  const channel = payload.channel || 'email';
  const minutesAhead = Number(payload.minutesAhead || 30);
  const lookbackMinutes = Number(payload.lookbackMinutes || 5);

  if (channel !== 'email') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'timeblock_reminders currently only supports email'
      })
    };
  }

  const reminders = await fetchUpcomingTimeBlockReminders({
    minutesAhead,
    lookbackMinutes
  });

  const results = [];
  const reminderType = `timeblock_${minutesAhead}m_before`;

  for (const reminder of reminders) {
    try {
      const alreadySent = await wasReminderSent({
        userId: reminder.userId,
        timeBlockId: reminder.timeBlockId,
        channel: 'email',
        type: reminderType
      });

      if (alreadySent) {
        results.push({
          userId: reminder.userId,
          timeBlockId: reminder.timeBlockId,
          channel: 'email',
          target: reminder.email,
          status: 'skipped',
          reason: 'already_sent'
        });
        continue;
      }

      const emailContent = buildReminderEmail(reminder, minutesAhead);

      await sendEmail(reminder.email, emailContent.subject, emailContent.message);

      await markReminderSent({
        userId: reminder.userId,
        timeBlockId: reminder.timeBlockId,
        channel: 'email',
        type: reminderType
      });

      results.push({
        userId: reminder.userId,
        timeBlockId: reminder.timeBlockId,
        channel: 'email',
        target: reminder.email,
        status: 'sent'
      });
    } catch (error) {
      results.push({
        userId: reminder.userId,
        timeBlockId: reminder.timeBlockId,
        channel: 'email',
        target: reminder.email,
        status: 'failed',
        error: error.message
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      mode: 'timeblock_reminders',
      totalCandidates: reminders.length,
      delivered: results.filter((item) => item.status === 'sent').length,
      results
    })
  };
}

async function handleDirectNotification(payload) {
  const channel = payload.channel || 'sms';
  const message = payload.message;
  const subject = payload.subject || 'Student Timetable Notification';

  if (!message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'message is required' })
    };
  }

  const recipients = await fetchRecipients({
    roles: parseArray(payload.roles),
    userIds: parseArray(payload.userIds)
  });

  const results = [];
  for (const recipient of recipients) {
    try {
      if (channel === 'sms') {
        if (!recipient.phone) continue;
        await sendSms(recipient.phone, message);
        results.push({
          userId: recipient.id,
          channel: 'sms',
          target: recipient.phone,
          status: 'sent'
        });
      } else if (channel === 'email') {
        if (!recipient.email) continue;
        await sendEmail(recipient.email, subject, message);
        results.push({
          userId: recipient.id,
          channel: 'email',
          target: recipient.email,
          status: 'sent'
        });
      } else {
        throw new Error(`Unsupported channel: ${channel}`);
      }
    } catch (error) {
      results.push({
        userId: recipient.id,
        channel,
        target: channel === 'sms' ? recipient.phone : recipient.email,
        status: 'failed',
        error: error.message
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      mode: 'direct',
      totalRecipients: recipients.length,
      delivered: results.filter((item) => item.status === 'sent').length,
      results
    })
  };
}

export const handler = async (event) => {
  const payload = typeof event === 'string' ? JSON.parse(event) : event;
  const mode = payload.mode || 'direct';

  if (mode === 'timeblock_reminders') {
    return await handleTimeBlockReminders(payload);
  }

  return await handleDirectNotification(payload);
};