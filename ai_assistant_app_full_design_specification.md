# AI Assistant Workspace – Comprehensive Design Specification

> **Purpose**: Deliver a single source‑of‑truth that any capable AI / dev team can consume to implement an application whose **look & feel _and_ functionality mirror** <https://siuhaqif.manus.space/> while remaining production‑grade, maintainable, and free of logical inconsistencies.

---

## 0. Table of Contents
1. Vision & Key Objectives  
2. Non‑Functional Requirements  
3. High‑Level System Architecture  
4. Tech Stack & Tooling Choices  
5. Data & Domain Model  
6. API Contract (Backend ↔ Frontend & 3rd‑Party)  
7. Front‑End Information Architecture & UX Spec  
8. Detailed Component Catalogue  
9. Core Feature Workflows  
10. Error‑Handling & Edge‑Case Policies  
11. Security, Privacy & Compliance  
12. Quality Strategy: Testing, CI/CD, Observability  
13. Deployment Topology  
14. Road‑map & Milestones

---

## 1. Vision & Key Objectives
| # | Objective | Success Metric |
|---|-----------|---------------|
| 1 | **Visual parity** with manus.space | ≥ 95 % matching in automated visual regression tests across breakpoints |
| 2 | **Feature parity** (Chat, Agent, Notebook, Task‑calendar, Replay, Media) | All acceptance criteria in §9 satisfied |
| 3 | **Zero logical errors** | 100 % pass rate of the comprehensive test suite (unit + e2e) |
| 4 | **Sub‑second UX** | ≤ 200 ms P95 client‑side interactive latency |
| 5 | **Maintainability** | ≥ 80 % code coverage, score ≥ A in static analysis (Sonar) |

---

## 2. Non‑Functional Requirements
- **Responsiveness**: Fully fluid layout supporting ≥ 375 px to ≥ 1920 px.  
- **A11y**: WCAG 2.2 AA.  
- **I18n**: EN + VI ready; RTL compatible.  
- **PWA**: Offline chat history, notifications.  
- **Scalability**: 50 k DAU, 10 concurrent requests/user.  
- **Observability**: OpenTelemetry tracing, structured logs (JSON), Prom‑exported metrics.  
- **Recovery**: RPO 15 min, RTO 30 min.

---

## 3. High‑Level System Architecture
```
┌──────────────┐      HTTPS      ┌──────────────┐
│  React PWA   │  ◀──────────▶  │  API GW +    │
│  (Vite + SW) │                │  BFF (Node)  │
└──────┬───────┘                └──────┬───────┘
       │ Web‑Socket / SSE               │REST/GraphQL
       ▼                                ▼
┌──────────────┐   gRPC   ┌────────────────────┐
│ Conversation │◀───────▶│  AI Service Layer   │
│  Service     │         │  (Function‑Calling) │
└──────────────┘         └─────────┬───────────┘
                                   │
                       ┌───────────▼───────────┐
                       │   External Providers  │
                       │  (OpenAI, Anthropic)  │
                       └───────────┬───────────┘
                                   │
                       ┌───────────▼───────────┐
                       │ Persistence Tier      │
                       │  • PostgreSQL (RDS)   │
                       │  • Redis Cluster      │
                       │  • S3 / Supabase Obj  │
                       └────────────────────────┘
```

### Key Notes
- **Backend‑for‑Frontend (BFF)** collapses auth, rate‑limit & fan‑out to micro‑services.  
- **Conversation Service** streams chat & agent events via server‑sent events (SSE) to guarantee atomic chronology.  
- **AI Service Layer** encapsulates function‑calling models, tool execution sandbox (Docker‑in‑Docker / Firecracker VM).

---

