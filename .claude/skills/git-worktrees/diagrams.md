# Git Worktrees - Visual Diagrams

Visual representations of how git worktrees enable parallel development.

## 1. Directory Structure

```mermaid
graph TD
    A[Repository Root<br/>software-multi-tool/] --> B[.git/<br/>Shared Git Database]
    A --> C[Main Working Directory<br/>branch: main]
    A --> D[.worktrees/]

    D --> E[feat-pra-45-user-profile/<br/>branch: feat/pra-45-user-profile<br/>PORT: 3742]
    D --> F[fix-pra-52-nav-bug/<br/>branch: fix/pra-52-nav-bug<br/>PORT: 3621]

    B -.->|shared| E
    B -.->|shared| F

    E --> E1[apps/web/.env.local<br/>PORT=3742]
    F --> F1[apps/web/.env.local<br/>PORT=3621]

    style B fill:#e1f5ff
    style E fill:#d4edda
    style F fill:#fff3cd
    style E1 fill:#d4edda
    style F1 fill:#fff3cd
```

**Key Points**:

- All worktrees share the same `.git/` directory
- Each worktree has its own working directory
- Each worktree has independent `.env.local` with unique PORT

---

## 2. Parallel Development Timeline

```mermaid
gantt
    title Parallel Development: Two Features Simultaneously
    dateFormat HH:mm
    axisFormat %H:%M

    section Main Repo
    Stay on main branch           :main, 09:00, 60m

    section Worktree 1 (PRA-45 Feature)
    Create worktree               :wt1-create, 09:00, 5m
    Allocate port (3742)          :wt1-port, after wt1-create, 2m
    Start dev server              :wt1-dev, after wt1-port, 2m
    Development work              :active, wt1-work, after wt1-dev, 120m
    Commit & push                 :wt1-commit, after wt1-work, 5m
    Create PR                     :wt1-pr, after wt1-commit, 3m

    section Worktree 2 (PRA-52 Bug Fix)
    Create worktree               :wt2-create, 09:15, 5m
    Allocate port (3621)          :wt2-port, after wt2-create, 2m
    Start dev server              :wt2-dev, after wt2-port, 2m
    Fix bug                       :crit, wt2-fix, after wt2-dev, 30m
    Test & commit                 :wt2-commit, after wt2-fix, 5m
    Create PR                     :wt2-pr, after wt2-commit, 3m
    PR merged                     :milestone, wt2-merged, after wt2-pr, 0m
    Cleanup worktree              :wt2-cleanup, after wt2-merged, 2m
```

**Timeline Breakdown**:

- **09:00-09:07**: Setup Worktree 1 (PRA-45)
- **09:15-09:22**: Setup Worktree 2 (PRA-52) *while PRA-45 dev server is running*
- **09:22-09:57**: Both dev servers running simultaneously
- **09:57**: PRA-52 merged and cleaned up
- **09:09-11:15**: PRA-45 work continues uninterrupted

---

## 3. Port Allocation Flow

```mermaid
flowchart TD
    A[Create Worktree<br/>.worktrees/feat-pra-45] --> B[Run Port Allocator<br/>worktree-port.sh]

    B --> C{Hash Worktree Path}
    C --> D[SHA256 Hash<br/>→ 0x2A3F...]
    D --> E[Modulo 499<br/>→ 241]
    E --> F[Add 3501<br/>→ Port 3742]

    F --> G{Check Port<br/>Available?}

    G -->|Yes| H[✓ Use Port 3742]
    G -->|No| I[Try Next Port<br/>→ 3743]

    I --> J{Check Port<br/>Available?}
    J -->|Yes| K[✓ Use Port 3743]
    J -->|No| L[Try Next Port<br/>→ 3744]

    H --> M[Write to .env.local<br/>PORT=3742]
    K --> N[Write to .env.local<br/>PORT=3743]

    M --> O[Start Dev Server<br/>http://localhost:3742]
    N --> P[Start Dev Server<br/>http://localhost:3743]

    style H fill:#d4edda
    style K fill:#d4edda
    style O fill:#d4edda
    style P fill:#d4edda
    style G fill:#fff3cd
    style J fill:#fff3cd
```

**Algorithm**:

1. Hash worktree path → deterministic number
2. Map to port range (3501-3999)
3. Check availability with `lsof`
4. If taken, linear probe to next port
5. Write PORT to `.env.local`

---

## 4. Git Relationship Diagram

