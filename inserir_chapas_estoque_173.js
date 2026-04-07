const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltando SUPABASE_URL e/ou SUPABASE_KEY (ou SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const REQUIRED_COLS = [
  'id',
  'fornecedor',
  'nomenclatura',
  'tamanho',
  'nome',
  'qual_cnpj',
  'nf',
  'quantidade',
  'valor_unitario',
  'estoque_minimo',
];

async function hasCol(col) {
  const { error } = await supabase.from('chapas_estoque').select(col).limit(1);
  if (!error) return true;
  const msg = String(error.message || error);
  if (msg.includes('column') || msg.includes('Could not find')) return false;
  throw error;
}

function printSql() {
  console.log('\nSQL (execute no Supabase SQL Editor):\n');
  console.log(`CREATE TABLE IF NOT EXISTS public.chapas_estoque (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor text,
  nomenclatura text,
  tamanho text,
  nome text,
  qual_cnpj text,
  nf text,
  quantidade integer DEFAULT 0,
  valor_unitario numeric DEFAULT 0,
  valor_total numeric GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  estoque_minimo integer DEFAULT 200
);`);
  console.log(`ALTER TABLE public.chapas_estoque ADD COLUMN IF NOT EXISTS fornecedor text;
ALTER TABLE public.chapas_estoque ADD COLUMN IF NOT EXISTS nomenclatura text;
ALTER TABLE public.chapas_estoque ADD COLUMN IF NOT EXISTS tamanho text;
ALTER TABLE public.chapas_estoque ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.chapas_estoque ADD COLUMN IF NOT EXISTS qual_cnpj text;
ALTER TABLE public.chapas_estoque ADD COLUMN IF NOT EXISTS nf text;
ALTER TABLE public.chapas_estoque ADD COLUMN IF NOT EXISTS quantidade integer DEFAULT 0;
ALTER TABLE public.chapas_estoque ADD COLUMN IF NOT EXISTS valor_unitario numeric DEFAULT 0;
ALTER TABLE public.chapas_estoque ADD COLUMN IF NOT EXISTS estoque_minimo integer DEFAULT 200;`);
}

function normalizeRow(r) {
  return {
    fornecedor: String(r.fornecedor || '').trim(),
    nomenclatura: String(r.nomenclatura || '').trim(),
    tamanho: String(r.tamanho || '').trim(),
    nome: String(r.nome || '').trim(),
    qual_cnpj: String(r.qual_cnpj || '').trim(),
    nf: String(r.nf || '').trim(),
    quantidade: Number.isFinite(Number(r.quantidade)) ? Math.trunc(Number(r.quantidade)) : 0,
    valor_unitario: Number.isFinite(Number(r.valor_unitario)) ? Number(r.valor_unitario) : 0,
    estoque_minimo: Number.isFinite(Number(r.estoque_minimo)) ? Math.trunc(Number(r.estoque_minimo)) : 200,
  };
}

async function inserir() {
  const raw = fs.readFileSync('./chapas_estoque_173.json', 'utf8');
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) throw new Error('chapas_estoque_173.json deve ser um array JSON');
  if (items.length !== 173) {
    console.error(`ATENÇÃO: esperado 173 itens, recebido ${items.length}.`);
  }

  const missing = [];
  for (const c of REQUIRED_COLS) {
    const ok = await hasCol(c);
    if (!ok) missing.push(c);
  }
  if (missing.length) {
    console.error('Colunas faltando na tabela chapas_estoque:', missing.join(', '));
    printSql();
    process.exit(1);
  }

  const clean = items.map(normalizeRow);

  const delFilter = '00000000-0000-0000-0000-000000000000';
  const { error: delErr } = await supabase.from('chapas_estoque').delete().neq('id', delFilter);
  if (delErr) throw delErr;
  console.log('✓ chapas_estoque: registros apagados');

  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < clean.length; i += chunkSize) {
    const chunk = clean.slice(i, i + chunkSize);
    const { error } = await supabase.from('chapas_estoque').insert(chunk);
    if (error) throw error;
    inserted += chunk.length;
    console.log(`Inseridos ${inserted}/${clean.length}`);
  }

  console.log('Concluído! Total inserido:', inserted);
}

inserir().catch((e) => {
  console.error('Erro:', e && e.message ? e.message : e);
  process.exit(1);
});

