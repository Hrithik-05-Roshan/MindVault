# Journal & Reflections Web Application

A user-authenticated private journal and AI reflection assistant powered by **Firebase Authentication**, **Cloud Firestore**, and the **Gemini 3.6 Flash API** via a full-stack Express and React architecture.

---

## Architecture Overview

- **User Authentication**: Federated Google Sign-In via Firebase Auth. User credentials and passwords are never directly handled or stored in custom code.
- **Data Isolation & Storage**: Cloud Firestore user-isolated subcollections (`/users/{userId}/entries/{entryId}` and `/users/{userId}/evolution/{timeRange}`). Strict Firestore security rules enforce that only the authenticated user can read or write their own documents.
- **AI Processing Engine**: Server-side Gemini endpoints with an automated 4-tier fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`):
  - `/api/reflect`: Multi-turn conversational reflections, smart summaries, and brainstorming.
  - `/api/evolution`: Personal Evolution Engine synthesizing trends, themes, goals, patterns, and insights over customizable time windows (`7d`, `30d`, `90d`, `all`).
  - `/api/past-self`: Archival introspection companion allowing authenticated users to converse directly with their historical journal archive with indirect prompt injection defenses.
- **Secret Hygiene**: Zero hardcoded API keys. All keys are dynamically loaded via environment variables and Google Cloud Secret Manager.

---

## Prerequisites & Google Cloud APIs

Ensure the `gcloud` CLI is installed and configured for your Google Cloud project:

```bash
# Set your project ID
export PROJECT_ID="YOUR_PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com
```

---

## Secret Management Setup

Store your Gemini API key securely in Google Cloud Secret Manager and grant access to the Cloud Run runtime service account:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Identify your Cloud project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# 3. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/evolution/{timeRange} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/past_self/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Ensure `.env` contains your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```

3. Start the development server (Express + Vite on port 3000):
   ```bash
   npm run dev
   ```

---

## Cloud Run Deployment Flow

Build and deploy the application container to Google Cloud Run:

```bash
# 1. Build and deploy service to Cloud Run
gcloud run deploy journal-reflections-app \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

---

## Required Campaign Labeling

Apply the mandatory resource label to register the service for automated challenge verification:

```bash
gcloud run services update journal-reflections-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```
