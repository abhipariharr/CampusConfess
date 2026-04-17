require('dotenv').config();
const express         = require('express');
const http            = require('http');
const { Server }      = require('socket.io');
const session         = require('express-session');
const MySQLStore      = require('express-mysql-session')(session);
const helmet          = require('helmet');
const path            = require('path');
const expressLayouts  = require('express-ejs-layouts');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));


// ─── Session ──────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// 🔹 DB config for session (NO SSL here)
const sessionDbOptions = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// 🔹 Session store
const sessionStore = new MySQLStore(sessionDbOptions);

const sessionMiddleware = session({
  key: 'cw_sid',
  secret: process.env.SESSION_SECRET || 'secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);

// Share session with Socket.io
io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

// ─── View Engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ─── Global Template Locals ───────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user          = req.session.user || null;
  res.locals.success       = req.session.success || null;
  res.locals.error         = req.session.error   || null;
  res.locals.title         = 'CampusWhisper';
  res.locals.metaDesc      = 'Anonymous college social platform';
  res.locals.pageScript    = null;
  res.locals.includeSocket = false;
  delete req.session.success;
  delete req.session.error;
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/',            require('./server/routes/auth.routes'));
app.use('/confessions', require('./server/routes/confessions.routes'));
app.use('/chat',        require('./server/routes/chat.routes'));
app.use('/match',       require('./server/routes/match.routes'));
app.use('/profile',     require('./server/routes/profile.routes'));
app.use('/admin',       require('./server/routes/admin.routes'));

// Home redirect
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/confessions');
  res.redirect('/login');
});

// 404
app.use((req, res) => {
  res.status(404).render('error', { title: '404', message: 'Page not found', code: 404 });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
require('./server/socket/chat.socket')(io);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 CampusWhisper → http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = { app, io };