## 4. Tech Stack & Tooling Choices
| Layer | Choice | Rationale |
|-------|--------|-----------|
| UI | **React 18 + Vite 5 + TypeScript 5** | Fast HMR, TS safety |
| Styling | **TailwindCSS 3** + shadcn/ui | Matches manus.space gradient/blur aesthetics |
| Animations | **framer‑motion 11** | Smooth card & panel transitions |
| State | **Zustand** (UI) + **React Query** (server) | Minimal boilerplate, suspense support |
| Storage | **Dexie (IndexedDB)** | Offline history & settings |
| Backend | **Node 20, Fastify 5** | Lightweight, high throughput |
| ORM | **Prisma 5** | Type‑safe DB access |
| DB | **PostgreSQL 15** | Relational fit for structured entities |
| Cache | **Redis 7** | Pub/Sub + rate‑limit token buckets |
| Auth | **NextAuth.js** (JWT + Google) | Social & email login |
| Infra | **Docker, Terraform, AWS ECS Fargate** | Portable & IaC |
| CI/CD | **GitHub Actions → Vercel Preview → Prod** | Ephemeral envs + blue/green |
| QA | **Vitest, Playwright, Storybook** | Unit, e2e, visual tests |

---

## 5. Data & Domain Model (Prisma Schema Extract)
```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String?
  image          String?
  chats          Chat[]
  notebooks      Notebook[]
  tasks          Task[]
  agentJobs      AgentJob[]
  createdAt      DateTime @default(now())
}

model Chat {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  title     String   @default("New Chat")
  messages  Message[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Message {
  id        String   @id @default(cuid())
  chat      Chat     @relation(fields: [chatId], references: [id])
  chatId    String
  role      MessageRole
  content   String
  toolCalls Json?
  createdAt DateTime @default(now())
}

enum MessageRole {
  user
  assistant
  system
}

model Notebook {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  markdown  String
  collaborators Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  cronExpr  String   @db.VarChar(120)
  nextRun   DateTime
  done      Boolean  @default(false)
}

model AgentJob {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  prompt      String
  status      AgentStatus @default(pending)
  toolTrace   Json?
  output      Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum AgentStatus {
  pending
  running
  succeeded
  failed
}
```

---

## 6. API Contract
### 6.1 Authentication
```
POST /api/auth/{provider}
GET  /api/session            → { user, accessToken, expires }
```

### 6.2 Chat
| Method | Endpoint | Body / Params | Returns |
|--------|----------|---------------|---------|
| `POST` | `/api/chat` | `{ title? }` | `chatId` |
| `GET`  | `/api/chat/{chatId}/events` | *SSE* | stream<Message|AgentEvent> |
| `POST` | `/api/chat/{chatId}/message` | `{ role:"user", content }` | 202 if accepted |
| `DELETE` | `/api/chat/{chatId}` | – | 204 |

### 6.3 Notebook
```
POST /api/notebook
GET  /api/notebook/{id}
PATCH /api/notebook/{id}   { markdown }
```

### 6.4 Task Scheduler
```
POST /api/task            { title, cronExpr }
PATCH /api/task/{id}      { done }
DELETE /api/task/{id}
```

### 6.5 Agent Jobs
```
POST /api/agent           { prompt }
GET  /api/agent/{id}/log  (SSE)
```

**Versioning**: `Accept: application/vnd.aiwa.v1+json` header.

---

## 7. Front‑End Information Architecture & UX Spec
### Breakpoints
- **sm** 640 px (mobile)  
- **md** 768 px (tablet)  
- **lg** 1024 px (laptop)  
- **xl** 1280 px (desktop)  

### Global Layout
```
┌──────────────────────────────────────────────────────────┐
│   NavigationBar (fixed, gradient, 64 px)                │
├─┬────────────────────────────────────────────────────────┤
│S│ Sidebar (collapsible 64 → 240 px)                     │
│i│                                                      │
│d│    MainContent (scroll)                               │
│e│                                                      │
└─┴────────────────────────────────────────────────────────┘
```

### Primary Routes & Wireframes
1. **/chat/:id** – multi‑pane (thread + suggestions).  
2. **/notebook/:id** – markdown editor + AI side‑panel.  
3. **/tasks** – calendar grid (FullCalendar) + list.  
4. **/media** – music/video cards (optional).  
5. **/settings** – profile, API keys.

### UI Patterns
- **Glass Card**: `.rounded-2xl .backdrop-blur .bg-white/70 .shadow-lg`  
- **Command Palette** (`cmd+k`): `@cmdk/ui` with global actions.  
- **Toast**: Radix Tooltip + headless.

---

