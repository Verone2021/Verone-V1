# Fix #3 - Implémenter Upload Image Sourcing Rapide

**Priorité:** 🔴 HAUTE
**Temps estimé:** 2-3h développement + 1h tests
**Dépendance:** Fix #2 (Image facultative - validé partiellement)

---

## 🎯 Objectif

Implémenter la logique d'upload d'image dans le hook `use-sourcing-products.ts` pour gérer correctement les images lorsque l'utilisateur en ajoute une dans le formulaire Sourcing Rapide.

**Problème actuel:**
- Formulaire envoie `imageFile` mais hook l'ignore
- Image perdue silencieusement (mauvaise UX)
- Pattern d'upload existe mais non utilisé

---

## 🔧 Modifications Requises

### 1. Mettre à jour Hook Backend

**Fichier:** `src/hooks/use-sourcing-products.ts`

**Fonction à modifier:** `createSourcingProduct` (lignes 257-306)

#### A. Mettre à jour l'interface TypeScript

```typescript
// AVANT (ligne 257)
const createSourcingProduct = async (data: {
  name: string
  supplier_page_url: string
  supplier_cost_price: number
  supplier_id?: string
  assigned_client_id?: string
}) => {

// APRÈS
const createSourcingProduct = async (data: {
  name: string
  supplier_page_url: string
  supplier_cost_price: number
  supplier_id?: string
  assigned_client_id?: string
  imageFile?: File // AJOUTER CE PARAMÈTRE
}) => {
```

#### B. Ajouter logique upload après création produit

**Insérer après ligne 289 (après création produit) :**

```typescript
// 🔄 NOUVEAU: Upload image si fournie
if (data.imageFile && newProduct) {
  try {
    // 1. Générer nom fichier unique
    const fileExt = data.imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `product-${newProduct.id}-${Date.now()}.${fileExt}`

    // 2. Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, data.imageFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erreur upload image:', uploadError)
      toast({
        title: "Avertissement",
        description: "Produit créé mais image non uploadée",
        variant: "destructive"
      })
    } else {
      // 3. Obtenir URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      // 4. Créer entrée dans product_images
      const { error: imageError } = await supabase
        .from('product_images')
        .insert({
          product_id: newProduct.id,
          image_url: publicUrl,
          is_primary: true,
          image_type: 'primary',
          alt_text: data.name,
          file_size: data.imageFile.size,
          format: fileExt,
          display_order: 0
        })

      if (imageError) {
        console.error('Erreur enregistrement image BD:', imageError)
        toast({
          title: "Avertissement",
          description: "Image uploadée mais non associée au produit",
          variant: "destructive"
        })
      }
    }
  } catch (err) {
    console.error('Erreur upload image:', err)
    // Ne pas bloquer la création du produit si upload échoue
  }
}
```

#### C. Mettre à jour message toast succès

**Modifier ligne 291-294 :**

```typescript
// AVANT
toast({
  title: "Succès",
  description: "Produit en sourcing créé"
})

// APRÈS
toast({
  title: "Succès",
  description: data.imageFile
    ? "Produit en sourcing créé avec image"
    : "Produit en sourcing créé"
})
```

---

### 2. Vérifier RLS Policies Supabase

**Action requise:** Valider que les policies permettent l'upload

**Vérification MCP Supabase:**
```typescript
mcp__supabase__execute_sql({
  query: `
    SELECT policyname, cmd, qual
    FROM pg_policies
    WHERE tablename = 'product_images'
  `
})
```

**Policies attendues:**
- ✅ INSERT autorisé pour utilisateurs authentifiés
- ✅ SELECT public pour is_primary = true
- ✅ UPDATE/DELETE autorisé pour owner

---

### 3. Tests de Validation

#### Test #1: Upload Image AVEC Produit
**Workflow:**
1. Naviguer `/catalogue/create` → "Sourcing Rapide"
2. Remplir formulaire:
   - Nom: `TEST FIX3 - Canapé Nordic`
   - URL: `https://example.com/test-fix3`
   - **Image:** AJOUTER image (ex: canape.jpg)
   - Client: Laisser vide
3. Soumettre formulaire
4. **Vérifications:**
   - ✅ Toast succès "Produit en sourcing créé avec image"
   - ✅ Redirection `/sourcing/produits`
   - ✅ Image visible dans liste produits
   - ✅ Console 0 erreur

#### Test #2: Upload Image SANS Produit (Régression)
**Workflow:**
1. Même formulaire mais **SANS image**
2. **Vérifications:**
   - ✅ Formulaire accepte soumission
   - ✅ Toast succès "Produit en sourcing créé"
   - ✅ Produit visible sans image (placeholder)
   - ✅ Console 0 erreur

