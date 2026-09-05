# MindVault

> **Your thoughts, remembered. Your growth, visible.**

MindVault is a private, user-authenticated AI journaling and reflection platform that turns everyday reflections into a long-term understanding of how you think, what you care about, and how you evolve.

It combines **Firebase Authentication, Cloud Firestore, Gemini, and Google Cloud Run** in a production-oriented full-stack application.

---

## Why MindVault?

Traditional journaling stores your thoughts.

MindVault helps you **understand them**.

Users can have multi-turn AI conversations around their reflections, revisit historical thinking, identify recurring patterns, and build a private memory of the things that matter to them.

> **Your reflections should become more valuable over time.**

---

# Core Features

## 1. AI Journal & Reflection

A private conversational journal powered by Gemini.

Users can:
- Write reflections and journal entries
- Have multi-turn conversations with the AI
- Ask for summaries and perspective
- Brainstorm ideas
- Explore thoughts and decisions
- Continue conversations from their private history

Every interaction is associated with the authenticated user.

---

## 2. Personal Evolution Engine

MindVault goes beyond individual journal entries and looks at the user's reflection history over time.

The Evolution Engine can surface:
- Recurring themes
- Goals and priorities
- Behavioral patterns
- Changes in thinking
- Important moments
- Progress and areas for growth
- Long-term insights

Users can explore:
- **7 days**
- **30 days**
- **90 days**
- **All time**

This turns a collection of journal entries into a living picture of personal evolution.

---

## 3. Past Self

**Past Self** lets users interact with their own historical journal archive.

Instead of simply searching old entries, users can ask:
- "What was I worried about last month?"
- "What goals kept coming up?"
- "Have I changed my mind about this?"
- "What patterns do you notice in my older reflections?"

The AI grounds its responses in the authenticated user's historical journal data.

Past Self also includes protections designed to reduce the risk of indirect prompt injection from untrusted historical content.

---

## 4. Memory Vault

Memory Vault provides a dedicated space for important information the user wants to preserve.

The design principle is **user control first**:
- AI may identify potentially useful memories
- The user remains in control of what is stored
- Memories are associated with the authenticated user
- Memory data is kept separate from the general journal experience

---

## 5. Reflection Intelligence

MindVault can enrich reflections with lightweight AI-generated intelligence, such as:
- Themes
- Key insights
- Detected goals
- Recurring patterns
- Potential memories

These insights enhance journaling without becoming a dependency for the core journal experience.

---

## 6. Private User Data

MindVault is built around authenticated, user-isolated data.

Firestore documents are organized under the authenticated user's namespace:

```text
/users/{userId}/entries/{entryId}
/users/{userId}/evolution/{timeRange}
/users/{userId}/interactions/{interactionId}
/users/{userId}/past_self/{docId}
```

