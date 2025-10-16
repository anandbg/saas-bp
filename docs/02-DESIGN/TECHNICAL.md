# Technical Design Document - Radiology Reporting App

## 📑 Document Information

**Version**: 1.0
**Date**: January 2025
**Status**: Draft for Review
**Author**: Claude Code (Autonomous Development System)

---

## 🎯 Purpose

This document provides detailed technical specifications for implementing the Radiology Reporting App migration from Node.js/Express to Next.js 14+. It serves as a reference for:

- Implementation decisions
- Code organization
- Integration patterns
- Data flow
- Error handling
- Performance optimization

---

## 📐 System Architecture

### Architecture Style

**Monolithic Next.js Application** with:
- Server-side rendering (SSR) for initial page loads
- Client-side navigation for SPA-like experience
- API routes for backend logic
- Edge functions for global performance
- WebSocket server for real-time features

### Why Next.js App Router?

1. **Server Components**: Reduce JavaScript bundle size, improve performance
2. **Streaming**: Progressive rendering for better perceived performance
3. **File-based Routing**: Intuitive project structure
4. **API Routes**: Backend logic in same codebase
5. **Edge Runtime**: Deploy closer to users globally
6. **Built-in Optimizations**: Image optimization, font optimization, etc.

---

## 🏗️ Project Structure

```
radiology-reporting-app/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI/CD pipeline
│       └── deploy.yml                # Deployment workflow
│
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── route.ts
│   │
│   ├── (dashboard)/                  # Protected route group
│   │   ├── layout.tsx                # Dashboard layout
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── generate/
│   │   │   └── page.tsx              # Generate report
│   │   ├── reports/
│   │   │   ├── page.tsx              # List reports
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # View report
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx      # Edit report
│   │   │   └── loading.tsx
│   │   ├── templates/
│   │   │   ├── page.tsx              # List templates
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # View/edit template
│   │   │   └── new/
│   │   │       └── page.tsx          # Create template
│   │   └── settings/
│   │       └── page.tsx              # User settings
│   │
│   ├── api/                          # API routes
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts
│   │   │   ├── logout/
│   │   │   │   └── route.ts
│   │   │   └── session/
│   │   │       └── route.ts
│   │   ├── transcribe/
│   │   │   ├── route.ts              # Batch transcription
│   │   │   └── ws/
│   │   │       └── route.ts          # WebSocket endpoint
│   │   ├── generate/
│   │   │   └── route.ts              # Report generation
│   │   ├── templates/
│   │   │   ├── route.ts              # List/create
│   │   │   ├── [id]/
│   │   │   │   └── route.ts          # Get/update/delete
│   │   │   └── default/
│   │   │       └── route.ts          # Get default
│   │   ├── reports/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── export/
│   │   │           └── route.ts
│   │   ├── search/
│   │   │   ├── pubmed/
│   │   │   │   └── route.ts
│   │   │   ├── radiopaedia/
│   │   │   │   └── route.ts
│   │   │   └── google/
│   │   │       └── route.ts
│   │   ├── webhooks/
│   │   │   └── outseta/
│   │   │       └── route.ts
│   │   └── health/
│   │       └── route.ts
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   ├── error.tsx                     # Error boundary
│   └── not-found.tsx                 # 404 page
│
├── components/                       # React components
│   ├── ui/                           # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/                       # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── auth/                         # Auth components
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── audio/                        # Audio components
│   │   ├── AudioRecorder.tsx
│   │   ├── AudioUploader.tsx
│   │   ├── AudioVisualizer.tsx
│   │   └── TranscriptionDisplay.tsx
│   ├── templates/                    # Template components
│   │   ├── TemplateCard.tsx
│   │   ├── TemplateEditor.tsx
│   │   ├── TemplateSelector.tsx
│   │   └── TemplateFilters.tsx
│   ├── reports/                      # Report components
│   │   ├── ReportForm.tsx
│   │   ├── ReportPreview.tsx
│   │   ├── ReportCard.tsx
│   │   ├── ReportEditor.tsx
│   │   └── ReportFilters.tsx
│   ├── chatkit/                      # ChatKit components
│   │   ├── ChatKitWidget.tsx
│   │   ├── ChatKitActions.tsx
│   │   └── ChatKitConfig.ts
│   └── search/                       # Search components
│       ├── SearchPanel.tsx
│       ├── SearchResults.tsx
│       └── SearchFilters.tsx
│
├── lib/                              # Core business logic
│   ├── auth/                         # Authentication
│   │   ├── outseta-client.ts
│   │   ├── session.ts
│   │   └── middleware.ts
│   ├── ai/                           # AI services
│   │   ├── report-generator.ts       # Main generator
│   │   ├── prompt-builder.ts         # Prompt construction
│   │   ├── contradiction-cleaner.ts  # Template integration
│   │   ├── model-fallback.ts         # Fallback logic
│   │   └── vercel-ai-sdk.ts         # Vercel AI SDK wrapper
│   ├── transcription/                # Transcription services
│   │   ├── whisper-client.ts         # OpenAI Whisper
│   │   ├── deepgram-client.ts        # Deepgram (optional)
│   │   ├── spoken-punctuation.ts     # Punctuation converter
│   │   └── websocket-handler.ts      # Real-time handler
│   ├── templates/                    # Template services
│   │   ├── template-service.ts       # CRUD operations
│   │   ├── template-validator.ts     # Validation
│   │   └── template-integration.ts   # Integration logic
│   ├── reports/                      # Report services
│   │   ├── report-service.ts         # CRUD operations
│   │   ├── report-validator.ts       # Validation
│   │   └── export-service.ts         # PDF/DOCX export
│   ├── search/                       # Search services
│   │   ├── pubmed-client.ts
│   │   ├── radiopaedia-client.ts
│   │   ├── google-client.ts
│   │   └── result-ranker.ts
│   ├── database/                     # Database utilities
│   │   ├── supabase-client.ts
│   │   ├── queries.ts
│   │   └── types.ts
│   ├── storage/                      # File storage
│   │   ├── audio-storage.ts
│   │   └── report-storage.ts
│   ├── webhooks/                     # Webhook handlers
│   │   └── outseta-handler.ts
│   ├── utils/                        # Utilities
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── error-handling.ts
│   │   └── rate-limiter.ts
│   └── constants/                    # Constants
│       ├── models.ts
│       ├── prompts.ts
│       └── config.ts
│
├── types/                            # TypeScript types
│   ├── database.ts                   # Database types
│   ├── api.ts                        # API types
│   ├── components.ts                 # Component prop types
│   └── index.ts                      # Exports
│
├── hooks/                            # Custom React hooks
│   ├── useAuth.ts
│   ├── useTranscription.ts
│   ├── useReportGeneration.ts
│   ├── useTemplates.ts
│   └── useReports.ts
│
├── contexts/                         # React contexts
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
│
├── middleware.ts                     # Next.js middleware
│
├── public/                           # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── supabase/                         # Supabase files
│   ├── migrations/                   # Database migrations
│   └── config.toml                   # Supabase config
│
├── tests/                            # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local                        # Local environment variables
├── .env.example                      # Example env file
├── .eslintrc.json                    # ESLint config
├── .prettierrc                       # Prettier config
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependencies
└── README.md                         # Project README
```

