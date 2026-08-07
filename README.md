# Agenda da Clínica

Sistema interno de agendamento para uma clínica com dois médicos e uma equipe de
secretários. Sem acesso de pacientes — uso 100% interno (médicos, secretários e admin).

## Stack e por quê

- **Next.js (App Router) + TypeScript** — um único projeto cobre front e back-end
  (Server Components + Server Actions), simplificando deploy e manutenção.
- **PostgreSQL + Prisma** — schema tipado, migrations versionadas, fácil de hospedar em
  provedores gerenciados gratuitos (Neon, Supabase). Fixado em **Prisma 6.x** (não 7) —
  o Prisma 7 exige "driver adapters" manuais para o client em runtime, o que adiciona
  complexidade sem necessidade para este projeto.
- **Auth.js (NextAuth) v4 com Credentials provider** — login por e-mail/senha, sessão
  em JWT (cookie httpOnly). Fixado em **v4 estável**, não v5 (ainda em beta na época em
  que este projeto foi criado).
- **Tailwind CSS + shadcn/ui (base Base UI)** — componentes prontos, sem reinventar
  formulários/modais. **Atenção:** esta versão do shadcn usa
  [Base UI](https://base-ui.com) como base, não Radix. Duas diferenças importantes ao
  adicionar novos componentes:
  - Use `render={<Componente />}` em vez de `asChild` para compor triggers.
  - `<Select items={{ id: "Rótulo" }}>` precisa do prop `items` (mapa id → rótulo) para
    o `<SelectValue>` mostrar o texto certo — sem isso ele mostra o `value` bruto.
- **Resend** — envio do e-mail de "esqueci minha senha" (e, futuramente, lembretes).
- **Vitest** — testes unitários da lógica pura de agenda (conflitos, cálculo de datas,
  validação de CPF).

## Estrutura de pastas

```
prisma/
  schema.prisma        # modelo de dados (fonte da verdade)
  seed.ts               # cria os 2 médicos/admin + procedimentos de exemplo

src/
  auth.ts                        # configuração do Auth.js (Credentials + JWT)
  middleware.ts                  # protege rotas (conveniência de UX; não é o limite de segurança real)

  app/
    (auth)/                      # layout sem navegação: login, esqueci senha, redefinir senha
    (app)/                       # layout autenticado com navegação
      agenda/[doctorId]/         # calendário dia/semana/mês
      patients/                  # cadastro e histórico de pacientes
      procedures/                # catálogo de procedimentos (admin)
      blocked-time/              # bloqueios de horário
      follow-ups/                # dashboard de retornos pendentes
      admin/users/               # gestão de usuários (admin)
    api/auth/[...nextauth]/      # handler do NextAuth (única rota de API do projeto)

  server/
    auth/
      authorization.ts           # regra central de permissão por agenda de médico
      scope.ts                   # resolve quais médicos o usuário logado pode ver/gerenciar
      session.ts                 # helper getAuthSession()
    actions/                     # Server Actions — todas as mutações do sistema
    queries/                     # leituras usadas pelos Server Components
    scheduling/
      conflicts.ts                # detecção de conflito de horário (consulta + bloqueio)
      followUp.ts                 # criação automática de retorno ao concluir consulta
      time.ts                     # funções puras de data/hora (testadas em time.test.ts)
    email/                        # integração com Resend
    db/prisma.ts                  # PrismaClient singleton

  lib/
    validations/                  # schemas zod por entidade
    cpf.ts                        # validação de CPF (checksum) — testado em cpf.test.ts
    date-only.ts                  # datas "sem hora" (ex: nascimento) em UTC-noon, evita bug de fuso
    agenda-range.ts                # cálculo de intervalo de dia/semana/mês para o calendário

  components/ui/                  # shadcn/ui
  components/nav/                 # navegação principal
```

## Modelo de dados (resumo)

Ver `prisma/schema.prisma` para os campos completos. Decisões principais:

- **Médico = `User` com `role = DOCTOR`.** Não há tabela `Doctor` separada.
- **`isAdmin` é um boolean independente do `role`** — hoje só os dois médicos são admin,
  mas a capacidade de admin não depende de ter agenda própria.
- **Secretário → médico é uma FK direta** (`linkedDoctorId` em `User`) — vários
  secretários podem apontar para o mesmo médico.
- **`ProcedureDoctor`** é a tabela de junção N:N entre procedimentos e médicos que os
  realizam.
- **`Appointment` grava `startTime`/`endTime`** calculados a partir da duração do
  procedimento no momento da criação (não recalcula se a duração padrão mudar depois).
- **Retorno automático é só um `Appointment`** com `status = PENDING_CONFIRMATION` e uma
  auto-relação (`followUpOfAppointmentId`) para a consulta que o originou.

### Regras de permissão

| Papel | Pode gerenciar (criar/editar/cancelar) | Pode ver (somente leitura) |
|---|---|---|
| Médico | A própria agenda | A agenda do outro médico |
| Secretário | A agenda do médico ao qual está vinculado | — |
| Admin (ambos os médicos) | Usuários, procedimentos | — |

A checagem de permissão vive em `src/server/auth/authorization.ts` e é chamada no
início de toda Server Action que grava dados — o `middleware.ts` só redireciona por
conveniência de navegação, não é a barreira de segurança real.

## Rodando localmente

### 1. Node.js

Requer Node 20+. Se não tiver, instale via [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Banco de dados Postgres

Duas opções:

**Opção A — banco local via Prisma (mais simples, sem Docker):**

```bash
npx prisma dev -d -n clinica
```

Isso imprime uma `DATABASE_URL` local (ex: `postgres://postgres:postgres@localhost:PORTA/template1?sslmode=disable`).
**Importante:** adicione `&pgbouncer=true&connection_limit=1` no fim dessa URL — sem
isso, o proxy local do `prisma dev` pode gerar o erro `prepared statement "s0" already
exists` sob certas condições de recarga do Next.js.

**Opção B — Postgres gerenciado gratuito (Neon ou Supabase):**
Crie um projeto em [neon.tech](https://neon.tech) ou [supabase.com](https://supabase.com)
e copie a connection string (com `sslmode=require`).

### 4. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha `.env`:

- `DATABASE_URL` — do passo 3.
- `NEXTAUTH_SECRET` — gere com `openssl rand -base64 32`.
- `RESEND_API_KEY` / `EMAIL_FROM` — opcional em dev; sem isso, o fluxo de "esqueci minha
  senha" continua funcionando (a mensagem genérica aparece normalmente), mas nenhum
  e-mail é realmente enviado. Crie uma conta grátis em [resend.com](https://resend.com)
  para habilitar o envio de verdade.
- `SEED_DOCTOR1_*` / `SEED_DOCTOR2_*` — nome/e-mail/senha inicial dos dois médicos/admin.

### 5. Migrations + seed

```bash
npx prisma migrate dev
npx prisma db seed
```

Isso cria os dois médicos/admin (senha definida em `.env`) e alguns procedimentos de
exemplo (um deles com retorno automático em 7 dias).

### 6. Rodar o servidor

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e entre com o e-mail/senha de um
dos médicos definidos no seed.

### Testes

```bash
npm test
```

Cobre a validação de CPF e a lógica pura de agenda (sobreposição de horários, cálculo
de data de retorno).

## Deploy

1. Crie um banco Postgres gerenciado (Neon ou Supabase).
2. Suba o projeto no [Vercel](https://vercel.com/new), conectando o repositório.
3. Configure as mesmas variáveis de `.env` no painel do Vercel (`DATABASE_URL` apontando
   para o banco de produção, `NEXTAUTH_URL`/`APP_URL` com o domínio real,
   `NEXTAUTH_SECRET` novo e único para produção).
4. Rode as migrations contra o banco de produção uma vez (`npx prisma migrate deploy`)
   e o seed dos dois médicos (`SEED_DOCTOR1_PASSWORD`/`SEED_DOCTOR2_PASSWORD` fortes,
   trocadas no primeiro login).
5. Configure um domínio de envio verificado no Resend para `EMAIL_FROM` funcionar em
   produção (o domínio de teste `onboarding@resend.dev` só envia para o e-mail da conta
   Resend).

## Escopo do MVP

**Incluído:**
usuários e permissões (médico/secretário/admin), agenda dia/semana/mês por médico,
criar/editar/remarcar/cancelar/concluir consulta, bloqueio de horários, detecção
automática de conflito, cadastro de pacientes com CPF validado e histórico, catálogo de
procedimentos com duração e regra de retorno, sugestão automática de retorno ao concluir
consulta, dashboard de retornos pendentes/atrasados, redefinição de senha por e-mail.

**Fora do escopo (fase 2):**
checklist de acompanhamento por procedimento, notificações WhatsApp, lembretes por
e-mail antes da consulta/retorno, faturamento, portal do paciente, múltiplas clínicas,
consultas recorrentes, relatórios/analytics.

## Próximos passos sugeridos

Peça ajustes incrementais — por exemplo: lembretes automáticos por e-mail antes da
consulta (reaproveitando a integração Resend já existente), checklist de acompanhamento
por procedimento, ou relatórios simples de atendimentos por período.
