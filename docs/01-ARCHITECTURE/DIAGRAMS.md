# System Architecture Diagrams

## 📐 Visual Documentation

This document provides ASCII-based architectural diagrams for the Radiology Reporting App. These diagrams complement the Blueprint and Technical Design documents.

---

## 🏗️ High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                         (Browser / Mobile Device)                            │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Next.js 14+ Frontend (React 18)                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │ │
│  │  │   Dashboard  │  │   Generate   │  │   Reports    │  │ Templates │ │ │
│  │  │     Page     │  │    Report    │  │     Page     │  │   Page    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘ │ │
│  │                                                                         │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │              OpenAI ChatKit Widget (Embedded)                  │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │                   UI Components Layer                          │   │ │
│  │  │  • Audio Recorder/Uploader  • Template Selector               │   │ │
│  │  │  • Report Form/Preview      • Search Panel                     │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTPS / WebSocket
                                │
┌───────────────────────────────┴─────────────────────────────────────────────┐
│                          APPLICATION LAYER                                   │
│                      (Vercel Edge Network / Node.js)                         │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Next.js Server Components & API Routes              │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │ │
│  │  │    Auth     │  │Transcription│  │   Report    │  │   Template   │ │ │
│  │  │   Routes    │  │   Service   │  │  Generator  │  │   Service    │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘ │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │ │
│  │  │   Search    │  │   Export    │  │  Analytics  │  │   Webhook    │ │ │
│  │  │   Service   │  │   Service   │  │   Tracker   │  │   Handler    │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Business Logic Layer                           │ │
│  │  • Spoken Punctuation Converter  • Contradiction Cleaner              │ │
│  │  • Prompt Builder                • Model Fallback Handler             │ │
│  │  • Template Integration          • Validation & Error Handling        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└───┬────────────┬────────────┬────────────┬────────────┬────────────┬────────┘
    │            │            │            │            │            │
    │            │            │            │            │            │
┌───▼──────┐ ┌──▼──────┐ ┌──▼────────┐ ┌─▼────────┐ ┌─▼────────┐ ┌─▼────────┐
│ Supabase │ │ Outseta │ │  OpenAI   │ │ Deepgram │ │  Google  │ │Radiopae- │
│PostgreSQL│ │Auth+CRM │ │   API     │ │  (Opt)   │ │Custom SE │ │ dia API  │
│ Database │ │ Billing │ │  (GPT-5,  │ │Transcrip.│ │ (Search) │ │(Medical) │
│ Storage  │ │ Users   │ │O3,Whisper)│ │          │ │          │ │ Search   │
└──────────┘ └─────────┘ │ ChatKit   │ └──────────┘ └──────────┘ └──────────┘
                         └───────────┘

                    ┌────────────────────────────┐
                    │   External Integrations    │
                    ├────────────────────────────┤
                    │ • PubMed E-utilities       │
                    │ • Sentry (Error Tracking)  │
                    │ • Vercel Analytics         │
                    └────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. User Authentication Flow

```
┌─────────┐
│  User   │
│ Browser │
└────┬────┘
     │ 1. Click "Login"
     ▼
┌─────────────────┐
│ Login Page      │
│ /login          │
└────┬────────────┘
     │ 2. Redirect to Outseta
     ▼
┌─────────────────────────────────┐
│     Outseta Hosted Login        │
│  (outseta.com/auth/login)       │
└────┬────────────────────────────┘
     │ 3. User enters credentials
     │ 4. Outseta validates
     ▼
┌─────────────────────────────────┐
│  Outseta Authorization Server   │
│  Generates: authorization_code  │
└────┬────────────────────────────┘
     │ 5. Redirect back with code
     ▼
┌─────────────────────────────────┐
│   /api/auth/callback            │
│   (Next.js API Route)           │
└────┬────────────────────────────┘
     │ 6. Exchange code for token
     ▼
┌─────────────────────────────────┐
│      Outseta Token Endpoint     │
│  Returns: access_token,         │
│           refresh_token         │
└────┬────────────────────────────┘
     │ 7. Verify token & get user
     ▼
┌─────────────────────────────────┐
│    Outseta Profile Endpoint     │
│  Returns: User profile data     │
└────┬────────────────────────────┘
     │ 8. Create/Update user
     ▼
┌─────────────────────────────────┐
│     Supabase Database           │
│  Upsert user record             │
└────┬────────────────────────────┘
     │ 9. Set session cookie
     ▼
┌─────────────────────────────────┐
│   Response with Set-Cookie      │
│   session_token=xxx             │
│   HttpOnly, Secure              │
└────┬────────────────────────────┘
     │ 10. Redirect to /dashboard
     ▼
┌─────────────────────────────────┐
│      Dashboard Page             │
│   (User authenticated)          │
└─────────────────────────────────┘
```

