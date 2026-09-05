# MindVault Automated Test Suite

## 1. Overview & Testing Philosophy

MindVault includes a comprehensive, multi-layered automated test suite designed to verify code correctness, multi-tenant security isolation, API contract adherence, Gemini fallback resilience, and UI stability.

The suite adheres strictly to the **Zero Production Leakage** rule:
- **No live API calls** are made to Google Gemini during automated tests.
- **No live Firestore connections or production mutations** are triggered.
- **No Google Maps Platform requests** or external network requests are executed.
- All testing runs deterministically and lightning-fast using high-fidelity test doubles, in-memory state models, and Vitest.

---

## 2. Test Architecture

The suite is structured into clear test categories inside `/tests`:

| Category | Path | Description |
| :--- | :--- | :--- |
| **Unit Tests** | `tests/unit/` | Pure business logic, sanitizers, Gemini fallback ladder logic, timeframe calculators, prompt injection defense, Memory Vault categorizers, ethical guardrails, coordinate validators, and notification settings. |
| **API Integration Tests** | `tests/integration/` | Express route contracts (`/api/reflect`, `/api/evolution`, `/api/past-self`, `/api/suggest-memories`, `/api/reflection-insight`, `/api/health`), request validation, error statuses, and header hygiene using Supertest. |
| **Security & Isolation** | `tests/security/` | Multi-tenant data isolation (User A vs. User B boundary checks), Firestore security rules simulation (`request.auth.uid == userId`), and Role-Based Access Control (RBAC) validation. |
| **Regression Tests** | `tests/regression/` | End-to-end user journey simulation from initial authentication, through reflection drafting, Gemini interaction, evolution calculation, memory vault curation, and sign-out. |
| **Resilience & Edge Cases** | `tests/resilience/` | Handling malformed AI responses, 50,000-character payload stress tests, network dropoffs during save (preventing UI buffer loss), rapid click debouncing, missing environment variables, and token sanitization. |
| **Frontend Component Tests** | `tests/frontend/` | React 19 component rendering, user interactions, search filtering, tab navigation, and error banners via `@testing-library/react` and `happy-dom`. |
| **E2E Smoke Tests** | `tests/e2e/` | App boot verification, view transitions between Journal, Past Self, Personal Evolution, and Memory Vault, and reflection workspace typing. |

---

## 3. Test Suites & Coverage Breakdown

Currently, the test suite contains **14 test files** comprising **101 tests**:

### Unit Test Suites (`tests/unit/`)
1. **`journal.test.ts` (6 tests)**:
   - Strips `undefined` properties before database writes (`sanitizePayload`).
   - Handles empty/whitespace-only input cleanly.
   - Computes accurate word counts across varied spacing and punctuation.
   - Generates unique ID timestamps.
   - Calculates duration between reflections accurately.
   - Preserves reflection message arrays during updates.

2. **`gemini.test.ts` (6 tests)**:
   - Primary model selection: `gemini-3.6-flash`.
   - High-availability fallback ladder: `gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`.
   - Recovers from simulated `503 UNAVAILABLE` and `429 RESOURCE_EXHAUSTED` responses.
   - Strips markdown code fences (````json ... ````) from structured model outputs.
   - Redacts secret API keys (`AIzaSy...`) from error messages.
   - Throws clear error when all fallback models fail.

3. **`evolution.test.ts` (6 tests)**:
   - Filters entries accurately by time ranges: 7d, 30d, 90d, and all-time.
   - Handles empty entry sets without throwing runtime errors.
   - Computes total words and interaction counts across entries.
   - Synthesizes recurring themes structure.
   - Sorts entries chronologically.
   - Validates calculated evolution payload format.

4. **`past-self.test.ts` (4 tests)**:
   - Enforces grounding strictly in provided journal history.
   - Detects and neutralizes prompt injection attempts embedded in historical entries.
   - Formats citations and reference markers for source entries.
   - Limits conversational history context to prevent token exhaustion.

5. **`memory-vault.test.ts` (5 tests)**:
   - Categorizes memories correctly into Goal, Principle, Learning, Decision, or Milestone.
   - Filters memories by search keywords across title, content, and source entry title.
   - Filters memories by category pill selection.
   - Validates memory payload fields before persistence.
   - Sorts memories by creation timestamp descending.

6. **`reflection-insight.test.ts` (3 tests)**:
   - Enforces non-prescriptive, reflective tone over medical or clinical declarations.
   - Validates structured insight output schema (theme, keyInsight, goals, patterns, suggestedMemory).
   - Sanitizes and handles empty inputs safely.

7. **`maps-notifications-admin.test.ts` (10 tests)**:
   - Validates geographic latitude and longitude coordinate bounds (-90..90, -180..180).
   - Sanitizes place names and location memory notes.
   - Validates email and browser notification preference schemas.
   - Enforces quiet hour time ranges.
   - Restricts administrative dashboard metrics to authorized admin roles.

