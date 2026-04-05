# Mobile frontend

This Expo/React Native app reuses the existing backend APIs.

## Local run

```bash
cd mobile
npm install
cp .env.example .env
npm run start
```

Set `EXPO_PUBLIC_API_URL` to the backend base URL, for example:

```env
EXPO_PUBLIC_API_URL=https://your-api-domain/api
```

## Deploy / release

This repository uses Expo Application Services (EAS) for mobile delivery.

### Android preview build

```bash
eas build --platform android --profile preview
```

### Production builds

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Store submission

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

## Required secrets / configuration

- Expo account and EAS project initialization
- Android keystore / Play Console access
- Apple Developer account for iOS
- `EXPO_PUBLIC_API_URL` pointing to the public backend API
