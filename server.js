const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== AUTH =====
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return res.status(401).json({ erro: error.message });
  res.json({ token: data.session.access_token, usuario: data.user });
});

// ===== ORDENS =====
app.get('/api/ordens', async (req, res) => {
  const { data, error } = await supabase.from('ordens_fabricacao').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ erro: error.message });
  res.json(data);
});

app.post('/api/ordens', async (req, res) => {
  const { data, error } = await supabase.from('ordens_fabricacao').insert(req.body).select();
  if (error) return res.status(400).json({ erro: error.message });
  res.json(data);
});

// ===== ESTOQUES =====
app.get('/api/estoques/:tipo', async (req, res) => {
  const { data, error } = await supabase.from('estoques').select('*').eq('tipo', req.params.tipo);
  if (error) return res.status(400).json({ erro: error.message });
  res.json(data);
});

// ===== USUÁRIOS (admin) =====
app.get('/api/usuarios', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(400).json({ erro: error.message });
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
