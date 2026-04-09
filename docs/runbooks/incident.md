---
name: senior-stabilization-protocol
description: 🚑 Protocol d'urgence 2025 pour stabiliser le projet après chaos migration. Feature Freeze, Audit Triggers, Isolation bugs.
model: sonnet
color: red
---

# 🚨 PROTOCOL ACTIVÉ

**Feature Bloquée** : $ARGUMENTS

You are now operating under the **Senior Developer Stabilization Protocol (2025)**.
Your goal is NOT to code features. Your goal is to **STOP the bleeding** and **RESTORE structural integrity**.

---

## 🛠️ TOOLKIT REQUIS

- **Database** (via psql/Supabase CLI):
  - `psql "${DATABASE_URL}" -c "SELECT ..."` : Requêtes SQL inspection
  - `supabase db diff` : Vérifier migrations/drift
- **playwright** (MCP configuré):
  - `mcp__playwright-lane-1__browser_console_messages`: Capturer erreurs console
  - `mcp__playwright-lane-1__browser_navigate`: Tester pages

> **Note :** Une seule session peut lancer `pnpm dev`. Ne JAMAIS relancer dev/build.

---

# 🚨 PHASE 0: THE FEATURE FREEZE (Containment)

**AVANT TOUTE INTERVENTION** :

```bash
git stash -m "WIP before stabilization protocol"
```

Ceci permet de restaurer l'état si nécessaire.

**IMMEDIATE ACTION:**
We are declaring a **FEATURE FREEZE** on the following stable domains to prevent regression. You are strictly FORBIDDEN from modifying logic in these areas unless explicitly authorized for a hotfix.

| Domain Status                                     | Risk Level         | Action                                                 |
| :------------------------------------------------ | :----------------- | :----------------------------------------------------- |
| **Identity/Profile** (`profile`, `auth`)          | 🧊 FROZEN          | **Read-Only**. No modifications allowed.               |
| **Organization** (`suppliers`, `clients`)         | 🧊 FROZEN          | **Read-Only**. No modifications allowed.               |
| **Product Catalog** (`variants`, `details`)       | 🧊 FROZEN          | **Read-Only**. No modifications allowed.               |
| **Core Business** (`orders`, `stock`, `triggers`) | 🔥 **ACTIVE FIRE** | **Debug-Only**. This is the only authorized work zone. |

**Command to Agent:**

> "I acknowledge the Feature Freeze. I will focus exclusively on the 'Core Business' domain (Orders/Stock/Triggers) and will not touch Profile, Organization, or Catalog code without express permission."

---

# 🏥 PHASE 1: THE STRUCTURAL HEALTH CHECK

Before fixing any specific bug, we must ensure the map (TypeScript) matches the territory (Database).

## Step 1.1: Type Consistency Audit

**Agent:** `verone-debug-investigator`
**Action:**

1.  Run `npm run type-check` (or equivalent) to capture all static errors.
2.  **CRITICAL:** Use MCP `supabase` to inspect the _LIVE_ database schema for the `orders` and `stock_movements` tables.
3.  Compare strictly with `packages/@verone/types/src/supabase.ts`.
4.  **Report:** List every column where the TypeScript type does not match the Database column (e.g., `string` vs `jsonb`, `nullable` mismatch).

## Step 1.2: Migration Reality Check

**Agent:** `database-architect`
**Action:**

1.  Read the local migration files in `supabase/migrations`.
2.  Compare against the actual `information_schema` on the remote DB.
3.  **Report:** Are there manual changes in the DB that are missing from the migration files?

---

# 🕵️ PHASE 2: TRIGGER ISOLATION (The "Black Box" Audit)

We suspect a trigger chain reaction is blocking critical writes (e.g., Supplier Orders).

## Step 2.1: The Chain of Events Map

**Agent:** `database-architect`
**Action:**

1.  Identify the target table (e.g., `supplier_orders`).
2.  List ALL triggers on this table via SQL:
    ```sql
    SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'supplier_orders';
    ```
3.  **Deep Dive:** For each trigger found, analyze if it updates another table (e.g., `stock_movements`) which _also_ has a trigger.
4.  **Detect Infinite Loops:** Flag any recursive logic (A updates B, B updates A).

## Step 2.2: The "Rename-to-Disable" Strategy

**Agent:** `database-architect`
**Action:**
Instead of deleting triggers, we disable them temporarily to isolate the fault.

1.  **Target:** The most suspicious trigger (e.g., `update_stock_alert`).
2.  **Action:** Propose SQL to rename it: `ALTER TRIGGER "trigger_name" ON "table" RENAME TO "DISABLED_trigger_name";`
3.  **Test:** Ask user to retry the blocked action.
    - _If works:_ The trigger code is the bug.
    - _If fails:_ The bug is upstream (RLS/Zod).

---

# 🔬 PHASE 3: SCIENTIFIC OBSERVABILITY (Fixing the Eyes)

We cannot fix what we cannot see. We must stop debugging symptoms and start logging causes.

## Step 3.1: The "Zod" Trap Check

**Agent:** `verone-debug-investigator`
**Action:**

1.  Locate the Server Action handling the failed request.
2.  **Code Injection:** Ensure Zod parsing errors are logged explicitly.
    ```typescript
    const result = schema.safeParse(data);
    if (!result.success) {
      console.error(
        '🚨 ZOD VALIDATION FAILED:',
        JSON.stringify(result.error.format(), null, 2)
      );
      // ... return error
    }
    ```

## Step 3.2: The "Swallowed Error" Check

**Agent:** `verone-debug-investigator`
**Action:**

1.  Scan for `try/catch` blocks in the relevant Server Action.
2.  **Fix:** Ensure `console.error(error)` is present in the `catch` block.
    - _Bad:_ `catch (e) { return { error: "Error" } }`
    - _Good:_ `catch (e) { console.error("🔥 CRITICAL DB ERROR:", e); return { error: "Database failure" } }`

---

# 🟢 PHASE 4: UNFREEZE (Retour à la Normale)

**Quand activer** : Le bug est corrigé et validé.

## Step 4.1: Validation Complète

**Agent:** `verone-debug-investigator`
**Action:**

1.  `npm run type-check` → 0 erreurs
2.  `npm run build` → Build réussi
3.  Test manuel de la feature réparée via Playwright

## Step 4.2: Levée du Gel

**Dire à Claude** :

> "Le bug est corrigé. Protocole de gel levé. On reprend le travail normal."

## Step 4.3: Checkpoint Git

```bash
git add .
git commit -m "fix(core): [Description du fix]

🤖 Generated with Claude Code"
```

**Note** : Le gel est **contextuel à la session**. Une nouvelle conversation = gel automatiquement levé.

---

# 🚀 UTILISATION

**Invocation** : `/senior-stabilization-protocol [feature bloquée]`

**Exemple** :

```
/senior-stabilization-protocol Ajout commande fournisseur bloquée
```

**Workflow** : Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 (UNFREEZE)
