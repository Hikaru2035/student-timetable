# System Architecture & UML Diagrams

Bộ diagram dưới đây được chuẩn hóa cho hệ thống gồm **Frontend, Backend, Mobile, CI/CD, Monitoring, AWS**. Tôi dùng **Mermaid** để bạn có thể render nhanh trong Markdown/Notion/GitHub. Bạn chỉ cần thay tên service, repo, env, queue, database theo hệ thống thực tế.

---

## 1) High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Users[Users]
        EndUser[End User]
        Admin[Admin / Internal User]
    end

    subgraph Clients[Client Layer]
        Web[Frontend Web App]
        Mobile[Mobile App]
    end

    subgraph Edge[Edge Layer]
        DNS[Route 53 / DNS]
        CDN[CloudFront]
        ALB[Application Load Balancer]
    end

    subgraph App[Application Layer]
        API[Backend API Service]
        Auth[Auth Service / JWT / OAuth]
        Worker[Background Worker]
    end

    subgraph Data[Data Layer]
        DB[(RDS / PostgreSQL)]
        Cache[(ElastiCache / Redis)]
        Queue[(SQS / Queue)]
        Storage[(S3 Object Storage)]
    end

    subgraph Ops[Observability & Operations]
        Logs[CloudWatch Logs]
        Metrics[Grafana / Datadog / CloudWatch Metrics]
        Errors[Sentry / Error Tracking]
        Alerts[Alerting: Slack / Email / PagerDuty]
    end

    EndUser --> Web
    EndUser --> Mobile
    Admin --> Web

    Web --> DNS --> CDN --> ALB --> API
    Mobile --> ALB

    API --> Auth
    API --> DB
    API --> Cache
    API --> Queue
    API --> Storage

    Worker --> Queue
    Worker --> DB
    Worker --> Storage

    API --> Logs
    API --> Metrics
    API --> Errors
    Worker --> Logs
    Worker --> Metrics
    Logs --> Alerts
    Metrics --> Alerts
    Errors --> Alerts
```

---

## 2) Clean AWS Architecture Diagram

```mermaid
flowchart TB
    Internet[Internet Users]
    Route53[Route 53]
    CloudFront[CloudFront]
    ALB[Application Load Balancer]

    subgraph VPC[VPC]
        subgraph PublicSubnets[Public Subnets]
            ALB2[ALB]
            Bastion[Bastion / VPN Optional]
        end

        subgraph PrivateSubnetsApp[Private App Subnets]
            ECS1[ECS / EKS / EC2 App Service]
            ECS2[Worker Service]
        end

        subgraph PrivateSubnetsData[Private Data Subnets]
            RDS[(RDS PostgreSQL/MySQL)]
            Redis[(ElastiCache Redis)]
        end
    end

    S3[S3 Static / Uploads]
    ECR[ECR Docker Images]
    CW[CloudWatch]
    Secrets[Secrets Manager / SSM]
    SQS[SQS]

    Internet --> Route53 --> CloudFront --> ALB --> ALB2
    ALB2 --> ECS1
    ECS1 --> RDS
    ECS1 --> Redis
    ECS1 --> S3
    ECS1 --> SQS
    ECS2 --> SQS
    ECS2 --> RDS
    ECS2 --> S3
    ECR --> ECS1
    ECR --> ECS2
    ECS1 --> CW
    ECS2 --> CW
    Secrets --> ECS1
    Secrets --> ECS2
```

---

## 3) C4-style Container Diagram

```mermaid
flowchart LR
    User[User]
    Admin[Admin]

    Web[Web Frontend\nReact / Next.js]
    Mobile[Mobile App\nFlutter / React Native]
    API[Backend API\nNode / Go / Java / Python]
    Worker[Async Worker\nJobs / Notification / Batch]
    DB[(Relational Database)]
    Redis[(Redis Cache)]
    Queue[(Message Queue)]
    S3[(Object Storage)]
    Monitoring[Monitoring Stack]

    User --> Web
    User --> Mobile
    Admin --> Web
    Web --> API
    Mobile --> API
    API --> DB
    API --> Redis
    API --> Queue
    API --> S3
    Worker --> Queue
    Worker --> DB
    Worker --> S3
    API --> Monitoring
    Worker --> Monitoring
