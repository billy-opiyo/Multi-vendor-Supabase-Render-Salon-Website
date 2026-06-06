# Storage and Media Notes — Phase 1

Phase 1 does not create active Supabase Storage buckets yet.

## Current media decision

Use **Cloudinary first** for managed media workflows because the legacy app already references Cloudinary upload folders and the target Render backend includes a signed upload endpoint:

```text
POST /api/v1/uploads/cloudinary/sign
```

The default development tenant seed stores:

```text
royal-braids/uploads
```

as the Cloudinary folder convention.

## Why not activate Supabase Storage yet?

Supabase Storage may still be useful for private files or tenant-specific assets, but the first backend rewrite path needs:

- Render-held Cloudinary secrets.
- Signed uploads generated server-side.
- `file_uploads` table rows to track uploaded/attached/deleted media.
- Admin content workflows in Phase 6.

Creating buckets before those workflows are designed could create policy drift.

## If Supabase Storage is introduced later

Add migrations/policies for buckets such as:

```text
tenant-media
profile-avatars
private-attachments
```

Storage policies should follow the same boundary rules:

- public reads only for explicitly public assets
- user-owned reads/writes for private assets
- admin-managed writes through permission checks
- service-role writes from Render for privileged workflows
