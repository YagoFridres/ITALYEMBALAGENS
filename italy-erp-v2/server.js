const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const ofRoutes = require('./routes/ofRoutes');
const apontamentoRoutes = require('./routes/apontamentoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const k of requiredEnv) {
  if (!process.env[k]) {
    console.error(`Missing env: ${k}`);
    process.exit(1);
  }
}

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/config', (req, res) => {
  res.json({
    ok: true,
    data: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/ofs', ofRoutes);
app.use('/api/apontamentos', apontamentoRoutes);
app.use('/api/dashboard', dashboardRoutes);

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));

app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/app', (req, res) => res.sendFile(path.join(publicDir, 'app.html')));

app.use((req, res) => res.status(404).json({ ok: false, error: 'not_found' }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Italy ERP v2: http://localhost:${port}`);
});
