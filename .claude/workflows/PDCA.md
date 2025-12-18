# Workflow P.D.C.A. (Plan-Do-Check-Act)

Methode de Deming adaptee aux agents IA. Valider chaque etape avec **PREUVES TECHNIQUES**.

---

## Phase 1 : PLAN (Analyse)

**Avant de toucher au code de production.**

1. **Audit existant** : Lire fichiers concernes (`apps/`, `packages/@verone/`)
2. **Comprendre contexte** : Consulter documentation si necessaire
3. **Proposer strategie** : Expliquer approche technique
4. **Capturer etat initial** :

```typescript
mcp__playwright__browser_navigate('http://localhost:3000/[page]');
mcp__playwright__browser_console_messages();
```

**Livrable** : Description probleme + approche proposee + etat initial

---

## Phase 2 : DO (Implementation)

**Execution de la solution.**

1. Code MINIMAL pour resoudre le probleme
2. Types TypeScript stricts (jamais de `any`)
3. Respecter architecture Turborepo (@verone/*)
4. Migration SQL idempotente si DB (APRES avoir teste le code)

**Livrable** : Code modifie/cree

---

## Phase 3 : CHECK (Verification)

**Le moment de verite - PREUVES OBLIGATOIRES.**

### 1. Console check

```typescript
mcp__playwright__browser_navigate('http://localhost:3000/[page]');
mcp__playwright__browser_console_messages();
```

→ **AFFICHER LE RESULTAT** (doit etre 0 erreurs)

### 2. Type check

```bash
npm run type-check
```

→ **AFFICHER LE RESULTAT** (doit etre 0 erreurs)

### 3. Build check

```bash
npm run build
```

→ **AFFICHER "Build succeeded"** ou l'erreur

**Livrable** : Logs prouvant console=0 errors + build=passe

---

## Phase 4 : ACT (Decision)

### Si CHECK = KO (Echec)

- **STOP** : Ne PAS demander de commit
- **BOUCLE REFLEXION** :
  1. Analyser l'erreur
  2. Corriger le code (retour a DO)
  3. Re-verifier (retour a CHECK)
- Iterer **au moins 2 fois** avant de demander de l'aide
- **Preuve** : Afficher chaque tentative et son resultat

### Si CHECK = OK (Succes)

- **Finalisation** : Creer migrations DB definitives (si necessaire)
- **Nettoyage** : Supprimer fichiers temporaires
- **Resume** :

```
PDCA COMPLET

PLAN : [description du probleme]
DO : [fichiers modifies]
CHECK :
   - Console errors : 0
   - Type-check : PASSE
   - Build : PASSE

Voulez-vous que je commit et push maintenant ?
```

- **ATTENDRE** reponse EXPLICITE avant commit

---

## Checklist Preuves Techniques

| Phase | Preuve Requise | Commande |
|-------|----------------|----------|
| PLAN | Etat initial capture | `browser_console_messages()` |
| CHECK | Console = 0 errors | `browser_console_messages()` |
| CHECK | Types valides | `npm run type-check` |
| CHECK | Build passe | `npm run build` |

---

## Comportements INTERDITS

- Dire "J'ai verifie" sans log dans la reponse
- Passer a ACT(commit) si CHECK a des erreurs
- Ignorer erreurs console "non-bloquantes"
- Creer migration DB sans avoir teste le code d'abord
- Supposer que "ca devrait marcher" sans preuve
- Demander de l'aide avant d'avoir itere 2 fois

---

## Exemple Boucle Reflexion

```
[CHECK #1] Console: 1 error "Cannot read property 'x' of undefined"
→ Analyse : Variable non initialisee ligne 42
→ [DO] Correction : Ajout de verification null
→ [CHECK #2] Console: 0 errors, Type-check: OK, Build: OK
→ [ACT] Succes ! Presenter resume au user.
```
