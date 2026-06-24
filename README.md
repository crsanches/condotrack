# CondoTrack

App de gestão de demandas para condomínios. Mobile-first, construído com Next.js 14 + Firebase.

## Setup

### 1. Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative **Authentication** → Sign-in method → **Email/Password**
3. Crie o banco **Firestore** (modo production)
4. Copie as regras de `firestore.rules` para o Console do Firestore
5. Vá em **Configurações do projeto** → copie as credenciais do Web App

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
# Preencha com suas credenciais do Firebase
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

### 4. Criar o primeiro usuário (Síndico)

No Firebase Console → Authentication → Add user, crie o e-mail/senha do síndico.

Depois no Firestore → Collection `users` → Add document com ID = UID do usuário criado:

```json
{
  "name": "Nome do Síndico",
  "email": "sindico@email.com",
  "role": "sindico",
  "canDelete": true,
  "active": true
}
```

A partir daí, o síndico pode criar os demais usuários pela tela de **Admin**.

### 5. Deploy (Vercel)

```bash
vercel
# Configure as variáveis de ambiente NEXT_PUBLIC_FIREBASE_* no painel da Vercel
```

## Permissões

| Ação | Conselheiro | Subsíndico | Síndico |
|------|-------------|------------|---------|
| Consultar | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ✅ |
| Atualizar | ✅ | ✅ | ✅ |
| Excluir | ❌ | ✅ (+ 2ª senha) | ✅ (+ 2ª senha) |
| Admin (usuários) | ❌ | ❌ | ✅ |

## Fluxo de exclusão

A exclusão exige **duas autenticações**:
1. Usuário logado clica em "Excluir"
2. Informa e-mail + senha de um **segundo** membro autorizado (síndico ou subsíndico)
3. Sistema verifica via Firebase Auth sem deslogar o usuário atual
4. Só então a demanda é excluída

## Estrutura de dados (Firestore)

### `users/{uid}`
```json
{
  "name": "string",
  "email": "string",
  "role": "sindico | subsindico | conselheiro",
  "canDelete": "boolean",
  "active": "boolean"
}
```

### `demands/{id}`
```json
{
  "titulo": "string",
  "tipo": "manutencao | administrativo | financeiro | seguranca | limpeza | obra | outro",
  "prioridade": "alta | media | baixa",
  "responsavel": "uid",
  "status": "aberta | em_andamento | concluida",
  "dataCriacao": "Timestamp",
  "dataConclusao": "Timestamp | null",
  "criadoPor": "uid",
  "atualizacoes": [
    {
      "data": "Timestamp",
      "texto": "string",
      "autor": "uid"
    }
  ]
}
```
