# Chá de Fraldas do Vítor — Deploy & Checklist

Este repositório contém a aplicação (React + Supabase) para gerenciar confirmações, mensagens e lista de presentes.

## Variáveis de ambiente
Configure as variáveis abaixo no seu host (Vercel, Netlify) ou copie para `.env` localmente (não comite `.env`):

- `VITE_SUPABASE_URL` — URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` — chave pública (anon) do Supabase
- `VITE_OWNER_WHATSAPP` — (opcional) telefone do organizador para o link de relatório WhatsApp

Exemplo local: copie `.env.example` para `.env` e preencha.

## Build & Preview (local)
Instale dependências e rode em modo dev:

```powershell
npm install
npm run dev
```

Para checar o build de produção e rodar preview:

```powershell
npm run build
npm run preview
```

Abra `http://localhost:5173` (ou a URL indicada) para visualizar.

## Teste de integração (automatizado)
Há um script para testar leitura/escrita/atualização/exclusão nas tabelas do Supabase:

```powershell
npm run test:integration
```

O script cria registros de teste e os remove automaticamente.

## Checklist antes de enviar convite
- [ ] Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente de produção (Vercel).
- [ ] Verificar no painel Supabase que as tabelas `guests`, `gifts`, `messages` existem e têm RLS/políticas conforme `supabase_setup.sql`.
- [ ] Aplicar o trecho de `supabase_setup.sql` (constraint de `fralda_tamanho`) no editor SQL do Supabase, se desejar validação adicional.
- [ ] Rodar `npm run build` e `npm run preview` para validar produção localmente.
- [ ] Testar fluxos principais no site:
  - Confirmar presença (formulário)
  - Enviar mensagem
  - Consultar lista de presentes (rota `/presentes`)
  - Painel de confirmados (`/confirmados`) — exportar Excel e enviar relatório via WhatsApp
- [ ] (Opcional) Rodar `npm run test:integration` para verificar integrações de banco.

## Realtime
- O app usa Realtime do Supabase nas hooks (`useGifts`, `useGuests`, `useMessages`).
- Caso queira consolidar canais, use `subscribeToTableChanges(table, callback)` exportado em `src/services/supabase.js`.

## Deploy (Vercel)
- Configure o projeto no Vercel apontando para este repositório.
- Em *Environment Variables* adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e `VITE_OWNER_WHATSAPP`.
- Build command: `npm run build`
- Output directory: `dist`

Após deploy, abra a URL do site e valide os fluxos do checklist.

## Fonts (self-hosting, optional)

Se quiser evitar a troca de fontes (FOUT) em redes móveis, você pode self-hostar as fontes usadas pelo projeto:

1. Baixe os `.woff2` e coloque em `public/fonts/`:
  - `Poppins-400.woff2`
  - `Poppins-700.woff2`
  - `DancingScript-400.woff2`
  - `DancingScript-700.woff2`

2. O projeto já contém regras `@font-face` em `index.html` que referenciam esses arquivos; ao adicioná-los o navegador irá usá-los com `font-display: swap`.

Se preferir não self-hostar, o projeto já usa `preconnect` + `preload` para Google Fonts, o que reduz bastante o efeito visual de troca de fontes.

## Problemas comuns
- 403/CORS ou erros de autenticação: verifique as políticas RLS e a chave anon.
- Realtime não chegando: confirme que as tabelas estão adicionadas à publicação `supabase_realtime` (veja `supabase_setup.sql`).

Se quiser, eu aplico a consolidação final de canais Realtime (substituir as inscrições espalhadas pelos hooks por `subscribeToTableChanges`) e testo novamente. Caso prefira que eu faça o deploy no Vercel por você, forneça acesso ou dados de configuração.
