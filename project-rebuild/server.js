require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./db/supabase');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({ ok: true, data: { SUPABASE_URL, SUPABASE_ANON_KEY } });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', authMiddleware, itemRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  try {
    console.error(err);
  } catch (e) {}
  res.status(500).json({ error: 'Server Error' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

