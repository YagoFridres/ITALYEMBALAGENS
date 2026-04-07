const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltando SUPABASE_URL e/ou SUPABASE_KEY (ou SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inserir() {
  const data = JSON.parse(fs.readFileSync('./marco2026_completo.json', 'utf8'));

  await supabase.from('relatorio_producao').delete().eq('mes_referencia', '2026-03');
  await supabase.from('relatorio_aparras').delete().eq('mes_referencia', '2026-03');

  const prod = Array.isArray(data.producao) ? data.producao : [];
  for (let i = 0; i < prod.length; i += 100) {
    const lote = prod.slice(i, i + 100);
    const { error } = await supabase.from('relatorio_producao').insert(lote);
    if (error) console.error('Erro producao lote', i, error.message || error);
    else console.log(`Produção: inseridos ${Math.min(i + 100, prod.length)}/${prod.length}`);
  }

  const ap = Array.isArray(data.aparras) ? data.aparras : [];
  for (let i = 0; i < ap.length; i += 100) {
    const lote = ap.slice(i, i + 100);
    const { error } = await supabase.from('relatorio_aparras').insert(lote);
    if (error) console.error('Erro aparras lote', i, error.message || error);
    else console.log(`Aparras: inseridos ${Math.min(i + 100, ap.length)}/${ap.length}`);
  }

  console.log('Concluído!');
}

inserir().catch((e) => {
  console.error('Erro geral:', e && e.message ? e.message : e);
  process.exit(1);
});