---

## 🔌 Core Integrations

### 1. Outseta Authentication

**Implementation**: OAuth 2.0 Authorization Code Flow

**Files**:
- `lib/auth/outseta-client.ts`
- `app/api/auth/callback/route.ts`
- `middleware.ts`

**Flow Diagram**:
```
User → Click "Login"
  ↓
Redirect to Outseta
  ↓
User authenticates
  ↓
Outseta redirects back with code
  ↓
/api/auth/callback receives code
  ↓
Exchange code for access token
  ↓
Verify token with Outseta API
  ↓
Create/update user in Supabase
  ↓
Set secure HTTP-only cookie
  ↓
Redirect to dashboard
```

**Code Example**:

```typescript
// lib/auth/outseta-client.ts
import { OutsetaClient } from '@outseta/sdk';

export const outseta = new OutsetaClient({
  apiKey: process.env.OUTSETA_API_KEY!,
  domain: process.env.OUTSETA_DOMAIN!,
});

export async function exchangeCodeForToken(code: string) {
  const response = await fetch(`https://${process.env.OUTSETA_DOMAIN}/api/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.OUTSETA_CLIENT_ID,
      client_secret: process.env.OUTSETA_CLIENT_SECRET,
      redirect_uri: process.env.OUTSETA_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
}

