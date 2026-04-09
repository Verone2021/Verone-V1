# Workflow Expert : Comment Font les Meilleurs Développeurs

**Version** : 1.0.0
**Date** : 2026-02-01
**Auteur** : Claude Code (Expert Mentor Mode)

---

## 🎯 Philosophie Expert

### Ce Qui Différencie un Expert d'un Novice

| Novice                                         | Expert                                    |
| ---------------------------------------------- | ----------------------------------------- |
| ❌ Propose "Option 1, 2, 3" face à un problème | ✅ ANALYSE, COMPREND, RÉSOUT              |
| ❌ Contourne les erreurs (as any, --no-verify) | ✅ CORRIGE la cause racine                |
| ❌ Abandonne si ça bloque                      | ✅ INVESTIGUE jusqu'à comprendre          |
| ❌ Trial-and-error sans méthode                | ✅ Documentation-first systématique       |
| ❌ "Je ne sais pas, que faire ?"               | ✅ "Laisse-moi chercher dans les docs"    |
| ❌ Code d'abord, debug après                   | ✅ Comprend d'abord, code après           |
| ❌ Fix symptoms                                | ✅ Fix root cause                         |
| ❌ Improvise un workflow                       | ✅ Suit un workflow éprouvé               |
| ❌ "Ça ne marche pas"                          | ✅ "Erreur ligne X : cause Y, solution Z" |
| ❌ 1 problème = 1 abandon                      | ✅ 1 problème = 1 opportunité d'apprendre |

---

## 📋 Workflow Expert Universel (TEACH-FIRST)

**Ce workflow s'applique à TOUT problème de code.**

### Phase 1 : INVESTIGUER (Documentation-First)

**Règle d'or** : JAMAIS coder avant de comprendre le pattern officiel.

**Actions** :

1. **Identifier le problème précis**
   - Lire TOUTE l'erreur (pas juste la première ligne)
   - Noter le numéro d'erreur (ex: TS2345, ESLint exhaustive-deps)
   - Identifier le fichier + ligne exacte

2. **Chercher documentation officielle** (MCP Context7)

   ```typescript
   // Pattern de recherche
   mcp__context7__resolve -
     library -
     id({
       libraryName: 'react',
       query: 'problème exact + best practices 2026',
     });

   mcp__context7__query -
     docs({
       libraryId: '/websites/react_dev',
       query: 'comment résoudre [problème] pattern officiel',
     });
   ```

3. **Lire TOUS les exemples**
   - Exemples corrects (✅)
   - Anti-patterns (❌)
   - Cas edge
   - Explications "pourquoi"

**Output** : Pattern officiel documenté, compris, ready to apply.

---

### Phase 2 : ANALYSER (Patterns Projet)

**Règle d'or** : S'aligner sur les conventions du projet.

**Actions** :

1. **Chercher patterns existants** (MCP Serena)

   ```typescript
   mcp__serena__search_for_pattern({
     substring_pattern: 'useCallback',
     restrict_search_to_code_files: true,
     paths_include_glob: '**/*.tsx',
   });
   ```

2. **Lire conventions projet**
   - `CLAUDE.md` - Règles comportement
   - `.claude/rules/**/*.md` - Règles spécifiques
   - `.claude/templates/` - Templates recommandés

3. **Identifier divergences**
   - Pattern officiel ≠ Pattern projet ?
   - Quelle version utiliser ?
   - Demander clarification si ambiguë

**Output** : Pattern projet identifié, aligné avec pattern officiel.

---

### Phase 3 : CHALLENGER (Validation Critique)

**Règle d'or** : Un expert CHALLENGE les demandes qui violent les best practices.

**Questions à se poser** :

1. **La demande utilisateur est-elle optimale ?**
   - Ex: User demande "ajoute `as any`" → ❌ Challenge avec alternative typée

2. **Y a-t-il une meilleure solution ?**
   - Ex: User veut `sed` global → ✅ Propose correction intelligente par fichier

3. **Quels sont les risques/trade-offs ?**
   - Ex: Contourner TypeScript = perte de type safety = bugs silencieux en prod

**Si demande sub-optimale** : EXPLIQUER pourquoi + PROPOSER meilleure alternative.

**Exemple** :

```
User: "Ajoute as any pour que ça compile"

Expert: "⚠️ ATTENTION : as any est une anti-pattern.

**Problème** :
- Perd type safety
- Masque bugs potentiels
- Rend code non maintenable

**Meilleure solution** :
1. Identifier type réel dans packages/@verone/types/src/supabase.ts
2. Importer type: `import type { Database } from '@verone/types'`
3. Typer correctement: `Database['public']['Tables']['table']['Insert']`

**Veux-tu que je cherche le bon type ?**
[attend confirmation]
```

