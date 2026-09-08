# Vercel Deployment Architecture Migration Plan

## 1. Current Architecture

CivicConnect is a full-stack civic complaint management platform:
- **Frontend**: React 18, Vite, Tailwind CSS, React Router 7, Leaflet / React-Leaflet, Chart.js / React-Chartjs-2, Lucide React, Axios.
  - Client entry: `client/src/main.jsx`
  - API Client: `client/src/services/api.js` (`baseURL: '/api'`)
  - Build output: `client/dist`
- **Backend API**: Node.js + Express
  - Server entry: `server/index.js`
  - Routes: `/api/auth`, `/api/complaints`, `/api/admin`, `/api/authority`, `/api/notifications`, `/api/analytics`, `/api/public`
  - Services: AI analysis with Groq (`server/services/aiService.js`), auto-assignment (`server/services/assignmentService.js`), notifications (`server/services/notificationService.js`)
- **Database**: SQLite (`better-sqlite3` / `node:sqlite`) with file `civicconnect.db`
  - 14 relational tables: `users`, `departments`, `complaint_categories`, `complaint_subcategories`, `complaints`, `complaint_images`, `complaint_status_history`, `complaint_comments`, `complaint_upvotes`, `feedback`, `notifications`, `audit_logs`, `sla_records`, `areas`.
  - Database schema & initialization: `server/database.js`
  - Seed script: `server/seed.js`
- **File Uploads**: Multer with `diskStorage` writing to `./uploads/` directory, served via `app.use('/uploads', express.static(...))`.

---

## 2. Vercel Incompatibilities

| Current Implementation | Vercel Serverless Constraint | Risk / Incompatibility |
| :--- | :--- | :--- |
| **Local SQLite File (`civicconnect.db`)** | Ephemeral, read-only filesystem (except `/tmp`). `/tmp` is wiped on cold starts and not shared across lambdas. | Writing to `./civicconnect.db` throws `EROFS`. Copying to `/tmp` causes total data loss on cold starts. |
| **Local Disk Uploads (`./uploads/`)** | Filesystem is ephemeral. Uploaded files do not persist across lambda invocations. | Citizen and authority uploaded evidence photos disappear after serverless container recycling. |
| **`app.listen(PORT)` in `server/index.js`** | Vercel executes serverless functions via exported request handlers, not long-running listening daemons. | Blocks or fails to bind in serverless execution. |
| **Direct SPA Navigation / Refreshes** | Vercel serves static files; requesting `/citizen/dashboard` or `/authority/complaints/1` directly causes 404 without SPA fallback. | Users cannot refresh pages or bookmark routes. |
| **Synchronous Database Queries** | Network-based persistent databases (Turso, Neon, Postgres) require asynchronous I/O (`Promise`). | Calling remote database methods requires `async/await` handling in route controllers. |

---

## 3. Proposed Vercel-Compatible Architecture

```
                                  VERCEL PLATFORM
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
STATIC ASSETS (Edge CDN)                                        SERVERLESS API (Lambda)
  - client/dist/*                                                 - api/index.js
  - index.html (SPA Fallback)                                     - Express app (server/index.js)
  - Direct route handling                                         - Routes: /api/*, /uploads/*
                                                                          │
                                       ┌──────────────────────────────────┴──────────────────────────────────┐
                                       ▼                                                                     ▼
                           DATABASE ADAPTER LAYER                                                STORAGE ADAPTER LAYER
                             (server/db/index.js)                                          (server/services/storageService.js)
                                       │                                                                     │
              ┌────────────────────────┴────────────────────────┐                                ┌───────────┴───────────┐
              ▼                                                 ▼                                ▼                       ▼
   LOCAL MODE (Offline)                              PRODUCTION (Vercel)                 LOCAL (Disk)          PRODUCTION (Vercel)
  - better-sqlite3 / node:sqlite                    - Turso (LibSQL Serverless SQLite)  - ./uploads/          - Vercel Blob / Cloudinary
  - civicconnect.db                                 - 100% SQLite dialect match                               - Fallback: Data URI in DB
```

