# File Storage & Indexing App — Plan

## Status: Idea / Not Started

## Vision

A private family file storage and indexing application. Think of it as a self-hosted alternative to Google Drive or Dropbox, tailored for the family's workflow with smart indexing and search.

## Core Feature Ideas

### 1. File Upload & Storage
- Upload files (documents, images, videos, etc.)
- Folder / collection organization
- Drag-and-drop upload UI

### 2. Indexing & Search
- Full-text search across document contents (PDFs, text files)
- Tag-based organization
- Metadata indexing (file type, date, size, author)
- AI-assisted tagging and categorization

### 3. File Viewer
- In-browser preview for PDFs, images, videos, audio
- Document thumbnails in listing

### 4. Sharing
- Private by default
- Share links with optional expiration

### 5. Versioning (stretch goal)
- Keep previous versions of files
- Restore from version history

## Domain Model (Draft)

```
File
  - id
  - name
  - mimeType
  - size: bytes
  - storageKey (reference to object storage)
  - collectionId
  - tags: string[]
  - uploadedAt: Date
  - uploadedBy: UserId
  - metadata: Record<string, unknown>

Collection (Folder)
  - id
  - name
  - parentId (nullable, for nesting)
  - createdBy: UserId

Tag
  - id
  - name
  - color
```

## Technical Considerations

- **Storage**: Cloudflare R2 (S3-compatible object storage, generous free tier)
- **Metadata DB**: Cloudflare D1 for file metadata and indexes
- **Search**: Cloudflare Vectorize for semantic/AI search, or simple SQL full-text search for MVP
- **Auth**: Share auth solution with Finance app
- **Route prefix**: `/files/`
- **Upload limits**: Cloudflare Workers have a 100MB body limit per request; handle large files with multipart/presigned URLs

## Dependencies to Evaluate

- Cloudflare R2 for blob storage
- Cloudflare D1 for metadata
- A PDF parsing library for text extraction
- An image processing library (thumbnails)

## Open Questions

- [ ] Storage quota per user?
- [ ] Which file types to index for full-text search?
- [ ] AI tagging: which model / provider?
- [ ] Mobile upload support (camera roll)?
- [ ] Offline access / sync?
