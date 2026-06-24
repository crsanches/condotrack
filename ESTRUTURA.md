# CondoTrack — Estrutura do Projeto

## Stack
- Next.js 14 (App Router)
- TypeScript
- Firebase (Auth + Firestore)
- Tailwind CSS
- Vercel (deploy)

## Estrutura de pastas

```
condotrack/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout raiz (mobile-first)
│   │   ├── page.tsx                # Redireciona para /auth ou /dashboard
│   │   ├── auth/
│   │   │   └── page.tsx            # Tela de login
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Home: stats + menu
│   │   ├── demands/
│   │   │   ├── page.tsx            # Lista com filtros
│   │   │   ├── nova/
│   │   │   │   └── page.tsx        # Registrar nova demanda
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Detalhe da demanda
│   │   │       ├── editar/
│   │   │       │   └── page.tsx    # Editar demanda
│   │   │       └── historico/
│   │   │           └── page.tsx    # Adicionar atualização
│   │   ├── admin/
│   │   │   └── page.tsx            # Gestão de usuários (só síndico)
│   │   └── api/
│   │       ├── demands/
│   │       │   └── route.ts        # GET/POST demandas
│   │       └── users/
│   │           └── route.ts        # GET usuários
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # Container mobile + header
│   │   │   ├── Header.tsx          # Header com back button
│   │   │   └── BottomNav.tsx       # Navegação inferior
│   │   ├── ui/
│   │   │   ├── PriorityBadge.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── ConfirmModal.tsx
│   │   └── demands/
│   │       ├── DemandCard.tsx      # Card da lista
│   │       ├── DemandForm.tsx      # Formulário novo/editar
│   │       ├── DemandFilters.tsx   # Filtros da lista
│   │       ├── UpdatesList.tsx     # Histórico de atualizações
│   │       └── DeleteModal.tsx     # Modal 2 usuários para excluir
│   ├── lib/
│   │   ├── firebase.ts             # Init Firebase
│   │   ├── firestore.ts            # Funções CRUD Firestore
│   │   └── auth.ts                 # Helpers de autenticação
│   ├── hooks/
│   │   ├── useAuth.ts              # Hook de autenticação
│   │   └── useDemands.ts           # Hook de demandas (realtime)
│   └── types/
│       └── index.ts                # Tipos TypeScript
├── .env.local.example
├── firestore.rules
├── package.json
└── README.md
```

## Coleções Firestore

### `users`
```
{
  uid: string,           // Firebase Auth UID
  name: string,
  role: 'sindico' | 'subsindico' | 'conselheiro',
  canDelete: boolean,    // true apenas para sindico/subsindico
  active: boolean
}
```

### `demands`
```
{
  id: string,            // auto-generated
  titulo: string,
  tipo: 'manutencao' | 'administrativo' | 'financeiro' | 'seguranca' | 'limpeza' | 'obra' | 'outro',
  prioridade: 'alta' | 'media' | 'baixa',
  responsavel: string,   // uid do usuário
  status: 'aberta' | 'em_andamento' | 'concluida',
  dataCriacao: Timestamp,
  dataConclusao: Timestamp | null,
  criadoPor: string,     // uid
  atualizacoes: [
    {
      data: Timestamp,
      texto: string,
      autor: string      // uid
    }
  ]
}
```

## Regras de acesso
- **Consultar / Criar / Atualizar**: todos os membros logados
- **Excluir**: apenas sindico + subsindico, exige confirmação de senha de um segundo membro autorizado
- **Admin (gestão de usuários)**: apenas sindico