### 2. Report Generation Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Fill report form
     │    (scan type, findings, template)
     ▼
┌─────────────────────────────────┐
│   Report Generation Form        │
│   /generate                     │
└────┬────────────────────────────┘
     │ 2. Submit form data
     ▼
┌─────────────────────────────────┐
│   POST /api/generate            │
│   Validates: Zod schema         │
└────┬────────────────────────────┘
     │ 3. Check auth & subscription
     ▼
┌─────────────────────────────────┐
│   Auth Middleware               │
│   Verifies: session_token       │
└────┬────────────────────────────┘
     │ 4. Load template (if ID provided)
     ▼
┌─────────────────────────────────┐
│   Template Service              │
│   Query: Supabase               │
└────┬────────────────────────────┘
     │ 5. Process findings
     ▼
┌─────────────────────────────────┐
│   Spoken Punctuation Converter  │
│   Transform: "full stop" → "."  │
└────┬────────────────────────────┘
     │ 6. Integrate with template
     ▼
┌─────────────────────────────────┐
│   Contradiction Cleaner         │
│   Remove: conflicting normals   │
└────┬────────────────────────────┘
     │ 7. Build prompt
     ▼
┌─────────────────────────────────┐
│   Prompt Builder                │
│   Load: report_prompt.txt       │
│   Insert: findings, template    │
└────┬────────────────────────────┘
     │ 8. Call AI model
     ▼
┌─────────────────────────────────┐
│   OpenAI API                    │
│   Model: GPT-5 or O3            │
│   (with fallback)               │
└────┬────────────────────────────┘
     │ 9. If primary fails
     ▼
┌─────────────────────────────────┐
│   Model Fallback Handler        │
│   Try: gpt-4o or gpt-4o-mini    │
└────┬────────────────────────────┘
     │ 10. Parse & validate response
     ▼
┌─────────────────────────────────┐
│   Response Validator            │
│   Check: JSON structure         │
│   Verify: no contradictions     │
└────┬────────────────────────────┘
     │ 11. Save to database
     ▼
┌─────────────────────────────────┐
│   Supabase Database             │
│   Insert: reports table         │
└────┬────────────────────────────┘
     │ 12. Return report
     ▼
┌─────────────────────────────────┐
│   JSON Response                 │
│   {report: {...},               │
│    metadata: {...}}             │
└────┬────────────────────────────┘
     │ 13. Display to user
     ▼
┌─────────────────────────────────┐
│   Report Preview Component      │
│   Render: Formatted report      │
└─────────────────────────────────┘
```

### 3. Real-Time Transcription Flow (WebSocket)

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Click "Start Recording"
     ▼
┌─────────────────────────────────┐
│   Audio Recorder Component      │
│   Initialize: MediaRecorder     │
└────┬────────────────────────────┘
     │ 2. Request microphone access
     ▼
┌─────────────────────────────────┐
│   Browser Audio API             │
│   getUserMedia()                │
└────┬────────────────────────────┘
     │ 3. Establish WebSocket
     ▼
┌─────────────────────────────────┐
│   WS /api/transcribe/ws         │
│   Upgrade: HTTP → WebSocket     │
└────┬────────────────────────────┘
     │ 4. Start recording
     ▼
┌─────────────────────────────────┐
│   MediaRecorder                 │
│   Capture: Audio chunks         │
│   Format: WebM / Opus           │
└────┬────────────────────────────┘
     │ 5. Stream audio chunks
     │    (every ~250ms)
     ▼
┌─────────────────────────────────┐
│   WebSocket Connection          │
│   Send: Binary audio data       │
└────┬────────────────────────────┘
     │ 6. Receive chunks
     ▼
┌─────────────────────────────────┐
│   WebSocket Handler             │
│   Buffer: Audio data            │
└────┬────────────────────────────┘
     │ 7. Forward to Whisper
     ▼
┌─────────────────────────────────┐
│   OpenAI Whisper API            │
│   Model: whisper-1              │
│   Stream: Yes                   │
└────┬────────────────────────────┘
     │ 8. Return transcript segments
     ▼
┌─────────────────────────────────┐
│   WebSocket Handler             │
│   Process: Segments             │
└────┬────────────────────────────┘
     │ 9. Send to client
     ▼
┌─────────────────────────────────┐
│   WebSocket Connection          │
│   Message: {                    │
│     type: 'transcript_segment'  │
│     text: '...',                │
│     is_final: false             │
│   }                             │
└────┬────────────────────────────┘
     │ 10. Update UI
     ▼
┌─────────────────────────────────┐
│   Transcription Display         │
│   Append: New text              │
│   Highlight: Current segment    │
└────┬────────────────────────────┘
     │ 11. Stop recording
     ▼
┌─────────────────────────────────┐
│   MediaRecorder.stop()          │
│   Send: 'stop' message          │
└────┬────────────────────────────┘
     │ 12. Finalize transcript
     ▼
┌─────────────────────────────────┐
│   WebSocket Handler             │
│   Apply: Spoken punctuation     │
│   Send: Complete transcript     │
└────┬────────────────────────────┘
     │ 13. Display final
     ▼
┌─────────────────────────────────┐
│   Findings Input Field          │
│   Insert: Full transcript       │
└─────────────────────────────────┘
```