---

## 4. Files to Create

1. **`vercel.json`**:
   - Configures build command (`cd client && npm install && npm run build`), output directory (`client/dist`).
   - Configures rewrites: `/api/(.*)` ➔ `/api/index.js`, `/uploads/(.*)` ➔ `/api/index.js`, `/(.*)` ➔ `/index.html`.
2. **`api/index.js`**:
   - Vercel serverless function entrypoint that exports the Express `app`.
3. **`server/db/index.js` (Database Abstraction Layer)**:
   - Provides a unified asynchronous query interface (`prepare(sql).get()`, `.all()`, `.run()`, `exec(sql)`).
   - **Local Mode**: Uses local `civicconnect.db` (via `better-sqlite3` or built-in `node:sqlite`).
   - **Production Mode**: Uses `@libsql/client` (Turso Cloud SQLite) when `TURSO_DATABASE_URL` is set.
   - **Zero-Config Fallback**: If deployed on Vercel before setting up Turso credentials, initializes an in-memory/`/tmp` database pre-seeded with demo data so the app **never crashes** on initial preview.
4. **`server/services/storageService.js` (File Storage Adapter)**:
   - **Local Mode**: Saves uploaded buffer to `./uploads/` and returns `/uploads/filename.ext`.
   - **Cloud Mode**: If `BLOB_READ_WRITE_TOKEN` (Vercel Blob) is set, uploads to Vercel Blob and returns the permanent HTTPS URL. If `CLOUDINARY_URL` is set, uploads to Cloudinary.
   - **Zero-Config Fallback**: If no cloud storage credentials exist on Vercel, stores as a Base64 data URI in `complaint_images` or `/tmp/uploads`, ensuring images never 404.
5. **`server/scripts/migrate-to-turso.js`**:
   - One-command migration tool that reads all 14 tables from `civicconnect.db` and pushes them into Turso cloud SQLite with zero data loss.
6. **`VERCEL_MIGRATION_PLAN.md`**:
   - Detailed architectural documentation in the repository as requested by Section 31.

---

## 5. Files to Modify

