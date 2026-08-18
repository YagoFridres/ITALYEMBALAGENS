const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const token = jwt.sign({ id:'t', perfil:'admin' }, 'italy_secret_2026', { expiresIn:'4h' });
const out = path.join(__dirname, '_jwt_token.txt');
fs.writeFileSync(out, token);
console.log('TOKEN written. length=', token.length);
console.log(token.slice(0, 30) + '...');