---

## 🗄️ Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE SCHEMA                                   │
│                        (Supabase PostgreSQL 15+)                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│        users            │
├─────────────────────────┤
│ id UUID PK              │◄────────┐
│ email TEXT UNIQUE       │         │
│ name TEXT               │         │
│ outseta_id TEXT UNIQUE  │         │
│ avatar_url TEXT         │         │
│ preferences JSONB       │         │
│ created_at TIMESTAMP    │         │
│ updated_at TIMESTAMP    │         │
└─────────────────────────┘         │
                                    │ FK user_id
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              │                     │                     │
┌─────────────▼─────────┐ ┌────────▼───────────┐ ┌──────▼────────────┐
│      templates        │ │      reports       │ │  audio_files      │
├───────────────────────┤ ├────────────────────┤ ├───────────────────┤
│ id UUID PK            │ │ id UUID PK         │ │ id UUID PK        │
│ user_id UUID FK       │ │ user_id UUID FK    │ │ user_id UUID FK   │
│ name TEXT             │ │ template_id UUID FK├─►│ file_path TEXT    │
│ content TEXT          │ │ scan_type TEXT     │ │ file_name TEXT    │
│ description TEXT      │ │ clinical_hist TEXT │ │ mime_type TEXT    │
│ modality TEXT         │ │ findings TEXT      │ │ size_bytes BIGINT │
│ body_part TEXT        │ │ comparison TEXT    │ │ duration_sec DEC  │
│ tags TEXT[]           │ │ mode TEXT          │ │ created_at TS     │
│ is_default BOOLEAN    │ │ technique TEXT     │ └───────────────────┘
│ version INTEGER       │ │ report_findings TX │           │
│ created_at TIMESTAMP  │ │ impression TEXT    │           │ FK audio_file_id
│ updated_at TIMESTAMP  │ │ clinical_adv TEXT  │           │
└───────────────────────┘ │ questions TEXT[]   │ ┌─────────▼─────────┐
                          │ differential JSONB │ │  transcriptions   │
                          │ generation_time INT│ ├───────────────────┤
                          │ model_used TEXT    │ │ id UUID PK        │
                          │ tokens_used INT    │ │ user_id UUID FK   │
                          │ cost_usd DECIMAL   │ │ audio_file_id FK  │
                          │ status TEXT        │ │ transcript TEXT   │
                          │ created_at TS      │ │ model_used TEXT   │
                          │ updated_at TS      │ │ confidence DEC    │
                          │ finalized_at TS    │ │ duration_ms INT   │
                          └────────────────────┘ │ language TEXT     │
                                                 │ created_at TS     │
┌─────────────────────────┐                     └───────────────────┘
│    subscriptions        │
├─────────────────────────┤
│ id UUID PK              │
│ user_id UUID FK         ├────┐
│ outseta_id TEXT UNIQUE  │    │ FK user_id
│ plan_name TEXT          │    │
│ status TEXT             │    └──────┐
│ current_period_start TS │           │
│ current_period_end TS   │           │
│ cancel_at TIMESTAMP     │           │
│ created_at TIMESTAMP    │           │
│ updated_at TIMESTAMP    │           │
└─────────────────────────┘           │
                                      │
                          ┌───────────▼──────────┐
                          │  (back to users)     │
                          └──────────────────────┘