export async function verifyToken(accessToken: string) {
  const response = await fetch(`https://${process.env.OUTSETA_DOMAIN}/api/v1/profile`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Invalid access token');
  }

  return response.json();
}
```

```typescript
// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, verifyToken } from '@/lib/auth/outseta-client';
import { createClient } from '@/lib/database/supabase-client';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  try {
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, refresh_token } = tokenData;

    // Verify token and get user info
    const outsetaUser = await verifyToken(access_token);

    // Create/update user in Supabase
    const supabase = createClient();
    const { data: user, error: dbError } = await supabase
      .from('users')
      .upsert({
        outseta_id: outsetaUser.Uid,
        email: outsetaUser.Email,
        name: `${outsetaUser.FirstName} ${outsetaUser.LastName}`,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Set secure cookie
    cookies().set('session_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }
}
```

### 2. Supabase Database

**Implementation**: Server-side client with Row Level Security

**Files**:
- `lib/database/supabase-client.ts`
- `lib/database/queries.ts`

**Code Example**:

```typescript
// lib/database/supabase-client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

export function createClientWithUser(userId: string) {
  const supabase = createClient();
  // Set user context for RLS
  supabase.rpc('set_current_user', { user_id: userId });
  return supabase;
}
```

```typescript
// lib/database/queries.ts
import { createClient } from './supabase-client';
import type { Template, Report } from '@/types/database';

export async function getTemplates(userId: string, filters?: {
  modality?: string;
  bodyPart?: string;
  search?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.modality) {
    query = query.eq('modality', filters.modality);
  }

  if (filters?.bodyPart) {
    query = query.eq('body_part', filters.bodyPart);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Template[];
}

export async function createTemplate(userId: string, template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();

  // If setting as default, unset other defaults
  if (template.is_default) {
    await supabase
      .from('templates')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('templates')
    .insert({
      ...template,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Template;
}
```

### 3. OpenAI Integration

**Implementation**: Vercel AI SDK 5 + Direct API Calls

**Files**:
- `lib/ai/vercel-ai-sdk.ts`
- `lib/ai/report-generator.ts`
- `lib/transcription/whisper-client.ts`

**Code Example**:

```typescript
// lib/ai/vercel-ai-sdk.ts
import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateReport(prompt: string, mode: 'espresso' | 'slow_brewed') {
  const model = mode === 'espresso' ? 'gpt-5' : 'o3';
  const fallbackModel = mode === 'espresso' ? 'gpt-4o-mini' : 'gpt-4o';
  const temperature = mode === 'espresso' ? 0.3 : 0.1;
  const maxTokens = mode === 'espresso' ? 4000 : 8000;

  try {
    const { text, usage } = await generateText({
      model: openai(model),
      prompt,
      temperature,
      maxTokens,
    });

    return {
      report: JSON.parse(text),
      metadata: {
        model_used: model,
        tokens_used: usage.totalTokens,
      },
    };
  } catch (error) {
    console.error(`Error with ${model}, falling back to ${fallbackModel}:`, error);

    // Fallback to secondary model
    const { text, usage } = await generateText({
      model: openai(fallbackModel),
      prompt,
      temperature,
      maxTokens,
    });

    return {
      report: JSON.parse(text),
      metadata: {
        model_used: fallbackModel,
        tokens_used: usage.totalTokens,
        fallback: true,
      },
    };
  }
}
```

```typescript
// lib/transcription/whisper-client.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioFile: File) {
  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
  });

  return {
    transcript: response.text,
    confidence: response.segments?.[0]?.avg_logprob || null,
    duration: response.duration,
  };
}
```

### 4. ChatKit Integration

**Implementation**: React component using OpenAI ChatKit (part of AgentKit, launched October 2025)

**Package**: `@openai/chatkit-react` (npm install @openai/chatkit-react)

**Authentication**: Uses existing OpenAI API key - no separate credentials required

**Files**:
- `components/chatkit/ChatKitWidget.tsx` - Main widget component
- `app/api/chatkit/session/route.ts` - Server-side session creation
- `lib/chatkit/config.ts` - Configuration (optional)

**Code Example**:

```typescript
// app/api/chatkit/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getUserFromRequest } from '@/lib/auth/api-protection';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    // Create ChatKit session
    const session = await openai.chatkit.sessions.create({
      // Optional: specify a custom assistant
      agent_id: process.env.OPENAI_ASSISTANT_ID, // Or use default
      // Optional: pass user context
      metadata: {
        user_id: user.id,
        user_email: user.email,
      },
    });

    return NextResponse.json({
      client_secret: session.client_secret
    });
  } catch (error) {
    console.error('ChatKit session error:', error);
    return NextResponse.json(
      { error: 'Failed to create ChatKit session' },
      { status: 500 }
    );
  }
}
```

```typescript
// components/chatkit/ChatKitWidget.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function RadiologyChatWidget() {
  const { control } = useChatKit({
    api: {
      async getClientSecret() {
        const res = await fetch('/api/chatkit/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          throw new Error('Failed to get ChatKit session');
        }

        const { client_secret } = await res.json();
        return client_secret;
      },
    },
  });

  return (
    <div className="fixed bottom-4 right-4">
      <ChatKit
        control={control}
        className="w-[400px] h-[600px] rounded-lg shadow-2xl"
      />
    </div>
  );
}
```

**Resources**:
- Documentation: https://platform.openai.com/docs/guides/chatkit
- GitHub: https://github.com/openai/chatkit-js
- Starter App: https://github.com/openai/openai-chatkit-starter-app

**Note**: ChatKit is generally available as of October 2025 and uses your existing OpenAI API key. No separate ChatKit credentials are required.

---

## 🔄 Critical Business Logic Migration

### 1. Spoken Punctuation Conversion

**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:155-184`