```

---

## 4) UML Use Case Diagram

```mermaid
flowchart LR
    User((User))
    Admin((Admin))
    DevOps((DevOps / Engineer))

    UC1([Login / Authenticate])
    UC2([Browse / Use Web Features])
    UC3([Use Mobile Features])
    UC4([Call Backend API])
    UC5([Manage Content / Admin Action])
    UC6([Deploy Release])
    UC7([Monitor System Health])
    UC8([Investigate Logs / Errors])

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    Admin --> UC1
    Admin --> UC5
    DevOps --> UC6
    DevOps --> UC7
    DevOps --> UC8
```

---

## 5) UML Component Diagram

```mermaid
flowchart LR
    subgraph Client
        FE[Frontend Web]
        MB[Mobile App]
    end

    subgraph Backend
        Gateway[API Gateway / Load Balancer]
        AuthC[Auth Component]
        UserC[User Module]
        BizC[Business Module]
        FileC[File Module]
        NotifyC[Notification Module]
        JobC[Job Worker]
    end

    subgraph Infra
        DB[(Database)]
        Redis[(Redis)]
        Queue[(Queue)]
        S3[(S3)]
        Obs[Monitoring / Logging]
    end

    FE --> Gateway
    MB --> Gateway
    Gateway --> AuthC
    Gateway --> UserC
    Gateway --> BizC
    Gateway --> FileC
    BizC --> NotifyC
    NotifyC --> Queue
    JobC --> Queue
    AuthC --> DB
    UserC --> DB
    BizC --> DB
    BizC --> Redis
    FileC --> S3
    Gateway --> Obs
    JobC --> Obs
```

---

## 6) UML Deployment Diagram

```mermaid
flowchart TB
    Device1[User Browser]
    Device2[Mobile Device]

    subgraph AWS[AWS Cloud]
        DNS[Route 53]
        CDN[CloudFront]
        ALB[ALB]

        subgraph Compute[Compute]
            AppNode[App Service\nECS / EKS / EC2]
            WorkerNode[Worker Service]
        end

        subgraph DataServices[Managed Data Services]
            DB[(RDS)]
            Redis[(ElastiCache)]
            SQS[(SQS)]
            S3[(S3)]
        end

        subgraph Ops[Operations]
            CW[CloudWatch]
            Sentry[Sentry / APM]
        end
    end

    Device1 --> DNS --> CDN --> ALB --> AppNode
    Device2 --> ALB --> AppNode
    AppNode --> DB
    AppNode --> Redis
    AppNode --> SQS
    AppNode --> S3
    WorkerNode --> SQS
    WorkerNode --> DB
    WorkerNode --> S3
    AppNode --> CW
    WorkerNode --> CW
    AppNode --> Sentry
```

---

## 7) UML Sequence Diagram — User Login Flow

```mermaid
sequenceDiagram
    actor User
    participant Web as Web / Mobile Client
    participant API as Backend API
    participant Auth as Auth Service
    participant DB as Database
    participant Cache as Redis

    User->>Web: Enter credentials
    Web->>API: POST /auth/login
    API->>Auth: Validate credentials
    Auth->>DB: Get user by email/phone
    DB-->>Auth: User record
    Auth->>Auth: Verify password / token policy
    Auth->>Cache: Store session / token metadata
    Auth-->>API: Access token + refresh token
    API-->>Web: 200 OK + auth payload
    Web-->>User: Logged in state
```

---

## 8) UML Sequence Diagram — Main Business Request

```mermaid
sequenceDiagram
    actor User
    participant Client as Frontend / Mobile
    participant API as Backend API
    participant Cache as Redis
    participant DB as Database
    participant Queue as Queue
    participant Worker as Background Worker

    User->>Client: Perform action
    Client->>API: Request with JWT
    API->>Cache: Check cache
    alt Cache hit
        Cache-->>API: Cached data
        API-->>Client: Response
    else Cache miss
        API->>DB: Query data / update transaction
        DB-->>API: Result
        API->>Cache: Update cache
        API->>Queue: Publish async event
        API-->>Client: Response
        Worker->>Queue: Consume event
        Worker->>DB: Update async state / audit log
    end
