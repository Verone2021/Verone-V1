# 📄 Claude Configuration — Auto-loaded by Claude Code

> This file is automatically loaded by Claude Code at project start to provide context, rules, and configuration.

## 🗂 Project Overview

**Vérone Back office** - Application de gestion back-office avec intégration MCP complète pour des capacités Claude Code améliorées.  
Construite sur **Next.js + React + shadcn/ui + Tailwind CSS + Supabase + Vercel**.

## 🛠 MCP Servers Available

### 🗄 **Supabase** — Database & Storage
- **Status**: ✅ Pre-configured in `.mcp.json`  
- **Features**: Database queries, storage management
- **Requires**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`
- **Security Note**: `SUPABASE_ACCESS_TOKEN` is private — never commit to public repos.

### 📚 **Context7** — Documentation
- **Features**: Tailwind CSS, Next.js, Shadcn UI, React docs
- **Usage**: Instant access to framework documentation
- **No config required**

### 🔧 **Serena** — Enhanced Editing
- **Features**: Advanced code editing and IDE assistance
- **Context**: `ide-assistant` mode activated
- **Auto-discovery**: Uses `${PWD}` for project context
- **Recommendation**: Best for medium/large projects to improve Claude’s context usage.

### 🐙 **GitHub** — Repository Management  
- **Requires**: `GITHUB_TOKEN` environment variable
- **Features**: Issues, PRs, commits, repository management
- **Scopes needed**: `repo`, `workflow`

### 🚀 **Vercel** — Deployment Management
- **Requires**: `VERCEL_API_TOKEN` environment variable  
- **Features**: Deploy logs, project configuration, builds

---

## 🧱 Tech Stack
- **Framework**: Next.js (React 18)
- **UI**: shadcn/ui + Tailwind CSS
- **Backend/DB**: Supabase
- **Deployment**: Vercel
- **Language**: TypeScript

---

## ✅ Workflow Guidelines
- Keep changes **incremental**, commit often.
- Before coding, ask Claude to **review or generate a plan** (`/plan`).
- For new features, start with `/tasks` or `/plan` in Claude.
- Use `@filename` to reference files for context.
- Verify MCP connectivity with `/mcp list` at project start.

---

## 📌 Key Commands
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Test**: `npm test` 
- **Lint**: `npm run lint`

---

## 📂 Important Files
- `/tasks/` → Project planning and task management
- [`README.md`](README.md) → Setup and configuration guide
- `.env.example` → Required environment variables
- `.mcp.json` → MCP servers configuration
- `.claude/settings.json` → Auto-approve MCP servers

---

## 🔑 Environment Variables Required
| Service  | Variable(s) | Where to get it |
|----------|-------------|-----------------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN` | Project settings in Supabase dashboard |
| GitHub   | `GITHUB_TOKEN` | [GitHub Tokens](https://github.com/settings/tokens) |
| Vercel   | `VERCEL_API_TOKEN` | [Vercel Tokens](https://vercel.com/account/tokens) |

---

## 🧠 Claude Tips
- Use `/mcp list` to check all MCP connections.
- Use `/plan` for structured task breakdowns.
- Reference files with `@filename` for context.
- **Keep `CLAUDE.md` updated whenever the stack, MCP list, or workflow changes.**
