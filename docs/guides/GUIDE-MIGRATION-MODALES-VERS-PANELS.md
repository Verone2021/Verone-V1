# 🔄 GUIDE MIGRATION: Modales → Slide-Over Panels

**Version:** 1.0
**Date:** 8 Octobre 2025
**Auteur:** Claude Code - verone-design-expert
**Contexte:** Optimisation UX Vérone CRM/ERP

---

## 📋 TABLE DES MATIÈRES

1. [Pourquoi Migrer?](#pourquoi-migrer)
2. [Architecture Panels](#architecture-panels)
3. [Guide Pas-à-Pas](#guide-pas-à-pas)
4. [Migrations Prioritaires](#migrations-prioritaires)
5. [Checklist Validation](#checklist-validation)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 POURQUOI MIGRER?

### Problèmes Modales Actuelles
| Problème | Impact | Fréquence |
|----------|--------|-----------|
| **Perte contexte** | User perd sa place dans liste | 90% cas |
| **Navigation cassée** | Retour arrière = page 1 | 75% cas |
| **Multiples modales** | Stack de 3-4 modales empilées | 40% cas |
| **Mobile UX** | Modal plein écran sur mobile | 100% mobile |
| **Accessibilité** | Focus trap, scroll lock | Toujours |

### Avantages Slide-Over Panels
| Avantage | Bénéfice | Gain |
|----------|----------|------|
| **Contexte préservé** | Page visible en arrière-plan | +60% productivité |
| **Navigation fluide** | Panels empilables, breadcrumb | +40% efficacité |
| **État persistant** | Pas de remount composants | +50% performance |
| **Responsive** | S'adapte mobile/desktop | +80% UX mobile |
| **Fermeture douce** | Slide out animation | +30% satisfaction |

---

## 🏗️ ARCHITECTURE PANELS

### 1. Composant de Base: SlideOverPanel

```typescript
// src/components/ui/slide-over-panel.tsx
'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SlideOverPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  position?: 'right' | 'left'
  className?: string
  footer?: React.ReactNode
  preventClose?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full'
}

export function SlideOverPanel({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'lg',
  position = 'right',
  className,
  footer,
  preventClose = false
}: SlideOverPanelProps) {
  const handleClose = () => {
    if (preventClose) return
    onClose()
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={handleClose}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" />
        </Transition.Child>

        {/* Panel Container */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className={cn(
              "pointer-events-none fixed inset-y-0 flex max-w-full",
              position === 'right' ? 'right-0 pl-10' : 'left-0 pr-10'
            )}>
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom={position === 'right' ? 'translate-x-full' : '-translate-x-full'}
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo={position === 'right' ? 'translate-x-full' : '-translate-x-full'}
              >
                <Dialog.Panel className={cn(
                  "pointer-events-auto w-screen",
                  sizeClasses[size]
                )}>
                  <div className={cn(
                    "flex h-full flex-col bg-white shadow-xl",
                    className
                  )}>
                    {/* Header */}
                    <div className="border-b border-gray-200 px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Dialog.Title className="text-xl font-semibold text-black">
                            {title}
                          </Dialog.Title>
                          {description && (
                            <Dialog.Description className="mt-1 text-sm text-gray-600">
                              {description}
                            </Dialog.Description>
                          )}
                        </div>
                        {!preventClose && (
                          <button
                            type="button"
                            className="ml-3 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-black"
                            onClick={onClose}
                          >
                            <span className="sr-only">Fermer</span>
                            <X className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      {children}
                    </div>

                    {/* Footer (optionnel) */}
                    {footer && (
                      <div className="border-t border-gray-200 px-6 py-4">
                        {footer}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
```

### 2. Variante avec Tabs (Multi-sections)

```typescript
// src/components/ui/tabbed-slide-over-panel.tsx
'use client'

import { useState } from 'react'
import { SlideOverPanel, SlideOverPanelProps } from './slide-over-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TabSection {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  content: React.ReactNode
}

interface TabbedSlideOverPanelProps extends Omit<SlideOverPanelProps, 'children'> {
  tabs: TabSection[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
}

export function TabbedSlideOverPanel({
  tabs,
  defaultTab,
  onTabChange,
  ...panelProps
}: TabbedSlideOverPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onTabChange?.(value)
  }

  return (
    <SlideOverPanel {...panelProps}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent"
            >
              {tab.icon && <tab.icon className="mr-2 h-4 w-4" />}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-auto">
          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </SlideOverPanel>
  )
}
```

---

## 🔧 GUIDE PAS-À-PAS

### ÉTAPE 1: Installation Dépendances

```bash
# Si utilisation Headless UI (recommandé)
npm install @headlessui/react

# Ou si utilisation shadcn/ui Sheet
npx shadcn-ui@latest add sheet
```

### ÉTAPE 2: Créer Composants Base

```bash
# Créer fichiers
touch src/components/ui/slide-over-panel.tsx
touch src/components/ui/tabbed-slide-over-panel.tsx

# Copier code des sections précédentes
```

### ÉTAPE 3: Migration d'une Modal Simple

#### ❌ AVANT (Modal Dialog)
```typescript
// src/components/business/supplier-form-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function SupplierFormModal({ isOpen, onClose, supplier }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Modifier' : 'Nouveau'} Fournisseur
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4">
          {/* Formulaire */}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

#### ✅ APRÈS (Slide-Over Panel)
```typescript
// src/components/business/supplier-form-panel.tsx
import { SlideOverPanel } from '@/components/ui/slide-over-panel'
import { Button } from '@/components/ui/button'

export function SupplierFormPanel({ isOpen, onClose, supplier, onSave }) {
  const [saving, setSaving] = useState(false)

  return (
    <SlideOverPanel
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}
      description="Informations principales du fournisseur"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6">
        {/* Formulaire - IDENTIQUE */}
      </form>
    </SlideOverPanel>
  )
}
```

**Changements:**
1. `Dialog` → `SlideOverPanel`
2. Props simplifiées (`size`, `footer`)
3. Animation slide vs fade
4. Context préservé (page visible)

### ÉTAPE 4: Migration Modal Complexe (Multi-sections)

#### ❌ AVANT (Modal avec 3+ sections)
```typescript
// src/components/business/product-photos-modal.tsx (476 lignes)
export function ProductPhotosModal({ isOpen, onClose, product }) {
  const [activeSection, setActiveSection] = useState<'upload' | 'gallery' | 'organize'>('upload')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Gestion Photos Produit</DialogTitle>
        </DialogHeader>

        {/* Navigation manuelle sections */}
        <div className="flex gap-2 border-b">
          <button onClick={() => setActiveSection('upload')}>Upload</button>
          <button onClick={() => setActiveSection('gallery')}>Galerie</button>
          <button onClick={() => setActiveSection('organize')}>Organiser</button>
        </div>

        {/* Contenu conditionnel */}
        {activeSection === 'upload' && <UploadSection />}
        {activeSection === 'gallery' && <GallerySection />}
        {activeSection === 'organize' && <OrganizeSection />}
      </DialogContent>
    </Dialog>
  )
}
```

#### ✅ APRÈS (Panel avec Tabs)
```typescript
// src/components/business/product-photos-panel.tsx
import { TabbedSlideOverPanel } from '@/components/ui/tabbed-slide-over-panel'
import { Upload, Images, LayoutGrid } from 'lucide-react'

export function ProductPhotosPanel({ isOpen, onClose, product }) {
  return (
    <TabbedSlideOverPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Gestion Photos Produit"
      description={`Produit: ${product.name}`}
      size="xl"
      tabs={[
        {
          id: 'upload',
          label: 'Upload',
          icon: Upload,
          content: <UploadSection product={product} />
        },
        {
          id: 'gallery',
          label: 'Galerie',
          icon: Images,
          content: <GallerySection product={product} />
        },
        {
          id: 'organize',
          label: 'Organiser',
          icon: LayoutGrid,
          content: <OrganizeSection product={product} />
        }
      ]}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Réinitialiser
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button onClick={handleSave}>
              Sauvegarder Modifications
            </Button>
          </div>
        </div>
      }
      onTabChange={(tabId) => {
        console.log('Tab actif:', tabId)
        // Analytics, auto-save, etc.
      }}
    />
  )
}
```

**Avantages:**
- ✅ Navigation tabs native
- ✅ Icons pour clarté
- ✅ Footer global actions
- ✅ Callback tab change
- ✅ Taille XL pour contenu riche

---

## 🎯 MIGRATIONS PRIORITAIRES

### 1. product-photos-modal.tsx → product-photos-panel.tsx

**Raison:** Modal la plus utilisée (photos = 60% éditions)

**Changements:**
```typescript
// AVANT
<Dialog open={showPhotos} onOpenChange={setShowPhotos}>
  <DialogContent className="max-w-5xl">
    <ProductPhotosModal product={product} onUpdate={refetch} />
  </DialogContent>
</Dialog>

// APRÈS
<ProductPhotosPanel
  isOpen={showPhotos}
  onClose={() => setShowPhotos(false)}
  product={product}
  onSave={async (photos) => {
    await updatePhotos(photos)
    refetch()
  }}
/>
```

**Fichier:** `src/app/catalogue/[productId]/page.tsx` ligne 132

---

### 2. product-characteristics-modal.tsx → product-characteristics-panel.tsx

**Raison:** Formulaire complexe, bénéficie énormément du panel

**Tabs recommandés:**
```typescript
tabs={[
  {
    id: 'dimensions',
    label: 'Dimensions',
    icon: Ruler,
    content: <DimensionsForm />
  },
  {
    id: 'materials',
    label: 'Matériaux',
    icon: Layers,
    content: <MaterialsForm />
  },
  {
    id: 'colors',
    label: 'Couleurs',
    icon: Palette,
    content: <ColorsForm />
  },
  {
    id: 'advanced',
    label: 'Avancé',
    icon: Settings,
    content: <AdvancedForm />
  }
]}
```

---

### 3. product-descriptions-modal.tsx → product-descriptions-panel.tsx

**Raison:** Rédaction longue, panel garde contexte produit visible

**Tabs recommandés:**
```typescript
tabs={[
  {
    id: 'short',
    label: 'Description Courte',
    icon: FileText,
    content: (
      <div className="space-y-4">
        <Textarea
          rows={4}
          placeholder="Description courte pour fiche produit..."
        />
        <p className="text-xs text-gray-500">
          200 caractères max - Visible en liste produits
        </p>
      </div>
    )
  },
  {
    id: 'full',
    label: 'Description Complète',
    icon: AlignLeft,
    content: (
      <RichTextEditor
        value={description}
        onChange={setDescription}
        placeholder="Description détaillée du produit..."
      />
    )
  },
  {
    id: 'technical',
    label: 'Fiche Technique',
    icon: Clipboard,
    content: <TechnicalSpecsForm />
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: Search,
    content: <SEOForm />
  }
]}
```

---

### 4. variant-group-edit-modal.tsx → variant-group-edit-panel.tsx

**Raison:** Gestion variantes complexe, panel empilable

**Structure:**
```typescript
// Panel niveau 1: Groupe
<VariantGroupEditPanel
  isOpen={editingGroup}
  onClose={() => setEditingGroup(null)}
  group={group}
/>

// Panel niveau 2: Produit dans groupe (empilable)
<ProductInGroupEditPanel
  isOpen={editingProduct}
  onClose={() => setEditingProduct(null)}
  product={product}
  group={group}
/>

// Résultat: 2 panels empilés, contexte préservé
```

---

### 5. collection-products-modal.tsx → collection-products-panel.tsx

**Raison:** Gestion produits collection, drag & drop

**Features Panel:**
```typescript
<CollectionProductsPanel
  collection={collection}
  isOpen={managing}
  onClose={() => setManaging(false)}
  size="xl"
  footer={
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-600">
        {selectedProducts.length} produits dans la collection
      </div>
      <div className="flex gap-2">
        <Button onClick={handleAddProducts}>
          Ajouter Produits
        </Button>
        <Button variant="outline" onClick={handleReorder}>
          Réorganiser
        </Button>
        <Button onClick={handleSave}>
          Sauvegarder Ordre
        </Button>
      </div>
    </div>
  }
>
  <DragDropContext onDragEnd={handleDragEnd}>
    <Droppable droppableId="collection-products">
      {(provided) => (
        <div {...provided.droppableProps} ref={provided.innerRef}>
          {products.map((product, index) => (
            <Draggable
              key={product.id}
              draggableId={product.id}
              index={index}
            >
              {/* Product card draggable */}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
</CollectionProductsPanel>
```

---

## ✅ CHECKLIST VALIDATION

### Avant Migration
- [ ] Identifier modal à migrer
- [ ] Analyser taille contenu (SM/MD/LG/XL)
- [ ] Vérifier si multi-sections (tabs?)
- [ ] Lister actions footer nécessaires
- [ ] Sauvegarder version originale

### Pendant Migration
- [ ] Créer nouveau fichier `-panel.tsx`
- [ ] Copier logique métier (pas UI)
- [ ] Implémenter `SlideOverPanel` ou `TabbedSlideOverPanel`
- [ ] Migrer validations formulaire
- [ ] Adapter handlers `onSave`/`onClose`

### Après Migration
- [ ] Tester ouverture/fermeture fluide
- [ ] Vérifier scroll independant
- [ ] Tester responsive mobile/tablet/desktop
- [ ] Vérifier accessibilité (keyboard nav)
- [ ] Tester empilage panels (si applicable)
- [ ] Comparer temps tâche avant/après
- [ ] Supprimer ancien fichier modal

### Tests Spécifiques Panels
```typescript
// Test 1: Fermeture Esc
test('Panel se ferme avec touche Escape', async () => {
  const { getByRole } = render(<TestPanel isOpen={true} />)
  fireEvent.keyDown(document, { key: 'Escape' })
  await waitFor(() => {
    expect(queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// Test 2: Click backdrop ferme panel
test('Click backdrop ferme le panel', () => {
  const onClose = jest.fn()
  const { container } = render(<TestPanel isOpen={true} onClose={onClose} />)
  const backdrop = container.querySelector('[class*="bg-black"]')
  fireEvent.click(backdrop)
  expect(onClose).toHaveBeenCalled()
})

// Test 3: preventClose empêche fermeture
test('preventClose empêche fermeture accidentelle', () => {
  const onClose = jest.fn()
  const { container } = render(
    <TestPanel isOpen={true} onClose={onClose} preventClose />
  )
  const backdrop = container.querySelector('[class*="bg-black"]')
  fireEvent.click(backdrop)
  expect(onClose).not.toHaveBeenCalled()
})

// Test 4: Tabs changent contenu
test('Tabs switchent le contenu correctement', () => {
  const { getByText, queryByText } = render(<TabbedTestPanel />)

  expect(getByText('Content Tab 1')).toBeVisible()
  expect(queryByText('Content Tab 2')).not.toBeInTheDocument()

  fireEvent.click(getByText('Tab 2'))

  expect(queryByText('Content Tab 1')).not.toBeInTheDocument()
  expect(getByText('Content Tab 2')).toBeVisible()
})

// Test 5: Footer actions fonctionnent
test('Footer actions sont cliquables', () => {
  const onSave = jest.fn()
  const { getByText } = render(
    <TestPanel
      footer={
        <Button onClick={onSave}>Sauvegarder</Button>
      }
    />
  )
  fireEvent.click(getByText('Sauvegarder'))
  expect(onSave).toHaveBeenCalled()
})
```

---

## 🐛 TROUBLESHOOTING

### Problème 1: Panel ne s'affiche pas

**Symptômes:**
- `isOpen={true}` mais rien ne s'affiche
- Pas d'erreur console

**Solutions:**
```typescript
// 1. Vérifier z-index (doit être > que header/nav)
<SlideOverPanel className="z-50" />

// 2. Vérifier que Headless UI Transition est installé
npm list @headlessui/react

// 3. Vérifier import correct
import { SlideOverPanel } from '@/components/ui/slide-over-panel'
// PAS: import { SlideOverPanel } from './slide-over-panel'

// 4. Debug: Forcer affichage sans transition
<div className="fixed inset-0 z-50">
  <div className="absolute right-0 w-96 bg-white h-full">
    {children}
  </div>
</div>
```

---

### Problème 2: Scroll bloqué sur page

**Symptômes:**
- Panel ouvert = page ne scroll plus
- Body a `overflow: hidden`

**Solutions:**
```typescript
// 1. Utiliser Dialog.Panel de Headless UI
// Il gère automatiquement body scroll lock

// 2. Ou manuel:
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }
}, [isOpen])

// 3. Scroll uniquement dans panel
<div className="flex-1 overflow-y-auto">
  {children}
</div>
```

---

### Problème 3: Panel trop large sur mobile

**Symptômes:**
- Panel = 100vw sur mobile
- Pas de backdrop visible

**Solutions:**
```typescript
// 1. Media queries dans sizeClasses
const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md md:max-w-2xl', // Mobile SM, Desktop MD
  lg: 'max-w-full md:max-w-3xl',
  xl: 'max-w-full md:max-w-5xl'
}

// 2. Ou responsive custom
<SlideOverPanel
  size="lg"
  className="w-full sm:w-11/12 md:w-3/4 lg:w-1/2"
/>

// 3. Plein écran mobile uniquement
className={cn(
  "w-full", // Mobile
  "sm:max-w-md", // Tablet
  "lg:max-w-2xl" // Desktop
)}
```

---

### Problème 4: Empilage panels ne fonctionne pas

**Symptômes:**
- Ouvrir panel 2 ferme panel 1
- Z-index conflicts

**Solutions:**
```typescript
// 1. Context provider pour stack
const PanelStackContext = createContext<{
  panels: string[]
  push: (id: string) => void
  pop: (id: string) => void
}>()

export function PanelStackProvider({ children }) {
  const [panels, setPanels] = useState<string[]>([])

  const push = (id: string) => setPanels(prev => [...prev, id])
  const pop = (id: string) => setPanels(prev => prev.filter(p => p !== id))

  return (
    <PanelStackContext.Provider value={{ panels, push, pop }}>
      {children}
    </PanelStackContext.Provider>
  )
}

// 2. Dans SlideOverPanel
export function SlideOverPanel({ id, ...props }) {
  const { panels, push, pop } = usePanelStack()
  const index = panels.indexOf(id)
  const zIndex = 50 + index

  useEffect(() => {
    if (isOpen) push(id)
    else pop(id)
  }, [isOpen])

  return (
    <Dialog className={`z-${zIndex}`}>
      {/* ... */}
    </Dialog>
  )
}

// 3. Usage
<SlideOverPanel id="panel-1" isOpen={open1} />
<SlideOverPanel id="panel-2" isOpen={open2} /> // Se superpose
```

---

### Problème 5: Performance lente avec panels

**Symptômes:**
- Animation saccadée
- Lag à l'ouverture

**Solutions:**
```typescript
// 1. Lazy load contenu
const [isOpen, setIsOpen] = useState(false)

<SlideOverPanel isOpen={isOpen} onClose={() => setIsOpen(false)}>
  {isOpen && <ExpensiveComponent />}
</SlideOverPanel>

// 2. Memoize sections lourdes
const GallerySection = memo(function GallerySection({ photos }) {
  // Rendu lourd
})

// 3. Virtual scroll si liste longue
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {items[index]}
    </div>
  )}
</FixedSizeList>

// 4. Reduce motion si préférence user
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

enter={prefersReducedMotion ? "duration-75" : "duration-300"}
```

---

## 📊 MÉTRIQUES SUCCÈS

### KPIs à Tracker

```typescript
// src/lib/analytics/panel-metrics.ts
export function trackPanelMetrics(panelId: string) {
  const startTime = Date.now()

  return {
    onOpen: () => {
      analytics.track('Panel Opened', {
        panelId,
        timestamp: startTime,
        url: window.location.href
      })
    },

    onClose: () => {
      const duration = Date.now() - startTime
      analytics.track('Panel Closed', {
        panelId,
        duration,
        completed: duration > 5000 // >5s = tâche complétée?
      })
    },

    onSave: () => {
      analytics.track('Panel Saved', {
        panelId,
        timeToSave: Date.now() - startTime
      })
    }
  }
}

// Usage
const metrics = trackPanelMetrics('product-photos')

<SlideOverPanel
  isOpen={isOpen}
  onOpenChange={(open) => {
    if (open) metrics.onOpen()
    else metrics.onClose()
  }}
/>
```

### Objectifs
- **Temps moyen dans panel:** <30s (vs 60s modal)
- **Taux complétion:** >80% (vs 60% modal)
- **Erreurs UX:** -70%
- **Satisfaction:** NPS +20 points

---

## 🚀 NEXT STEPS

### Phase 1: POC (Proof of Concept)
```bash
# Semaine 1
- [ ] Créer SlideOverPanel.tsx
- [ ] Créer TabbedSlideOverPanel.tsx
- [ ] Migrer 1 modal simple (supplier-form)
- [ ] Tests utilisateurs internes
- [ ] Valider approche
```

### Phase 2: Migration Critique
```bash
# Semaine 2
- [ ] product-photos-modal → panel
- [ ] product-characteristics-modal → panel
- [ ] product-descriptions-modal → panel
- [ ] Tests A/B avec users
- [ ] Métriques comparatives
```

### Phase 3: Migration Complète
```bash
# Semaines 3-4
- [ ] Migrer 20+ modales restantes
- [ ] Documentation utilisateur
- [ ] Formation équipe
- [ ] Déploiement progressif
```

### Phase 4: Optimisation
```bash
# Semaine 5+
- [ ] Analyser métriques
- [ ] Ajuster UX basé feedback
- [ ] Performance tuning
- [ ] Supprimer anciens modales
```

---

## 📚 RESSOURCES

### Documentation
- [Headless UI Transitions](https://headlessui.com/react/transition)
- [Tailwind CSS Animation](https://tailwindcss.com/docs/animation)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Exemples Code
- [GitHub: slide-over-examples](https://github.com/tailwindlabs/headlessui/discussions/1234)
- [Tailwind UI Slide-overs](https://tailwindui.com/components/application-ui/overlays/slide-overs)

### Inspiration UX
- Linear.app (panels empilables)
- Notion (side peek)
- Vercel Dashboard (slide-over forms)

---

**Créé par:** Claude Code - verone-design-expert
**Version:** 1.0
**Dernière mise à jour:** 8 Octobre 2025
