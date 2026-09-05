# Security Policy — MindVault

> MindVault is designed as a private, authenticated reflection platform. Security and privacy are treated as core product requirements across identity, data access, AI processing, secrets, administration, and deployment.

## Security Objectives

MindVault follows five primary security objectives:

1. **Authentication** — only authenticated users can access private user functionality.
2. **Authorization** — users can access only resources they are authorized to access.
3. **Data Isolation** — one user's private journal, memories, evolution data, and related records must not be accessible to another user.
4. **Secret Protection** — API keys and sensitive credentials must remain outside client-side code and source control.
5. **AI Safety** — user-generated and historical content is treated as untrusted data and is not allowed to override trusted application instructions.

---

# 1. Authentication

MindVault uses **Firebase Authentication with Google Sign-In**.

### Security principles

- Authentication is delegated to Firebase.
- The application does not implement or store Google account passwords.
- Private application functionality requires an authenticated Firebase identity.
- Server-side operations use the authenticated user's identity when authorizing protected operations.
- Sign-out removes the authenticated application session according to the application's Firebase authentication flow.

Authentication should be considered the first security boundary, not the only one.

---

# 2. Authorization

Authentication answers:

> "Who is the user?"

Authorization answers:

> "Is this user allowed to perform this operation?"

MindVault uses the authenticated Firebase UID to scope user-specific operations.

Protected operations should verify authentication and ownership before reading or modifying user data.

Conceptually:

```text
Request
   ↓
Authentication
   ↓
Authenticated Firebase UID
   ↓
Authorization / Ownership Check
   ↓
Requested Resource
```

A client-provided user ID must never be treated as proof of ownership.

---

# 3. Firestore Data Isolation

MindVault stores user-specific information beneath the authenticated user's namespace.

Representative data paths include:

```text
/users/{userId}/entries/{entryId}
/users/{userId}/interactions/{interactionId}
/users/{userId}/evolution/{timeRange}
/users/{userId}/past_self/{docId}
/users/{userId}/memories/{memoryId}
/users/{userId}/locations/{locationId}
/users/{userId}/notifications/{notificationId}
```

The exact collection structure should always match the deployed application's Firestore schema.

## Owner-bound access control

The security model is based on the relationship:

```text
request.auth.uid == userId
```

Representative Firestore rule pattern:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

### Important

Production Firestore rules must be reviewed against the actual deployed schema before release. If the application contains administrative or server-only collections, those collections should use explicit rules appropriate to their access model rather than relying on an overly broad wildcard rule.

---

# 4. Cross-User Access Protection

A critical security requirement is preventing horizontal privilege escalation.

For example:

```text
User A
  ↓
Authenticated UID = A
  ↓
Attempts to access /users/B/entries/...
  ↓
Authorization / Firestore ownership check
  ↓
DENIED
```

The same principle applies to:

- Journal entries
- Journal interactions
- Personal Evolution data
- Past Self data
- Memories
- Location-aware memories
- Notifications
- Other user-specific resources

Security testing should explicitly verify that User A cannot read or modify User B's protected resources.

---

# 5. Gemini API Security

Gemini requests are handled through server-side application routes.

Representative AI routes include:

```text
/api/reflect
/api/evolution
/api/past-self
```

The browser should not receive the production Gemini API key.

The intended flow is:

```text
React Client
     ↓
Authenticated Application API
     ↓
Node.js / Express
     ↓
Gemini API
```

This prevents the Gemini credential from being embedded directly in frontend JavaScript.

---

# 6. Secret Management

MindVault follows a zero-hardcoded-secret approach.

### Production secrets

Sensitive credentials should be supplied through **Google Cloud Secret Manager** and runtime configuration rather than committed to source control.

Example deployment configuration:

```bash
--set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### Repository hygiene

Never commit:

```text
.env
.env.local
.env.production
API keys
service-account JSON files
private certificates
OAuth client secrets
database credentials
notification provider secrets
```

Use safe placeholders in documentation:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

---

# 7. Environment Separation

Development and production credentials should be kept separate.

Local development may use environment variables:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

Production should use the configured cloud secret-management mechanism.

A production secret should never be copied into:

- React source files
- browser-accessible configuration
- Git history
- README files
- screenshots
- demo videos
- client-side bundles

---

# 8. API Input Validation

All server-side API endpoints should treat client input as untrusted.

Validation should cover:

- Missing fields
- Empty strings
- Unexpected data types
- Oversized input
- Malformed request bodies
- Invalid identifiers
- Invalid time ranges
- Invalid location data
- Invalid notification payloads

The server should reject invalid requests rather than assuming the frontend has already validated them.

Frontend validation improves usability; server-side validation provides the actual security boundary.

---

# 9. Request Authentication & Ownership

Protected API routes should follow this pattern:

```text
Receive request
     ↓
