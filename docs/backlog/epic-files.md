# Epic: File Storage & Indexing

- **Status**: Backlog
- **Priority**: Low

## Goal

A private family file storage and indexing app at `/files/` — a self-hosted alternative to Google Drive for documents, images, and other files. Smart search (full-text + AI tagging) makes files findable without needing a rigid folder structure.

## Open Questions (resolve before starting)

- [ ] Storage quota per user?
- [ ] Which file types to index for full-text search?
- [ ] AI tagging: which model / provider?
- [ ] Mobile upload support (camera roll)?

## Scope

**In:**
- File upload and storage (Cloudflare R2)
- Folder / collection organisation
- In-browser preview for PDFs, images, video, audio
- Full-text search across document contents
- Tag-based organisation (manual + AI-assisted)
- Private share links with optional expiration
- Auth shared with Finance app (same Google OAuth sessions)

**Out:**
- Offline access / sync
- File versioning (stretch goal — not in first release)
- Public sharing / anonymous access
- Mobile-native app

## Domain Model

```
File
  - id
  - name
  - mimeType
  - size (bytes)
  - storageKey       ← R2 object key
  - collectionId
  - tags: string[]
  - uploadedAt
  - uploadedBy (userId)
  - metadata: Record<string, unknown>

Collection (Folder)
  - id
  - name
  - parentId         ← nullable, for nesting
  - createdBy (userId)

Tag
  - id
  - name
  - color
```

## Technical Notes

| Concern | Decision |
|---|---|
| Blob storage | Cloudflare R2 (S3-compatible, generous free tier) |
| Metadata DB | Cloudflare D1 (same pattern as Finance) |
| Search | SQL full-text search for MVP; Cloudflare Vectorize for semantic search later |
| Auth | Shared Google OAuth sessions — same `session_id` cookie |
| Route prefix | `/files/` |
| Upload limit | Cloudflare Workers cap at 100MB per request; large files need multipart / presigned URLs |

## Tasks

### Foundation
- [ ] (M) D1 migration — `files`, `collections`, `tags` tables; migration file + wrangler apply
- [ ] (M) R2 bucket setup — create bucket in wrangler.jsonc; add presigned upload URL server fn
- [ ] (S) Gate `/files/*` routes — `beforeLoad` check for `context.user`, redirect to `/login`

### Upload & Storage
- [ ] (M) File upload UI — drag-and-drop zone + file picker; upload to R2 via presigned URL; save metadata to D1
- [ ] (S) Collection (folder) management — create, rename, delete collections; breadcrumb nav

### Viewing & Search
- [ ] (M) File listing — grid or list view; thumbnails for images; file type icons for others
- [ ] (M) In-browser preview — PDF viewer, image lightbox, video/audio player
- [ ] (M) Full-text search — extract text from PDFs on upload; store in D1; SQL FTS query

### Sharing
- [ ] (S) Private share links — generate a signed URL with optional expiry; server fn to validate

### AI
- [ ] (L) AI tagging — on upload, send file content to Claude; suggest tags; let user confirm before saving

## Done When

- [ ] Files can be uploaded, organised into collections, and deleted
- [ ] Files are viewable in-browser (PDF, image, video)
- [ ] Full-text search returns relevant results
- [ ] `/files/*` requires a valid session
- [ ] All tests pass
- [ ] Biome, TypeScript, and Knip checks pass