INDEXES:
─────────
users:
  • idx_users_email (email)
  • idx_users_outseta_id (outseta_id)

templates:
  • idx_templates_user_id (user_id)
  • idx_templates_modality (modality)
  • idx_templates_body_part (body_part)
  • idx_templates_tags (tags) GIN

reports:
  • idx_reports_user_id (user_id)
  • idx_reports_template_id (template_id)
  • idx_reports_scan_type (scan_type)
  • idx_reports_status (status)
  • idx_reports_created_at (created_at DESC)
  • idx_reports_user_created (user_id, created_at DESC)

audio_files:
  • idx_audio_files_user_id (user_id)
  • idx_audio_files_created_at (created_at DESC)

transcriptions:
  • idx_transcriptions_user_id (user_id)
  • idx_transcriptions_audio_file_id (audio_file_id)

subscriptions:
  • idx_subscriptions_user_id (user_id)
  • idx_subscriptions_outseta_id (outseta_id)
  • idx_subscriptions_status (status)
```

---

## 🔌 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT HIERARCHY                                  │
└─────────────────────────────────────────────────────────────────────────────┘

App (Root Layout)
│
├── Providers
│   ├── AuthProvider
│   │   └── Context: { user, login, logout, isAuthenticated }
│   ├── ThemeProvider
│   │   └── Context: { theme, setTheme }
│   └── ToastProvider
│       └── Context: { toast, dismiss }
│
├── Layout (Dashboard Layout)
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   │   ├── NavLink (Dashboard)
│   │   │   ├── NavLink (Generate)
│   │   │   ├── NavLink (Reports)
│   │   │   └── NavLink (Templates)
│   │   └── UserMenu
│   │       ├── Avatar
│   │       ├── Dropdown
│   │       │   ├── MenuItem (Settings)
│   │       │   ├── MenuItem (Billing)
│   │       │   └── MenuItem (Logout)
│   │       └── SubscriptionBadge
│   │
│   ├── Sidebar (Optional)
│   │   ├── QuickActions
│   │   │   ├── Button (New Report)
│   │   │   └── Button (New Template)
│   │   └── RecentReports
│   │       └── ReportCard[] (max 5)
│   │
│   └── Main
│       └── {children} (Page content)
│
└── Pages
    │
    ├── DashboardPage (/)
    │   ├── StatsCards
    │   │   ├── Card (Total Reports)
    │   │   ├── Card (This Month)
    │   │   └── Card (Templates)
    │   ├── RecentActivity
    │   │   └── ActivityItem[]
    │   └── QuickStart
    │       └── ActionButton[]
    │
    ├── GeneratePage (/generate)
    │   ├── ReportForm
    │   │   ├── ScanTypeSelector
    │   │   │   └── Select (CT, MRI, X-Ray, etc.)
    │   │   ├── Input (Clinical History)
    │   │   ├── FindingsInput
    │   │   │   ├── Textarea (Manual input)
    │   │   │   ├── AudioRecorder
    │   │   │   │   ├── RecordButton
    │   │   │   │   ├── AudioVisualizer
    │   │   │   │   ├── Timer
    │   │   │   │   └── StopButton
    │   │   │   ├── AudioUploader
    │   │   │   │   ├── Dropzone
    │   │   │   │   └── FileList
    │   │   │   └── TranscriptionDisplay
    │   │   │       ├── LiveText (streaming)
    │   │   │       └── ConfidenceIndicator
    │   │   ├── Input (Comparison)
    │   │   ├── TemplateSelector
    │   │   │   ├── SearchInput
    │   │   │   ├── FilterButtons
    │   │   │   └── TemplateGrid
    │   │   │       └── TemplateCard[]
    │   │   └── GenerationOptions
    │   │       ├── RadioGroup (espresso/slow_brewed)
    │   │       ├── Checkbox (Include advice)
    │   │       ├── Checkbox (Include questions)
    │   │       └── Checkbox (Include differential)
    │   │
    │   ├── ChatKitWidget (Floating)
    │   │   └── ChatKitSDK
    │   │       ├── ChatMessages
    │   │       ├── InputArea
    │   │       └── CustomActions
    │   │
    │   └── ReportPreview
    │       ├── LoadingState (during generation)
    │       ├── ErrorState (if failed)
    │       └── ReportDisplay
    │           ├── Section (Technique)
    │           ├── Section (Comparison)
    │           ├── Section (Findings)
    │           ├── Section (Impression)
    │           ├── Section (Clinical Advice)
    │           ├── Section (Questions)
    │           ├── Section (Differential Diagnosis)
    │           └── Actions
    │               ├── Button (Save)
    │               ├── Button (Edit)
    │               ├── Button (Export PDF)
    │               └── Button (Export DOCX)
    │
    ├── ReportsPage (/reports)
    │   ├── ReportFilters
    │   │   ├── SearchInput
    │   │   ├── DateRangePicker
    │   │   ├── Select (Scan Type)
    │   │   └── Select (Status)
    │   ├── ReportList
    │   │   └── ReportCard[]
    │   │       ├── Badge (Scan Type)
    │   │       ├── Text (Clinical History)
    │   │       ├── Date
    │   │       └── Actions
    │   │           ├── Button (View)
    │   │           ├── Button (Edit)
    │   │           └── Button (Delete)
    │   └── Pagination
    │
    ├── ReportDetailPage (/reports/[id])
    │   ├── ReportHeader
    │   │   ├── Title (Scan Type)
    │   │   ├── Metadata (Date, Model, Time)
    │   │   └── Actions
    │   │       ├── Button (Edit)
    │   │       ├── Button (Export)
    │   │       └── Button (Delete)
    │   └── ReportContent
    │       └── (Same sections as ReportPreview)
    │
    └── TemplatesPage (/templates)
        ├── TemplateFilters
        │   ├── SearchInput
        │   ├── Select (Modality)
        │   └── Select (Body Part)
        ├── TemplateGrid
        │   └── TemplateCard[]
        │       ├── Badge (Modality)
        │       ├── Badge (Body Part)
        │       ├── Badge (Default)
        │       ├── Text (Description)
        │       └── Actions
        │           ├── Button (Use)
        │           ├── Button (Edit)
        │           └── Button (Delete)
        └── CreateButton (FAB)
```