Validate request
     ↓
Verify authentication
     ↓
Resolve authenticated UID
     ↓
Verify resource ownership / role
     ↓
Perform operation
```

The application must not authorize access based only on:

- a user ID supplied by the client
- a URL parameter
- a hidden frontend field
- a local-storage value
- a UI state
- a client-controlled role value

---

# 10. Past Self & Prompt Injection Protection

Past Self processes historical journal content.

Historical journal entries are **user-generated data**, not trusted system instructions.

This creates an important AI security boundary:

```text
Trusted application instructions
          ↓
       Gemini
          ↑
Untrusted journal content
```

Historical content must not be allowed to redefine:

- system instructions
- authorization rules
- tool permissions
- security policies
- application behavior

Potentially malicious text inside a journal entry should remain data to be analyzed, not instructions to be obeyed.

---

# 11. AI Output Handling

AI output is not automatically trusted.

Gemini responses should be treated as external/generated data and validated before being used for:

- persistence
- structured UI rendering
- application decisions
- memory suggestions
- evolution summaries
- notifications

Malformed or unexpected AI responses should result in controlled error handling rather than application crashes.

AI-generated content must not independently grant permissions or change authorization state.

---

# 12. Personal Evolution Security

Personal Evolution analyzes historical user data.

The security requirements are:

- Only authenticated users may request their own evolution analysis.
- The analysis must use data belonging to the authenticated user.
- A client must not be able to request another user's evolution data by changing a UID.
- Empty or insufficient history should be handled safely.
- AI-generated insights must not be treated as authoritative authorization information.

---

# 13. Memory Vault Security

Memory Vault contains potentially sensitive personal information.

Security principles:

- Memories are user-scoped.
- Access requires authentication.
- Ownership is enforced using the authenticated user's identity.
- AI suggestions must not bypass user control.
- Memory data must not be exposed through unrelated users, admin views, logs, or error messages.
- Deletion/update operations must verify ownership.

---

# 14. Location / Google Maps Security

Location information can be sensitive.

MindVault treats location-aware memories as private user data.

Security principles:

- Location data is associated with the authenticated user.
- Location records must follow the same ownership controls as journal data.
- Google Maps configuration must not expose server-side secrets.
- Browser-exposed Maps keys, where required by the Maps architecture, should use appropriate API restrictions.
- Location-service failures should not expose private data or credentials.
- Optional location functionality should not prevent core journaling from working.

---

# 15. Notification Security

Notification integrations can involve external credentials and potentially sensitive content.

Security principles:

- External notification credentials remain server-side.
- Notification payloads should be validated before dispatch.
- Notification providers should receive only the information required for the notification.
- Notification failures should be handled gracefully.
- A notification provider failure must not expose secrets or break core journaling.
- Users should have control over notification preferences where implemented.

Supported notification integrations should use their own least-privilege credentials and appropriate provider-side security controls.

---

# 16. Admin Dashboard & RBAC

Administrative functionality represents a privileged security boundary.

The Admin Dashboard should be accessible only to explicitly authorized administrators.

Conceptual model:

```text
Firebase Authentication
          ↓
Authenticated identity
          ↓
Role / Admin authorization
          ↓
Admin-only functionality
```

Security requirements:

- Unauthenticated users cannot access admin functionality.
- Normal users cannot elevate themselves to administrator.
- Admin authorization must be enforced server-side.
- Client-side UI hiding is not considered sufficient authorization.
- Admin metrics should use aggregation where possible.
- Private journal content should not be exposed unnecessarily to administrators.
- Administrative actions should be auditable where appropriate.

Never trust a client-provided value such as:

```text
isAdmin=true
role=admin
```

as proof of privilege.

---

# 17. Error Handling & Information Disclosure

Production errors should be useful without revealing sensitive implementation details.

Do not expose:

- API keys
- access tokens
- service-account credentials
- environment variables
- database credentials
- internal authentication tokens
- private journal content belonging to another user
- full server stack traces to end users

Expected behavior:

```text
Internal failure
      ↓
