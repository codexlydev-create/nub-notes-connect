# NoteShare backend (Node.js + Express + MongoDB)

Standalone API server for the NoteShare frontend. Runs **outside** Lovable.

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure

```bash
cp .env.example .env
# then edit .env and fill in:
#   MONGODB_URI            (e.g. mongodb+srv://...  or mongodb://127.0.0.1:27017/noteshare)
#   JWT_SECRET             (any long random string)
#   EMAIL_USER             (your gmail address)
#   EMAIL_APP_PASSWORD     (a Google App Password — NOT your real password)
```

Create a Gmail App Password: https://myaccount.google.com/apppasswords
(2-Step Verification must be enabled on the Google account first.)

## 3. Run

```bash
npm run dev   # auto-restarts on changes
# or
npm start
```

Server listens on `http://localhost:5000` by default.

## 4. Point the frontend at it

In the Lovable project, set `VITE_API_BASE_URL=http://localhost:5000`
(Lovable → Project Settings → Environment variables, or your local `.env`).

## API surface

All JSON, all under `/api`. Auth via `Authorization: Bearer <jwt>`.

### Auth & OTP
- `POST /api/auth/send-otp`               `{ email, purpose: "signup"|"login"|"reset" }`
- `POST /api/auth/verify-otp`             `{ email, code, purpose }`
- `POST /api/auth/signup`                 `{ name, email, password, otpToken }`
- `POST /api/auth/login`                  `{ email, password }`
- `POST /api/auth/reset-password`         `{ email, newPassword, otpToken }`
- `GET  /api/auth/me`                     (auth) → current user

### Notes
- `GET    /api/notes`                     query: `department, course, type, q, page, limit`
- `GET    /api/notes/:id`                 → single note (also bumps view count)
- `POST   /api/notes`                     (auth, multipart) fields: `title, description, department, course, courseCode, type, file`
- `PATCH  /api/notes/:id`                 (auth, owner only)
- `DELETE /api/notes/:id`                 (auth, owner only)
- `GET    /api/notes/:id/file`            → streams the PDF
- `POST   /api/notes/:id/like`            (auth) toggle
- `POST   /api/notes/:id/dislike`         (auth) toggle
- `POST   /api/notes/:id/save`            (auth) toggle
- `GET    /api/notes/me/uploads`          (auth)
- `GET    /api/notes/me/saved`            (auth)

### Users
- `GET   /api/users/contributors`         → top contributors
- `PATCH /api/users/me`                   (auth) update profile

### Contact
- `POST /api/contact`                     `{ name, email, subject, message }` → sends mail via Nodemailer

## File storage

PDFs are saved to `server/uploads/` on disk and served at `/api/notes/:id/file`.
Max size controlled by `MAX_UPLOAD_MB` (default 25 MB).