```mermaid
graph LR
    subgraph "Shared Git Database"
        GIT[.git/<br/>Objects, Refs, Branches]
    end

    subgraph "Main Repo (Root)"
        MAIN[Working Directory<br/>branch: main]
    end

    subgraph "Worktree 1"
        WT1[Working Directory<br/>branch: feat/pra-45]
        WT1_ENV[.env.local<br/>PORT=3742]
    end

    subgraph "Worktree 2"
        WT2[Working Directory<br/>branch: fix/pra-52]
        WT2_ENV[.env.local<br/>PORT=3621]
    end

    GIT <-.->|reads/writes| MAIN
    GIT <-.->|reads/writes| WT1
    GIT <-.->|reads/writes| WT2

    WT1 -.->|independent| WT1_ENV
    WT2 -.->|independent| WT2_ENV

    style GIT fill:#e1f5ff
    style MAIN fill:#f8f9fa
    style WT1 fill:#d4edda
    style WT2 fill:#fff3cd
```

**Key Relationships**:

- **Shared**: Git history, branches, remotes, config
- **Independent**: Working files, checked-out branch, `.env.local`

---

## 5. Complete Workflow Sequence

```mermaid
sequenceDiagram
    participant User
    participant Main as Main Repo<br/>(root)
    participant WT1 as Worktree 1<br/>(PRA-45)
    participant WT2 as Worktree 2<br/>(PRA-52)
    participant Remote as GitHub<br/>(origin)

    User->>Main: git worktree add .worktrees/feat-pra-45
    Main->>WT1: Create worktree
    WT1->>WT1: Allocate PORT=3742
    WT1->>WT1: Start dev server

    Note over WT1: Dev server running<br/>http://localhost:3742

    User->>Main: git worktree add .worktrees/fix-pra-52
    Main->>WT2: Create worktree
    WT2->>WT2: Allocate PORT=3621
    WT2->>WT2: Start dev server

    Note over WT1,WT2: Both servers running<br/>in parallel!

    User->>WT2: Make changes & commit
    WT2->>Remote: git push origin fix/pra-52
    WT2->>Remote: Create PR #127

    Note over WT2: PR approved & merged

    User->>WT2: Stop dev server
    User->>Main: git worktree remove fix-pra-52
    Main->>WT2: Delete worktree

    Note over WT1: Still running!<br/>No interruption

    User->>WT1: Continue development
    User->>WT1: Make more commits
    WT1->>Remote: git push origin feat/pra-45
    WT1->>Remote: Create PR #128

    Note over WT1: PR approved & merged

    User->>WT1: Stop dev server
    User->>Main: git worktree remove feat-pra-45
    Main->>WT1: Delete worktree

    User->>Main: git pull origin main
    Note over Main: Now includes both<br/>PRA-45 & PRA-52!
```

---

## 6. Port Collision Scenario

```mermaid
flowchart TD
    A[Worktree A<br/>Path Hash → 3518] --> B{Port 3518<br/>Available?}
    C[Worktree B<br/>Path Hash → 3518] --> B

    B -->|Yes| D[Worktree A<br/>Uses 3518 ✓]
    B -->|No<br/>Server running| E[Worktree B<br/>Checks 3519]

    E --> F{Port 3519<br/>Available?}
    F -->|Yes| G[Worktree B<br/>Uses 3519 ✓]

    D --> H[Dev Server A<br/>localhost:3518]
    G --> I[Dev Server B<br/>localhost:3519]

    style B fill:#fff3cd
    style D fill:#d4edda
    style E fill:#ffeaa7
    style F fill:#fff3cd
    style G fill:#d4edda
```

**Collision Handling**:

- Same hash → same initial port attempt
- Real-time check with `lsof` detects occupied port
- Automatic linear probe to next available port
- Both worktrees get unique ports

---

## 7. Worktree Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Created: git worktree add

    Created --> Configured: Allocate PORT
    Configured --> Running: Start dev server

    Running --> Modified: Make changes
    Modified --> Committed: git commit
    Committed --> Running: Continue work

    Committed --> Pushed: git push
    Pushed --> PROpen: Create PR

    PROpen --> Merged: PR approved
    Merged --> Stopped: Stop dev server
    Stopped --> Removed: git worktree remove
    Removed --> [*]

    Running --> Stopped: Stop dev server
    Stopped --> Running: Restart dev server