```

---

## 9) UML Sequence Diagram — CI/CD Flow

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant Git as GitHub / GitLab
    participant CI as CI Pipeline
    participant Registry as ECR / Artifact Registry
    participant Deploy as Deployment Step
    participant App as AWS Runtime
    participant Monitor as Monitoring

    Dev->>Git: Push commit / create PR
    Git->>CI: Trigger pipeline
    CI->>CI: Run lint + unit test + build
    alt PR pipeline success
        CI-->>Git: Status checks passed
    end
    Dev->>Git: Merge to main
    Git->>CI: Trigger release pipeline
    CI->>Registry: Build and push image
    CI->>Deploy: Trigger deploy to staging/prod
    Deploy->>App: Roll out new version
    App->>Monitor: Emit logs / metrics / health checks
    Monitor-->>Dev: Alert if issue detected
```

---

## 10) UML Activity Diagram — Release Process

```mermaid
flowchart TD
    A[Developer pushes code] --> B[PR created]
    B --> C[Run lint/test/build checks]
    C --> D{Checks passed?}
    D -- No --> E[Fix code and push again]
    E --> C
    D -- Yes --> F[Review and approve PR]
    F --> G[Merge to main]
    G --> H[Build artifact / Docker image]
    H --> I[Push to registry]
    I --> J[Deploy to staging]
    J --> K{Smoke test OK?}
    K -- No --> L[Rollback / fix issue]
    K -- Yes --> M[Promote to production]
    M --> N[Monitor logs, metrics, alerts]
```

---

## 11) UML State Diagram — Service Health

```mermaid
stateDiagram-v2
    [*] --> Starting
    Starting --> Healthy: Startup checks passed
    Starting --> Unhealthy: Startup failed
    Healthy --> Degraded: High latency / partial dependency failure
    Degraded --> Healthy: Recovered
    Healthy --> Unhealthy: Crash / fatal dependency issue
    Degraded --> Unhealthy: Error threshold exceeded
    Unhealthy --> Restarting: Auto-restart / redeploy
    Restarting --> Starting
    Restarting --> Unhealthy: Restart failed
```

---

## 12) Recommended Naming You Should Replace

* `Frontend Web App` → tên web app thực tế
* `Mobile App` → tên app mobile thực tế
* `Backend API Service` → tên service chính
* `Background Worker` → tên worker / consumer thực tế
* `RDS / PostgreSQL` → loại DB thực tế
* `ElastiCache / Redis` → cache thực tế
* `SQS / Queue` → loại queue thực tế
* `Grafana / Datadog / CloudWatch Metrics` → tool monitoring thực tế
* `Sentry / Error Tracking` → error tracking thực tế

---

## 13) Bộ Diagram Tối Thiểu Nên Dùng Khi Thuyết Trình

Nếu bạn chỉ muốn bộ ngắn, nên dùng đúng 5 diagram này:

1. High-Level Architecture Diagram
2. AWS Architecture Diagram
3. UML Component Diagram
4. UML Sequence Diagram — Main Business Request
5. UML Sequence Diagram — CI/CD Flow

---

## 14) Cách Thuyết Trình Theo Diagram

* Bắt đầu bằng **High-Level Architecture** để định vị các khối lớn.
* Chuyển sang **AWS Architecture** để map ứng dụng vào hạ tầng thực.
* Dùng **Component Diagram** để giải thích phân rã trong backend.
* Dùng **Login Flow** hoặc **Main Business Request** để mô tả runtime.
* Kết thúc bằng **CI/CD Flow** và **Monitoring** để chứng minh vận hành hoàn chỉnh.

---

## 15) Nếu Muốn Chuẩn Hóa Theo Hệ Thống Của Bạn

Hãy thay thế thêm các mục sau:

* FE framework: React / Next.js / Vue
* BE stack: NestJS / Express / Go / Spring / FastAPI
* Mobile stack: Flutter / React Native / native
* Runtime: ECS / EKS / EC2 / Lambda
* Database: PostgreSQL / MySQL / MongoDB
* Queue: SQS / RabbitMQ / Kafka
* Monitoring: Grafana / Datadog / Sentry / CloudWatch
* CI/CD: GitHub Actions / GitLab CI / Jenkins

Khi bạn gửi stack thực tế, tôi có thể chuyển bộ diagram này thành bản **đúng 100% theo hệ thống của bạn**, với tên service, flow và AWS resources cụ thể.
