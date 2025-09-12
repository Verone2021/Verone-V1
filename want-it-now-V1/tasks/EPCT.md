---
description: Explorer la base de code, créer un plan d'implémentation, coder et tester en suivant le workflow EPCT
---

# Workflow Explorer, Planifier, Coder, Tester

À la fin de ce message, je vais te demander de faire quelque chose.  
Merci de suivre le workflow **« Explorer, Planifier, Coder, Tester »** dès le départ.

## Explorer

- Identifier et lire tous les fichiers utiles pour implémenter la fonctionnalité (exemples ou fichiers cibles).  
- Recueillir les chemins de fichiers pertinents et toute autre information utile.  
- Si quelque chose reste flou, poser des questions avant de continuer.  

## Planifier

- Rédiger un plan d'implémentation détaillé.  
- Inclure ce qui est nécessaire (tests, composants lookbook, documentation) selon les standards du dépôt.  
- Si des points restent incertains ou manquants, s'arrêter ici et clarifier avant de coder.  

## Coder

Quand le plan est clair, commencer à coder :  

- Respecter le style existant du code (variables et méthodes avec des noms explicites).  
- Toujours rester dans le **périmètre des changements**. Ne pas modifier de code non concerné.  
- Ne pas commenter le code.  
- Lancer le script d'auto-formatage et corriger les avertissements du linter si pertinent.  

## Tester

- Lancer la suite de tests et vérifier que tout passe.  
- Si les changements touchent l'UX, vérifier manuellement les principaux flux dans le navigateur.  
- En cas de problème, revenir à l'étape « Planifier » et ajuster.  

## Rédiger le compte rendu

Une fois terminé :  

- Rédiger un court rapport pouvant servir de description de PR.  
- Inclure : l'objectif, les choix effectués (avec justification brève) et les commandes utiles exécutées.  

---

## Want It Now - Standards Projet

### <× **Tech Stack & Architecture**

#### **Stack Principal**
- **Framework** : Next.js 15 + React 19 + TypeScript 5.9
- **UI** : shadcn/ui + Tailwind CSS + Lucide React
- **Backend** : Supabase (PostgreSQL + RLS + Auth + Storage)
- **Deployment** : Vercel
- **Testing** : Playwright E2E + Jest
- **Validation** : Zod + React Hook Form

#### **Scripts Disponibles**
```bash
# Development
npm run dev              # Serveur local port 3000
npm run build           # Build production
npm run start           # Serveur production

# Quality
npm run lint            # ESLint check
npm run test            # Playwright E2E tests
npm run test:ui         # Tests avec interface

# Database (Supabase)
npm run db:start        # Démarrer Supabase local
npm run db:reset        # Reset + reseed database
npm run db:migrate      # Appliquer migrations
npm run db:types        # Générer types TypeScript
npm run db:studio       # Interface admin Supabase
```

### <¨ **Design System Want It Now**

#### **Couleurs Signature**
- **Copper Primary** : `#D4841A` (boutons, CTA, accents)
- **Green Secondary** : `#2D5A27` (navigation, succès, confirmations)
- **Gradient Signature** : `bg-gradient-to-r from-[#D4841A] to-[#2D5A27]`

#### **Composants UI Standards**
```tsx
// Input OBLIGATOIRE avec fond blanc
<Input className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11" />

// Button Primary Copper
<Button className="bg-[#D4841A] hover:bg-[#B8741A] text-white">Action</Button>

// Button Green (confirmations)
<Button className="bg-[#2D5A27] hover:bg-[#1F3F1C] text-white">Confirmer</Button>

// Badge Copper
<Badge className="bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20">Status</Badge>
```

### =Ä **Patterns Base de Données**

#### **Migrations Supabase**
- **Fichiers** : `supabase/migrations/XXX_description.sql`
- **Ordre** : Numérotation séquentielle (001, 002, etc.)
- **Pattern** : Tables ’ Vues ’ RLS ’ Fonctions ’ Permissions

#### **RLS (Row Level Security)**
```sql
-- Pattern standard RLS
CREATE POLICY "policy_name" ON table_name
FOR operation TO role
USING (condition);
```

#### **Server Actions Pattern**
```tsx
'use server'

export async function actionName(data: SchemaType): Promise<ActionResult<ReturnType>> {
  try {
    const supabase = await createClient()
    const validated = schema.parse(data)
    
    const { data: result, error } = await supabase
      .from('table')
      .insert(validated)
    
    if (error) throw error
    
    revalidatePath('/path')
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### =Ý **Validation & Formulaires**

#### **Schéma Zod Standard**
```tsx
const schema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Format email invalide").optional(),
  type: z.enum(['physique', 'morale'])
})

// Avec React Hook Form
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
})
```

#### **Structure Formulaire Standard**
```tsx
<form className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        Section Title
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Champs avec validation */}
      </div>
    </CardContent>
  </Card>