**New Location**: `lib/transcription/spoken-punctuation.ts`

**Implementation**:

```typescript
// lib/transcription/spoken-punctuation.ts

/**
 * Converts spoken punctuation phrases to actual punctuation marks.
 * CRITICAL: This function must preserve exact behavior from existing app.
 *
 * Examples:
 * - "full stop" → "."
 * - "comma" → ","
 * - "new line" → "\n"
 */
export function applySpokenPunctuation(input: string): string {
  if (!input) return input;

  let text = input;

  const replacements: Array<{ re: RegExp; rep: string }> = [
    { re: /\b(full\s+stop|period)\b/gi, rep: '.' },
    { re: /\b(comma)\b/gi, rep: ',' },
    { re: /\b(question\s*mark|questionmark)\b/gi, rep: '?' },
    { re: /\b(exclamation\s*(mark|point)|exclamationmark)\b/gi, rep: '!' },
    { re: /\b(colon)\b/gi, rep: ':' },
    { re: /\b(semi[-\s]?colon)\b/gi, rep: ';' },
    { re: /\b(new\s+line|newline)\b/gi, rep: '\n' },
    { re: /\b(new\s+paragraph)\b/gi, rep: '\n\n' },
  ];

  for (const { re, rep } of replacements) {
    text = text.replace(re, rep);
  }

  // Normalize spaces around punctuation
  text = text
    .replace(/\s+([.,!?;:])/g, '$1') // Remove space before punctuation
    .replace(/([.,!?;:])(?!\s|\n)/g, '$1 ') // Add space after punctuation
    .replace(/\s+\n/g, '\n') // Clean up before newlines
    .replace(/\n\s+/g, '\n') // Clean up after newlines
    .replace(/\s{2,}/g, ' ') // Normalize multiple spaces
    .trim();

  return text;
}

/**
 * Test cases to verify exact behavior
 */
export function testSpokenPunctuation() {
  const tests = [
    {
      input: 'No fracture full stop',
      expected: 'No fracture.',
    },
    {
      input: 'Nodules in right lung comma left lung comma and mediastinum full stop',
      expected: 'Nodules in right lung, left lung, and mediastinum.',
    },
    {
      input: 'There is a mass question mark',
      expected: 'There is a mass?',
    },
    {
      input: 'Critical finding exclamation mark',
      expected: 'Critical finding!',
    },
    {
      input: 'First line new line Second line new paragraph Third line',
      expected: 'First line\nSecond line\n\nThird line',
    },
  ];

  tests.forEach(({ input, expected }) => {
    const actual = applySpokenPunctuation(input);
    if (actual !== expected) {
      console.error(`Test failed:\nInput: ${input}\nExpected: ${expected}\nActual: ${actual}`);
    } else {
      console.log(`✓ Test passed: ${input}`);
    }
  });
}
```

### 2. Contradiction Cleaning

**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:701-765`

**New Location**: `lib/ai/contradiction-cleaner.ts`

**Implementation**:

```typescript
// lib/ai/contradiction-cleaner.ts

/**
 * Cleans conflicting normal statements from template when abnormalities are present.
 * CRITICAL: This prevents contradictions like "lungs are clear" when "nodule present".
 *
 * Logic:
 * 1. If user mentions abnormality in organ → Remove template's "normal" statement for that organ
 * 2. Preserve template normals for organs not mentioned by user
 * 3. Add qualifiers like "otherwise" or "at other levels" where appropriate
 */
