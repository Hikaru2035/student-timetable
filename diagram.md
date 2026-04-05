# Student Timetable — Architecture Diagrams

* **Frontend web**: React + Vite + React Router + Tailwind
* **Backend API**: Express 5 + Prisma + PostgreSQL + JWT
* **Mobile app**: Expo / React Native
* **Infra**: AWS EKS + ECR + ALB Ingress + Secrets Manager + External Secrets
* **Monitoring**: kube-prometheus-stack + Grafana + Loki + Alloy
* **Notification**: AWS Lambda calls the backend admin endpoint, sends email via SES
* **CI/CD**: GitHub Actions + Jenkins

---

## 1) Architecture diagram general system 

```mermaid
flowchart TB
    User[Student / Teacher / Admin]
    Browser[Web Browser]
    Phone[Mobile App - Expo React Native]

    DNS[Public Domain\nphungngocdiep05.id.vn]
    ALB[ALB Ingress on EKS]

    subgraph EKS[EKS Cluster: student-timetable-prod]
        FE[Frontend Deployment\nReact + Nginx\n2 replicas]
        BE[Backend Deployment\nExpress + Prisma\n2 replicas]
        ES[External Secrets]
    end

    Secrets[AWS Secrets Manager]
    DB[(PostgreSQL)]
    Lambda[AWS Lambda\nnotification-dispatcher]
    SNS[SNS SMS]
    SES[SES Email]

    subgraph Monitoring[Monitoring Namespace]
        Grafana[Grafana]
        Prom[Prometheus stack]
        Loki[Loki]
        Alloy[Alloy log collector]
    end

    User --> Browser --> DNS --> ALB
    User --> Phone --> ALB
    ALB --> FE
    ALB --> BE
    FE --> BE
    BE --> DB
    ES --> Secrets
    ES --> BE
    BE --> Lambda
    Lambda --> DB
    Lambda --> SNS
    Lambda --> SES
    FE --> Alloy
    BE --> Alloy
    Alloy --> Loki
    Prom --> Grafana
    Loki --> Grafana
```
---

## 2) AWS / Deployment diagram 

```mermaid
flowchart TB
    Internet[Internet Users]
    Route[Domain / DNS]
    Ingress[ALB Ingress\nHTTP 80 / HTTPS 443]

    subgraph AWS[AWS ap-southeast-1]
        subgraph EKSCluster[EKS student-timetable-prod]
            subgraph AppNS[Namespace: app]
                FEPod[frontend pods x2\ncontainerPort 80]
                BEPod[backend pods x2\ncontainerPort 3001]
                FEsvc[frontend ClusterIP Service]
                BEsvc[backend ClusterIP Service]
                ExtSecret[ExternalSecret backend-env]
            end

            subgraph MonNS[Namespace: monitoring]
                GrafanaSvc[Grafana]
                LokiSvc[Loki / loki-gateway]
                AlloyPods[Alloy pods]
                PromSvc[Prometheus stack]
            end
        end

        ECR1[ECR student-timetable-frontend]
        ECR2[ECR student-timetable-backend]
        SecretMgr[Secrets Manager\nstudent-timetable/backend1]
        LambdaFn[Lambda notification-dispatcher]
        RDS[(PostgreSQL)]
        SNS[SNS]
        SES[SES]
    end

    Internet --> Route --> Ingress
    Ingress --> FEsvc --> FEPod
    Ingress --> BEsvc --> BEPod
    FEPod --> BEsvc
    BEPod --> RDS
    ExtSecret --> SecretMgr
    ExtSecret --> BEPod
    BEPod --> LambdaFn
    LambdaFn --> RDS
    LambdaFn --> SNS
    LambdaFn --> SES
    ECR1 --> FEPod
    ECR2 --> BEPod
    FEPod --> AlloyPods
    BEPod --> AlloyPods
    AlloyPods --> LokiSvc
    PromSvc --> GrafanaSvc
    LokiSvc --> GrafanaSvc
```

---

## 3) UML component diagram 