## 8. Detailed Component Catalogue
| Component | Props (simplified) | Behaviour |
|-----------|--------------------|-----------|
| `<NavigationBar>` | `user` | Scroll‑shadow; responsive nav items |
| `<Sidebar>` | `activeId, onSelect` | Collapses under **md** |
| `<ChatThread>` | `chatId` | Streams SSE, auto‑scroll with smart lock |
| `<MessageBubble>` | `message` | Markdown render + tool call chips |
| `<NotebookEditor>` | `notebookId` | Yjs collab extension, slash‑commands |
| `<AgentRunner>` | `job` | show live logs; retry action |
| `<TaskCalendar>` | `tasks[]` | Drag‑drop to reschedule |

> Full prop interfaces provided in `src/types/ui.d.ts` once scaffolded.

---

## 9. Core Feature Workflows (Sequence Diagrams)
### 9.1 Chat Message Flow
```
User → UI          : type msg
UI   → BFF         : POST /chat/{id}/message
BFF  → AI Service  : stream(messages)
AI   → BFF         : delta tokens (SSE)
BFF  → UI (SSE)    : delta tokens
UI   → IndexedDB   : persist msg & deltas
```

### 9.2 Agent Job Flow
1. User clicks **Run as Agent** in Notebook.  
2. Front‑end POST `/api/agent` prompt + context.  
3. AI Service selects tools, spawns sandbox, emits events.  
4. UI consumes `/agent/{id}/log` SSE; renders timeline.

### 9.3 Task Natural‑Language Scheduling
```
User → UI  : "remind me to stand‑up every weekday at 9"
UI   → AI  : system("transform to cron")
UI   → API : POST /task { cronExpr="0 9 * * 1-5" }
```

---

## 10. Error‑Handling & Edge‑Case Policies
| Area | Potential Issue | Strategy |
|------|-----------------|----------|
| SSE drop | Network hiccup | Reconnect w/ exponential back‑off, resume from `lastEventId` |
| Prompt exceeding token limit | Truncate oldest user msgs, retain summary context, warn user |
| Agent tool timeouts | Kill after 30 s idle; mark job failed; show retry |
| DB deadlock | Retry 3× with jitter |
| Rate limit exceeded | 429 + Retry‑After; UI toast + grey‑out send button |

---

## 11. Security, Privacy & Compliance
- **OWASP Top10** mitigations (CSRF, XSS, SSRF guards).  
- OAuth PKCE + rotating refresh tokens (90 d).  
- Encrypt secrets via AWS SSM Parameter Store.  
- Row Level Security in Postgres (owner id).  
- GDPR‑ready: data export & account deletion endpoints.

---

## 12. Quality Strategy
### Testing Matrix
| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | utils, reducers, hooks |
| Component | Storybook + Jest DOM | snapshot & a11y |
| Integration | msw.js + Vitest | API ↔ UI contracts |
| E2E | Playwright | happy‑path user journeys |
| Visual | Playwright Trace | per breakpoint diff |

### CI Workflow
1. **lint** (`eslint --max-warnings=0`).  
2. **build** (`vite build`).  
3. **test** (unit + int).  
4. **e2e** on Vercel Preview.  
5. **check‑secrets** via Trufflehog.

---

## 13. Deployment Topology
- **Preview**: Vercel edge runtime + PlanetScale.  
- **Prod**: AWS ECS Fargate, ALB, RDS Postgres Multi‑AZ, ElastiCache Redis, CloudFront CDN, Route 53.  
- **Blue/Green**: `ecs deploy --traffic-shift 100 --wait`.  
- **Rollback**: one‑click to previous task set.

---

## 14. Road‑map & Milestones
| Week | Deliverable |
|------|-------------|
| 1 | Repo scaffold, CI/CD, Nav + Sidebar skeleton |
| 2 | Chat SSE pipeline, visual parity pass #1 |
| 3 | Notebook editor + AI side‑panel |
| 4 | Agent runner & Replay timeline |
| 5 | Task calendar + natural‑language parser |
| 6 | Media module & Settings, a11y audit |
| 7 | Load testing & observability |
| 8 | Beta launch → collect feedback |
| 9 | Polish, perf budget, doc & handover |

---

### End of Specification