export function cleanConflictingNormals(
  userFindings: string,
  templateContent: string
): string {
  // Extract findings section from template
  const findingsMatch = templateContent.match(/FINDINGS:([\s\S]*?)(?=IMPRESSION:|$)/i);
  if (!findingsMatch) return templateContent;

  let templateFindings = findingsMatch[1].trim();
  const lowerUserFindings = userFindings.toLowerCase();

  // Define organ systems and their associated keywords
  const organSystems = [
    {
      name: 'lungs',
      abnormalKeywords: ['nodule', 'mass', 'consolidation', 'opacity', 'infiltrate', 'pneumonia'],
      normalPhrases: [
        /the lungs are clear/gi,
        /lungs clear/gi,
        /no focal consolidation/gi,
        /no mass or nodule/gi,
      ],
      adaptation: 'otherwise clear',
    },
    {
      name: 'heart',
      abnormalKeywords: ['cardiomegaly', 'enlarged heart', 'cardiac', 'pericardial'],
      normalPhrases: [
        /heart size is normal/gi,
        /cardiac silhouette is normal/gi,
        /normal heart size/gi,
      ],
      adaptation: 'otherwise normal',
    },
    {
      name: 'pleura',
      abnormalKeywords: ['effusion', 'pneumothorax', 'pleural'],
      normalPhrases: [
        /no pleural effusion/gi,
        /no pneumothorax/gi,
        /pleural spaces are clear/gi,
      ],
      adaptation: 'otherwise clear',
    },
    {
      name: 'lymph nodes',
      abnormalKeywords: ['lymphadenopathy', 'enlarged lymph', 'lymph node'],
      normalPhrases: [
        /no enlarged lymph nodes/gi,
        /no lymphadenopathy/gi,
        /lymph nodes are normal/gi,
      ],
      adaptation: 'otherwise normal',
    },
    {
      name: 'vertebrae',
      abnormalKeywords: ['fracture', 'compression', 'height loss'],
      normalPhrases: [
        /no.*fracture/gi,
        /vertebral body heights are maintained/gi,
        /no evidence of.*fracture/gi,
      ],
      adaptation: 'at other levels',
    },
    {
      name: 'discs',
      abnormalKeywords: ['disc.*narrowing', 'degenerative', 'disc space'],
      normalPhrases: [
        /disc spaces are preserved/gi,
        /no.*degenerative changes/gi,
        /intervertebral disc spaces are normal/gi,
      ],
      adaptation: 'at other levels',
    },
  ];

  // Check each organ system
  for (const system of organSystems) {
    const hasAbnormality = system.abnormalKeywords.some(keyword =>
      new RegExp(keyword, 'i').test(lowerUserFindings)
    );

    if (hasAbnormality) {
      // Remove or adapt normal phrases for this organ system
      for (const phrase of system.normalPhrases) {
        if (system.name === 'vertebrae' || system.name === 'discs') {
          // For multi-level structures, add qualifier
          templateFindings = templateFindings.replace(
            phrase,
            (match) => match.replace(/\.$/, ` ${system.adaptation}.`)
          );
        } else {
          // For single organs, remove the normal statement
          templateFindings = templateFindings.replace(phrase, '');
        }
      }
    }
  }

  // Clean up any duplicate periods, spaces, or empty lines
  templateFindings = templateFindings
    .replace(/\.\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  // Replace findings in template
  return templateContent.replace(
    /FINDINGS:([\s\S]*?)(?=IMPRESSION:|$)/i,
    `FINDINGS:\n${templateFindings}\n\n`
  );
}

/**
 * Integration function that merges user findings with template
 */
export function integrateFindings(
  userFindings: string,
  templateContent: string
): string {
  // Clean contradictions first
  let integrated = cleanConflictingNormals(userFindings, templateContent);

  // Extract template findings
  const findingsMatch = integrated.match(/FINDINGS:([\s\S]*?)(?=IMPRESSION:|$)/i);
  if (!findingsMatch) return integrated;

  let templateFindings = findingsMatch[1].trim();

  // Prepend user findings (abnormalities first)
  const mergedFindings = `${userFindings} ${templateFindings}`;

  // Replace findings section
  integrated = integrated.replace(
    /FINDINGS:([\s\S]*?)(?=IMPRESSION:|$)/i,
    `FINDINGS:\n${mergedFindings}\n\n`
  );

  return integrated;
}
```

### 3. Report Generation with Model Fallback

**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:418-897`

**New Location**: `lib/ai/report-generator.ts`

**Implementation**:

```typescript
// lib/ai/report-generator.ts
import { generateReport as generateWithVercelAI } from './vercel-ai-sdk';
import { buildPrompt } from './prompt-builder';
import { integrateFindings } from './contradiction-cleaner';
import { applySpokenPunctuation } from '../transcription/spoken-punctuation';
import type { ReportGenerationInput, GeneratedReport } from '@/types/api';

export async function generateRadiologyReport(
  input: ReportGenerationInput
): Promise<GeneratedReport> {
  const startTime = Date.now();

  try {
    // Step 1: Apply spoken punctuation conversion to findings
    const cleanedFindings = applySpokenPunctuation(input.findings);

    // Step 2: Load template if specified
    let templateContent = '';
    if (input.template_id) {
      const template = await getTemplate(input.template_id);
      templateContent = template.content;
    }

    // Step 3: Integrate findings with template
    const integratedContent = templateContent
      ? integrateFindings(cleanedFindings, templateContent)
      : cleanedFindings;

    // Step 4: Build prompt using report_prompt.txt template
    const prompt = buildPrompt({
      scan_type: input.scan_type,
      clinical_history: input.clinical_history,
      findings: integratedContent,
      comparison: input.comparison,
      template_content: templateContent,
      mode: input.mode,
      include_advice: input.include_advice,
      include_questions: input.include_questions,
      include_differential: input.include_differential,
    });

    // Step 5: Generate report with model fallback
    const { report, metadata } = await generateWithVercelAI(prompt, input.mode);

    // Step 6: Validate JSON structure
    validateReportStructure(report);

    // Step 7: Calculate generation time
    const generationTime = Date.now() - startTime;

    return {
      report,
      metadata: {
        ...metadata,
        generation_time_ms: generationTime,
      },
    };
  } catch (error) {
    console.error('Report generation error:', error);
    throw new Error(`Failed to generate report: ${error.message}`);
  }
}

function validateReportStructure(report: any) {
  const requiredFields = ['technique', 'comparison', 'findings', 'impression'];
  const missingFields = requiredFields.filter(field => !report[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate that findings don't contain forbidden patterns
  if (report.findings.match(/pertinent\s+negatives:/i)) {
    throw new Error('Report contains forbidden "Pertinent Negatives" section');
  }
}
```

---

## 🧪 Testing Approach

### Unit Tests

**Critical Functions to Test**:

```typescript
// tests/unit/spoken-punctuation.test.ts
import { describe, it, expect } from 'vitest';
import { applySpokenPunctuation } from '@/lib/transcription/spoken-punctuation';

describe('applySpokenPunctuation', () => {
  it('converts "full stop" to period', () => {
    expect(applySpokenPunctuation('No fracture full stop'))
      .toBe('No fracture.');
  });

  it('handles multiple punctuation types', () => {
    expect(applySpokenPunctuation('Finding A comma Finding B full stop'))
      .toBe('Finding A, Finding B.');
  });

  it('converts newline keywords', () => {
    expect(applySpokenPunctuation('Line 1 new line Line 2'))
      .toBe('Line 1\nLine 2');
  });

  it('normalizes spaces around punctuation', () => {
    expect(applySpokenPunctuation('Text  comma  more text  full stop'))
      .toBe('Text, more text.');
  });
});
```

```typescript
// tests/unit/contradiction-cleaner.test.ts
import { describe, it, expect } from 'vitest';
import { cleanConflictingNormals } from '@/lib/ai/contradiction-cleaner';

describe('cleanConflictingNormals', () => {
  const template = `
FINDINGS:
The lungs are clear without focal consolidation. No pleural effusion or pneumothorax.
Heart size is normal. No enlarged lymph nodes.

IMPRESSION:
No acute cardiopulmonary abnormality.
  `.trim();

  it('removes "lungs are clear" when nodule mentioned', () => {
    const userFindings = 'There is a nodule in the right upper lobe.';
    const result = cleanConflictingNormals(userFindings, template);

    expect(result).not.toMatch(/lungs are clear/i);
    expect(result).toMatch(/no pleural effusion/i); // Preserves other normals
  });

  it('adapts "no fracture" when fracture at specific level', () => {
    const spineTemplate = `
FINDINGS:
No evidence of acute fracture or dislocation. Vertebral body heights are maintained.
    `.trim();

    const userFindings = 'Compression fracture at L1.';
    const result = cleanConflictingNormals(userFindings, spineTemplate);

    expect(result).toMatch(/at other levels/i);
  });

  it('preserves normals for unaffected systems', () => {
    const userFindings = 'Pleural effusion noted.';
    const result = cleanConflictingNormals(userFindings, template);

    expect(result).toMatch(/lungs are clear/i); // Lungs normal, keep it
    expect(result).not.toMatch(/no pleural effusion/i); // Effusion present, remove it
    expect(result).toMatch(/heart size is normal/i); // Heart normal, keep it
  });
});
```

### Integration Tests

```typescript
// tests/integration/report-generation.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateRadiologyReport } from '@/lib/ai/report-generator';
import { setupTestDatabase, cleanupTestDatabase } from './test-helpers';

describe('Report Generation Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('generates report in espresso mode', async () => {
    const input = {
      scan_type: 'CT Chest',
      clinical_history: '55yo male smoker with cough',
      findings: 'Spiculated nodule in right upper lobe',
      mode: 'espresso' as const,
      include_advice: true,
      include_questions: true,
      include_differential: true,
    };

    const result = await generateRadiologyReport(input);

    expect(result.report.findings).toContain('nodule');
    expect(result.report.impression).toBeDefined();
    expect(result.report.clinical_advice).toBeDefined();
    expect(result.metadata.generation_time_ms).toBeLessThan(10000); // < 10s
    expect(result.metadata.model_used).toMatch(/gpt-5|gpt-4o/i);
  });

  it('integrates template without contradictions', async () => {
    const input = {
      scan_type: 'X-Ray Lumbar Spine',
      findings: 'Compression fracture at L1 with 30% height loss',
      template_id: 'test-template-id',
      mode: 'espresso' as const,
    };

    const result = await generateRadiologyReport(input);

    // Should mention fracture
    expect(result.report.findings).toMatch(/L1.*fracture/i);

    // Should NOT say "no fracture" without qualification
    expect(result.report.findings).not.toMatch(/^no.*fracture(?!.*other)/i);

    // Should include qualifier for normal levels
    expect(result.report.findings).toMatch(/other levels|otherwise/i);
  });

  it('handles model fallback gracefully', async () => {
    // Mock primary model failure
    vi.mock('@/lib/ai/vercel-ai-sdk', () => ({
      generateReport: vi.fn()
        .mockRejectedValueOnce(new Error('Model unavailable'))
        .mockResolvedValueOnce({
          report: { /* valid report */ },
          metadata: { model_used: 'gpt-4o', fallback: true },
        }),
    }));

    const input = {
      scan_type: 'CT Chest',
      findings: 'Test findings',
      mode: 'espresso' as const,
    };

    const result = await generateRadiologyReport(input);

    expect(result.metadata.fallback).toBe(true);
    expect(result.metadata.model_used).toBe('gpt-4o');
  });
});
```

---

## 🔒 Security Implementation

### Authentication Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/outseta-client';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/generate',
  '/reports',
  '/templates',
  '/settings',
];

