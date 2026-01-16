# Architecture Diagrams

## 1. System Architecture Overview

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Web["Next.js 15 App<br/>(React 19)"]
        Mobile["Mobile/API Clients"]
    end

    subgraph API["API Layer"]
        oRPC["oRPC Router<br/>/api/rpc/* (binary)<br/>/api/* (REST)"]
        Auth["Better Auth<br/>(Sessions, OAuth, Passkeys)"]
        Webhooks["Webhook Handlers<br/>(Stripe, etc.)"]
    end

    subgraph Workers["Background Workers"]
        PgBoss["pg-boss<br/>(Job Queue)"]
        Processors["Tool Processors<br/>(Invoice, Contract, etc.)"]
    end

    subgraph Data["Data Layer"]
        Postgres[(PostgreSQL<br/>Supabase)]
        S3[(S3 Storage)]
        Redis[(Redis Cache)]
    end

    subgraph External["External Services"]
        Stripe["Stripe<br/>(Payments)"]
        AI["AI Providers<br/>(Anthropic, OpenAI)"]
        Email["Email<br/>(Resend, etc.)"]
    end

    Web --> oRPC
    Mobile --> oRPC
    oRPC --> Auth
    oRPC --> Postgres
    oRPC --> PgBoss
    PgBoss --> Processors
    Processors --> AI
    Processors --> Postgres
    Webhooks --> Stripe
    Webhooks --> Postgres
    Web --> S3
    oRPC --> Email
```

## 2. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant A as Better Auth
    participant DB as Database
    participant O as OAuth Provider

    rect rgb(240, 248, 255)
        Note over U,O: Email/Password Login
        U->>W: Enter credentials
        W->>A: POST /auth/sign-in/email
        A->>DB: Verify credentials
        DB-->>A: User record
        A->>DB: Create Session
        A-->>W: Set session cookie
        W-->>U: Redirect to dashboard
    end

    rect rgb(255, 248, 240)
        Note over U,O: OAuth Login (Google/GitHub)
        U->>W: Click "Sign in with Google"
        W->>A: GET /auth/sign-in/social
        A->>O: Redirect to OAuth provider
        O-->>U: Authorization consent
        U->>O: Approve
        O-->>A: Authorization code
        A->>O: Exchange for tokens
        A->>DB: Find/Create User + Account
        A->>DB: Create Session
        A-->>W: Set session cookie
        W-->>U: Redirect to dashboard
    end

    rect rgb(240, 255, 240)
        Note over U,O: Passkey Authentication
        U->>W: Click "Sign in with Passkey"
        W->>A: GET /auth/passkey/authenticate
        A-->>W: Challenge
        W->>U: Browser WebAuthn prompt
        U->>W: Biometric/PIN
        W->>A: POST signed challenge
        A->>DB: Verify passkey
        A->>DB: Create Session
        A-->>W: Set session cookie
    end
```

## 3. API Request Flow (oRPC)

```mermaid
flowchart LR
    subgraph Client
        RC["oRPC Client<br/>(TanStack Query)"]
    end

    subgraph Server["Fastify Server"]
        direction TB
        RPC["RPCHandler<br/>/api/rpc/*"]
        REST["OpenAPIHandler<br/>/api/*"]
    end

    subgraph Middleware["Middleware Chain"]
        direction TB
        Ctx["Context Creation<br/>(headers)"]
        AuthMW["Auth Middleware<br/>(session extraction)"]
        RoleMW["Role Middleware<br/>(admin check)"]
    end

    subgraph Procedures
        direction TB
        Public["publicProcedure"]
        Protected["protectedProcedure<br/>(+ user context)"]
        Admin["adminProcedure<br/>(+ role check)"]
    end

    subgraph Handlers["Route Handlers"]
        direction TB
        H1["users/*"]
        H2["organizations/*"]
        H3["payments/*"]
        H4["jobs/*"]
        H5["ai/*"]
    end

    RC -->|Binary| RPC
    RC -->|JSON| REST
    RPC --> Ctx
    REST --> Ctx
    Ctx --> AuthMW
    AuthMW --> Public
    AuthMW --> Protected
    Protected --> RoleMW
    RoleMW --> Admin
    Public --> H1
    Protected --> H2
    Protected --> H3
    Protected --> H4
    Admin --> H5
```

## 4. Background Job Processing Pipeline

