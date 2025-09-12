# Want It Now - Design System Officiel

## 🎨 **Couleurs Signature**

### **Palette Primaire**
```css
/* Copper System - Couleur principale */
--copper-primary: #D4841A;
--copper-hover: #B8741A;
--copper-light: #D4841A10; /* 10% opacity */
--copper-border: #D4841A20; /* 20% opacity */

/* Green System - Couleur secondaire */  
--green-primary: #2D5A27;
--green-hover: #1F3F1C;
--green-light: #2D5A2710; /* 10% opacity */
--green-border: #2D5A2720; /* 20% opacity */

/* Gradient Signature */
--gradient-primary: linear-gradient(to right, #D4841A, #2D5A27);
--gradient-subtle: linear-gradient(to bottom right, #D4841A05, transparent, #2D5A2705);
```

### **Usage Couleurs**
- **Copper (#D4841A)** : Boutons primaires, CTA, badges actifs, accents
- **Green (#2D5A27)** : Navigation, succès, confirmations, avatars  
- **Gradient** : Éléments premium, headers importants
- **Subtle Gradient** : Backgrounds, cartes, zones délimitées

## 🧩 **Composants UI Standards**

### **Input Obligatoire avec Fond Blanc**
```tsx
// Pattern OBLIGATOIRE - tous les inputs
<Input className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11" />

// Usage avec validation
<Input 
  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
  data-testid="property-name-input"
  placeholder="Nom de la propriété"
  required
/>
```

### **Boutons System**
```tsx
// Button Primary Copper
<Button className="bg-[#D4841A] hover:bg-[#B8741A] text-white shadow-sm hover:shadow-md transition-all duration-200">
  <Plus className="w-4 h-4 mr-2" />
  Action Principale
</Button>

// Button Green (Confirmations)
<Button className="bg-[#2D5A27] hover:bg-[#1F3F1C] text-white shadow-sm hover:shadow-md transition-all duration-200">
  <CheckCircle2 className="w-4 h-4 mr-2" />
  Confirmer
</Button>

// Button Outline Copper
<Button 
  variant="outline" 
  className="border-[#D4841A] text-[#D4841A] hover:bg-[#D4841A] hover:text-white transition-all duration-200"
>
  <Edit className="w-4 h-4 mr-2" />
  Modifier
</Button>

// Button Gradient Premium
<Button className="bg-gradient-to-r from-[#D4841A] to-[#2D5A27] hover:from-[#B8741A] hover:to-[#1F3F1C] text-white shadow-lg hover:shadow-xl transition-all duration-300">
  <Star className="w-4 h-4 mr-2" />
  Premium Action
</Button>
```

### **Badges System**
```tsx
// Badge Copper
<Badge className="bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20">
  Actif
</Badge>

// Badge Green Success
<Badge className="bg-green-100 text-green-800 border-green-200">
  <CheckCircle2 className="w-3 h-3 mr-1" />
  Confirmé
</Badge>

// Badge Warning
<Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
  <Clock className="w-3 h-3 mr-1" />
  En attente
</Badge>

// Badge Error
<Badge className="bg-red-100 text-red-800 border-red-200">
  <X className="w-3 h-3 mr-1" />
  Erreur
</Badge>
```

## 📋 **Tables CRUD Avancées**

### **Pattern Table Standard**
```tsx
// Barre d'outils table
<div className="flex items-center justify-between space-x-4">
  <div className="flex items-center space-x-3">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input 
        placeholder="Rechercher..." 
        className="pl-10 w-64 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
      />
    </div>
    <Button variant="outline" size="sm">
      <Filter className="w-4 h-4 mr-2" />
      Filtres
    </Button>
  </div>
  <div className="flex items-center space-x-2">
    <Button size="sm" variant="outline">
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
    <Button size="sm" className="bg-[#D4841A] hover:bg-[#B8741A]">
      <Plus className="w-4 h-4 mr-2" />
      Ajouter
    </Button>
  </div>
</div>

// Table avec sélection multiple
<Table>
  <TableHeader className="bg-gray-50">
    <TableRow>
      <TableHead className="w-12">
        <Checkbox />
      </TableHead>
      <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors">
        <div className="flex items-center space-x-1">
          <span>Nom</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
      </TableHead>
      <TableHead>Statut</TableHead>
      <TableHead>Type</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell>
        <Checkbox />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#D4841A]/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-[#D4841A]" />
          </div>
          <span>Jean Dupont</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Actif
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
          Particulier
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end space-x-1">
          <Button size="sm" variant="ghost" className="hover:bg-blue-100">
            <Eye className="w-4 h-4 text-blue-600" />
          </Button>
          <Button size="sm" variant="ghost" className="hover:bg-[#D4841A]/10">
            <Edit className="w-4 h-4 text-[#D4841A]" />
          </Button>
          <Button size="sm" variant="ghost" className="hover:bg-red-100">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## 📝 **Formulaires Multi-étapes**

### **Pattern Wizard Standard**
```tsx
// Structure Card avec étapes
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gradient-to-r from-[#D4841A] to-[#B8741A] rounded-lg flex items-center justify-center">
        <Building className="w-4 h-4 text-white" />
      </div>
      Création Propriété - Étape 1/3
    </CardTitle>
    <CardDescription>
      Informations générales de la propriété
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="property-name">Nom de la propriété *</Label>
        <Input 
          id="property-name"
          className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
          placeholder="Villa Les Palmiers"
          data-testid="property-name-input"
        />
      </div>
      {/* Autres champs... */}
    </div>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline" disabled>
      Précédent
    </Button>
    <Button className="bg-[#D4841A] hover:bg-[#B8741A] text-white">
      Suivant
      <ChevronRight className="w-4 h-4 ml-2" />
    </Button>
  </CardFooter>
</Card>
```

## 🎭 **Navigation & Sidebar**

### **Logo Animé Want It Now**
```tsx
// Logo avec animation signature
<div className="flex items-center space-x-3 p-4">
  <div className="relative w-10 h-10">
    <div className="absolute inset-0 bg-[#D4841A] rounded-lg transform rotate-45 origin-center opacity-80 animate-pulse"></div>
    <div className="absolute inset-0 bg-[#2D5A27] rounded-lg transform -rotate-45 origin-center animate-pulse"></div>
  </div>
  <div className="flex flex-col">
    <span className="font-semibold text-gray-900">Want It Now</span>
    <span className="text-xs text-gray-500">Gestion Immobilière</span>
  </div>
</div>
```

### **États Sidebar Items**
```tsx
// Item Normal
<div className="flex items-center p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all">
  <Home className="h-4 w-4 mr-3 text-gray-500" />
  <span className="text-gray-700">Dashboard</span>
</div>

// Item Actif
<div className="flex items-center p-3 rounded-lg bg-[#D4841A]/10 border-r-2 border-[#D4841A] transition-all">
  <Users className="h-4 w-4 mr-3 text-[#D4841A]" />
  <span className="text-[#D4841A] font-medium">Propriétaires</span>
  <Badge className="ml-auto bg-[#D4841A] text-white">12</Badge>
</div>
```

## 🚨 **Messages d'État**

### **Alerts System**
```tsx
// Success Alert
<Alert className="border-green-200 bg-green-50">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  <AlertTitle className="text-green-800">Succès</AlertTitle>
  <AlertDescription className="text-green-700">
    L'opération s'est déroulée avec succès.
  </AlertDescription>
</Alert>

// Warning Alert  
<Alert className="border-yellow-200 bg-yellow-50">
  <AlertTriangle className="h-4 w-4 text-yellow-600" />
  <AlertTitle className="text-yellow-800">Attention</AlertTitle>
  <AlertDescription className="text-yellow-700">
    Cette action nécessite votre attention.
  </AlertDescription>
</Alert>

// Error Alert
<Alert className="border-red-200 bg-red-50">
  <AlertCircle className="h-4 w-4 text-red-600" />
  <AlertTitle className="text-red-800">Erreur</AlertTitle>
  <AlertDescription className="text-red-700">
    Une erreur s'est produite lors du traitement.
  </AlertDescription>
</Alert>
```

## 📱 **Responsive Design**

### **Breakpoints Standard**
```css
/* Mobile First Approach */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 0 2rem;
  }
}

/* Desktop */  
@media (min-width: 1024px) {
  .container {
    padding: 0 3rem;
  }
}
```

### **Grid Responsive**
```tsx
// Grid adaptatif
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards responsive */}
</div>

// Navigation mobile
<div className="lg:hidden">
  <Button variant="ghost" size="sm">
    <Menu className="h-4 w-4" />
  </Button>
</div>
```

## ♿ **Accessibility**

### **Standards WCAG 2.1 AA**
```tsx
// Labels obligatoires
<Label htmlFor="property-address">Adresse complète *</Label>
<Input 
  id="property-address"
  aria-describedby="address-help"
  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
/>
<div id="address-help" className="text-sm text-gray-500">
  Inclure numéro, rue, code postal et ville
</div>

// Focus visible 
.focus-visible:focus {
  outline: 2px solid #D4841A;
  outline-offset: 2px;
}

// Contraste couleurs vérifié
/* Tous les textes respectent ratio 4.5:1 minimum */
```

## 🎨 **Classes Utilitaires Custom**

### **Extensions Tailwind**
```css
/* tailwind.config.js extensions */
.modern-shadow {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.rounded-large {
  border-radius: 1rem;
}

.text-spacing {
  letter-spacing: -0.025em;
}

.transition-smooth {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

**Ce design system est la référence unique pour toute l'interface Want It Now. Tous les nouveaux composants doivent respecter ces standards.**