---

## 🔄 State Management Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT                                     │
└─────────────────────────────────────────────────────────────────────────────┘

CLIENT STATE (React Context + Hooks)
│
├── AuthContext
│   ├── State:
│   │   ├── user: User | null
│   │   ├── isAuthenticated: boolean
│   │   ├── isLoading: boolean
│   │   └── error: string | null
│   └── Actions:
│       ├── login(credentials) → Promise<void>
│       ├── logout() → Promise<void>
│       └── refreshSession() → Promise<void>
│
├── ThemeContext
│   ├── State:
│   │   └── theme: 'light' | 'dark' | 'system'
│   └── Actions:
│       └── setTheme(theme) → void
│
└── ToastContext
    ├── State:
    │   └── toasts: Toast[]
    └── Actions:
        ├── toast(message, type) → void
        └── dismiss(id) → void

SERVER STATE (React Query / SWR)
│
├── Templates
│   ├── useTemplates(filters)
│   │   ├── Query Key: ['templates', userId, filters]
│   │   ├── Fetcher: GET /api/templates
│   │   ├── Cache: 5 minutes
│   │   └── Refetch: On window focus
│   │
│   ├── useTemplate(id)
│   │   ├── Query Key: ['template', id]
│   │   ├── Fetcher: GET /api/templates/:id
│   │   └── Cache: 10 minutes
│   │
│   ├── useCreateTemplate()
│   │   ├── Mutation: POST /api/templates
│   │   └── Invalidates: ['templates']
│   │
│   └── useUpdateTemplate()
│       ├── Mutation: PUT /api/templates/:id
│       └── Invalidates: ['templates'], ['template', id]
│
├── Reports
│   ├── useReports(filters)
│   │   ├── Query Key: ['reports', userId, filters]
│   │   ├── Fetcher: GET /api/reports
│   │   ├── Cache: 2 minutes
│   │   └── Pagination: Enabled
│   │
│   ├── useReport(id)
│   │   ├── Query Key: ['report', id]
│   │   └── Fetcher: GET /api/reports/:id
│   │
│   └── useGenerateReport()
│       ├── Mutation: POST /api/generate
│       ├── On Success: Invalidates ['reports']
│       └── Optimistic Update: Add pending report
│
└── Transcription
    ├── useTranscription()
    │   ├── Mutation: POST /api/transcribe
    │   └── Progress: Track upload progress
    │
    └── useRealtimeTranscription()
        ├── WebSocket: /api/transcribe/ws
        ├── State: transcript, isRecording, confidence
        └── Actions: start(), stop(), pause()

