/**
 * Sample diagrams for the Diagram Editor
 */

export const SAMPLE_DIAGRAMS = {
	flowchart: `flowchart TD
    A[Start] --> B{Is it valid?}
    B -->|Yes| C[Process Data]
    B -->|No| D[Show Error]
    C --> E[Save to Database]
    D --> F[Log Error]
    E --> G[Send Notification]
    F --> G
    G --> H[End]`,

	sequence: `sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant DB as Database

    U->>C: Click Submit
    C->>S: POST /api/data
    S->>DB: INSERT record
    DB-->>S: Success
    S-->>C: 200 OK
    C-->>U: Show success`,

	classDiagram: `classDiagram
    class User {
        +String id
        +String email
        +String name
        +login()
        +logout()
    }
    class Organization {
        +String id
        +String name
        +addMember(User)
        +removeMember(User)
    }
    class Subscription {
        +String id
        +String plan
        +Date startDate
        +upgrade()
        +cancel()
    }
    User "*" --> "1" Organization : belongs to
    Organization "1" --> "1" Subscription : has`,

	stateDiagram: `stateDiagram-v2
    [*] --> Draft
    Draft --> Review : Submit
    Review --> Approved : Approve
    Review --> Draft : Request Changes
    Approved --> Published : Publish
    Published --> Archived : Archive
    Archived --> [*]`,

	erDiagram: `erDiagram
    USER ||--o{ ORDER : places
    USER {
        string id PK
        string email
        string name
    }
    ORDER ||--|{ LINE_ITEM : contains
    ORDER {
        string id PK
        date created_at
        string status
    }
    LINE_ITEM {
        string id PK
        int quantity
        float price
    }
    LINE_ITEM }|--|| PRODUCT : references
    PRODUCT {
        string id PK
        string name
        float price
    }`,

	gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
        Requirements     :a1, 2024-01-01, 7d
        Design           :a2, after a1, 14d
    section Development
        Backend API      :b1, after a2, 21d
        Frontend UI      :b2, after a2, 21d
    section Testing
        Integration      :c1, after b1, 7d
        UAT              :c2, after c1, 7d
    section Deployment
        Production       :d1, after c2, 3d`,
} as const;

export type DiagramType = keyof typeof SAMPLE_DIAGRAMS;

export const DIAGRAM_TYPE_LABELS: Record<DiagramType, string> = {
	flowchart: "Flowchart",
	sequence: "Sequence Diagram",
	classDiagram: "Class Diagram",
	stateDiagram: "State Diagram",
	erDiagram: "ER Diagram",
	gantt: "Gantt Chart",
};

export const DEFAULT_DIAGRAM_TYPE: DiagramType = "flowchart";