// API routes that require authentication
const protectedApiRoutes = [
  '/api/generate',
  '/api/transcribe',
  '/api/templates',
  '/api/reports',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedRoute && !isProtectedApi) {
    return NextResponse.next();
  }

  // Get session token from cookie
  const sessionToken = request.cookies.get('session_token')?.value;

  if (!sessionToken) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify token with Outseta
    const user = await verifyToken(sessionToken);

    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.Uid);
    requestHeaders.set('x-user-email', user.Email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Invalid token
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Clear invalid cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### API Route Protection

```typescript
// lib/auth/api-protection.ts
import { NextRequest } from 'next/server';

export function getUserFromRequest(request: NextRequest): {
  id: string;
  email: string;
} {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');

  if (!userId || !userEmail) {
    throw new Error('Unauthorized');
  }

  return {
    id: userId,
    email: userEmail,
  };
}

// Usage in API routes
// app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/api-protection';
import { getTemplates } from '@/lib/database/queries';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const templates = await getTemplates(user.id);

    return NextResponse.json({ templates });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Input Validation

```typescript
// lib/utils/validation.ts
import { z } from 'zod';

export const ReportGenerationSchema = z.object({
  scan_type: z.string().min(1, 'Scan type is required'),
  clinical_history: z.string().optional(),
  findings: z.string().min(1, 'Findings are required'),
  comparison: z.string().optional(),
  template_id: z.string().uuid().optional(),
  mode: z.enum(['espresso', 'slow_brewed']),
  include_advice: z.boolean().default(true),
  include_questions: z.boolean().default(true),
  include_differential: z.boolean().default(true),
});

export const TemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  description: z.string().max(500).optional(),
  modality: z.string().max(50).optional(),
  body_part: z.string().max(50).optional(),
  tags: z.array(z.string()).max(10).optional(),
  is_default: z.boolean().default(false),
});