LOCAL STATE (Component State)
│
├── Form State (React Hook Form)
│   ├── ReportForm
│   │   ├── scan_type: string
│   │   ├── clinical_history: string
│   │   ├── findings: string
│   │   ├── comparison: string
│   │   ├── template_id: string
│   │   └── options: GenerationOptions
│   │
│   └── TemplateForm
│       ├── name: string
│       ├── content: string
│       ├── description: string
│       ├── modality: string
│       ├── body_part: string
│       └── tags: string[]
│
└── UI State
    ├── Modals: isOpen, activeModal
    ├── Dropdowns: isExpanded
    ├── Sidebars: isCollapsed
    └── Filters: activeFilters
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 1: NETWORK SECURITY
├── HTTPS Only (TLS 1.3)
├── Content Security Policy (CSP)
├── HSTS Headers
└── DDoS Protection (Vercel)

LAYER 2: AUTHENTICATION
├── Outseta OAuth 2.0
│   ├── Authorization Code Flow
│   ├── PKCE (optional, recommended)
│   ├── State Parameter (CSRF protection)
│   └── Token Expiration (7 days)
├── Session Management
│   ├── HTTP-Only Cookies
│   ├── Secure Flag (production)
│   ├── SameSite=Lax
│   └── Token Refresh
└── Multi-Factor Authentication (Outseta)

LAYER 3: AUTHORIZATION
├── Middleware Protection
│   ├── Check: Session token valid
│   ├── Verify: With Outseta API
│   └── Block: Unauthorized requests
├── API Route Guards
│   ├── Extract: User ID from token
│   ├── Validate: User exists
│   └── Check: Subscription status
└── Row Level Security (RLS)
    ├── Policy: Users see only their data
    ├── Enforcement: Database level
    └── Bypass: Service role key only

LAYER 4: DATA PROTECTION
├── Encryption at Rest
│   ├── Database: Supabase default
│   └── Files: Supabase Storage
├── Encryption in Transit
│   ├── HTTPS: All connections
│   └── WSS: WebSocket connections
└── Sensitive Data Handling
    ├── No PHI in logs
    ├── Masked in error messages
    └── Audit trail for access

LAYER 5: INPUT VALIDATION
├── Client-Side
│   ├── React Hook Form
│   ├── Zod Schemas
│   └── Real-time validation
├── Server-Side
│   ├── API Route validation
│   ├── Zod Schema parsing
│   └── Type checking
└── Sanitization
    ├── XSS Prevention
    ├── SQL Injection (Supabase parameterized)
    └── Path Traversal

LAYER 6: API SECURITY
├── Rate Limiting
│   ├── Per User: 60 req/min
│   ├── Per IP: 100 req/min
│   └── Sliding Window
├── CORS Policy
│   ├── Origin: Same domain only
│   ├── Credentials: Include
│   └── Methods: Explicit list
└── API Keys
    ├── Environment variables
    ├── Never in code
    └── Rotation policy

LAYER 7: MONITORING & INCIDENT RESPONSE
├── Error Tracking (Sentry)
│   ├── Client errors
│   ├── Server errors
│   └── Performance issues
├── Audit Logging
│   ├── Authentication events
│   ├── Data access
│   └── Admin actions
└── Alerts
    ├── Suspicious activity
    ├── Failed auth attempts
    └── API anomalies
