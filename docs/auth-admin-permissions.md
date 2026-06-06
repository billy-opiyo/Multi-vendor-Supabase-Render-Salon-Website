# Auth, Profiles, Admins, and Permissions

Phase 3 replaces Firebase Auth/Admin SDK behavior with Supabase Auth plus database-backed authorization records.

## Sources of truth

| Concern                      | Source of truth                                                             |
| ---------------------------- | --------------------------------------------------------------------------- |
| User identity/session        | Supabase Auth `auth.users` and access tokens                                |
| User profile extension       | `public.profiles`                                                           |
| Admin access                 | `public.admin_users`                                                        |
| Admin permission flags       | `public.admin_users.permissions`                                            |
| Admin mutation history       | `public.admin_audit_logs`                                                   |
| Account restrictions/history | `public.profiles.security_restrictions` and `public.admin_security_actions` |

## Backend token verification

Browser clients authenticate with Supabase, then call Render with:

```http
Authorization: Bearer <supabase-access-token>
```

Render verifies the token using the service-role Supabase client in `requireAuth` and attaches the verified user to `req.auth.user`.

## Profile sync

`POST /api/v1/profiles/sync` creates or updates the caller's profile from Supabase Auth identity metadata.

User-controlled profile writes are limited to safe fields:

- `display_name`
- `phone`
- `avatar_url`
- `metadata`

Users cannot set their own `role`, `security_restrictions`, or admin permissions through profile endpoints.

## Admin permission model

Admin access is granted by an active row in `admin_users`.

Supported roles:

- `super_admin`
- `admin`

Supported permission flags:

- `canManageAdmins`
- `canManageBookings`
- `canManageContent`
- `canManageSecurity`

`super_admin` bypasses individual permission flags in backend middleware. Normal admins must have the specific permission required by the endpoint.

## Admin management endpoints

Initial Phase 3 endpoints:

```text
GET   /api/v1/auth/me
POST  /api/v1/profiles/sync
GET   /api/v1/profiles/me
PATCH /api/v1/profiles/me
GET   /api/v1/admin/users/me
GET   /api/v1/admin/users
POST  /api/v1/admin/users
PATCH /api/v1/admin/users/:adminUserId
```

Admin create/update workflows write `admin_audit_logs` so privileged changes are traceable.

## Account restriction strategy

Supabase-compatible account restrictions should be represented in Postgres rather than Firebase custom claims:

1. Render writes the durable action to `admin_security_actions`.
2. Render stores the current restriction state on `profiles.security_restrictions`.
3. Sensitive Render middleware checks the current restriction state before allowing privileged workflows.
4. Supabase Auth Admin APIs may be used where supported for bans, password recovery links, or session invalidation.

Recommended `security_restrictions` shape:

```json
{
	"temporaryBlockUntil": "2026-06-06T15:00:00.000Z",
	"forcePasswordReset": false,
	"reason": "Suspicious login activity"
}
```

Force logout/password reset should not depend on Firebase token revocation. For Supabase, use a combination of server-side restriction checks, Supabase Auth admin operations where available, and frontend session refresh/sign-out behavior.
