# Notification dispatcher Lambda

This Lambda queries `User` and `PersonalInfo` from PostgreSQL via Prisma, then sends:

- SMS through Amazon SNS using `phone`
- Email through Amazon SES using `email`

## Why SES for email

Amazon SNS can publish directly to phone numbers for SMS, but email delivery in SNS is topic-subscription based. For application-triggered email to addresses stored in the DB, SES is the better fit.

## Event examples

### SMS to all students

```json
{
  "channel": "sms",
  "roles": ["STUDENT"],
  "message": "Tomorrow's exam starts at 08:00."
}
```

### Email to selected users

```json
{
  "channel": "email",
  "userIds": ["uuid-1", "uuid-2"],
  "subject": "Schedule update",
  "message": "Your class has moved to room B201."
}
```

## Required environment variables

- `DATABASE_URL`
- `AWS_REGION`
- `SES_FROM_EMAIL`

## Minimal IAM permissions

- `sns:Publish`
- `ses:SendEmail`
- `ses:SendRawEmail`
- network access to the PostgreSQL database
