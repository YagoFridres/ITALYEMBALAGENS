const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '_TESTE_WRITE_OK.txt');
fs.writeFileSync(p, 'hello_node_write_'+Date.now()+'\n');
process.exit(0);
