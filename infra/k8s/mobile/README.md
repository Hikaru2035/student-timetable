# Mobile deployment notes

Mobile applications are distributed through the app stores, not through Kubernetes.

## What stays in EKS

- Backend API
- PostgreSQL / supporting AWS services
- Notification Lambda integration

## What is deployed separately

- Android app build (AAB/APK)
- iOS app build (IPA)

## Release flow

1. Set `EXPO_PUBLIC_API_URL` to the public API domain.
2. Build with EAS.
3. Submit to Google Play / App Store.
4. Keep backend CORS and API auth aligned with the mobile client.

Mobile does not require an EKS `Deployment` or `Service` because the executable runs on the user's device.
