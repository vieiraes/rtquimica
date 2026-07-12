# RTQuímico

Aplicação web para gestão de responsabilidades técnicas de profissionais da Química.

## Executar

```bash
npm install
npm run dev
```

A aplicação abre em modo demonstrativo, com dados locais e fluxos navegáveis.

## Supabase

1. Crie um projeto no Supabase.
2. Aplique o esquema com `supabase db push --linked` (ou cole o conteúdo da migration mais recente em `supabase/migrations/` no SQL Editor).
3. Copie `.env.example` para `.env.local`.
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

O esquema (fonte única em `supabase/migrations/`) inclui tabelas, RLS, bucket
privado de documentos, limite de seis RTs ativas e geração automática do alerta
de comunicação ao CRQ.

## Funcionalidades implementadas

- Landing page e acesso à demonstração
- Dashboard responsivo com métricas, prazos e alertas
- Cadastro e acompanhamento de RTs
- Central de alertas e preferências
- Diário de ações técnicas
- Checklist de conformidade
- Biblioteca e edição de POPs
- Portal simplificado da empresa
- Painel administrativo
- Perfil, plano e modo escuro
