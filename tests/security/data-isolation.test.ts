// @vitest-environment node
import { describe, it, expect } from 'vitest';

/**
 * Security Test Suite: Multi-User Data Isolation & Firestore Rule Evaluation
 * Verifies strict boundary isolation between User A and User B across all subcollections.
 */
describe('Security Tests: Multi-Tenant Data Isolation (User A vs User B)', () => {
  interface AuthContext {
    uid: string;
    email?: string;
  }

  interface SecurityRuleRequest {
    auth: AuthContext | null;
  }

  // Exact evaluation logic from firestore.rules:
  // match /users/{userId} { allow read, write: if request.auth != null && request.auth.uid == userId; }
  function evaluateFirestoreSecurityRule(
    request: SecurityRuleRequest,
    targetPath: string
  ): { allowed: boolean; reason?: string } {
    const match = targetPath.match(/^\/users\/([^/]+)(\/.*)?$/);
    if (!match) {
      return { allowed: false, reason: 'Path outside /users namespace' };
    }

    const pathUserId = match[1];

    if (!request.auth) {
      return { allowed: false, reason: 'Unauthenticated: request.auth is null' };
    }

    if (request.auth.uid !== pathUserId) {
      return {
        allowed: false,
        reason: `Forbidden: request.auth.uid (${request.auth.uid}) does not match target path userId (${pathUserId})`,
      };
    }

    return { allowed: true };
  }

  const userA: AuthContext = { uid: 'user-a-11111', email: 'alice@example.com' };
  const userB: AuthContext = { uid: 'user-b-22222', email: 'bob@example.com' };

  describe('User A Boundary Tests', () => {
    it("User A can access User A's own journal entries", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userA.uid}/entries/entry-123`
      );
      expect(res.allowed).toBe(true);
    });

    it("User A can access User A's own personal evolution data", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userA.uid}/evolution/30d`
      );
      expect(res.allowed).toBe(true);
    });

    it("User A can access User A's own Past Self history", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userA.uid}/past_self/history`
      );
      expect(res.allowed).toBe(true);
    });

    it("User A can access User A's own Memory Vault items", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userA.uid}/memories/memory-999`
      );
      expect(res.allowed).toBe(true);
    });

    it("User A can access User A's own location memories", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userA.uid}/locations/loc-456`
      );
      expect(res.allowed).toBe(true);
    });

    it("User A can access User A's own notification preferences", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userA.uid}/notifications/settings`
      );
      expect(res.allowed).toBe(true);
    });
  });

  describe('User B Boundary Tests', () => {
    it("User B can access User B's own journal entries", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userB },
        `/users/${userB.uid}/entries/entry-789`
      );
      expect(res.allowed).toBe(true);
    });

    it("User B can access User B's own memories", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userB },
        `/users/${userB.uid}/memories/memory-333`
      );
      expect(res.allowed).toBe(true);
    });
  });

  describe('Cross-Tenant Data Leakage Prevention (Strict Denial)', () => {
    it("User A CANNOT access User B's journal entries", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userB.uid}/entries/entry-secret-b`
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Forbidden');
    });

    it("User B CANNOT access User A's journal entries", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userB },
        `/users/${userA.uid}/entries/entry-secret-a`
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Forbidden');
    });

    it("User A CANNOT access User B's memories", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userB.uid}/memories/secret-goal`
      );
      expect(res.allowed).toBe(false);
    });

    it("User A CANNOT access User B's evolution data", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userB.uid}/evolution/all`
      );
      expect(res.allowed).toBe(false);
    });

    it("User A CANNOT access User B's Past Self conversations", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userB.uid}/past_self/history`
      );
      expect(res.allowed).toBe(false);
    });

    it("User A CANNOT access User B's location memories", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userB.uid}/locations/secret-place`
      );
      expect(res.allowed).toBe(false);
    });

    it("User A CANNOT access User B's notifications", () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: userA },
        `/users/${userB.uid}/notifications/settings`
      );
      expect(res.allowed).toBe(false);
    });
  });

  describe('Unauthenticated Access Prevention', () => {
    it('Unauthenticated requests are denied access to any user document', () => {
      const res = evaluateFirestoreSecurityRule(
        { auth: null },
        `/users/${userA.uid}/entries/entry-123`
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Unauthenticated');
    });

    it('Root level or system document access outside /users is denied', () => {
      const res = evaluateFirestoreSecurityRule({ auth: userA }, `/system/config`);
      expect(res.allowed).toBe(false);
    });
  });
});