Server logs detailed diagnostic information
      ↓
Client receives controlled error response
```

Error messages should provide enough information for the user to recover without revealing sensitive internal details.

---

# 18. Logging & Privacy

Logs must be treated as potentially sensitive.

Avoid logging:

- Full journal entries
- Full AI conversations
- Authentication tokens
- API keys
- Secret values
- Private memory contents
- Unnecessary location data
- Notification credentials

Prefer structured operational information such as:

```text
request type
timestamp
route
status
latency
error category
authenticated user identifier where appropriate
```

Production logging should follow the minimum-information principle.

---

# 19. Dependency & Supply-Chain Security

Dependencies should be kept intentional and up to date.

Before adding a dependency:

1. Confirm that it is necessary.
2. Prefer established packages.
3. Avoid unnecessary duplicate libraries.
4. Review package permissions and behavior.
5. Run the project's tests after dependency changes.
6. Review lockfile changes before committing.

Do not add large libraries solely for cosmetic or unused functionality.

---

# 20. Security Testing

Security should be tested as part of the automated test suite.

Important scenarios include:

### Authentication

- Unauthenticated request → denied
- Authenticated request → allowed when authorized
- Invalid/expired authentication → denied

### Authorization

- User A accessing User B's resource → denied
- User B accessing User A's resource → denied
- Normal user accessing admin functionality → denied

### Firestore

- Owner can access own data
- Non-owner cannot access protected data
- Unauthorized writes are denied

### API

- Invalid request bodies are rejected
- Missing required fields are rejected
- Unauthorized requests are rejected
- Sensitive data is not returned in errors

### AI

- Gemini failures are handled
- Fallback behavior is tested
- Malformed AI output is handled
- Historical prompt injection attempts are treated as untrusted content

### Secrets

- No real secrets exist in source control
- Production secrets are not returned by API responses
- Client bundles do not contain server-side Gemini credentials

---

# 21. Production Security Checklist

Before deployment:

- [ ] Firebase Authentication is configured correctly.
- [ ] Google Sign-In is working.
- [ ] Protected routes require authentication.
- [ ] Server-side authorization is enforced.
- [ ] Firestore rules are deployed and reviewed.
- [ ] Cross-user access has been tested.
- [ ] Admin/RBAC access has been tested.
- [ ] Gemini API keys are not exposed to the browser.
- [ ] Production secrets are stored securely.
- [ ] `.env` files and credentials are excluded from Git.
- [ ] API input validation is enabled.
- [ ] AI output is treated as untrusted/generated data.
- [ ] Past Self has prompt-injection protections.
- [ ] Location data is user-scoped.
- [ ] Notification credentials remain server-side.
- [ ] Production errors do not expose secrets or stack traces.
- [ ] Sensitive journal content is not unnecessarily logged.
- [ ] Automated security tests pass.
- [ ] Production build passes.
- [ ] Cloud Run deployment succeeds.
- [ ] No known critical security failures remain.

---

# 22. Security Testing Philosophy

MindVault follows a **defense-in-depth** approach.

```text
Firebase Authentication
        ↓
Server Authorization
        ↓
Firestore Owner Rules
        ↓
Input Validation
        ↓
Secure Secret Management
        ↓
AI Prompt / Data Boundaries
        ↓
Error & Logging Hygiene
        ↓
Automated Security Testing
```

No single control is assumed to be sufficient.

For example, hiding a user's data in the frontend is not considered security. The backend and database must enforce the same ownership boundary.

---

# 23. Responsible Disclosure

If a security vulnerability is discovered, do not publicly disclose exploit details before the issue has been investigated.

When reporting a vulnerability, provide:

- A clear description
- Reproduction steps
- Affected component
- Potential impact
- Suggested mitigation, if known

Never include real user credentials, API keys, tokens, or private journal content in a report.

---

# 24. Security Scope

This document describes the security architecture and intended security controls of MindVault.

Security claims should always be verified against the **currently deployed application, source code, Firebase rules, Cloud Run configuration, and enabled integrations**.

A feature should not be considered secure merely because it is documented here; the corresponding implementation and configuration must enforce the documented control.

---

## Security Principle

> **Private by default. Authorized by identity. Protected at every layer.**

MindVault's security model is designed to protect the user's reflections while allowing AI, location, memory, notification, and administrative capabilities to operate within clearly defined authorization boundaries.
