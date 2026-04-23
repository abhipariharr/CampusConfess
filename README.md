# CampusConfess 🎭

> Anonymous college social platform — confess, chat anonymously, reveal identity by mutual consent, and find matches based on shared interests.

https://campusconfess-production.up.railway.app/
---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8.0+

---

### 1. Create the Database

Open MySQL and run:
```bash
mysql -u root -p < schema.sql
```
This creates the `campuswhisper` database and all tables.

---

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campuswhisper
PORT=3000
SESSION_SECRET=change-this-to-something-random
```
*(Email SMTP fields are optional — reset links print to console in dev mode)*

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Seed Demo Data (Recommended)

```bash
npm run seed
```

Creates:
- 1 admin: `admin@campus.local` / `Admin@1234`
- 5 demo users: `alice@demo.edu` through `eve@demo.edu` / `Demo@1234`
- 8 sample confessions

---

### 5. Start the App

**Development (auto-restart):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

App runs at → **http://localhost:3000**

---

## 🗂️ Project Structure

```
campuswhisper/
├── app.js                    # Express + Socket.io entry
├── schema.sql                # Full MySQL schema
├── seed.js                   # Demo data seeder
├── hash.js                   # Password hashing utility
├── .env.example              # Environment template
├── server/
│   ├── config/
│   │   └── db.js             # MySQL2 connection pool
│   ├── middleware/
│   │   ├── auth.js          # requireAuth / requireAdmin guards
│   │   └── rateLimiter.js   # Rate limits on auth/API routes
│   ├── models/
│   │   ├── user.model.js        # User queries
│   │   ├── confession.model.js  # Confession CRUD
│   │   ├── chat.model.js       # Chat room queries
│   │   ├── match.model.js      # Match suggestions
│   │   └── notification.model.js # Notifications
│   ├── routes/
│   │   ├── auth.routes.js      # Login, signup, password reset
│   │   ├── confessions.routes.js # Feed, create, like, comment
│   │   ├── chat.routes.js      # Chat lobby and rooms
│   │   ├── match.routes.js     # Matchmaking endpoints
│   │   ├── profile.routes.js   # User profile
│   │   └── admin.routes.js     # Admin panel
│   ├── socket/
│   │   └── chat.socket.js  # Socket.io real-time chat handlers
│   └── utils/
│       ├── anonName.js     # Random anonymous name generator
│       ├── badWords.js     # Profanity filter
│       └── mailer.js       # Email (Nodemailer)
├── views/
│   ├── layouts/
│   │   ├── main.ejs        # Main layout (navbar, flash)
│   │   └── auth.ejs        # Auth layout (login/signup)
│   ├── partials/
│   │   ├── navbar.ejs      # Navigation bar
│   │   └── flash.ejs       # Flash messages
│   ├── auth/
│   │   ├── login.ejs
│   │   ├── signup.ejs
│   │   ├── forgot-password.ejs
│   │   └── reset-password.ejs
│   ├── feed/
│   │   ├── index.ejs       # Confession feed
│   │   └── post.ejs        # Create confession form
│   ├── chat/
│   │   ├── index.ejs       # Chat lobby
│   │   └── room.ejs        # Active chat room
│   ├── match/
│   │   └── index.ejs       # Match suggestions
│   ├── profile/
│   │   └── index.ejs       # User profile
│   ├── admin/
│   │   ├── dashboard.ejs    # Admin dashboard
│   │   └── confessions.ejs   # Confession management
│   └── error.ejs           # Error page
└── public/
    ├── css/
    │   └── theme.css       # Cinematic dark theme
    └── js/
        ├── chat.js         # Chat functionality
        ├── confessions.js  # Feed interactions
        └── match.js        # Match interactions
```

---

## 🔐 Security Features
- **bcrypt** (12 rounds) password hashing
- **express-rate-limit** — 10 login/15min, 5 signup/hour, 3 reset/hour
- **helmet** — secure HTTP headers
- **express-validator** — input sanitization on all forms
- **Parameterized queries** — SQL injection protection
- **HttpOnly + SameSite** cookies
- **Profanity filter** on confessions and chat

---

## 👑 Admin Login
| Field | Value |
|---|---|
| Email | `admin@campus.local` |
| Password | `Admin@1234` |

Admin panel: http://localhost:3000/admin

---

## 📡 Key API Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/login` | Login |
| POST | `/signup` | Register |
| GET | `/confessions` | Feed |
| POST | `/confessions` | Create confession |
| POST | `/confessions/:id/like` | Toggle like |
| POST | `/confessions/:id/comment` | Add comment |
| POST | `/chat/random` | Join random chat |
| POST | `/chat/interest` | Join interest chat |
| GET | `/chat/:code` | Open chat room |
| POST | `/chat/:code/reveal` | Request identity reveal |
| GET | `/match` | Get match suggestions |
| POST | `/match/:id/chat` | Chat with a match |
| GET | `/admin` | Admin dashboard |

---

## 🗄️ Database Tables
| Table | Purpose |
|---|---|
| `users` | Accounts (real name hidden) |
| `user_interests` | Interest tags per user |
| `confessions` | Anonymous posts |
| `confession_likes` | Like records |
| `confession_comments` | Anonymous comments |
| `reports` | Content/user reports |
| `chat_rooms` | 1:1 chat sessions |
| `chat_participants` | Room membership + anon labels |
| `chat_messages` | Chat history |
| `password_resets` | Reset tokens (1 hour TTL) |
| `admin_logs` | Admin action audit (7 day auto-delete) |
| `sessions` | Express session store (auto-created) |