Firestore security rules enforce owner-based access:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    match /users/{userId}/evolution/{timeRange} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    match /users/{userId}/past_self/{docId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

---

# Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │ Journal / Insights   │
                    │ Past Self / Memory  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Express / Node API   │
                    │ Authenticated Routes │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
        ┌────────────┐  ┌────────────┐  ┌─────────────┐
        │   Gemini   │  │ Firestore  │  │ Firebase    │
        │ AI Engine  │  │ User Data  │  │ Auth        │
        └────────────┘  └────────────┘  └─────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Google Cloud      │
                    │       Run            │
                    └──────────────────────┘
```

---

# Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| AI | Gemini API |
| Maps | Google Maps Platform |
| Notifications | Email / Slack / Discord integrations |
| Deployment | Google Cloud Run |
| Secrets | Google Cloud Secret Manager |
| Development | Vite + npm |

---


---

# Google Maps Integration — Memory Atlas

## 6. Location-Aware Memories

MindVault extends journaling into the physical world through **Google Maps integration**. Users can associate journal entries and memories with real-world locations and explore those memories through the **Memory Atlas**.

Capabilities include:
- Location search
- Optional location attached to journal entries
- Map markers for location-aware memories
- Viewing associated reflections from a location
- User-scoped location data

This adds a spatial dimension to personal reflection: not only **what happened**, but **where it happened**.

---

# Admin Dashboard

## 7. Secure Administration & System Insights

MindVault includes a role-aware administration layer for authorized administrators. The Admin Dashboard focuses on aggregated operational and product information rather than exposing private journal content.

It can provide:
- User statistics
- Journal activity statistics
- AI request statistics
- Feature usage
- System health and service status
- Error and operational metrics

Administrative access is protected through role-based authorization. Normal users cannot access administrative functionality.

**Privacy principle:** system visibility without unnecessary access to private user reflections.

---

# Notification System

## 8. Smart Notifications

MindVault includes a notification layer for useful reflection and platform events. Depending on the configured integrations, notifications can support:

- Journal reminders
- Important reflection insights
- Memory suggestions
- Personal Evolution updates
- User-configured notification preferences
- External notification channels such as Email, Slack, or Discord

External service credentials are handled server-side and are never intentionally exposed to the client. Notification failures are designed not to block core journaling functionality.

---

# Custom Capabilities Beyond the Starter

The original **Personal Gemini Journal** provides the foundation for authenticated AI journaling. MindVault extends that foundation into a longitudinal personal reflection platform with custom capabilities:

- **Personal Evolution** — identifies themes, goals, patterns, and changes in thinking across time.
- **Past Self** — enables conversations with the user's historical journal archive.
- **Memory Vault** — provides a user-controlled layer for preserving important memories.
- **Reflection Intelligence** — extracts structured insights from individual reflections.
- **Memory Atlas** — connects personal memories with real-world locations through Google Maps.
- **Admin Dashboard** — provides authorized administrators with aggregated platform and operational insights.
- **Notification System** — extends the platform with configurable and external notifications.

Together, these capabilities transform the starter journal into a broader system for **personal memory, reflection, discovery, and growth**.

---

# Google AI Studio Development

Google AI Studio was used as the primary AI-assisted development environment for building and extending the authenticated journal application.

The starter application was expanded through iterative development of custom capabilities, including:

- Gemini-powered reflection workflows
- Personal Evolution
- Past Self
- Memory Vault
- Reflection Intelligence
- Location-aware memories and Google Maps integration
- Administrative functionality
- Notification workflows
- Authentication-aware data handling
- Firestore persistence
- Server-side Gemini processing
- Production-oriented error handling and fallback behavior
- Cloud Run deployment

The resulting application was refined and tested as a full-stack React and Express application.

# AI Processing

MindVault keeps Gemini processing behind server-side API routes.

### `/api/reflect`

Handles conversational journaling, reflections, summaries, and brainstorming.

### `/api/evolution`

Builds longer-term insights from the user's reflection history across configurable time ranges.

### `/api/past-self`

Provides historical introspection using the authenticated user's journal archive.

The application uses an automated Gemini fallback strategy:

```text
gemini-3.6-flash
        ↓
gemini-3.1-flash-lite
        ↓
gemini-flash-latest
        ↓
gemini-3.7-flash
```

The fallback mechanism is intended to improve resilience when a preferred model is unavailable or temporarily fails.

---

# Security

Security is a core part of the application.

### Authentication

Users authenticate through **Firebase Authentication with Google Sign-In**.

The application does not implement or store Google account passwords itself.

### Authorization & Data Isolation

User data is scoped to the authenticated user's UID.

Firestore owner-bound rules prevent one authenticated user from directly reading or writing another user's protected documents.

### Secret Management

No Gemini API key is hardcoded into the application.

Local development uses environment configuration, while Cloud Run deployment can load the Gemini key through **Google Cloud Secret Manager**.

### Prompt Injection Considerations

Historical journal content is treated as user data rather than trusted instructions. The Past Self workflow includes defenses against indirect prompt injection from archived content.

---

# Local Development

## Prerequisites

- Node.js
- npm
- A Firebase project
- A Gemini API key
- Google Cloud CLI for Cloud Run deployment

## Install

```bash
npm install
```

## Environment

For local development:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

Do not commit real credentials to Git.

## Run

```bash
npm run dev
```

The development application runs on port `3000`.

---

# Firebase / Firestore Setup

Configure Firebase Authentication with Google Sign-In and connect the application to the required Firebase project.

Deploy the Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

The production rules should remain owner-bound to the authenticated Firebase UID.

---

# Google Cloud Setup

Set your Google Cloud project:

```bash
export PROJECT_ID="YOUR_PROJECT_ID"

gcloud config set project $PROJECT_ID
```

Enable the required APIs:

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com
```

---

# Secret Manager

Create the Gemini API key secret:

```bash
gcloud secrets create GEMINI_API_KEY \
  --replication-policy="automatic"

echo -n "YOUR_API_KEY" | \
  gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

Grant the Cloud Run runtime service account access:

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID \
  --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

# Cloud Run Deployment

Build and deploy the application:

```bash
gcloud run deploy journal-reflections-app \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

After deployment, Cloud Run provides the publicly accessible application URL.

> The Cloud Run service can be publicly reachable while private user functionality remains protected by Firebase Authentication and application authorization.

---

# Challenge Verification Label

Apply the required challenge label:

```bash
gcloud run services update journal-reflections-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

# Production Verification Checklist

Before submission, verify:

- [ ] Cloud Run URL is publicly accessible
- [ ] Google Sign-In works
- [ ] Authenticated users can create journal entries
- [ ] Journal history loads correctly
- [ ] Gemini reflection works
- [ ] Personal Evolution works
- [ ] Past Self works
- [ ] Memory Vault works
- [ ] Reflection Intelligence works
- [ ] User data remains isolated
- [ ] Gemini API key is not exposed in the client
- [ ] Firestore rules are deployed
- [ ] Cloud Run deployment succeeds
- [ ] Required challenge label is applied
- [ ] GitHub repository is public
- [ ] No real credentials or secrets are committed

---

# Submission

The project submission should include:

### Deployment / App Walkthrough

A publicly accessible Cloud Run URL or a public walkthrough video/blog.

### Demo Social Post

A public LinkedIn, X, Facebook, Medium, or similar post showcasing the project.

Required campaign hashtag:

```text
#AccelerateAIwithCloudRun
```

### Public Code Repository

A publicly accessible GitHub or GitLab repository containing the project source code and this README.

### Brief Description

**MindVault is a secure, AI-powered personal reflection platform that transforms everyday journaling into an evolving understanding of the user. Built with Gemini, Firebase Authentication, Cloud Firestore, and Google Cloud Run, it provides multi-turn AI journaling while keeping user data strictly isolated. Beyond basic journaling, MindVault introduces Personal Evolution, Past Self, Memory Vault, and Reflection Intelligence to help users understand recurring patterns, revisit their past thinking, and build a meaningful long-term picture of their personal growth.**

---

# Demo Flow

```text
Landing Page
     ↓
Google Sign-In
     ↓
Private Journal
     ↓
AI Reflection
     ↓
Journal History
     ↓
Personal Evolution
     ↓
Past Self
     ↓
Memory Vault
```

The goal is to demonstrate not only that the AI responds, but that **MindVault becomes more useful as the user's private reflection history grows.**

---

# Project Value

### Authenticity

A real product concept built around long-term personal reflection rather than a generic AI chatbot.

### Usability

A simple flow from journaling to reflection, history, personal insights, and memory.

### Stability

Server-side AI processing, persistence, fallback handling, and production deployment on Cloud Run.

### Security

Firebase authentication, UID-based data isolation, Firestore security rules, server-side secrets, and prompt-injection considerations.

---

# License

This project is provided for the associated challenge/ideathon submission.