```mermaid
flowchart LR
    subgraph ClientLayer[Client Layer]
        Web[Web Frontend]
        Mobile[Mobile App]
    end

    subgraph BackendLayer[Backend API]
        Auth[Auth Routes]
        TimeBlocks[TimeBlocks Routes]
        PersonalInfo[PersonalInfo Routes]
        Admin[Admin Routes]
        Analytics[Analytics Routes]
        Middleware[Auth + Admin Middleware]
        LambdaSvc[Notification Lambda Service]
    end

    subgraph DataLayer[Data Layer]
        Prisma[Prisma ORM]
        PG[(PostgreSQL)]
    end

    subgraph NotifyLayer[Notification Layer]
        Lambda[notification-dispatcher Lambda]
        SNS[SNS SMS]
        SES[SES Email]
    end

    Web --> Middleware
    Mobile --> Middleware
    Middleware --> Auth
    Middleware --> TimeBlocks
    Middleware --> PersonalInfo
    Middleware --> Admin
    Middleware --> Analytics

    Auth --> Prisma
    TimeBlocks --> Prisma
    PersonalInfo --> Prisma
    Admin --> Prisma
    Analytics --> Prisma
    Prisma --> PG

    Admin --> LambdaSvc --> Lambda
    Lambda --> PG
    Lambda --> SNS
    Lambda --> SES
```

---

## 4) UML sequence diagram — login flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Web / Mobile
    participant API as Express API
    participant Prisma as Prisma
    participant DB as PostgreSQL

    User->>FE: Enter username + password
    FE->>API: POST /api/auth/login
    API->>Prisma: findUnique(User by username)
    Prisma->>DB: Query user
    DB-->>Prisma: user record
    Prisma-->>API: user
    API->>API: bcrypt.compare + generate JWT
    API-->>FE: token + user + set cookie(token)
    FE->>FE: save token localStorage
    FE-->>User: Login Successful
```

---

## 5) UML sequence diagram — Manage timetable / time block

```mermaid
sequenceDiagram
    actor User
    participant FE as Web / Mobile
    participant API as Backend API
    participant Auth as requireAuth middleware
    participant Prisma as Prisma ORM
    participant DB as PostgreSQL

    User->>FE: Create / Edit / Delete time block
    FE->>API: POST|PUT|DELETE /api/timeblocks
    API->>Auth: Verify JWT
    Auth-->>API: req.userId
    API->>Prisma: create/update/delete TimeBlock
    Prisma->>DB: SQL transaction
    DB-->>Prisma: result
    Prisma-->>API: updated entity
    API-->>FE: JSON response
    FE-->>User: UI update event
```

---

## 6) UML sequence diagram — admin sends notification

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Admin Web UI
    participant API as Backend Admin Route
    participant LambdaSvc as invokeNotificationLambda()
    participant Lambda as AWS Lambda
    participant DB as PostgreSQL
    participant SNS as Amazon SNS
    participant SES as Amazon SES

    Admin->>FE: Choose channel + recipients + message
    FE->>API: POST /api/admin/notifications/send
    API->>API: requireAuth + requireAdmin
    API->>LambdaSvc: invokeNotificationLambda(payload)
    LambdaSvc->>Lambda: InvokeCommand(RequestResponse)
    Lambda->>DB: Query recipients from User/PersonalInfo
    alt channel = sms
        Lambda->>SNS: Publish SMS
    else channel = email
        Lambda->>SES: Send email
    end
    Lambda-->>API: delivery result
    API-->>FE: result JSON
    FE-->>Admin: Notification send success / fail
```
---

## 7) CI/CD diagram

```mermaid
flowchart LR
    Dev[Developer] --> Git[GitHub Repository]

    Git --> GHA[GitHub Actions CI]
    GHA --> B1[Backend npm ci]
    GHA --> F1[Frontend npm ci + build]
    GHA --> D1[Docker compose build + push\nDocker Hub]

    Git --> Jenkins[Jenkins Release Pipeline]
    Jenkins --> ECR[ECR login]
    Jenkins --> Build[Build backend/frontend images]
    Build --> Push[Push images to ECR]
    Push --> Deploy[kubectl set image on EKS]
    Deploy --> Rollout[Rollout status check]

    Rollout --> EKSRun[EKS app namespace]
    EKSRun --> Monitor[Grafana / Loki / cluster health]
```
---

## 8) Monitoring architecture diagram

```mermaid
flowchart LR
    subgraph AppNS[Namespace app]
        FE[frontend pods]
        BE[backend pods]
    end

    subgraph MonNS[Namespace monitoring]
        Alloy[Grafana Alloy]
        Loki[loki-gateway / Loki]
        Prom[kube-prometheus-stack]
        Grafana[Grafana]
    end

    FE --> Alloy
    BE --> Alloy
    Alloy --> Loki
    Loki --> Grafana
    Prom --> Grafana
```

