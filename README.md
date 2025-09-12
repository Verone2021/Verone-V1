# Project Template

Template repository with full MCP stack for Claude Code integration.  
Designed for **Next.js + React + shadcn/ui + Tailwind CSS + Supabase + Vercel** projects.

## 📂 Structure

project-template/
├─ CLAUDE.md # Claude Code configuration & project rules
├─ README.md # This file
├─ tasks/ # Project management
│ ├─ todo.md # Task list
│ └─ projectplan.md # Project planning
├─ .claude/ # Claude settings
│ └─ settings.json # Auto-approve MCP servers
├─ .gitignore # Git exclusions
├─ .mcp.json # MCP servers configuration
└─ .env.example # Environment variables template

---

## 🚀 Getting Started

### 1. Clone & Setup
```bash
git clone https://github.com/Verone2021/Template_dev.git
cd Template_dev
cp .env.example .env.local
2. Configure API Keys
Set these environment variables in your .env file or system.
See "Configuration des variables d’environnement" below for details.

# GitHub (required for repo management)
export GITHUB_TOKEN=ghp_your_token

# Vercel (required for deployments)  
export VERCEL_API_TOKEN=vercel_your_token

# Notion (required for documentation)
export NOTION_API_KEY=secret_your_key

# Supabase (optional if using MCP Supabase)
export NEXT_PUBLIC_SUPABASE_URL=https://your_project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
export SUPABASE_ACCESS_TOKEN=your_service_role_key

⚙️ Configuration des variables d'environnement

Ce projet inclut un fichier .env.example que vous devez copier et renommer :
```bash
cp .env.example .env.local
```
Ensuite, remplissez chaque variable avec vos propres valeurs dans `.env.local`.

🔹 SUPABASE
NEXT_PUBLIC_SUPABASE_URL : URL de votre projet Supabase (ex : https://xxxx.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY : clé anon de Supabase (frontend)
SUPABASE_ACCESS_TOKEN : clé service_role (⚠️ privée), utilisée uniquement par le MCP Supabase

🔹 GITHUB
GITHUB_TOKEN : token personnel GitHub avec les droits repo et workflow
→ Créer un token GitHub

🔹 VERCEL
VERCEL_API_TOKEN : token API de Vercel
→ Créer un token Vercel

🔹 NOTION
NOTION_API_KEY : clé API de votre intégration Notion
→ Créer une intégration Notion

📌 Bonnes pratiques :
- Ne jamais commiter votre `.env.local` dans un dépôt public (déjà exclu par .gitignore)
- Garder les clés sensibles uniquement sur des environnements sécurisés
- Le fichier `.env.local` est automatiquement chargé par Next.js et les serveurs MCP

🛠 MCP Servers Included
Supabase : Database and storage access ✅ Pre-configured
Context7 : Tailwind CSS, Next.js, Shadcn UI, React docs
Serena : Enhanced Claude editing capabilities
GitHub : Repository management, issues, PRs
Vercel : Deployment management and logs
Notion : Documentation and knowledge base

📦 Tech Stack
Framework : Next.js (React 18)
UI : shadcn/ui + Tailwind CSS
Backend/DB : Supabase
Deployment : Vercel
Language : TypeScript

✅ Recommended Workflow with Claude Code
Start Claude in Cursor:
claude
Check MCP connectivity:
/mcp list
→ All servers should appear as enabled.
Plan before coding:
Use /plan or /tasks to structure your work.
Use file references:
Mention @filename to include code or docs in context.

📂 Important Files
CLAUDE.md → Rules, context, and Claude configuration
.env.example → Template for environment variables
.mcp.json → MCP servers configuration
.claude/settings.json → Auto-approve MCP servers

📋 Tasks
See the tasks/ directory for:
todo.md : Short-term task list
projectplan.md : MVP & planning