```

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘

DEVELOPMENT ENVIRONMENT
┌────────────────────────────┐
│   Developer Machine        │
│                            │
│   ┌────────────────────┐   │
│   │  localhost:3000    │   │
│   │  Next.js Dev       │   │
│   │  Hot Reload        │   │
│   └────────────────────┘   │
│            │               │
│            ▼               │
│   ┌────────────────────┐   │
│   │  Local Supabase    │   │
│   │  (Docker)          │   │
│   └────────────────────┘   │
└────────────────────────────┘

STAGING/PREVIEW ENVIRONMENT
┌────────────────────────────┐
│      Vercel Preview        │
│  (per Pull Request)        │
│                            │
│   ┌────────────────────┐   │
│   │  preview-*.vercel  │   │
│   │  Next.js Build     │   │
│   │  Edge Functions    │   │
│   └──────┬─────────────┘   │
│          │                 │
│          ▼                 │
│   ┌────────────────────┐   │
│   │  Preview Database  │   │
│   │  (Supabase Branch) │   │
│   └────────────────────┘   │
└────────────────────────────┘

PRODUCTION ENVIRONMENT
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE NETWORK                                  │
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   US East   │  │   US West   │  │   Europe    │  │   Asia Pac  │       │
│  │   (IAD)     │  │   (SFO)     │  │   (FRA)     │  │   (SIN)     │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                 │                 │               │
│         └────────────────┴─────────────────┴─────────────────┘               │
│                                  │                                           │
│                                  ▼                                           │
│                     ┌──────────────────────┐                                │
│                     │   Next.js App        │                                │
│                     │   • Server Comp      │                                │
│                     │   • API Routes       │                                │
│                     │   • Edge Functions   │                                │
│                     └──────────┬───────────┘                                │
└────────────────────────────────┼─────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
     ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
     │  Supabase    │  │  Outseta    │  │  OpenAI      │
     │  Production  │  │  Production │  │  API         │
     │              │  │             │  │              │
     │  • Database  │  │  • Auth     │  │  • GPT-5/O3  │
     │  • Storage   │  │  • Billing  │  │  • Whisper   │
     │  • Realtime  │  │  • CRM      │  │  • ChatKit   │
     └──────────────┘  └─────────────┘  └──────────────┘

CI/CD PIPELINE
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GITHUB ACTIONS                                       │
│                                                                               │
│  1. Push to Branch                                                           │
│     └──> Trigger Workflow                                                    │
│                                                                               │
│  2. Lint & Type Check                                                        │
│     ├──> ESLint                                                              │
│     └──> TypeScript                                                          │
│                                                                               │
│  3. Run Tests                                                                │
│     ├──> Unit Tests (Vitest)                                                 │
│     ├──> Integration Tests                                                   │
│     └──> Coverage Report                                                     │
│                                                                               │
│  4. Build Application                                                        │
│     ├──> Next.js Build                                                       │
│     ├──> Type Generation                                                     │
│     └──> Asset Optimization                                                  │
│                                                                               │
│  5. Deploy to Vercel                                                         │
│     ├──> Preview (on PR)                                                     │
│     └──> Production (on main)                                                │
│                                                                               │
│  6. Post-Deploy                                                              │
│     ├──> Smoke Tests                                                         │
│     ├──> Database Migrations                                                 │
│     └──> Notification (Slack/Email)                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Microservices Interaction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVICE INTERACTION MAP                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Next.js App
     │
     ├─────────────────┐
     │                 │
     ▼                 ▼
Supabase          Outseta
     │                 │
     │  ┌──────────────┤
     │  │              │
     │  │  User Sync   │
     │  │  (Webhook)   │
     │  │              │
     │  └──────────────┘
     │
     │
     ▼
┌─────────────────────────────────┐
│   Database Operations           │
│   • CRUD on all tables          │
│   • File storage (Supabase)     │
│   • Realtime subscriptions      │
└─────────────────────────────────┘

Next.js App → OpenAI
     │
     ├──────────► Whisper API
     │            • Audio → Text
     │            • Streaming mode
     │            • Batch mode
     │
     ├──────────► GPT-5 / O3
     │            • Report generation
     │            • Fallback to GPT-4o
     │            • JSON mode
     │
     └──────────► ChatKit
                  • Widget rendering
                  • Custom actions
                  • Context management

Next.js App → Search Services
     │
     ├──────────► PubMed
     │            • Medical literature
     │            • E-utilities API
     │            • Result ranking
     │
     ├──────────► Radiopaedia
     │            • Radiology reference
     │            • Case studies
     │            • Image database
     │
     └──────────► Google Custom Search
                  • General web search
                  • Filtered results
                  • Medical sites only

Webhooks (Inbound)
     │
     └──────────► Outseta Webhooks
                  • subscription.created
                  • subscription.updated
                  • subscription.canceled
                  • user.updated
                  │
                  └──► Sync to Supabase
```

---

*These diagrams provide visual representations of the system architecture, data flows, and component relationships. Use them as reference during development and for onboarding new team members.*

**Legend**:
- `─────` : Flow/Connection
- `│` : Vertical connection
- `┌┐└┘` : Boxes/containers
- `▼►` : Direction of flow
- `◄` : Foreign key relationship
- `PK` : Primary Key
- `FK` : Foreign Key
