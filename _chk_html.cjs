const https = require('https');
const opts = {
  host:'adm.italyembalagens.com.br', path:'/', method:'GET', timeout: 15000,
  headers:{'Accept':'text/html', 'Cache-Control':'no-cache', 'Pragma':'no-cache', 'User-Agent':'TestClient/1.0'}
};
const t0 = Date.now();
const req = https.request(opts, (res) => {
  const hdrs = { ...res.headers };
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    const tempo = Date.now()-t0;
    const temNovo = b.includes('Largura da Pe') || b.includes('Largura da Peca') || b.includes('da Peça (mm)');
    const temVelho = b.includes('Largura Necessária (mm)') || b.includes('Largura Necessaria');
    const tem9cols = b.includes('110px 1fr 160px 120px 80px 90px 90px 100px 110px');
    const temSelecionar = b.includes('_simdSelecionarChapa') || b.includes('Selecionar</button>');
    const patch = hdrs['x-index-patch-version'];
    console.log('HTTP', res.statusCode);
    console.log('x-index-patch-version:', patch);
    console.log('TEM_LABEL_NOVO (Largura da Peça):', temNovo);
    console.log('TEM_LABEL_VELHO (Largura Necessária):', temVelho);
    console.log('TEM_9COLS (110px acao):', tem9cols);
    console.log('TEM_SELECIONAR (funcao):', temSelecionar);
    console.log('HTML length:', b.length, 'bytes');
    console.log('Tempo:', tempo, 'ms');
    process.exit( (temNovo && tem9cols && temSelecionar) ? 0 : 1 );
  });
});
req.on('timeout', () => { req.destroy(); process.exit(3); });
req.on('error', e => { console.log('NET', e.message); process.exit(4); });
req.end();