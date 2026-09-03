# UltraWear FC Role Provisioning

Editorial and moderation routes require a server-verified Supabase Auth user whose `app_metadata.role` is `editor` or `admin`.

## Security rule

Roles must be assigned through a trusted administrator or server-side Supabase operation. Never accept a role from browser request bodies, user-editable metadata, query parameters, or client-side state.

The application intentionally reads `user.app_metadata.role` after `supabase.auth.getUser(token)` so the role decision is made from authenticated server-side identity.

## Provisioning procedure

Use the Supabase Dashboard or a protected server-side/admin operation to set the user's `app_metadata`:

```json
{
  "role": "editor"
}
```

Use `admin` only for users who need administrative capabilities.

After changing the role, require the user to obtain a fresh session/token so the updated claims are available to the application.

## Verification checklist

- Confirm the target account identity before changing its role.
- Grant the minimum role needed: `editor` for editorial work, `admin` for administration.
- Do not place service-role credentials in client code or public environment variables.
- Do not expose an endpoint that lets users self-assign or escalate roles.
- Review role assignments periodically and remove access when no longer required.

This document describes the operational procedure; it does not grant any role itself.