// Usage in API route
import { ReportGenerationSchema } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = ReportGenerationSchema.parse(body);

    // Process request
    const result = await generateRadiologyReport(validatedData);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

---

## ⚡ Performance Optimization

### 1. Server Component Strategy

**Implementation**:
- Use Server Components by default
- Mark as Client Component only when needed (interactivity, hooks, browser APIs)

**Example**:

```typescript
// app/reports/page.tsx (Server Component - default)
import { getReports } from '@/lib/database/queries';
import { ReportList } from '@/components/reports/ReportList';

export default async function ReportsPage() {
  // Fetch data on server
  const reports = await getReports();

  return (
    <div>
      <h1>Reports</h1>
      <ReportList reports={reports} />
    </div>
  );
}

// components/reports/ReportList.tsx (Client Component - needs interactivity)
'use client';

import { useState } from 'react';

export function ReportList({ reports }) {
  const [filter, setFilter] = useState('');

  // Client-side filtering
  const filtered = reports.filter(r =>
    r.scan_type.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter reports..."
      />
      {filtered.map(report => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
```

### 2. Image Optimization

**Implementation**: Use Next.js Image component

```typescript
import Image from 'next/image';

<Image
  src="/images/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
/>
```

### 3. Code Splitting

**Implementation**: Dynamic imports for heavy components