```mermaid
stateDiagram-v2
    [*] --> PENDING: Job Created

    PENDING --> PROCESSING: Worker Claims Job
    PROCESSING --> COMPLETED: Success
    PROCESSING --> FAILED: Error (max retries)
    PROCESSING --> PENDING: Error (retry available)
    PENDING --> CANCELLED: User Cancels
    PROCESSING --> CANCELLED: User Cancels

    COMPLETED --> [*]: Archived after 7 days
    FAILED --> [*]: Archived after 14 days
    CANCELLED --> [*]: Archived after 7 days

    note right of PENDING
        - Created in ToolJob table
        - Submitted to pg-boss queue
        - Priority-based ordering
    end note

    note right of PROCESSING
        - Atomic claim (prevents duplicates)
        - 10-minute timeout
        - Attempt counter incremented
    end note

    note right of FAILED
        - Retry: 60s → 120s → 240s
        - Max 3 attempts
        - Error stored in ToolJob
    end note
```

## 5. Job Processing Detail Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Server
    participant DB as Database
    participant PG as pg-boss
    participant W as Worker
    participant AI as AI Provider

    C->>API: POST /api/jobs {toolSlug, input}
    API->>DB: Check cache (24hr)
    alt Cache Hit
        DB-->>API: Cached result
        API-->>C: Return cached job
    else Cache Miss
        API->>DB: Create ToolJob (PENDING)
        API->>PG: INSERT into pgboss.job
        API-->>C: Return job ID

        loop Polling/Streaming
            C->>API: GET /jobs/{id}/stream
        end

        W->>PG: Poll for jobs (batch=5)
        PG-->>W: Return job batch
        W->>DB: Atomic claim (UPDATE WHERE status=PENDING)
        W->>DB: Set status=PROCESSING
        W->>AI: Execute processor
        AI-->>W: Result
        W->>DB: Update ToolJob (COMPLETED + output)
        W->>PG: boss.complete()

        API-->>C: Stream update (COMPLETED)
    end
```

## 6. Data Model - Entity Relationships

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Account : has
    User ||--o{ Passkey : has
    User ||--o{ Member : joins
    User ||--o{ ToolJob : creates
    User ||--o{ AiChat : owns
    User ||--o{ Purchase : makes
    User ||--o{ Notification : receives
    User ||--o{ Invitation : sends

    Organization ||--o{ Member : contains
    Organization ||--o{ Invitation : has
    Organization ||--o{ AiChat : owns
    Organization ||--|| CreditBalance : has
    Organization ||--o{ Purchase : has

    Member }o--|| Organization : belongs_to
    Member }o--|| User : is

    CreditBalance ||--o{ CreditTransaction : logs

    ToolJob ||--o{ CreditTransaction : charges
    ToolJob }o--o| User : owned_by

    Purchase }o--o| User : for_user
    Purchase }o--o| Organization : for_org

    User {
        string id PK
        string email UK
        string name
        string role
        boolean onboardingComplete
        string paymentsCustomerId
    }

    Organization {
        string id PK
        string slug UK
        string name
        string paymentsCustomerId
    }

    ToolJob {
        string id PK
        string toolSlug
        string status
        json input
        json output
        int attempts
        string pgBossJobId UK
    }

    CreditBalance {
        string id PK
        int included
        int used
        int purchasedCredits
        datetime periodStart
        datetime periodEnd
    }

    Purchase {
        string id PK
        string type
        string customerId
        string subscriptionId UK
        string productId
    }
```

## 7. Payment & Credit Flow

```mermaid
flowchart TB
    subgraph Checkout["Checkout Flow"]
        U[User] --> PP[Pricing Page]
        PP --> |Select Plan| CS[Create Checkout Session]
        CS --> Stripe[Stripe Checkout]
        Stripe --> |Success| WH[Webhook Handler]
    end

    subgraph Webhooks["Stripe Webhooks"]
        WH --> |checkout.session.completed| E1[Set Customer ID]
        WH --> |customer.subscription.created| E2[Create Purchase + Grant Credits]
        WH --> |invoice.paid| E3[Reset Credits for New Period]
        WH --> |subscription.updated| E4[Adjust Credits]
        WH --> |subscription.deleted| E5[Delete Purchase]
    end

    subgraph Credits["Credit System"]
        E2 --> CB[(CreditBalance)]
        E3 --> CB
        E4 --> CB

        CB --> |included| Plan[Plan Credits<br/>Reset monthly]
        CB --> |purchasedCredits| Pack[Credit Packs<br/>Never expire]
        CB --> |used| Usage[Usage Counter]
        CB --> |overage| Over[Overage Tracking]
    end

    subgraph Usage["Credit Consumption"]
        TJ[Tool Job Completed] --> CT[CreditTransaction]
        CT --> |USAGE| CB
        CT --> |Store| Audit[Audit Trail]
    end
```

## 8. Multi-tenant Organization Structure