#### Test #3: Upload Image Invalide (Edge Case)
**Workflow:**
1. Tenter upload fichier > 10MB
2. Tenter upload fichier non-image (.pdf)
3. **Vérifications:**
   - ✅ Erreur validation frontend (avant soumission)
   - ✅ Pas de crash backend

---

## 📊 Critères de Succès

### Fonctionnel
- [ ] Image uploadée vers Supabase Storage (`product-images` bucket)
- [ ] Entrée créée dans table `product_images`
- [ ] Image marquée `is_primary = true`
- [ ] Image visible dans liste produits
- [ ] Formulaire sans image fonctionne toujours (régression)

### Performance
- [ ] Upload < 3s pour image 2MB
- [ ] Pas de blocage UI pendant upload
- [ ] Feedback toast approprié

### UX
- [ ] Toast indique si image uploadée ou non
- [ ] Pas d'erreur silencieuse
- [ ] Message clair si upload échoue

---

## 🔗 Références Code

### Pattern Existant
**Fichier:** `src/components/forms/simple-product-form.tsx`
**Lignes:** 121-148
**Logique:** Upload Storage + Insertion product_images

### Hook Upload Disponible
**Fichier:** `src/hooks/use-simple-image-upload.ts`
**Note:** Peut être utilisé mais pattern inline plus simple pour ce cas

### Formulaire Frontend
**Fichier:** `src/components/business/sourcing-quick-form.tsx`
**Ligne 136:** `imageFile: selectedImage || undefined`
**Status:** ✅ Prêt côté frontend

---

## ⚠️ Points d'Attention

### Sécurité
- ✅ Validation taille fichier (maxSizeBytes: 10MB)
- ✅ Validation type MIME (image/jpeg, image/png, image/webp)
- ✅ Nom fichier unique (timestamp + product_id)
- ✅ RLS policies Supabase actives

### Gestion Erreurs
- ✅ Échec upload ne bloque pas création produit
- ✅ Toast warning si upload échoue
- ✅ Logs console pour debug
- ✅ Pas d'exception non gérée

### Performance
- ⚠️ Upload synchrone (bloque UI temporairement)
- ✅ Feedback visuel pendant upload (toast)
- ✅ Pas de retry automatique (éviter boucle)

---

## 📝 Checklist Développement

**Phase 1: Implémentation**
- [ ] Mettre à jour interface TypeScript fonction createSourcingProduct
- [ ] Ajouter logique upload Storage (après création produit)
- [ ] Ajouter insertion product_images
- [ ] Mettre à jour toast succès (différencier avec/sans image)
- [ ] Gérer erreurs upload (try/catch)
- [ ] Ajouter logs console debug

**Phase 2: Tests Manuels**
- [ ] Test upload image valide (JPG 2MB)
- [ ] Test upload image valide (PNG 5MB)
- [ ] Test création sans image (régression)
- [ ] Test upload image trop grosse (> 10MB)
- [ ] Test upload fichier non-image
- [ ] Vérifier console errors (0 attendu)

**Phase 3: Validation BD**
- [ ] Vérifier entrée product_images créée
- [ ] Vérifier is_primary = true
- [ ] Vérifier image_url accessible publiquement
- [ ] Vérifier file_size enregistré
- [ ] Vérifier format correct

**Phase 4: Cleanup**
- [ ] Supprimer produits de test créés
- [ ] Supprimer images de test du Storage
- [ ] Mettre à jour rapport validation Fix #2

---

## 🚀 Alternative: Quick Fix Temporaire

**Si pas le temps pour implémentation complète:**

### Option B: Retirer Upload Temporairement

**Fichier:** `src/components/business/sourcing-quick-form.tsx`

**Modifications:**
```typescript
// 1. Commenter section upload image (lignes 187-257)
{/* Section upload image temporairement désactivée - Fix #3 en cours */}

// 2. Ajouter note explicative
<Alert className="mb-4">
  <Info className="h-4 w-4" />
  <AlertDescription>
    L'upload d'image sera disponible prochainement.
    Vous pourrez ajouter des images après création du produit.
  </AlertDescription>
</Alert>
```

**Temps estimé:** 15 min
**Impact:** Pas de confusion utilisateur, workflow clair

---

## 📅 Planning Recommandé

**Jour 1 (2-3h):** Implémentation Fix #3
**Jour 2 (1h):** Tests complets + validation
**Jour 3 (30min):** Cleanup + mise à jour documentation

**Total:** 3-4h (vs 15min quick fix)

**Recommandation:** Implémenter solution complète pour éviter dette technique

---

**Créé:** 2025-10-03 23:20 UTC
**Créé par:** Vérone Test Expert (suite validation Fix #2)
**Priorité:** 🔴 HAUTE (UX critique)
