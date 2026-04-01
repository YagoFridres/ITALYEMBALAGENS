# Italy Embalagens — PCP Pro ERP v2

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 18+ instalado ( `https://nodejs.org)`
- Conta no Supabase ( `https://supabase.com)`

### 2. Configurar o Supabase
1. Crie um projeto novo no Supabase
2. Vá em SQL Editor e cole todo o conteúdo de `sql/schema.sql`
3. Execute o SQL para criar as tabelas

### 3. Configurar o .env
1. Copie o arquivo `.env.example` e renomeie para `.env`
2. Preencha com as chaves do seu projeto Supabase:
   - SUPABASE_URL → Aba Settings > API > Project URL
   - SUPABASE_ANON_KEY → Aba Settings > API > anon/public
   - SUPABASE_SERVICE_ROLE_KEY → Aba Settings > API > service_role
   - PORT=3000
   - SESSION_SECRET=qualquer-texto-longo-aqui

### 4. Instalar e rodar
```
cd italy-erp-v2
npm install
node server.js
```
Abra http://localhost:3000

## Como fazer deploy no Render

### 1. Subir para o GitHub
```
git init
git add .
git commit -m "Italy ERP v2 — inicial"
git remote add origin `https://github.com/SEU_USUARIO/italy-erp-v2.git`
git push -u origin main
```

### 2. Configurar no Render
1. Acesse `https://render.com`  e crie conta
2. Clique em "New > Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Em "Environment Variables", adicione as mesmas variáveis do `.env`
6. Clique em "Create Web Service"

O Render fará o deploy automaticamente. A URL pública aparecerá no painel.
```
