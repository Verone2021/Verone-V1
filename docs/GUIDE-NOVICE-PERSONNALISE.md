# 🎓 GUIDE NOVICE PERSONNALISÉ - Vérone Back-Office

**Public** : Développeur novice Romeo Dos Santos
**Objectif** : Autonomie complète pour continuer le projet
**Approche** : Templates pratiques + Exemples concrets

---

## 📖 TABLE DES MATIÈRES

1. [Vocabulaire Simplifié](#vocabulaire-simplifié)
2. [Templates Communication](#templates-communication)
3. [Exemples Concrets](#exemples-concrets)
4. [Checklist Avant Demander Aide](#checklist-avant-demander-aide)
5. [Erreurs Fréquentes](#erreurs-fréquentes)

---

## 📚 VOCABULAIRE SIMPLIFIÉ

### Architecture

**Monorepo** : Un seul repository Git contenant plusieurs packages (mini-projets)

- **Exemple Vérone** : `packages/@verone/ui`, `packages/@verone/utils`, etc.
- **Avantage** : Partager code entre back-office et website facilement

**Workspace** : Package interne dans le monorepo

- **pnpm** gère les dépendances entre workspaces
- **Protocole** : `workspace:*` = version locale (pas npm registry)

**Turborepo** : Outil pour gérer plusieurs apps dans même monorepo

- **Apps** : Projets complets (back-office, website, affiliation)
- **Packages** : Code partagé (`@verone/*`)

### Composants UI

**CVA (Class Variance Authority)** : Bibliothèque pour gérer variants de composants

- **Variants** : Versions différentes d'un composant (ex: button primary, secondary, destructive)
- **Type-safe** : TypeScript empêche erreurs de typage

**Radix UI** : Bibliothèque de composants accessibles sans style

- **Primitives** : Composants de base (Dialog, Popover, Select)
- **Headless** : Pas de style par défaut, on ajoute Tailwind CSS

**Design Tokens** : Variables de design réutilisables

- **Exemples** : Couleurs (primary, success, danger), Espacements (4px, 8px, 16px)
- **Fichiers** : `packages/@verone/ui/src/design-system/tokens/`

**Props** : Paramètres qu'on passe à un composant React

```typescript
// Exemple
<ButtonUnified
  variant="primary"    // ← Prop variant
  size="lg"            // ← Prop size
  loading={isLoading}  // ← Prop loading
>
  Enregistrer
</ButtonUnified>
```

### TypeScript

**Interface** : Définition de structure d'objet TypeScript

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary'; // Valeurs autorisées
  size?: 'sm' | 'md' | 'lg'; // ? = optionnel
  onClick: () => void; // Fonction
}
```

**Type** : Similaire à interface, mais pour types simples

```typescript
type Variant = 'primary' | 'secondary' | 'destructive';
```

**VariantProps** : Type généré automatiquement par CVA

```typescript
import { type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('base-class', { variants: {...} });
type ButtonVariantProps = VariantProps<typeof buttonVariants>;
// → Extrait automatiquement : { variant?: ..., size?: ... }
```

### Git & Workflow

**Branch** : Version parallèle du code

- `main` : Version principale (développement)
- `feature/nom` : Nouvelle fonctionnalité
- `fix/nom` : Correction bug

**Commit** : Enregistrement de modifications

- **Format Vérone** : `feat(module): Description`
- **Exemples** : `feat(ui): Add BadgeUnified component`, `fix(auth): Resolve login error`

**Push** : Envoyer commits vers GitHub

- **Commande** : `git push origin main`

**PR (Pull Request)** : Demande de fusion de code

- **Workflow** : branch feature → PR → Review → Merge main

---

## 💬 TEMPLATES COMMUNICATION

### 1. Créer Nouveau Composant UI

**Template** :

```
Je veux créer un composant [NOM_COMPOSANT]Unified.

**Contexte** :
- Inspiré de : [COMPOSANT_EXISTANT ou shadcn/ui]
- Utilisation : [OÙ dans l'app]

**Variants souhaités** : [LISTE variants]
- Exemple : primary, secondary, destructive

**Props principaux** : [LISTE props]
- Exemple : variant, size, icon, loading

**Références** :
- Pattern à suivre : ButtonUnified.tsx
- Design tokens : Utiliser existants
```

**Exemple Concret** :

```
Je veux créer un composant BadgeUnified.

**Contexte** :
- Inspiré de : Badge shadcn/ui actuel
- Utilisation : Étiquettes statut (produits, commandes, utilisateurs)

**Variants souhaités** : 10 variants
- default, secondary, destructive, outline
- success, warning, info
- customer, supplier, partner

**Props principaux** :
- variant : Type de badge
- size : sm, md, lg
- icon : Lucide icon (optionnel)
- dot : Afficher point coloré (optionnel)
- removable : Afficher croix fermeture (optionnel)

**Références** :
- Pattern à suivre : ButtonUnified.tsx
- Design tokens : colors.ts (primary, success, warning, etc.)
```

---

### 2. Modifier Composant Existant

**Template** :

```
Je veux modifier le composant [NOM_COMPOSANT].

**Fichier** : [CHEMIN_FICHIER]

**Modifications souhaitées** :
1. [Modification 1]
2. [Modification 2]

**Raison** : [POURQUOI cette modification]

**Impact** : [Fichiers potentiellement affectés]
```

**Exemple Concret** :

```
Je veux modifier le composant ButtonUnified.

**Fichier** : packages/@verone/ui/apps/back-office/src/components/ui/button-unified.tsx

**Modifications souhaitées** :
1. Ajouter variant "success" (vert)
2. Ajouter prop "fullWidth" pour prendre 100% largeur
3. Ajouter animation hover plus smooth

**Raison** :
- Boutons de validation nécessitent couleur verte
- Formulaires mobiles nécessitent boutons full-width
- UX plus moderne avec animations

**Impact** :
- ~15 fichiers utilisent ButtonUnified
- Besoin tester pages : dashboard, produits, commandes
```

---

### 3. Déboguer Erreur Console

**Template** :

```
J'ai une erreur console sur la page [NOM_PAGE].

**URL** : [URL localhost ou production]

**Message d'erreur** :
[COPIER message COMPLET]

**Quand ça arrive** :
- [Action qui déclenche erreur]
- Exemple : "Quand je clique sur bouton Enregistrer"

**Ce que j'ai déjà essayé** :
1. [Tentative 1]
2. [Tentative 2]
```

**Exemple Concret** :

```
J'ai une erreur console sur la page Produits.

**URL** : http://localhost:3000/produits/catalogue

**Message d'erreur** :
"TypeError: Cannot read properties of undefined (reading 'name')
  at ProductCard.tsx:45"

**Quand ça arrive** :
- Dès que la page charge
- Seulement quand il y a plus de 10 produits
- Pas d'erreur avec 5 produits

**Ce que j'ai déjà essayé** :
1. Vérifié que données existent (console.log)
2. Rechargé page (Cmd+R)
3. Vidé cache navigateur
```

---

### 4. Ajouter Nouvelle Fonctionnalité

**Template** :

```
Je veux ajouter la fonctionnalité [NOM_FEATURE].

**Module concerné** : [Module du back-office]

**Description** :
[Ce que doit faire la fonctionnalité en 2-3 phrases]

**User Story** :
"En tant que [ROLE], je veux [ACTION] afin de [OBJECTIF]"

**Acceptance Criteria** :
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3

**Questions** :
- [Question 1 si incertitude]
```

**Exemple Concret** :

```
Je veux ajouter la fonctionnalité "Export Excel produits".

**Module concerné** : Produits / Catalogue

**Description** :
Permettre d'exporter la liste des produits affichés (avec filtres actifs)
vers un fichier Excel téléchargeable. Inclure colonnes : nom, référence,
prix, stock, catégorie.

**User Story** :
"En tant que gestionnaire catalogue, je veux exporter les produits filtrés
en Excel afin de les analyser dans des tableaux croisés dynamiques externes."

**Acceptance Criteria** :
- [ ] Bouton "Exporter Excel" visible sur page catalogue
- [ ] Export respecte filtres actifs (catégorie, recherche, etc.)
- [ ] Fichier téléchargé format .xlsx
- [ ] Colonnes : nom, référence, prix, stock, catégorie, date création
- [ ] Performance : <5s pour 1000 produits

**Questions** :
- Faut-il inclure images produits dans Excel ?
- Limite maximale de produits exportables ?
```

---

### 5. Résoudre Erreur TypeScript

**Template** :

````
J'ai une erreur TypeScript.

**Fichier** : [CHEMIN_FICHIER:LIGNE]

**Code erreur** : [EX: TS2322, TS2345]

**Message** :
[COPIER message COMPLET]

**Code concerné** :
```typescript
[COPIER 5-10 lignes de code autour de l'erreur]
````

**Ce que j'ai essayé** :

1. [Tentative 1]

```

**Exemple Concret** :
```

J'ai une erreur TypeScript.

**Fichier** : apps/back-office/src/app/produits/catalogue/page.tsx:89

**Code erreur** : TS2322

**Message** :
"Type 'string | undefined' is not assignable to type 'string'.
Type 'undefined' is not assignable to type 'string'."

**Code concerné** :

```typescript
// Ligne 85-95
const product = await getProduct(productId);

return (
  <ProductCard
    title={product.name}       // ← Ligne 89 : Erreur ici
    price={product.price}
    image={product.image_url}
  />
);
```

**Ce que j'ai essayé** :

1. Ajouté optional chaining : `product?.name` → Même erreur
2. Vérifié interface Product → name est bien string
3. console.log(product) → name existe et est string

```

---

### 6. Demander Review Avant Commit

**Template** :
```

Je vais commiter les modifications suivantes.

**Fichiers modifiés** : [NOMBRE fichiers]

- [Liste 5-10 fichiers principaux]

**Résumé modifications** :
[Description concise en 2-3 lignes]

**Tests effectués** :

- [ ] Type-check : 0 erreurs
- [ ] Build : Success
- [ ] MCP Browser console : 0 errors
- [ ] Pages testées : [LISTE]

**Prêt à commit ?**

```

**Exemple Concret** :
```

Je vais commiter les modifications suivantes.

**Fichiers modifiés** : 8 fichiers

- packages/@verone/ui/apps/back-office/src/components/ui/badge-unified.tsx (nouveau)
- packages/@verone/ui/apps/back-office/src/components/ui/badge-unified.stories.tsx (nouveau)
- packages/@verone/ui/src/index.ts (ajout export BadgeUnified)
- apps/back-office/src/app/produits/catalogue/page.tsx (utilise BadgeUnified)
- apps/back-office/src/app/commandes/fournisseurs/page.tsx (utilise BadgeUnified)
- apps/back-office/src/app/dashboard/page.tsx (utilise BadgeUnified)

**Résumé modifications** :
Création composant BadgeUnified avec 10 variants (default, success, warning,
destructive, etc.). Remplacement de 15 instances de Badge legacy par BadgeUnified
dans 3 pages principales.

**Tests effectués** :

- [x] Type-check : 0 erreurs
- [x] Build : Success (16.2s)
- [x] MCP Browser console : 0 errors
- [x] Pages testées : Dashboard, Produits, Commandes fournisseurs
- [x] Screenshot avant/après : Visuellement identique

**Prêt à commit ?**

```

---

### 7. Setup Environnement (Turborepo Multi-Apps)

**Template** :
```

Je veux setup [NOM_CONFIG].

**Objectif** : [Ce que je veux accomplir]

**Étape actuelle** : [Où j'en suis]

**Documentation consultée** : [Liens ou fichiers lus]

**Questions** :

1. [Question précise 1]
2. [Question précise 2]

```

**Exemple Concret** :
```

Je veux setup Turborepo pour gérer back-office + website.

**Objectif** :
Préparer architecture monorepo avec 2 apps distinctes (back-office et website)
partageant les packages @verone/\*. Chaque app doit pouvoir être déployée
indépendamment sur Vercel.

**Étape actuelle** :
J'ai lu la documentation Turborepo basics. J'ai compris le concept de
`turbo.json` et pipelines. Pas encore commencé modifications repo.

**Documentation consultée** :

- https://turbo.build/repo/docs/getting-started
- docs/ROADMAP-DEVELOPPEMENT.md (Phase 3)

**Questions** :

1. Faut-il créer dossier `apps/` maintenant ou attendre que back-office soit 100% terminé ?
2. Est-ce que les packages @verone/\* actuels restent où ils sont ?
3. Comment gérer les env variables (.env.local) avec 2 apps ?
4. Vercel va détecter automatiquement les 2 apps ou faut-il config manuelle ?

```

---

## 🎯 EXEMPLES CONCRETS

### Exemple 1 : Développer Composant Nouveau

**Situation** : Je veux créer InputUnified

**Ma demande à Claude Code** :
```

Je veux créer un composant InputUnified.

**Contexte** :

- Inspiré de : Input shadcn/ui actuel
- Utilisation : Tous formulaires (produits, commandes, contacts)

**Variants souhaités** : 4 variants

- default (border classique)
- filled (background gris)
- outlined (border épaisse)
- underlined (bordure uniquement en bas)

**Props principaux** :

- variant : Type d'input
- size : sm, md, lg
- icon : Lucide icon à gauche (optionnel)
- error : Message erreur (string optionnel)
- helper : Texte aide (string optionnel)
- disabled : Désactiver input

**États à gérer** :

- Focus (border bleue)
- Error (border rouge + texte erreur)
- Disabled (opacity réduite)

**Références** :

- Pattern à suivre : ButtonUnified.tsx
- Design tokens : colors.ts, spacing.ts
- Composant actuel : apps/back-office/src/components/ui/input.tsx

Merci de :

1. Créer packages/@verone/ui/apps/back-office/src/components/ui/input-unified.tsx
2. Créer Story Storybook
3. Ajouter export dans packages/@verone/ui/src/index.ts
4. Me donner exemple d'utilisation dans formulaire

```

**Ce que Claude Code fait** :
1. Utilise Sequential Thinking pour planifier
2. Lit ButtonUnified.tsx comme référence
3. Crée InputUnified.tsx avec CVA + variants
4. Crée Story Storybook avec tous variants
5. Teste console = 0 errors
6. Me donne exemple concret d'utilisation

---

### Exemple 2 : Déboguer Page Lente

**Situation** : Page Produits charge en 8 secondes (SLO = 3s)

**Ma demande à Claude Code** :
```

La page Produits est très lente.

**URL** : http://localhost:3000/produits/catalogue

**Performance actuelle** :

- Temps chargement : ~8 secondes
- SLO attendu : <3 secondes

**Comportement observé** :

- Loader affiche pendant 6-7 secondes
- Puis produits apparaissent tous d'un coup (pas progressif)
- Console : Pas d'erreurs
- Navigateur : Chrome, pas de throttling activé

**Données** :

- Environ 500 produits dans la base
- Chaque produit a 3-5 images
- Filtres : Catégorie, recherche texte, fourchette prix

**Ce que j'ai déjà vérifié** :

1. Query Supabase : Prend ~2s (vu dans Network tab)
2. Images : Utilise déjà next/image
3. Type-check : 0 erreurs
4. Build : Success

**Questions** :

- Faut-il ajouter pagination ?
- Faut-il lazy-load images ?
- Y a-t-il un bottleneck côté serveur ?

Merci d'investiguer avec MCP Playwright Browser et me proposer solutions.

```

**Ce que Claude Code fait** :
1. MCP Playwright Browser → Mesure performance réelle
2. Analyse query Supabase (peut-être SELECT * au lieu de colonnes spécifiques)
3. Vérifie si re-renders inutiles (React DevTools)
4. Propose 3-5 optimisations concrètes avec code
5. Implémente la plus critique (ex: pagination)
6. Re-teste performance
7. Me montre avant/après (8s → 2.1s)

---

### Exemple 3 : Intégrer Composant dans Page

**Situation** : Je veux utiliser BadgeUnified dans page Commandes

**Ma demande à Claude Code** :
```

Je veux remplacer les badges actuels par BadgeUnified dans la page Commandes Fournisseurs.

**Fichier** : apps/back-office/src/app/commandes/fournisseurs/page.tsx

**Remplacements souhaités** :

1. Badge statut commande (En attente, Validée, Livrée, Annulée)
   - En attente → variant "warning"
   - Validée → variant "info"
   - Livrée → variant "success"
   - Annulée → variant "destructive"

2. Badge fournisseur
   - Variant "supplier" (nouveau variant à créer si n'existe pas)

**Contraintes** :

- Ne pas casser fonctionnalités existantes
- Respecter design actuel visuellement
- Console = 0 errors après modification

**Tests à faire** :

- Affichage correct des 4 statuts
- Responsive mobile (badges pas trop larges)
- Pas de régression autres pages

Merci de me montrer le diff avant/après et valider avec MCP Browser.

```

**Ce que Claude Code fait** :
1. Lit fichier page.tsx actuel
2. Identifie tous usages Badge legacy
3. Vérifie que variants nécessaires existent dans BadgeUnified
4. Si manquant : Propose d'ajouter variant "supplier"
5. Fait remplacement avec imports corrects
6. Teste page avec MCP Browser
7. Vérifie console = 0 errors
8. Me montre screenshot avant/après
9. Propose commit message structuré

---

### Exemple 4 : Préparer Commit Propre

**Situation** : J'ai travaillé 3 heures, modifié 15 fichiers, prêt à commiter

**Ma demande à Claude Code** :
```

Je suis prêt à commiter mes modifications.

**Contexte travail** :

- Durée session : 3 heures
- Fichiers modifiés : ~15
- Feature : Création BadgeUnified + intégration 3 pages

**Ce que j'ai fait** :

1. Créé BadgeUnified.tsx (10 variants)
2. Créé Story Storybook
3. Remplacé Badge legacy dans Dashboard
4. Remplacé Badge legacy dans Produits
5. Remplacé Badge legacy dans Commandes
6. Ajouté types TypeScript stricts
7. Tests manuels (console = 0 errors)

**Validation effectuée** :

- [x] Type-check : 0 erreurs
- [x] Build : Success
- [x] npm run lint : Pas d'erreurs bloquantes
- [x] MCP Browser : 0 console errors sur 3 pages testées
- [x] Screenshot avant/après : OK

**Prêt pour commit et push ?**

Merci de :

1. Vérifier que j'ai rien oublié
2. Me proposer message commit structuré
3. Valider que pre-commit hooks vont passer
4. Commiter et pusher si tout OK

```

**Ce que Claude Code fait** :
1. `git status` → Vérifie fichiers modifiés
2. `git diff` → Review changements
3. Identifie si modifications groupables (ex: création composant = 1 commit)
4. Propose commit message conventionnel :
```

feat(ui): Add BadgeUnified component with 10 variants

- Created BadgeUnified.tsx with CVA variants
- Added Storybook story with all variants
- Replaced Badge legacy in Dashboard, Products, Orders
- Added TypeScript strict types
- Tests: Console 0 errors, Build success

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>

```
5. Exécute pre-commit hooks (simulation)
6. Si OK → Commit + Push
7. Me confirme SHA commit et me donne lien GitHub

---

### Exemple 5 : Apprendre Nouveau Concept

**Situation** : Je ne comprends pas "Server Actions" Next.js

**Ma demande à Claude Code** :
```

Je ne comprends pas les Server Actions Next.js.

**Contexte** :
J'ai lu la doc officielle mais c'est trop technique. J'ai besoin d'explication
simple avec exemple concret Vérone.

**Ce que je sais déjà** :

- React components basiques (useState, useEffect)
- API routes classiques (/api/products)
- Fetch data côté client

**Ce que je ne comprends PAS** :

- Pourquoi utiliser Server Actions au lieu d'API routes ?
- Comment ça marche concrètement (code traverse serveur/client comment ?)
- Quand les utiliser dans Vérone ?

**Exemple concret souhaité** :
Créer/modifier un produit dans notre catalogue. Montre-moi :

1. Version AVANT (API route classique)
2. Version APRÈS (Server Action)
3. Avantages concrets pour Vérone

Explique comme si j'avais 10 ans (mais qui code).

````

**Ce que Claude Code fait** :
1. Explication ultra-simplifiée avec métaphore
2. Montre code AVANT (API route) :
   ```typescript
   // API Route classique
   // File: app/api/products/route.ts
   export async function POST(request: Request) {
     const body = await request.json();
     const product = await createProduct(body);
     return Response.json(product);
   }

   // Côté client
   const handleSubmit = async (data) => {
     const res = await fetch('/api/products', {
       method: 'POST',
       body: JSON.stringify(data)
     });
     const product = await res.json();
   }
````

3. Montre code APRÈS (Server Action) :

   ```typescript
   // Server Action
   // File: app/actions/products.ts
   'use server';
   export async function createProduct(data: FormData) {
     const product = await db.products.create({...});
     revalidatePath('/produits');
     return product;
   }

   // Côté client (BEAUCOUP plus simple)
   <form action={createProduct}>
     <input name="name" />
     <button type="submit">Créer</button>
   </form>
   ```

4. Liste 5 avantages concrets Vérone
5. Me dit quand utiliser quoi (règle simple)
6. Me montre fichier existant qui utilise Server Actions

---

## ✅ CHECKLIST AVANT DEMANDER AIDE

### Erreur Console

Avant de demander aide pour une erreur console, j'ai vérifié :

- [ ] **J'ai copié le message d'erreur COMPLET** (pas juste première ligne)
- [ ] **J'ai noté l'URL exacte** où l'erreur apparaît
- [ ] **J'ai identifié l'action déclenchante** (clic, scroll, load, etc.)
- [ ] **J'ai vérifié Browser Dev Tools** → Tab Console
- [ ] **J'ai testé dans navigateur différent** (Chrome vs Firefox)
- [ ] **J'ai vidé cache** (Cmd+Shift+R ou Ctrl+Shift+R)
- [ ] **J'ai relu mon code récent** (dernières modifications)

### Erreur TypeScript

Avant de demander aide pour erreur TypeScript, j'ai vérifié :

- [ ] **J'ai copié le code erreur** (ex: TS2322, TS2345)
- [ ] **J'ai copié 5-10 lignes de code** autour de l'erreur
- [ ] **J'ai exécuté `npm run type-check`** pour voir toutes erreurs
- [ ] **J'ai vérifié les imports** (chemin correct, package existe)
- [ ] **J'ai vérifié les types** (interface correspond à usage)
- [ ] **J'ai tenté optional chaining** (?. ou ??)
- [ ] **J'ai lu message d'erreur EN ENTIER** (souvent solution à la fin)

### Build Échoue

Avant de demander aide pour build qui échoue, j'ai vérifié :

- [ ] **J'ai copié les 10-20 dernières lignes** de sortie build
- [ ] **J'ai exécuté `npm run type-check`** (erreurs TypeScript ?)
- [ ] **J'ai exécuté `npm run lint`** (erreurs ESLint ?)
- [ ] **J'ai vérifié dépendances** (`pnpm install` à jour ?)
- [ ] **J'ai vérifié fichiers modifiés** (`git status`)
- [ ] **J'ai testé `npm run dev`** (dev fonctionne ?)
- [ ] **J'ai supprimé `.next/`** et retenté (`rm -rf .next`)

### Performance Lente

Avant de demander aide pour performance lente, j'ai vérifié :

- [ ] **J'ai mesuré temps exact** (Network tab, Lighthouse)
- [ ] **J'ai identifié étape lente** (query DB ? render ? images ?)
- [ ] **J'ai vérifié taille données** (combien rows, combien images ?)
- [ ] **J'ai testé avec données réduites** (10 items vs 1000)
- [ ] **J'ai vérifié console errors** (peut ralentir page)
- [ ] **J'ai testé mode Incognito** (pas d'extensions)
- [ ] **J'ai vérifié Network throttling** (pas en "Slow 3G")

### Composant Ne S'affiche Pas

Avant de demander aide pour composant invisible, j'ai vérifié :

- [ ] **J'ai vérifié import** (chemin correct, package existe)
- [ ] **J'ai vérifié export** (composant bien exporté dans index.ts)
- [ ] **J'ai vérifié props** (tous props requis passés)
- [ ] **J'ai vérifié console errors** (erreur React ?)
- [ ] **J'ai vérifié styles** (display: none ? opacity: 0 ?)
- [ ] **J'ai inspecté DOM** (élément existe dans HTML ?)
- [ ] **J'ai testé console.log** (composant se monte ?)

---

## 🚨 ERREURS FRÉQUENTES

### Erreur 1 : Import Introuvable

**Message** :

```
Module not found: Can't resolve '@verone/ui'
```

**Cause** : Package workspace pas installé ou mal configuré

**Solutions** :

```bash
# 1. Réinstaller dépendances
pnpm install

# 2. Vérifier package existe
ls packages/@verone/ui

# 3. Vérifier exports dans package.json
cat packages/@verone/ui/package.json | grep exports

# 4. Clear cache Next.js
rm -rf .next
npm run dev
```

---

### Erreur 2 : Type 'X' is not assignable to type 'Y'

**Message** :

```
TS2322: Type 'string | undefined' is not assignable to type 'string'
```

**Cause** : Valeur peut être undefined, mais type attend valeur garantie

**Solutions** :

```typescript
// ❌ AVANT (erreur)
const name: string = product.name; // product.name peut être undefined

// ✅ APRÈS (solution 1 : optional chaining + default)
const name: string = product?.name ?? 'Sans nom';

// ✅ APRÈS (solution 2 : type guard)
if (product?.name) {
  const name: string = product.name; // TypeScript sait que name existe
}

// ✅ APRÈS (solution 3 : type assertion si certain)
const name: string = product.name!; // ! = "je suis certain que ça existe"
```

---

### Erreur 3 : Hydration Failed

**Message** :

```
Error: Hydration failed because the initial UI does not match
what was rendered on the server.
```

**Cause** : HTML serveur ≠ HTML client (souvent Date.now(), random(), localStorage)

**Solutions** :

```typescript
// ❌ AVANT (erreur)
export function Component() {
  return <div>{Date.now()}</div>;  // Serveur = 1000, Client = 1001 → Erreur
}

// ✅ APRÈS (solution : useEffect)
export function Component() {
  const [timestamp, setTimestamp] = useState<number | null>(null);

  useEffect(() => {
    setTimestamp(Date.now());  // Execute seulement côté client
  }, []);

  if (!timestamp) return <div>Loading...</div>;
  return <div>{timestamp}</div>;
}
```

---

### Erreur 4 : Too Many Re-renders

**Message** :

```
Error: Too many re-renders. React limits the number of renders
to prevent an infinite loop.
```

**Cause** : setState dans render provoque loop infini

**Solutions** :

```typescript
// ❌ AVANT (erreur)
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1);  // ❌ Appel direct dans render → Loop infini
  return <div>{count}</div>;
}

// ✅ APRÈS (solution : useEffect)
function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1);  // ✅ Dans useEffect, exécute 1x
  }, []);  // [] = execute 1x au mount

  return <div>{count}</div>;
}

// ✅ APRÈS (solution 2 : event handler)
function Component() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>  // ✅ Dans onClick
      {count}
    </button>
  );
}
```

---

### Erreur 5 : Cannot Access Before Initialization

**Message** :

```
ReferenceError: Cannot access 'MyComponent' before initialization
```

**Cause** : Import circulaire (A importe B, B importe A)

**Solutions** :

```typescript
// ❌ AVANT (erreur - import circulaire)
// File: ComponentA.tsx
import { ComponentB } from './ComponentB';
export function ComponentA() {
  return <ComponentB />;
}

// File: ComponentB.tsx
import { ComponentA } from './ComponentA';  // ❌ Circulaire !
export function ComponentB() {
  return <ComponentA />;
}

// ✅ APRÈS (solution : extraire logique partagée)
// File: shared.ts
export const sharedLogic = () => {...};

// File: ComponentA.tsx
import { sharedLogic } from './shared';
export function ComponentA() {...}

// File: ComponentB.tsx
import { sharedLogic } from './shared';  // ✅ Pas circulaire
export function ComponentB() {...}
```

---

## 🎓 PROGRESSION APPRENTISSAGE

### Niveau 1 : Novice (Semaines 1-2)

**Compétences à acquérir** :

- ✅ Comprendre structure monorepo (packages, workspace)
- ✅ Créer composant simple avec CVA (Badge, Card)
- ✅ Utiliser props TypeScript (interface, types)
- ✅ Utiliser design tokens (colors, spacing)

**Exercices pratiques** :

1. Créer BadgeUnified (2-3h)
2. Créer CardUnified (2-3h)
3. Intégrer dans 3 pages différentes
4. Documenter Storybook

**Indicateurs de succès** :

- Je comprends variants CVA
- Je sais passer props à composant
- Je lis messages TypeScript sans panique
- Je commit sans `--no-verify`

---

### Niveau 2 : Débutant (Semaines 3-4)

**Compétences à acquérir** :

- ✅ Créer composant moyen avec états (Input, Form)
- ✅ Gérer erreurs formulaires (React Hook Form + Zod)
- ✅ Optimiser performance basique (React.memo, useMemo)
- ✅ Déboguer avec MCP Browser

**Exercices pratiques** :

1. Créer InputUnified avec gestion erreurs (3-4h)
2. Créer FormUnified simple (6-8h)
3. Optimiser page lente (identifier bottleneck)
4. Écrire 5 tests E2E critiques

**Indicateurs de succès** :

- Je gère états formulaires complexes
- Je comprends re-renders React
- Je mesure performance (Lighthouse)
- Je debug erreurs seul (80% cas)

---

### Niveau 3 : Intermédiaire (Semaines 5-8)

**Compétences à acquérir** :

- ✅ Créer composant complexe (Table avec tri/filtres)
- ✅ Comprendre Server Actions Next.js
- ✅ Gérer cache (revalidatePath, cache tags)
- ✅ Configurer Turborepo multi-apps

**Exercices pratiques** :

1. Créer TableUnified avec tri/filtres (10-12h)
2. Migrer 5 API routes → Server Actions
3. Setup Turborepo (1 semaine)
4. Démarrer développement website

**Indicateurs de succès** :

- Je comprends différence SSR/CSR/SSG
- Je configure pipelines Turborepo
- Je résous 95% problèmes seul
- Je contribue documentation

---

## 📞 QUAND DEMANDER AIDE

### Demander Aide Immédiatement Si :

✅ **Erreur bloque production** (site down, erreurs critiques)
✅ **Erreur incompréhensible après 30min recherche**
✅ **Décision architecture importante** (choix technologie, structure)
✅ **Sécurité potentiellement compromise** (SQL injection, XSS, etc.)
✅ **Performance dégradée >50%** vs baseline

### Chercher Seul D'abord (15-30min) Si :

🟡 **Erreur TypeScript classique** (assignability, undefined, etc.)
🟡 **Erreur console React** (hydration, re-renders, etc.)
🟡 **Style CSS/Tailwind pas appliqué**
🟡 **Import package introuvable** (souvent pnpm install)
🟡 **Build échoue localement** (mais dev fonctionne)

---

## 🔗 RESSOURCES RAPIDES

### Documentation Interne (Vérone)

- `docs/STATUS-COMPOSANTS-DYNAMIQUES.md` : État actuel projet
- `docs/ROADMAP-DEVELOPPEMENT.md` : Planning 4 mois
- `docs/audits/2025-11/GUIDE-DESIGN-SYSTEM-V2.md` : Guide Design System complet
- `CLAUDE.md` : Workflow universel + règles d'or

### Code Référence (Vérone)

- `packages/@verone/ui/apps/back-office/src/components/ui/button-unified.tsx` : Pattern simple
- `packages/@verone/ui/apps/back-office/src/components/ui/kpi-card-unified.tsx` : Pattern complexe
- `packages/@verone/ui/src/design-system/tokens/` : Tous design tokens

### Documentation Externe

- [CVA](https://cva.style/docs) : Class Variance Authority
- [Radix UI](https://www.radix-ui.com) : Primitives accessibles
- [Tailwind CSS](https://tailwindcss.com/docs) : Utility-first CSS
- [Next.js 15](https://nextjs.org/docs) : App Router, Server Actions
- [React Hook Form](https://react-hook-form.com) : Formulaires performants
- [Zod](https://zod.dev) : Validation TypeScript-first

### Outils MCP

- `mcp__sequential-thinking__sequentialthinking` : Décomposer problèmes complexes
- `mcp__serena__get_symbols_overview` : Explorer fichier avant modifier
- `mcp__playwright__browser_navigate` : Tester pages automatiquement
- `mcp__context7__get-library-docs` : Documentation officielle libraries

---

## 🎯 MON OBJECTIF À 4 SEMAINES

**Date cible** : 2025-12-06

**Compétences maîtrisées** :

- ✅ Créer composants UI réutilisables (CVA + Radix UI)
- ✅ Intégrer composants dans back-office
- ✅ Déboguer erreurs console/TypeScript seul (80% cas)
- ✅ Commiter/pusher sans `--no-verify` systématiquement
- ✅ Comprendre architecture monorepo (imports, packages)

**Livrables concrets** :

- 3-5 composants unifiés production-ready
- 10-20 pages back-office utilisant nouveaux composants
- Storybook coverage 20-30%
- 0 erreurs TypeScript
- Documentation à jour

**État mental** :

- Confiance pour créer nouveau composant seul
- Autonomie 80% (20% aide Claude Code pour cas complexes)
- Compréhension workflow Git professionnel
- Capacité expliquer choix techniques

---

**Version** : 1.0
**Date création** : 2025-11-08
**Auteur** : Claude Code pour Romeo Dos Santos

**Prêt à démarrer ? Choisis une tâche dans ROADMAP-DEVELOPPEMENT.md et utilise templates ci-dessus !** 🚀