### Integration Test Suite (`tests/integration/`)
8. **`api-routes.test.ts` (16 tests)**:
   - `GET /api/health`: Confirms service health and metadata.
   - `POST /api/reflect`: Validates request body, handles valid prompts, and simulates graceful recovery.
   - `POST /api/evolution`: Rejects empty arrays, processes valid reflection payloads.
   - `POST /api/past-self`: Rejects empty questions, verifies conversational replies grounded in past entries.
   - `POST /api/suggest-memories`: Requires entry content, extracts candidate memory items.
   - `POST /api/reflection-insight`: Extracts structured insights from reflections.
   - Security: Unknown routes return 404; zero API keys leaked in response headers or body.

### Security & Access Control Suites (`tests/security/`)
9. **`data-isolation.test.ts` (17 tests)**:
   - Validates Firestore security rule: `request.auth.uid == userId`.
   - User A can access User A's entries, evolution, past self, memories, locations, and notifications.
   - User B can access User B's entries and memories.
   - User A is strictly forbidden from accessing User B's entries, memories, evolution, past self, locations, and notifications.
   - Unauthenticated callers (`request.auth == null`) are denied access to any user document.
   - Access to arbitrary system documents outside `/users` is denied.

10. **`admin-rbac.test.ts` (7 tests)**:
    - 401 Unauthorized for unauthenticated requests.
    - 403 Forbidden for standard users attempting admin access.
    - Grants access to users with verified admin claims.
    - Rejects standard admin on superadmin routes while granting superadmin full access.
    - Prevents client-side privilege escalation by ignoring forged body parameters.
    - Verifies admins cannot read private user reflections without owner authorization.

### Regression Test Suite (`tests/regression/`)
11. **`user-journey.test.ts` (6 tests)**:
    - Step 1: User authentication and profile initialization.
    - Steps 2-3: Reflection drafting and editing with sanitized Firestore payloads.
    - Steps 4-5: Multi-turn Gemini dialogue with guaranteed transaction persistence.
    - Step 6: Personal Evolution analysis synthesis across historical entries.
    - Steps 7-8: Memory Vault item curation and querying.
    - Steps 9-10: History inspection and secure sign-out.

### Resilience & Failure Suite (`tests/resilience/`)
12. **`failures.test.ts` (6 tests)**:
    - Gracefully handles corrupted, non-JSON output from AI models.
    - Survives massive input payloads (50,000 characters) without crashing.
    - Preserves user input buffer when database writes fail (allowing retry).
    - Debounces rapid consecutive auto-save keystrokes cleanly.
    - Throws clear runtime error when `GEMINI_API_KEY` is missing.
    - Sanitizes internal stack traces and API keys from error outputs.

### Frontend & E2E Suites (`tests/frontend/` & `tests/e2e/`)
13. **`components.test.tsx` (6 tests)**:
    - `LandingView`: Google Sign-In button and authentication error banner rendering.
    - `Navbar`: Navigation tabs (Journal, Past Self, Personal Evolution, Memory Vault) and user profile display.
    - `HistorySidebar`: Reflection list rendering, item selection, and live search filtering.

14. **`smoke.test.tsx` (3 tests)**:
    - Application boots cleanly with navigation bar, sidebar, and workspace.
    - Interactive typing into reflection editor with live state updates.
    - Smooth, client-side routing transitions across Journal, Past Self, Personal Evolution, and Memory Vault.

---

## 4. How to Run the Tests

Run the test suite using standard `npm` scripts:

```bash
# Run the complete test suite (all 14 test files)
npm test

# Run in interactive watch mode for active development
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only API integration tests
npm run test:integration

# Run only security and data-isolation tests
npm run test:security

# Run frontend component and E2E smoke tests
npm run test:ui

# Generate a code coverage report
npm run test:coverage
```

---

## 5. Mocking Strategy

The test suite uses specialized test helpers in `tests/helpers/testServer.ts` and `tests/setup.ts`:

- **Mock Express App (`createMockApp`)**: Mirrors the production routing, body parsing, and error-handling logic of `server.ts` without starting network listeners or making external calls to Google APIs.
- **In-Memory Storage Doubles**: Simulates Firebase Firestore collections and documents in memory for end-to-end lifecycle and security verification.
- **Client Mocking (`vi.mock('../../src/lib/firebase')`)**: Simulates Firebase Auth states and Firestore data streams in React component and E2E smoke tests.
- **Global Polyfills**: Polyfills `ResizeObserver`, `window.matchMedia`, and `window.scrollTo` in `tests/setup.ts` to support modern browser UI rendering in headless environments.

---

## 6. Adding New Tests

When adding new features or capabilities to MindVault, adhere to these guidelines:

1. **Place tests in the appropriate directory**:
   - Pure algorithmic or data-transform functions -> `tests/unit/`
   - Express endpoints or network contracts -> `tests/integration/`
   - Access control, UID validation, or permission rules -> `tests/security/`
   - Component rendering and DOM interactions -> `tests/frontend/`
   - High-level multi-view flows -> `tests/e2e/`
2. **Never invoke real external services**: Use `createMockApp` or mock handlers.
3. **Assert negative cases and boundary conditions**: Ensure invalid or unauthorized inputs are explicitly denied or rejected with appropriate error codes.
4. **Zero-Hardcoding**: Never include real credentials, passwords, or active API keys in test fixtures.