---

### Phase 4 : ÉDUQUER (Expliquer Avant Implémenter)

**Règle d'or** : L'utilisateur doit COMPRENDRE le "pourquoi" avant le "comment".

**Template explication** :

```markdown
## Problème Identifié

[Description claire du problème]

## Cause Racine

[Pourquoi ça arrive, pas juste "c'est comme ça"]

## Solutions Possibles

### Option 1 : [Nom]

- ✅ Avantages
- ❌ Inconvénients
- Exemple concret

### Option 2 : [Nom] (RECOMMANDÉE)

- ✅ Avantages
- ❌ Inconvénients
- Exemple concret

## Recommandation Expert

[Quelle option choisir et pourquoi]

## Exemple Dans le Projet

[Code existant qui suit ce pattern]

## Prochaines Étapes

[Ce que je vais faire concrètement]
```

**Output** : Utilisateur comprend le problème + solution + pourquoi.

---

### Phase 5 : ATTENDRE (Confirmation Utilisateur)

**Règle d'or** : Ne JAMAIS implémenter sans validation si approche ambiguë.

**Quand attendre confirmation ?**

- ✅ Plusieurs solutions viables (demander préférence)
- ✅ Trade-offs significatifs (performance vs lisibilité)
- ✅ Changement architectural (impacte plusieurs fichiers)
- ✅ Approche inhabituelle (diverge du pattern projet)

**Quand NE PAS attendre ?**

- ❌ Pattern officiel clair + évident
- ❌ Fix de bug simple (typo, import manquant)
- ❌ User a déjà confirmé l'approche

**Outil** : `AskUserQuestion` pour choix structurés.

---

### Phase 6 : IMPLÉMENTER (Minimum Nécessaire)

**Règle d'or** : Faire le MINIMUM qui résout le problème.

**Principes** :

1. **Pas d'over-engineering**
   - Ne PAS ajouter features non demandées
   - Ne PAS refactorer code adjacent
   - Ne PAS créer abstractions prématurées

2. **Un changement à la fois**
   - Fix 1 erreur → Vérifier → Fix suivante
   - Pas de "tout casser pour tout refaire"

3. **Boy Scout Rule**
   - Fichier doit être PLUS propre après
   - Mais pas au point de devenir méconnaissable

4. **Tests/Vérification continus**
   - Type-check après chaque fix
   - Build régulièrement
   - Self-verify avant commit

**Output** : Code fonctionnel, testé, minimal.

---

## 🛠️ Workflow Spécifique : Erreurs TypeScript

**Scénario** : Après corrections ESLint, `type-check` échoue avec 5 erreurs.

### Approche Novice ❌

```
1. Voir erreurs TypeScript
2. "Je ne sais pas comment corriger"
3. Proposer 3 options :
   - Option 1 : Changer de fichier
   - Option 2 : Utiliser as any
   - Option 3 : Générer types Supabase
4. Attendre que user choisisse
5. Implémenter l'option choisie
```

**Problème** :

- Propose options sans analyser
- Inclut options sub-optimales (as any)
- Délègue responsabilité au user
- N'apprend rien du problème

**Temps** : 30 min de discussion + aucune correction

---

### Approche Expert ✅

```
1. Voir erreurs TypeScript
2. LIRE chaque erreur attentivement
3. IDENTIFIER cause racine :
   - TS2345 ligne 127 : "Property 'name' does not exist"
   - → Colonne 'name' n'existe pas dans DB
4. CHERCHER type Supabase correct :
   - grep "organisations:" packages/@verone/types/src/supabase.ts
   - → Ligne 4828 : Row a 'legal_name', pas 'name'
5. CORRIGER :
   - Interface locale : name → legal_name
   - SELECT query : .select('id, legal_name, type')
   - UI : supplier.name → supplier.legal_name
6. VÉRIFIER :
   - pnpm type-check → 1 erreur en moins ✅
7. RÉPÉTER pour erreurs 2-5
8. COMMIT quand 0 erreurs
```

**Avantages** :

- ✅ Analyse systématique
- ✅ Corrige cause racine
- ✅ Apprend le pattern (types Supabase)
- ✅ Documente si récurrent

**Temps** : 15-20 min pour 5 erreurs corrigées

---

## 📊 Métriques Expert

### Indicateurs de Performance

**Novice** :