| File | Why Modified | How Existing Functionality is Preserved |
| :--- | :--- | :--- |
| `package.json` | Add `@libsql/client` for Turso persistent SQLite and `@vercel/blob` for cloud storage. | All existing dependencies, scripts, and Node engines are retained. |
| `server/index.js` | Export `app` for Vercel serverless (`module.exports = app`), only invoke `app.listen()` when not running under Vercel serverless. Add dynamic `/uploads/:filename` route handler for storage adapter. | Local development `npm run dev` and `npm run server` behave identically. |
| `server/database.js` | Forward to the new Database Abstraction Layer (`server/db/index.js`). | Existing imports `const { getDb, initDatabase } = require('./database')` continue to work without breaking. |
| `server/middleware/upload.js` | Use memory storage for uploaded files so buffers can be dispatched to the storage adapter (disk locally, cloud on Vercel). | Limits, allowed MIME types, and file filter rules remain 100% identical. |
| `server/routes/complaints.js` | Ensure route handlers `await` database adapter calls and call `storageService.saveFile()`. | Exact same endpoint paths, input payloads, business logic, auto-assignment, and responses. |
| `server/routes/authority.js` | Ensure route handlers `await` database calls and use `storageService.saveFile()` for progress/resolution photos. | Exact same authority workflow, statuses, and permissions. |
| `server/routes/auth.js` | Ensure route handlers `await` database adapter calls. | JWT signing, bcrypt password hashing, demo login credentials, and user responses remain identical. |
| `server/routes/admin.js` | Ensure route handlers `await` database adapter calls. | All administrative queries, user toggles, departments, and category creation remain identical. |
| `server/routes/notifications.js` | Ensure route handlers `await` database adapter calls. | Notification retrieval and read status marking remain identical. |
| `server/routes/public.js` | Ensure stats calculation `awaits` database adapter calls. | Same public metrics, resolution calculations, and category breakdowns. |
| `server/services/assignmentService.js` | Make `autoAssignComplaint` asynchronous (`async/await`). | Same officer balancing algorithm and SLA calculation. |
| `server/services/notificationService.js` | Make notification insertion functions asynchronous. | Same notification templates, status transition alerts, and recipient logic. |
| `server/middleware/auth.js` | Make `authenticateToken` asynchronous to `await` user verification. | Exact same JWT token extraction, header parsing, role validation, and 401/403 responses. |
| `.env.example` | Add documentation for `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `BLOB_READ_WRITE_TOKEN`. | Existing variables are retained. |

---

## 6. Files That Will Remain Untouched

All frontend components, pages, contexts, styling, routing, and assets remain **100% UNTOUCHED**:
- `client/src/App.jsx`
- `client/src/main.jsx`
- `client/src/pages/**` (All citizen, authority, admin, and public pages)
- `client/src/components/**` (All cards, navigation, maps, charts, dialogs)
- `client/src/context/**` (`AuthContext.jsx`, `LanguageContext.jsx`, `NotificationContext.jsx`)
- `client/src/services/api.js`
- `client/src/index.css`
- `client/tailwind.config.js`
- `client/vite.config.js`
- `render.yaml` & `Dockerfile` (Kept intact as rollback references per Section 22)
- `civicconnect.db` (Kept intact as original local backup per Section 30)

---

## 7. Database Migration Strategy

### Why Turso (LibSQL) is the Safest Persistent Choice:
1. **100% SQLite Dialect Match**: Turso is LibSQL, an open-source fork of SQLite built for serverless.
2. **Zero SQL Rewriting**: Tables, columns, constraints, foreign keys, `AUTOINCREMENT`, `datetime('now', '-30 days')`, `JULIANDAY(resolved_at) - JULIANDAY(created_at)` all execute identically with zero translation bugs.
3. **Dual Compatibility**:
   - If `TURSO_DATABASE_URL` is set in environment: Connects to persistent Turso cloud SQLite.
   - If NOT set (local development): Connects to local `./civicconnect.db`.
4. **Data Migration Script**:
   - We will provide `server/scripts/migrate-to-turso.js` that connects to local `civicconnect.db`, reads all records from all 14 tables, and batch-inserts them into the Turso database.
   - The original `civicconnect.db` file is never deleted or modified during this process.

---

## 8. File Storage Strategy

1. **Storage Adapter Pattern (`server/services/storageService.js`)**:
   - `saveFile(file, category)` returns a URL string:
     - **Local Mode**: Saves to `./uploads/${filename}` ➔ returns `/uploads/${filename}`.
     - **Production Mode**:
       - If `BLOB_READ_WRITE_TOKEN` is present: uploads to Vercel Blob ➔ returns `https://...public.blob.vercel-storage.com/...`
       - If `CLOUDINARY_URL` is present: uploads to Cloudinary ➔ returns secure URL.
       - **Fallback**: Stores Base64 data URI directly in `complaint_images` ➔ `<img src={image_path} />` renders natively with zero configuration.
2. **Frontend Zero-Regression**:
   - The frontend continues to receive `image_path` as a string and renders `<img src={image_path} />`. No frontend redesign needed.

---

## 9. Environment Variable Strategy

| Variable | Scope | Purpose | Required For |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Server | Environment mode (`production` on Vercel) | Both |
| `JWT_SECRET` | Server Secret | Cryptographic signing key for auth tokens | Both |
| `GROQ_API_KEY` | Server Secret | Groq AI LLM inference (Llama/Qwen) | Both (AI features) |
| `TURSO_DATABASE_URL` | Server Secret | Turso cloud database connection URL (`libsql://...`) | Vercel persistent DB |
| `TURSO_AUTH_TOKEN` | Server Secret | Turso cloud database authentication token | Vercel persistent DB |
| `BLOB_READ_WRITE_TOKEN` | Server Secret | Vercel Blob storage token for persistent uploads | Vercel persistent files (optional, fallback provided) |

No secrets are exposed to client code (no `VITE_` prefix on sensitive variables).