```typescript
// components/reports/ReportEditor.tsx
import dynamic from 'next/dynamic';

// Lazy load rich text editor (heavy dependency)
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  {
    loading: () => <div>Loading editor...</div>,
    ssr: false, // Don't render on server
  }
);

export function ReportEditor({ content, onChange }) {
  return (
    <div>
      <RichTextEditor
        value={content}
        onChange={onChange}
      />
    </div>
  );
}
```

### 4. API Response Caching

**Implementation**: Cache frequently accessed data

```typescript
// app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  const templates = await getTemplates(user.id);

  // Cache for 5 minutes
  return NextResponse.json(
    { templates },
    {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    }
  );
}
```

### 5. Database Query Optimization

**Implementation**: Use indexes and select only needed fields

```typescript
// lib/database/queries.ts

// Bad: Select all fields
const { data } = await supabase
  .from('reports')
  .select('*');

// Good: Select only needed fields
const { data } = await supabase
  .from('reports')
  .select('id, scan_type, created_at, status')
  .order('created_at', { ascending: false })
  .limit(20);

// Ensure indexes exist
// In migration:
CREATE INDEX idx_reports_user_created ON reports(user_id, created_at DESC);
CREATE INDEX idx_reports_scan_type ON reports(scan_type);
```

---

## 📦 Deployment Configuration

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    domains: [
      'avatars.outseta.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', ''),
    ].filter(Boolean),
  },

  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'session_token',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
      "NEXT_PUBLIC_OUTSETA_DOMAIN": "@outseta-domain",
      "OPENAI_API_KEY": "@openai-api-key"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
        }
      ]
    }
  ]
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Next.js 14+ project setup
- [ ] TypeScript configuration
- [ ] ESLint + Prettier setup
- [ ] Tailwind CSS setup
- [ ] Supabase client setup
- [ ] Database schema creation
- [ ] Outseta integration
- [ ] Authentication flow
- [ ] Protected routes middleware
- [ ] Basic layout components
- [ ] CI/CD pipeline

### Phase 2: Core Features ✅
- [ ] Template CRUD operations
- [ ] Template editor component
- [ ] Template selector component
- [ ] Audio recorder component
- [ ] Audio uploader component
- [ ] Transcription service (Whisper)
- [ ] Spoken punctuation conversion
- [ ] Report generation service
- [ ] Prompt builder
- [ ] Contradiction cleaner
- [ ] Model fallback logic
- [ ] Report form component
- [ ] Report preview component
- [ ] Report list page
- [ ] Report detail page

### Phase 3: Advanced Features ✅
- [ ] WebSocket transcription
- [ ] ChatKit widget integration
- [ ] Custom ChatKit actions
- [ ] PubMed search integration
- [ ] Radiopaedia search integration
- [ ] Google search integration (optional)
- [ ] Report export (PDF)
- [ ] Report export (DOCX)
- [ ] Usage analytics

### Phase 4: Testing & Polish ✅
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Security audit
- [ ] Accessibility audit
- [ ] Mobile responsiveness
- [ ] Documentation
- [ ] User acceptance testing
- [ ] Production deployment

---

## 📚 References

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Outseta API Docs](https://go.outseta.com/support/api-documentation)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

### Internal Documentation
- `BLUEPRINT.md` - High-level system architecture
- `SETUP_CREDENTIALS_GUIDE.md` - Credential setup instructions
- `sample-data/README.md` - Sample data guide
- Source application: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/`

---

*This technical design document provides implementation-level details for autonomous development. All critical business logic preservation points are identified and mapped to new locations.*

**Status**: Ready for Implementation
**Next Step**: Begin Phase 1 development