- 📉 Trial-and-error ratio : 80% (8 tentatives pour 10 problèmes)
- 📉 Documentation consulted : 10%
- 📉 Root cause fixed : 30%
- 📉 Time to solution : 2-3x plus lent

**Expert** :

- 📈 Documentation-first : 90%
- 📈 Root cause fixed : 95%
- 📈 Pattern reusability : 80% (pattern appris = applicable ailleurs)
- 📈 Time to solution : 2-3x plus rapide

---

## 🎓 Leçons Clés

### 1. "Je Ne Sais Pas" ≠ "Je Ne Peux Pas Savoir"

**Novice** : "Je ne sais pas comment corriger → propose options"

**Expert** : "Je ne sais pas comment corriger → cherche docs → apprend → corrige"

---

### 2. Chaque Problème = Opportunité d'Apprentissage

**Novice** : Fix symptom → passe au suivant

**Expert** : Fix root cause → documente pattern → prochaine fois 10x plus rapide

**Exemple** :

```markdown
# Mémoire créée après 1er problème

# .serena/memories/supabase-organisations-columns.md

Problème rencontré : Column 'name' does not exist
Cause : Table organisations utilise 'legal_name'
Solution : Toujours utiliser legal_name
Fichiers concernés : expense-form.tsx, supplier-list.tsx

→ Prochaine fois : 0 recherche, fix direct en 2 min
```

---

### 3. Documentation-First = 2-3x Plus Rapide

**Temps investissement** :

- 5-10 min : Lire docs officielles
- 2-3 min : Chercher patterns projet
- 5 min : Implémenter correctement du premier coup
- **Total** : 12-18 min

**Vs Trial-and-Error** :

- 2 min : Essayer fix au hasard
- 5 min : Debug pourquoi ça marche pas
- 2 min : Essayer autre fix
- 5 min : Debug à nouveau
- 10 min : Chercher sur StackOverflow
- 5 min : Adapter réponse au projet
- 3 min : Enfin ça marche (peut-être)
- **Total** : 32 min + risque de fix fragile

---

## 🔗 Application Pratique

### Checklist Expert (À Suivre Pour Chaque Problème)

```markdown
- [ ] 1. LIRE l'erreur complète (pas juste 1ère ligne)
- [ ] 2. CHERCHER docs officielles (MCP Context7)
- [ ] 3. LIRE tous exemples + anti-patterns
- [ ] 4. CHERCHER patterns projet (MCP Serena)
- [ ] 5. IDENTIFIER divergences pattern officiel vs projet
- [ ] 6. CHALLENGER si demande user sub-optimale
- [ ] 7. EXPLIQUER problème + solution + pourquoi
- [ ] 8. ATTENDRE confirmation si ambiguë
- [ ] 9. IMPLÉMENTER minimum nécessaire
- [ ] 10. VÉRIFIER après chaque changement
- [ ] 11. DOCUMENTER si pattern récurrent
- [ ] 12. COMMIT quand 100% validé
```

**Temps total** : 15-30 min selon complexité

**Bénéfice** : Solution robuste, apprise, réutilisable

---

## 📖 Références

### Workflows Documentés

- **ESLint Warnings** : `.claude/commands/fix-warnings.md`
- **TypeScript Errors** : `.claude/guides/typescript-errors-debugging.md`
- **Expert Workflow** : `.claude/guides/expert-workflow.md` (ce fichier)

### Outils MCP

- **Context7** : Documentation officielle (React, Next.js, TypeScript, Supabase)
- **Serena** : Exploration code projet, patterns existants
- **Supabase MCP** : Types générés, migrations, queries

### Best Practices Sources

- [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Addy Osmani 2026 Workflow](https://addyosmani.com/blog/ai-coding-workflow/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

## 💡 Citation Inspirante

> **"Do not jump into implementation or change files unless clearly instructed to make changes. When the user's intent is ambiguous, default to providing information, doing research, and providing recommendations rather than taking action."**
>
> — Anthropic Documentation

**Traduction Expert** :

- ✅ Recherche D'ABORD
- ✅ Comprends le problème
- ✅ Propose la MEILLEURE solution
- ✅ Explique POURQUOI
- ✅ Implémente APRÈS validation

**PAS** :

- ❌ Code immédiatement
- ❌ Propose 3 options au hasard
- ❌ Attend que user devine la solution
- ❌ Fix symptoms sans comprendre cause

---

**Auteur** : Claude Code (Expert Mentor Mode)
**Dernière mise à jour** : 2026-02-01
**Philosophie** : Un expert RÉSOUT les problèmes, ne les CONTOURNE pas.