</form>
```

### = **Authentication SSR Pattern**

```tsx
// Layout avec auth server-side
export default async function RootLayout({ children }) {
  const initialAuthData = await getServerAuthData()
  
  return (
    <AuthProviderSSR initialData={initialAuthData}>
      {children}
    </AuthProviderSSR>
  )
}

// Requêtes parallèles optimisées
const [profile, roles, assignments] = await Promise.all([
  supabase.from('utilisateurs').select('*'),
  supabase.from('user_roles').select('*'),
  supabase.from('user_organisation_assignments').select('*')
])
```

---

## Checklist Qualité Want It Now

###  **Phase Explorer**
- [ ] Identifier les fichiers `actions/`, `components/`, `lib/validations/` concernés
- [ ] Vérifier les migrations DB existantes dans `supabase/migrations/`
- [ ] Consulter le design system dans `Docs/UI-design-system-guidelines.md`
- [ ] Examiner les patterns similaires dans le codebase
- [ ] Lister les composants UI réutilisables dans `components/ui/`

###  **Phase Planifier (STOP OBLIGATOIRE)**
- [ ] Plan détaillé avec étapes numérotées
- [ ] Files exactes à créer/modifier (chemins complets)
- [ ] Schema Zod de validation requis
- [ ] Migrations DB nécessaires (tables, RLS, vues)
- [ ] Composants UI à créer vs réutiliser
- [ ] Tests E2E Playwright à ajouter
- [ ] **STOP** - Attendre validation avant de coder

###  **Phase Coder**
- [ ] Respecter les couleurs Want It Now (#D4841A, #2D5A27)
- [ ] Inputs avec `bg-white` forcé et focus Copper
- [ ] Messages d'erreur en français
- [ ] Types TypeScript stricts
- [ ] Server Actions avec revalidatePath
- [ ] Migrations DB ordonnées et documentées
- [ ] `npm run lint` sans warnings
- [ ] Format code cohérent avec existing

###  **Phase Tester**
- [ ] `npm run test` E2E Playwright passent
- [ ] Test manuel desktop (Chrome) + mobile (responsive)
- [ ] Vérification formulaires (validation, soumission, erreurs)
- [ ] Test navigation et flux utilisateur complets
- [ ] Performance : pas de régression notable
- [ ] Accessibilité de base (focus visible, labels)

###  **Database Quality**
- [ ] Migrations appliquées sans erreur
- [ ] RLS policies testées (auth + anon)
- [ ] Vues fonctionnelles avec permissions correctes
- [ ] Indexes performants sur colonnes de recherche
- [ ] Constraints et validations DB cohérentes

###  **UI/UX Consistency**
- [ ] Design system Want It Now respecté
- [ ] Transitions fluides (duration-200/300)
- [ ] États loading avec spinners animés
- [ ] Messages toast informatifs
- [ ] Responsive mobile-first fonctionnel

---

## Extensions Workflow (Optionnelles)

### =€ **Conventional Commits**
```bash
feat: ajouter gestion propriétaires physiques
fix: corriger validation email dans formulaire
chore: mettre à jour types database après migration
docs: enrichir documentation API proprietaires
```

### =Ë **Template PR Description**
```markdown
## Objectif
Brief description de la fonctionnalité implémentée

## Changements
- **Added**: Nouvelles fonctionnalités
- **Changed**: Modifications existantes  
- **Fixed**: Corrections de bugs

## Files Touchés
- `actions/module.ts` - Server actions CRUD
- `components/module/` - Composants UI
- `supabase/migrations/XXX_` - Schema changes

## Tests
- [ ] E2E Playwright ajoutés/mis à jour
- [ ] Tests manuels desktop + mobile OK
- [ ] Performance vérifiée

## Commands Run
```bash
npm run lint && npm run test && npm run build
```
```

### = **Rollback Plan**
- **DB** : Migrations réversibles avec DOWN scripts
- **Code** : Git revert des commits concernés
- **Deploy** : Rollback Vercel en un clic
- **Cache** : Invalidation cache Supabase si nécessaire

---

## <¯ **Définition de Fini (DoD)**

Une fonctionnalité est considérée **terminée** quand :

1. ** Code Quality**
   - Lint sans warnings
   - Types TypeScript stricts
   - Pas de code commenté/debug

2. ** Tests & Validation**
   - Tests E2E Playwright passent
   - Tests manuels desktop + mobile OK
   - Validation Zod avec messages français

3. ** Database & Performance**
   - Migrations appliquées et documentées
   - RLS policies sécurisées
   - Pas de régression performance

4. ** UX & Design**
   - Design system Want It Now respecté
   - Responsive fonctionnel
   - Accessibilité de base (focus, labels)

5. ** Documentation**
   - README mis à jour si nécessaire
   - Schema changes documentés
   - PR description complète

---

**Toujours appliquer ce workflow. STOP après Planifier, reprendre seulement après validation explicite.**