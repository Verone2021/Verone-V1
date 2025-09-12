# Configuration MCP Stack Existante - Want It Now

## 🛠 MCP Servers Actuels (Conservés)

### ✅ **Stack MCP Opérationnelle**

D'après le CLAUDE.md existant, voici les MCP servers actuellement configurés :

#### **🔧 Serena** — Enhanced Editing & Diagnostics
- **Status**: ✅ Configuré et opérationnel
- **Features**: TypeScript diagnostics, code analysis, projet structure analysis
- **Installation**: `claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)`
- **Usage dans architecture TDD**: Diagnostics temps réel pendant phase coding
- **Integration agents**: Utilisé par tous les agents pour analysis code

#### **📚 Context7** — Documentation Framework
- **Status**: ✅ Configuré et opérationnel  
- **Features**: Tailwind CSS, Next.js, Shadcn UI, React docs
- **Installation**: `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest`
- **Usage dans architecture TDD**: Documentation lookup pendant design + implementation
- **Integration agents**: Ressource principale Shadcn Expert + référence Orchestrateur

#### **🔍 Ref** — Technical References & API Search
- **Status**: ✅ Configuré via HTTP transport
- **Features**: Technical documentation search, API references, code examples
- **Installation**: `claude mcp add --transport http Ref "https://api.ref.tools/mcp?apiKey=ref-adba3c10044809167187"`
- **Usage dans architecture TDD**: Recherche patterns + best practices
- **Integration agents**: Support technique pour tous les agents

#### **🧠 Sequential Thinking** — Problem Solving
- **Status**: ✅ Configuré via NPX
- **Features**: Structured problem solving, architecture planning, complex debugging
- **Installation**: `claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking`
- **Usage dans architecture TDD**: Planning phases complexes, debugging
- **Integration agents**: Outil principal Orchestrateur pour coordination

#### **🎭 Playwright** — Browser Automation & Testing  
- **Status**: ✅ Configuré via NPX
- **Features**: E2E testing, browser automation, web interaction
- **Installation**: `claude mcp add playwright -- npx @playwright/mcp`
- **Usage dans architecture TDD**: **CORE** - Tests E2E pour tous les workflows
- **Integration agents**: Outil principal Playwright Expert

#### **🔧 IDE** — VS Code Integration
- **Status**: ✅ Intégré
- **Features**: Diagnostics languagues, exécution code, intégration IDE
- **Usage dans architecture TDD**: Feedback temps réel, debugging
- **Integration agents**: Support technique continu

## 🚀 **Enhancement Architecture TDD**

### **Conservation Intégrale**
- ✅ **Tous les MCP actuels sont conservés**
- ✅ **Configuration existante préservée** 
- ✅ **Fonctionnalités enrichies** avec agents spécialisés
- ✅ **Workflow EPCT maintenu** et amélioré avec TDD

### **Nouvelles Intégrations**

#### **Auto-approbations Sécurisées**
```json
// Ajout dans .claude/settings.json
{
  "enableAllProjectMcpServers": true,
  "permissions": {
    "auto-approve": [
      "mcp__playwright__*",
      "mcp__ide__*",
      "mcp__sequential-thinking__*"
    ]
  }
}
```

#### **Configuration Agents + MCP**
```yaml
# Mapping Agents → MCP Tools
Orchestrateur Want It Now:
  - Sequential Thinking (planning complexe)
  - Serena (diagnostics projet)
  - Context7 (documentation)
  
Playwright Expert Want It Now:
  - Playwright MCP (tests E2E)
  - IDE (debugging)
  - Serena (code analysis)
  
Shadcn Expert Want It Now:
  - Context7 (Shadcn documentation)
  - Ref (design patterns)
  - IDE (preview temps réel)
```

## 📋 **Workflow MCP Integration**

### **Phase Explorer (EPCT Enhanced)**
1. **Sequential Thinking** → Analyse problème complexe
2. **Serena** → Diagnostics codebase existant  
3. **Context7 + Ref** → Documentation + best practices
4. **Orchestrateur** → Coordination insights

### **Phase Planifier (TDD Planning)**
1. **Orchestrateur** → Plan implementation avec business rules
2. **Serena** → Validation structure codebase
3. **Sequential Thinking** → Strategy validation
4. **Manifeste** → Documentation plan

### **Phase Coder (TDD Red → Green)**
1. **Playwright Expert** → Tests-first avec Playwright MCP
2. **Shadcn Expert** → Implementation UI avec Context7
3. **Serena** → Diagnostics temps réel
4. **IDE** → Feedback continu

### **Phase Tester (TDD Verify)**
1. **Playwright MCP** → Exécution tests E2E
2. **IDE** → Code coverage + diagnostics
3. **Serena** → Code quality checks
4. **Smart Commit** → Sauvegarde cycle complet

## 🔧 **Configuration Technique**

### **Variables Environnement Requises**
```bash
# Existantes (conservées)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_ACCESS_TOKEN=your_access_token

# Nouvelles (optionnelles selon MCP)
REF_API_KEY=ref-adba3c10044809167187  # Déjà configuré
```

### **Troubleshooting MCP**
```bash
# Vérification status
claude mcp list

# Re-configuration si nécessaire
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
claude mcp add --transport http Ref "https://api.ref.tools/mcp?apiKey=ref-adba3c10044809167187"
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
claude mcp add playwright -- npx @playwright/mcp
```

## ✅ **Validation Integration**

### **Tests MCP Stack**
- [ ] `claude mcp list` → Tous les MCP actifs
- [ ] Serena → Diagnostics projet disponibles
- [ ] Context7 → Documentation Shadcn accessible
- [ ] Ref → API search fonctionnel  
- [ ] Sequential Thinking → Problem solving opérationnel
- [ ] Playwright → Tests E2E exécutables
- [ ] IDE → Integration VS Code active

### **Agents + MCP Tests**
- [ ] Orchestrateur → Utilise Sequential Thinking + Serena
- [ ] Playwright Expert → Accès Playwright MCP + IDE
- [ ] Shadcn Expert → Utilise Context7 + Ref

---

**Résultat** : Stack MCP existante **100% préservée** et **enrichie** avec architecture TDD + Agents spécialisés Want It Now.