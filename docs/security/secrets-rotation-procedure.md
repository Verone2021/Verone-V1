# Secrets Rotation Procedure

**Last Updated**: 2026-01-20
**Status**: Official security procedure

## Overview

This document defines the procedure for rotating production secrets and credentials.

---

## Secrets Inventory

### Back Office Production Password

**Location**: Local memory only (never committed)
- File: `.serena/memories/back-office-login-credentials-2026-01.md`
- Scope: Production environment access
- Rotation frequency: Every 90 days or on security event

### Sentry Auth Token

**Location**: Local memory only (never committed)
- File: `.serena/memories/sentry-auth-token-2026-01.md`
- Scope: Sentry API access for error monitoring
- Rotation frequency: Every 180 days or on security event

---

## Rotation Procedures

### Back Office Password Rotation

1. **Generate new password**:
   ```bash
   # Use strong password generator (min 16 chars, mixed case, numbers, symbols)
   openssl rand -base64 24
   ```

2. **Update production environment**:
   - Access Vercel dashboard
   - Navigate to project settings > Environment Variables
   - Update `BACK_OFFICE_PASSWORD` variable
   - Redeploy affected services

3. **Update local memory**:
   ```bash
   # Update .serena/memories/back-office-login-credentials-2026-01.md
   # Include rotation date and reason
   ```

4. **Verify access**:
   - Test login on production
   - Confirm old password is rejected

5. **Notify team**:
   - Inform authorized users of password change
   - Provide secure distribution channel

### Sentry Token Rotation

1. **Generate new token**:
   - Login to Sentry dashboard
   - Navigate to Settings > Auth Tokens
   - Create new token with same scopes
   - Copy token immediately (shown once)

2. **Update environment**:
   - Access Vercel/deployment platform
   - Update `SENTRY_AUTH_TOKEN` variable
   - Update local `.env` if needed

3. **Update local memory**:
   ```bash
   # Update .serena/memories/sentry-auth-token-2026-01.md
   # Include rotation date and token metadata (NOT the token itself)
   ```

4. **Revoke old token**:
   - Return to Sentry dashboard
   - Delete old auth token
   - Confirm revocation

5. **Verify monitoring**:
   - Check Sentry integration still works
   - Send test error to confirm capture

---

## Security Best Practices

### Storage

- **NEVER** commit secrets to git
- **NEVER** include secrets in code comments
- **ALWAYS** use environment variables for secrets
- **ALWAYS** use `.gitignore` for local secret files

### Access Control

- Limit secret access to minimum required personnel
- Use separate secrets for dev/staging/production
- Document who has access to which secrets

### Incident Response

If a secret is compromised:

1. **Immediate rotation** (within 1 hour)
2. **Audit access logs** for unauthorized use
3. **Document incident** in security log
4. **Notify affected parties** if data exposure occurred

---

## Automation

Future improvement: Implement automated rotation with tools like:
- HashiCorp Vault
- AWS Secrets Manager
- Vercel Encrypted Environment Variables

---

## Audit Trail

All rotations must be documented with:
- Date/time of rotation
- Reason for rotation (scheduled/incident)
- Person who performed rotation
- Verification status

---

**Version**: 1.0.0
**Owner**: Security Team
**Next Review**: 2026-04-20 (quarterly)
