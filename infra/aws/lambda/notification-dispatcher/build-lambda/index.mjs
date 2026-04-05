import { PrismaClient } from '@prisma/client';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const prisma = new PrismaClient();
const sns = new SNSClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const ses = new SESv2Client({ region: process.env.AWS_REGION || 'ap-southeast-1' });

function parseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
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

async function sendSms(phoneNumber, message) {
  await sns.send(new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message
  }));
}

async function sendEmail(email, subject, message) {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) {
    throw new Error('SES_FROM_EMAIL is required for email delivery');
  }

  await ses.send(new SendEmailCommand({
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
  }));
}

export const handler = async (event) => {
  const payload = typeof event === 'string' ? JSON.parse(event) : event;
  const channel = payload.channel || 'sms';
  const message = payload.message;
  const subject = payload.subject || 'Student Timetable Notification';

  if (!message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'message is required' }) };
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
        results.push({ userId: recipient.id, channel: 'sms', target: recipient.phone, status: 'sent' });
      } else if (channel === 'email') {
        if (!recipient.email) continue;
        await sendEmail(recipient.email, subject, message);
        results.push({ userId: recipient.id, channel: 'email', target: recipient.email, status: 'sent' });
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
      totalRecipients: recipients.length,
      delivered: results.filter((item) => item.status === 'sent').length,
      results
    })
  };
};
