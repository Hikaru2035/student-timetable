# Added mobile frontend and notification Lambda

## Mobile frontend

- New folder: `mobile/`
- Stack: Expo + React Native
- Screens included:
  - Login
  - Timetable list
  - Personal info update
- Config via `EXPO_PUBLIC_API_URL`
- Release via Expo EAS (`mobile/eas.json`)

## Mobile deployment

- Added `mobile/README.md`
- Added `.github/workflows/mobile.yml`
- Added `infra/k8s/mobile/README.md` to clarify that mobile is released through app stores, not Kubernetes

## Notification Lambda

- New folder: `infra/aws/lambda/notification-dispatcher/`
- Reads recipients from PostgreSQL via Prisma
- Sends SMS through SNS
- Sends email through SES
- Added deploy helper: `deploy.sh`
- Added IAM policies:
  - `infra/aws/iam/lambda-notification-policy.json`
  - `infra/aws/iam/backend-invoke-lambda-policy.json`

## Backend integration

- Added dependency `@aws-sdk/client-lambda`
- Added service `backend/src/services/notificationLambda.js`
- Added admin endpoint `POST /api/admin/notifications/send`
- Added new secrets/env references:
  - `AWS_REGION`
  - `NOTIFICATION_LAMBDA_NAME`

## Sample admin payload

```json
{
  "channel": "sms",
  "roles": ["STUDENT"],
  "message": "Reminder: class starts at 08:00 tomorrow."
}
```

```json
{
  "channel": "email",
  "userIds": ["user-uuid-1", "user-uuid-2"],
  "subject": "Schedule changed",
  "message": "Your schedule has been updated. Please check the mobile app."
}
```
