const jwt = require('jsonwebtoken');
const SEC = process.env.JWT_SECRET || 'italy_secret_2026';
const tok = jwt.sign({
  id: 'diag-local-probe-0001',
  nome: 'Diag Local Probe',
  email: 'diag@local',
  perfil: 'admin',
  permissoes: ['tudo'],
  avatar_url: null,
}, SEC, { expiresIn: '6h' });
console.log('TOKEN=' + tok);
