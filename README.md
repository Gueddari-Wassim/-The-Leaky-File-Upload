# Secure file Upload system

A RESTful API service for secure image uploading with **content-based deduplication**, **magic-byte validation**, and **automatic expiry cleanup**. Built with Express 5, Multer, Prisma ORM, and PostgreSQL.

---

## Features

- **Image Upload** — Upload JPEG, PNG, GIF, and WEBP images (max 5 MB)
- **Content Deduplication** — Files are SHA-256 hashed; duplicate uploads reuse the existing stored copy
- **Magic-Byte Validation** — File content is verified against its declared MIME type to reject spoofed files
- **Auto Expiry & Cleanup** — Uploaded files expire after 24 hours; a cron job purges expired files every hour
- **PostgreSQL Storage** — File metadata and upload references stored via Prisma ORM

---

## Tech Stack

| Layer        | Technology                  |
| ------------ | --------------------------- |
| Runtime      | Node.js                     |
| Framework    | Express 5                   |
| File Uploads | Multer 2                    |
| Database     | PostgreSQL                  |
| ORM          | Prisma 7 (with `pg` adapter)|
| Scheduler    | node-cron                   |

---

## Project Structure

```
src/
├── server.js                  # App entry point
├── config/
│   └── prisma.js              # Prisma client setup
├── controllers/
│   └── upload.controller.js   # Upload request handler
├── middlewares/
│   ├── upload.js              # Multer config (storage, file filter, size limit)
│   └── uploadErrors.js        # Multer error handling middleware
├── routes/
│   └── upload.routes.js       # Route definitions
├── services/
│   └── upload.service.js      # Core upload logic (hash, dedupe, magic bytes)
├── uploads/                   # Uploaded files directory (auto-created)
└── utils/
    └── cleanup.js             # Expired-file purge scheduler
prisma/
└── schema.prisma              # Database schema
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** database
- **npm**

### Installation

```bash
# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### Run the Server

```bash
# Development (with hot-reload)
npm run dev

# The server starts on the port specified in .env
```

---

## API Endpoints

### Health Check

```
GET /health
```

**Response:**

```json
{
  "success": true,
  "message": "Server running successfully"
}
```

### Upload an Image

```
POST /api/upload
Content-Type: multipart/form-data
```

| Field    | Type   | Required | Description                          |
| -------- | ------ | -------- | ------------------------------------ |
| `file`   | File   | Yes      | Image file (JPEG, PNG, GIF, WEBP)   |
| `userId` | String | No       | Uploader identifier (default: `"anonymous"`) |

**Success Response (201):**

```json
{
  "success": true,
  "message": "File uploaded successfully.",
  "data": {
    "uploadId": "uuid",
    "originalName": "photo.jpg",
    "size": 204800,
    "mimeType": "image/jpeg",
    "expiresAt": "2026-02-16T10:30:00.000Z",
    "deduplicated": false
  }
}
```

**Error Responses:**

| Status | Condition                          |
| ------ | ---------------------------------- |
| 400    | No file provided                   |
| 413    | File exceeds 5 MB                  |
| 415    | Unsupported file type or spoofed content |
| 500    | Internal server error              |

---

## Testing with Postman

1. Set method to **POST** and URL to `http://localhost:3000/api/upload`
2. Go to the **Body** tab → select **form-data**
3. Add a key `file`, change type from **Text** to **File**, and select an image
4. (Optional) Add a key `userId` with type **Text** and any value
5. Click **Send**

> Do **not** manually set the `Content-Type` header — Postman handles it automatically for form-data.

---

## Database Schema

**StoredFile** — Deduplicated file storage record

| Column      | Type     | Description             |
| ----------- | -------- | ----------------------- |
| id          | UUID     | Primary key             |
| hash        | String   | SHA-256 hash (unique)   |
| storagePath | String   | Path on disk            |
| size        | Int      | File size in bytes      |
| mimeType    | String   | MIME type               |
| expiresAt   | DateTime | Auto-expiry timestamp   |

**UploadRef** — Per-user upload reference

| Column       | Type     | Description                |
| ------------ | -------- | -------------------------- |
| id           | UUID     | Primary key                |
| userId       | String   | Uploader identifier        |
| originalName | String   | Original filename          |
| storedFileId | String   | FK → StoredFile            |

---

## License

ISC
