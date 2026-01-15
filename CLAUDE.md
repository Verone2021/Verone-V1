# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour décoration et mobilier d'intérieur haut de gamme.

## Commandes

```bash
npm run dev          # Dev (localhost:3000)
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run e2e:smoke    # Smoke tests UI
```

---

## Workflow Standard Anthropic

### 1. Explorer
- Lire fichiers AVANT de coder
- Comprendre contexte existant

### 2. Planifier
**Utiliser EnterPlanMode pour tasks complexes**:
- Claude génère plan dans `.claude/plans/`
- User review & approve
- Pas de fichier ACTIVE.md custom

### 3. Coder
- Suivre patterns existants
- Minimum nécessaire

### 4. Vérifier
```bash
npm run type-check
npm run build
npm run e2e:smoke  # Si UI modifiée
```

### 5. Commiter
**Format commit requis**:
```
[APP-DOMAIN-NNN] type: description courte

Details optionnels...
```

**Exemples**:
- `[LM-ORD-009] feat: refonte workflow order form`
- `[BO-DASH-001] fix: cache invalidation`
- `[NO-TASK] chore: update dependencies`

**Validation automatique**: Hook PreToolUse bloque si format invalide

---

## Task Management (.tasks/)

### Structure
```
.tasks/
├── LM-ORD-009.md        # 1 fichier = 1 task
├── BO-DASH-001.md
├── INDEX.md             # Généré auto (gitignored)
└── TEMPLATE.md          # Template
```

### Créer nouvelle task
```bash
cp .tasks/TEMPLATE.md .tasks/LM-ORD-XXX.md
# Éditer frontmatter YAML
# git add .tasks/LM-ORD-XXX.md
```

### Générer index
```bash
.tasks/generate-index.sh
cat .tasks/INDEX.md
```

---

## Stack Technique

- Next.js 15 (App Router, RSC)
- shadcn/ui + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Turborepo v2.6.0 + pnpm

---

## Ports

| Application | Port |
|-------------|------|
| back-office | 3000 |
| site-internet | 3001 |
| linkme | 3002 |

---

## Git

- `main`: Production
- `feat/*`: Features
- `fix/*`: Bug fixes

---

**Version**: 8.0.0 (Refonte 2026-01-15)