```

**States**:

- **Created**: Worktree directory exists, branch checked out
- **Configured**: PORT allocated, `.env.local` configured
- **Running**: Dev server active, development in progress
- **Modified**: Local changes, not yet committed
- **Committed**: Changes committed locally
- **Pushed**: Commits pushed to remote
- **PROpen**: Pull request created
- **Merged**: PR merged to main
- **Stopped**: Dev server stopped, worktree still exists
- **Removed**: Worktree deleted, cleanup complete

---

## 8. Parallel Testing Scenario

```mermaid
graph TD
    subgraph "Worktree 1: PRA-45"
        WT1[Run pnpm test:integration]
        WT1 --> TC1[Testcontainers]
        TC1 --> DB1[PostgreSQL<br/>Port: 54321<br/>auto-allocated]
    end

    subgraph "Worktree 2: PRA-52"
        WT2[Run pnpm test:integration]
        WT2 --> TC2[Testcontainers]
        TC2 --> DB2[PostgreSQL<br/>Port: 54322<br/>auto-allocated]
    end

    subgraph "Worktree 3: PRA-60"
        WT3[Run pnpm test:integration]
        WT3 --> TC3[Testcontainers]
        TC3 --> DB3[PostgreSQL<br/>Port: 54323<br/>auto-allocated]
    end

    DB1 -.->|isolated| DB1
    DB2 -.->|isolated| DB2
    DB3 -.->|isolated| DB3

    style DB1 fill:#d4edda
    style DB2 fill:#fff3cd
    style DB3 fill:#e3d4ff
```

**Parallel Testing**:

- Each worktree runs integration tests independently
- Testcontainers allocates unique PostgreSQL ports automatically
- No manual DATABASE_URL configuration needed
- Tests run simultaneously without conflicts

---

## 9. Branch Structure Visualization

```mermaid
gitGraph
    commit id: "Initial"
    commit id: "Setup"

    branch feat/pra-45-user-profile
    checkout feat/pra-45-user-profile
    commit id: "Add API endpoint"
    commit id: "Add UI page"

    checkout main
    branch fix/pra-52-nav-bug
    checkout fix/pra-52-nav-bug
    commit id: "Fix navigation bug"

    checkout main
    merge fix/pra-52-nav-bug tag: "PRA-52 merged"

    checkout feat/pra-45-user-profile
    commit id: "Add tests"
    merge main tag: "Merge main into feature"
    commit id: "Final touches"

    checkout main
    merge feat/pra-45-user-profile tag: "PRA-45 merged"
```

**Branch Flow**:

1. Create `feat/pra-45-user-profile` from main
2. Create `fix/pra-52-nav-bug` from main
3. Merge PRA-52 to main (quick bug fix)
4. Merge main back into PRA-45 (stay up-to-date)
5. Complete PRA-45, merge to main

---

## 10. Developer Experience Comparison

```mermaid
graph LR
    subgraph "Traditional: git checkout (Branch Switching)"
        A1[Working on Feature A] -->|git checkout| B1[Stash changes]
        B1 -->|git checkout bug-fix| C1[Work on Bug Fix]
        C1 -->|Commit & push| D1[git checkout feature-a]
        D1 -->|git stash pop| E1[Resume Feature A]

        style B1 fill:#f8d7da
        style D1 fill:#f8d7da
    end

    subgraph "Worktrees: Parallel Development"
        A2[Worktree 1: Feature A<br/>PORT=3742] -.->|No switching| A2
        B2[Worktree 2: Bug Fix<br/>PORT=3621] -.->|No switching| B2

        A2 -.->|Always running| C2[Continuous work]
        B2 -.->|Independent| D2[Quick fix & merge]

        style A2 fill:#d4edda
        style B2 fill:#d4edda
        style C2 fill:#d4edda
        style D2 fill:#d4edda
    end
```

**Traditional Flow Problems**:

- ❌ Stash/unstash changes
- ❌ Restart dev server each switch
- ❌ Context switching overhead
- ❌ Risk of stash conflicts

**Worktree Flow Benefits**:

- ✅ No stashing needed
- ✅ Dev servers stay running
- ✅ Zero context switching
- ✅ True parallel work

---

## Usage in Documentation

These diagrams can be embedded in:

1. **SKILL.md** - Core concepts section
2. **examples.md** - Visual workflow examples
3. **README.md** - Quick visual reference

### Embedding Example

````markdown
## How Worktrees Work

Worktrees allow you to check out multiple branches simultaneously:

```mermaid
[diagram here]
```

This enables true parallel development without context switching.
````

---

## Diagram Descriptions for Accessibility

1. **Directory Structure**: Shows how .worktrees/ relates to main repo
2. **Timeline**: Gantt chart of parallel development
3. **Port Allocation**: Flowchart of deterministic port assignment
4. **Git Relationship**: How worktrees share .git database
5. **Sequence**: Complete workflow from creation to cleanup
6. **Collision**: How hash collisions are resolved
7. **Lifecycle**: State machine of worktree stages
8. **Testing**: Parallel integration tests with Testcontainers
9. **Branches**: Git branch structure over time
10. **Comparison**: Traditional vs worktree workflows