```mermaid
flowchart TB
    subgraph Users["User Layer"]
        U1[User A]
        U2[User B]
        U3[User C]
    end

    subgraph Orgs["Organization Layer"]
        O1[Org: Acme Inc]
        O2[Org: StartupCo]
    end

    subgraph Roles["Membership Roles"]
        R1[Owner]
        R2[Admin]
        R3[Member]
    end

    subgraph Resources["Scoped Resources"]
        direction TB
        RC1[Credits]
        RC2[AI Chats]
        RC3[Purchases]
        RC4[Invitations]
    end

    U1 -->|owner| O1
    U2 -->|admin| O1
    U2 -->|owner| O2
    U3 -->|member| O1
    U3 -->|member| O2

    O1 --> RC1
    O1 --> RC2
    O1 --> RC3
    O1 --> RC4

    O2 --> RC1
    O2 --> RC2
    O2 --> RC3
    O2 --> RC4

    subgraph Billing["Seat-Based Billing"]
        O1 -->|3 seats| Sub1[Pro Plan $19.99/seat]
        O2 -->|2 seats| Sub2[Starter Plan $4.99/seat]
    end
```

## 9. Frontend Application Structure

```mermaid
flowchart TB
    subgraph Root["/ (Root Layout)"]
        subgraph Marketing["(marketing) - Public"]
            Home["/"]
            Pricing["/pricing"]
            Blog["/blog"]
            Docs["/docs"]
            Auth["/auth/*"]
        end

        subgraph SaaS["(saas) - Protected"]
            subgraph Account["(account) - Personal"]
                Dashboard["/app"]
                Settings["/app/settings/*"]
                Tools["/app/tools/*"]
            end

            subgraph OrgRoutes["(organizations) - Org Context"]
                OrgDash["/app/[orgSlug]"]
                OrgSettings["/app/[orgSlug]/settings/*"]
                OrgTools["/app/[orgSlug]/tools/*"]
                OrgBilling["/app/[orgSlug]/settings/billing"]
            end
        end

        subgraph Admin["(admin) - Admin Only"]
            AdminDash["/admin"]
            AdminUsers["/admin/users"]
            AdminOrgs["/admin/organizations"]
        end
    end

    Root --> Marketing
    Root --> SaaS
    Root --> Admin

    Auth -->|Login| SaaS
    SaaS -->|Switch Org| OrgRoutes
```

## 10. AI Tool Processing Architecture

```mermaid
flowchart LR
    subgraph Input["Input Layer"]
        URL[URL Input]
        Text[Text Input]
        File[File Upload]
    end

    subgraph Validation["Validation"]
        Schema[Zod Schema<br/>Validation]
        RateLimit[Rate Limit<br/>Check]
        Credits[Credit Balance<br/>Check]
    end

    subgraph Processing["Processing Pipeline"]
        Extract[Content<br/>Extraction]
        Prompt[Prompt<br/>Construction]
        AI[AI Model<br/>Execution]
        Parse[Response<br/>Parsing]
    end

    subgraph Output["Output"]
        Cache[Cache Result<br/>24hr TTL]
        Store[Store in<br/>ToolJob]
        Charge[Charge<br/>Credits]
    end

    URL --> Schema
    Text --> Schema
    File --> Schema

    Schema --> RateLimit
    RateLimit --> Credits
    Credits --> Extract

    Extract --> Prompt
    Prompt --> AI
    AI --> Parse

    Parse --> Cache
    Parse --> Store
    Store --> Charge
```

## 11. Deployment Architecture

```mermaid
flowchart TB
    subgraph GitHub["GitHub"]
        Repo[Repository]
        Actions[GitHub Actions<br/>CI/CD]
    end

    subgraph Vercel["Vercel"]
        Preview[Preview<br/>Deployments]
        Prod[Production<br/>Deployment]
        Edge[Edge<br/>Functions]
    end

    subgraph Render["Render"]
        API[API Server<br/>(Fastify + pg-boss)]
        Worker[Background<br/>Workers]
    end

    subgraph Supabase["Supabase"]
        DB[(PostgreSQL)]
        Branch[Preview<br/>Branches]
        Auth2[Auth<br/>Extensions]
    end

    subgraph AWS["AWS"]
        S3[(S3 Bucket<br/>File Storage)]
    end

    subgraph Services["External Services"]
        Stripe2[Stripe]
        Anthropic[Anthropic]
        OpenAI2[OpenAI]
        Resend[Resend/Email]
    end

    Repo --> Actions
    Actions --> Preview
    Actions --> Prod
    Actions --> API

    Prod --> Edge
    Edge --> API
    API --> DB
    API --> S3

    Preview --> Branch

    Worker --> DB
    Worker --> Anthropic
    Worker --> OpenAI2

    API --> Stripe2
    API --> Resend
```

## Usage

To render these diagrams:
1. **GitHub/GitLab**: Markdown preview renders Mermaid automatically
2. **VS Code**: Install "Markdown Preview Mermaid Support" extension
3. **Online**: Paste into [mermaid.live](https://mermaid.live)
4. **Docs**: Fumadocs supports Mermaid via MDX plugins
