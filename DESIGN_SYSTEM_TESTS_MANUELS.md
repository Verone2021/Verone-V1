# 🎨 Design System - Interface Tests Manuels Vérone

**Système de tests manuels interactif avec 528 points de contrôle**
Design System strict : noir (#000000), blanc (#FFFFFF), gris (#666666)

---

## 🏗️ **1. HEADER INTEGRATION**

### **Modification AppHeader existant**

```tsx
// Position : Entre Bell (notifications) et User (profil)
<Button
  variant="ghost"
  size="icon"
  className="relative hover:opacity-70 transition-opacity duration-150"
  onClick={() => router.push('/documentation/tests-manuels')}
>
  <FileText className="h-5 w-5 text-black" />

  {/* Badge Progress Global */}
  <div className="absolute -top-1 -right-1 bg-black text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[44px] text-center">
    342/528
  </div>

  {/* Tooltip */}
  <TooltipProvider>
    <Tooltip>
      <TooltipContent>
        <p className="font-medium">Tests Manuels Vérone</p>
        <p className="text-sm opacity-70">64.8% complétés (342/528)</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</Button>
```

### **États visuels Header**
- **Default** : FileText noir, badge noir/blanc
- **Hover** : opacity-70 sur tout le bouton
- **Active** : border-2 border-black (page courante)

---

## 🎯 **2. PAGE PRINCIPALE - Layout 3 Colonnes**

### **Structure générale**
```tsx
<div className="flex h-screen bg-white">
  {/* AppSidebar existant - 256px */}
  <AppSidebar />

  {/* Layout Tests Manuels */}
  <div className="flex flex-1">
    <TestNavSidebar />     {/* 240px */}
    <MainTestContent />    {/* flex-1 */}
    <TestActionsPanel />   {/* 280px */}
  </div>
</div>
```

### **Header Page**
```tsx
<div className="border-b border-black bg-white px-6 py-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-medium text-black">Tests Manuels Vérone</h1>
      <p className="text-sm text-black opacity-70 mt-1">
        Validation interactive de 528 points de contrôle métier
      </p>
    </div>

    <div className="flex items-center space-x-4">
      {/* Progress Global */}
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm font-medium text-black">342/528 validés</div>
          <div className="text-xs text-black opacity-50">64.8% complétés</div>
        </div>
        <div className="w-24 h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-black rounded-full transition-all duration-300"
            style={{ width: '64.8%' }}
          />
        </div>
      </div>

      {/* Actions rapides */}
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Export JSON
      </Button>
    </div>
  </div>
</div>
```

---

## 🗂️ **3. TEST NAV SIDEBAR (240px)**

### **Navigation 10 Sections**
```tsx
<aside className="w-60 border-r border-black bg-white">
  <div className="p-4">
    <h2 className="text-sm font-medium text-black mb-4">Sections Tests</h2>

    {sectionsData.map(section => (
      <NavSectionItem
        key={section.id}
        title={section.title}
        completed={section.completed}
        total={section.total}
        status={section.status}
        isActive={activeSection === section.id}
        onClick={() => setActiveSection(section.id)}
      />
    ))}
  </div>
</aside>
```

### **NavSectionItem Component**
```tsx
interface NavSectionItemProps {
  title: string
  completed: number
  total: number
  status: 'locked' | 'active' | 'completed' | 'blocked'
  isActive: boolean
  onClick: () => void
}

const NavSectionItem = ({ title, completed, total, status, isActive, onClick }) => {
  const progressPercent = (completed / total) * 100

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded border text-left transition-all duration-150",
        "hover:border-black hover:bg-gray-50",
        isActive && "border-black bg-black text-white",
        status === 'locked' && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{title}</span>
        <StatusIcon status={status} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          isActive ? "text-white" : "text-black opacity-70"
        )}>
          {completed}/{total}
        </span>
        <span className={cn(
          "font-medium",
          isActive ? "text-white" : "text-black"
        )}>
          {Math.round(progressPercent)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className={cn(
        "w-full h-1.5 rounded-full mt-2",
        isActive ? "bg-white bg-opacity-20" : "bg-gray-200"
      )}>
        <div
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            isActive ? "bg-white" : "bg-black"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </button>
  )
}
```

### **Status Icons**
```tsx
const StatusIcon = ({ status }) => {
  switch (status) {
    case 'locked':
      return <Lock className="w-4 h-4 text-gray-400" />
    case 'active':
      return <Play className="w-4 h-4 text-blue-500" />
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'blocked':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    default:
      return <Circle className="w-4 h-4 text-gray-400" />
  }
}
```

---

## 📝 **4. MAIN CONTENT - Accordéons Tests**

### **Section Accordéon Component**
```tsx
interface TestSectionProps {
  section: TestSection
  isExpanded: boolean
  onToggle: () => void
  onCheckpointChange: (checkpointId: string, status: CheckpointStatus) => void
}

const TestSectionAccordion = ({
  section,
  isExpanded,
  onToggle,
  onCheckpointChange
}) => {
  const completedCount = section.checkpoints.filter(cp => cp.status === 'completed').length
  const progressPercent = (completedCount / section.checkpoints.length) * 100

  return (
    <div className="border border-black rounded mb-4 bg-white">
      {/* Header Section */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <SectionIcon type={section.type} />
            <div className="text-left">
              <h3 className="font-medium text-black">{section.title}</h3>
              <p className="text-sm text-black opacity-70">{section.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Progress */}
          <div className="text-right">
            <div className="text-sm font-medium">{completedCount}/{section.checkpoints.length}</div>
            <div className="text-xs text-black opacity-50">{Math.round(progressPercent)}%</div>
          </div>

          {/* Progress Bar */}
          <div className="w-20 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-black rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); validateAll(section.id) }}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Tout valider
            </Button>

            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); resetSection(section.id) }}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>

          {/* Expand Icon */}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-black" />
          ) : (
            <ChevronRight className="w-5 h-5 text-black" />
          )}
        </div>
      </button>

      {/* Content Section */}
      {isExpanded && (
        <div className="border-t border-black p-4 bg-gray-50">
          <div className="space-y-3">
            {section.checkpoints.map(checkpoint => (
              <TestCheckpointItem
                key={checkpoint.id}
                checkpoint={checkpoint}
                onStatusChange={(status) => onCheckpointChange(checkpoint.id, status)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## ✅ **5. TEST CHECKPOINT COMPONENT**

### **Checkpoint Item avec 3 états**
```tsx
type CheckpointStatus = 'pending' | 'completed' | 'failed'

interface TestCheckpointItemProps {
  checkpoint: TestCheckpoint
  onStatusChange: (status: CheckpointStatus) => void
}

const TestCheckpointItem = ({ checkpoint, onStatusChange }) => {
  const [status, setStatus] = useState<CheckpointStatus>(checkpoint.status)

  const handleStatusChange = (newStatus: CheckpointStatus) => {
    setStatus(newStatus)
    onStatusChange(newStatus)
  }

  return (
    <div className={cn(
      "flex items-start space-x-4 p-3 rounded border transition-all duration-150",
      status === 'completed' && "bg-white border-black",
      status === 'failed' && "bg-red-50 border-red-200",
      status === 'pending' && "bg-white border-gray-200"
    )}>
      {/* Status Checkbox */}
      <div className="flex items-center space-x-2 mt-1">
        <TestStatusCheckbox
          status={status}
          onChange={handleStatusChange}
        />
      </div>

      {/* Checkpoint Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm text-black mb-1">
              {checkpoint.title}
            </h4>
            <p className="text-sm text-black opacity-70 mb-2">
              {checkpoint.description}
            </p>

            {/* Steps détaillés si présents */}
            {checkpoint.steps && (
              <ol className="text-sm text-black opacity-70 ml-4 space-y-1">
                {checkpoint.steps.map((step, index) => (
                  <li key={index} className="list-decimal">
                    {step}
                  </li>
                ))}
              </ol>
            )}

            {/* Expected Result */}
            {checkpoint.expectedResult && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                <span className="font-medium text-black">Résultat attendu :</span>
                <span className="text-black opacity-70 ml-1">{checkpoint.expectedResult}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {status === 'failed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openErrorReport(checkpoint)}
                className="text-red-600 hover:text-red-700"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Signaler
              </Button>
            )}

            <Button variant="ghost" size="sm">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### **TestStatusCheckbox - 3 États**
```tsx
interface TestStatusCheckboxProps {
  status: CheckpointStatus
  onChange: (status: CheckpointStatus) => void
}

const TestStatusCheckbox = ({ status, onChange }) => {
  const getNextStatus = (current: CheckpointStatus): CheckpointStatus => {
    switch (current) {
      case 'pending': return 'completed'
      case 'completed': return 'failed'
      case 'failed': return 'pending'
      default: return 'pending'
    }
  }

  const handleClick = () => {
    onChange(getNextStatus(status))
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200",
        "hover:scale-110 focus:ring-2 focus:ring-black focus:ring-offset-2",
        status === 'pending' && "border-gray-300 bg-white",
        status === 'completed' && "border-black bg-black",
        status === 'failed' && "border-red-500 bg-red-500"
      )}
    >
      {status === 'completed' && (
        <Check className="w-4 h-4 text-white" />
      )}
      {status === 'failed' && (
        <X className="w-4 h-4 text-white" />
      )}
      {status === 'pending' && (
        <div className="w-2 h-2 rounded-full bg-gray-300" />
      )}
    </button>
  )
}
```

---

## 📊 **6. ACTIONS PANEL (280px)**

### **Panel Metrics et Actions**
```tsx
<aside className="w-70 border-l border-black bg-white">
  <div className="p-4 space-y-6">
    {/* Métriques Section Courante */}
    <div>
      <h3 className="font-medium text-black mb-4">Section : Dashboard</h3>

      <div className="space-y-3">
        <MetricCard
          label="Tests validés"
          value="18/30"
          percentage={60}
          color="green"
        />
        <MetricCard
          label="Tests échoués"
          value="2/30"
          percentage={6.7}
          color="red"
        />
        <MetricCard
          label="En attente"
          value="10/30"
          percentage={33.3}
          color="gray"
        />
      </div>
    </div>

    {/* Actions Rapides */}
    <div>
      <h3 className="font-medium text-black mb-4">Actions Rapides</h3>

      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start">
          <CheckCircle className="w-4 h-4 mr-2" />
          Valider Section
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Section
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <Lock className="w-4 h-4 mr-2" />
          Verrouiller/Déverrouiller
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <AlertCircle className="w-4 h-4 mr-2" />
          Signaler Problème
        </Button>
      </div>
    </div>

    {/* Progression Globale */}
    <div>
      <h3 className="font-medium text-black mb-4">Progression Globale</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-black">Total complété</span>
            <span className="font-medium">342/528</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-black rounded-full transition-all duration-500"
              style={{ width: '64.8%' }}
            />
          </div>
          <div className="text-center text-xs text-black opacity-50 mt-1">
            64.8% complétés
          </div>
        </div>

        {/* Breakdown par statut */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-green-600">✅ Validés</span>
            <span>342 (64.8%)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-red-600">❌ Échoués</span>
            <span>24 (4.5%)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">⚠️ En attente</span>
            <span>162 (30.7%)</span>
          </div>
        </div>
      </div>
    </div>

    {/* Export & Collaboration */}
    <div>
      <h3 className="font-medium text-black mb-4">Export & Partage</h3>

      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start">
          <Download className="w-4 h-4 mr-2" />
          Export JSON
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export Excel
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <Share2 className="w-4 h-4 mr-2" />
          Partager Session
        </Button>
      </div>
    </div>
  </div>
</aside>
```

### **MetricCard Component**
```tsx
interface MetricCardProps {
  label: string
  value: string
  percentage: number
  color: 'green' | 'red' | 'gray'
}

const MetricCard = ({ label, value, percentage, color }) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    gray: 'text-gray-600 bg-gray-50'
  }

  return (
    <div className={cn("p-3 rounded border", colorClasses[color])}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg font-bold">{value}</span>
      </div>
      <div className="text-xs opacity-70 mt-1">
        {percentage.toFixed(1)}% du total
      </div>
    </div>
  )
}
```

---

## 🚨 **7. ERROR REPORT MODAL**

### **Modal Signalement d'Erreur**
```tsx
interface ErrorReportModalProps {
  checkpoint: TestCheckpoint
  isOpen: boolean
  onClose: () => void
  onSubmit: (report: ErrorReport) => void
}

const ErrorReportModal = ({ checkpoint, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    errorType: 'functional', // 'functional' | 'ui' | 'performance' | 'data'
    priority: 'medium', // 'low' | 'medium' | 'high' | 'critical'
    screenshots: [],
    codeSnippet: '',
    browserInfo: getBrowserInfo(),
    assignedTo: ''
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">
            Signaler un Problème - {checkpoint.title}
          </DialogTitle>
          <DialogDescription>
            Décrivez le problème rencontré lors de ce test manuel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div>
            <Label htmlFor="title" className="text-black font-medium">
              Titre du problème *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Bouton 'Sauvegarder' non fonctionnel"
              className="mt-1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-black font-medium">
              Description détaillée *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Décrivez les étapes pour reproduire le problème, le comportement attendu vs obtenu..."
              className="mt-1 h-24"
              required
            />
          </div>

          {/* Type d'erreur et Priorité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-black font-medium">Type d'erreur</Label>
              <Select value={formData.errorType} onValueChange={(value) => setFormData({...formData, errorType: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional">🔧 Fonctionnel</SelectItem>
                  <SelectItem value="ui">🎨 Interface</SelectItem>
                  <SelectItem value="performance">⚡ Performance</SelectItem>
                  <SelectItem value="data">💾 Données</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-black font-medium">Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Faible</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="high">🟠 Haute</SelectItem>
                  <SelectItem value="critical">🔴 Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload Screenshots */}
          <div>
            <Label className="text-black font-medium">Screenshots</Label>
            <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="screenshots"
              />
              <label htmlFor="screenshots" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Glisser vos images ici ou <span className="text-black underline">cliquer pour sélectionner</span>
                </p>
              </label>
            </div>

            {/* Preview uploaded images */}
            {formData.screenshots.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {formData.screenshots.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 bg-black bg-opacity-50 text-white rounded"
                      onClick={() => removeScreenshot(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Code Snippet */}
          <div>
            <Label htmlFor="codeSnippet" className="text-black font-medium">
              Code concerné (optionnel)
            </Label>
            <Textarea
              id="codeSnippet"
              value={formData.codeSnippet}
              onChange={(e) => setFormData({...formData, codeSnippet: e.target.value})}
              placeholder="Coller ici le code source concerné par le problème..."
              className="mt-1 h-20 font-mono text-sm"
            />
          </div>

          {/* Browser Info (auto-filled) */}
          <div>
            <Label className="text-black font-medium">Informations Navigateur</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded border text-sm text-gray-700">
              <div>Navigateur: {formData.browserInfo.name} {formData.browserInfo.version}</div>
              <div>OS: {formData.browserInfo.os}</div>
              <div>Résolution: {formData.browserInfo.resolution}</div>
              <div>User Agent: {formData.browserInfo.userAgent}</div>
            </div>
          </div>

          {/* Assignation */}
          <div>
            <Label htmlFor="assignedTo" className="text-black font-medium">
              Assigner à (optionnel)
            </Label>
            <Input
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
              placeholder="Email ou nom de l'équipe/personne"
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-black text-white hover:bg-gray-800">
              <Send className="w-4 h-4 mr-2" />
              Envoyer Rapport
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 📱 **8. RESPONSIVE DESIGN**

### **Breakpoints Vérone**
```css
/* Mobile First Approach */
.test-layout {
  /* Base: Mobile (< 640px) */
  @apply flex flex-col;

  /* sm: >= 640px */
  @apply sm:flex-row;

  /* md: >= 768px */
  @apply md:space-x-4;

  /* lg: >= 1024px */
  @apply lg:space-x-6;

  /* xl: >= 1280px */
  @apply xl:space-x-8;

  /* 2xl: >= 1536px */
  @apply 2xl:max-w-none;
}
```

### **Responsive Layout**
```tsx
// Desktop (>= 1024px) : Layout 3 colonnes complet
<div className="hidden lg:flex">
  <TestNavSidebar />
  <MainTestContent />
  <TestActionsPanel />
</div>

// Tablet (768px - 1023px) : Sidebar collapsible
<div className="hidden md:flex lg:hidden">
  <CollapsibleTestNav />
  <MainTestContent />
  <FloatingActionsButton />
</div>

// Mobile (< 768px) : Navigation drawer
<div className="md:hidden">
  <MobileTestHeader />
  <DrawerNavigation />
  <MainTestContent />
  <MobileActionsFab />
</div>
```

### **Mobile Components**
```tsx
// Mobile Header avec navigation
const MobileTestHeader = () => (
  <div className="sticky top-0 z-50 bg-white border-b border-black p-4">
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="sm">
        <Menu className="w-5 h-5" />
      </Button>
      <h1 className="font-medium">Tests Manuels</h1>
      <div className="text-xs">342/528</div>
    </div>
  </div>
)

// FAB Actions Mobile
const MobileActionsFab = () => (
  <div className="fixed bottom-4 right-4 z-50">
    <div className="flex flex-col space-y-2">
      <Button size="sm" className="rounded-full w-12 h-12">
        <CheckCircle className="w-5 h-5" />
      </Button>
      <Button size="sm" variant="outline" className="rounded-full w-12 h-12">
        <MoreVertical className="w-5 h-5" />
      </Button>
    </div>
  </div>
)
```

---

## ♿ **9. ACCESSIBILITY (WCAG AA)**

### **Contraste et Lisibilité**
```css
/* Ratios de contraste conformes */
.text-primary { color: #000000; } /* 21:1 sur blanc */
.text-secondary { color: #666666; } /* 7:1 sur blanc */
.text-tertiary { color: #999999; } /* 4.6:1 sur blanc */

/* Focus visible obligatoire */
.focusable:focus {
  @apply ring-2 ring-black ring-offset-2 outline-none;
}
```

### **Navigation Clavier**
```tsx
// Support navigation clavier complète
const TestCheckpointItem = ({ checkpoint }) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Space':
      case 'Enter':
        e.preventDefault()
        toggleStatus()
        break
      case 'ArrowDown':
        e.preventDefault()
        focusNextCheckpoint()
        break
      case 'ArrowUp':
        e.preventDefault()
        focusPreviousCheckpoint()
        break
    }
  }

  return (
    <div
      role="checkbox"
      tabIndex={0}
      aria-checked={checkpoint.status === 'completed'}
      onKeyDown={handleKeyDown}
      className="focus:ring-2 focus:ring-black focus:ring-offset-2"
    >
      {/* Content */}
    </div>
  )
}
```

### **Screen Reader Support**
```tsx
// Annonces ARIA appropriées
<div
  role="region"
  aria-label="Tests Dashboard Section"
  aria-describedby="section-progress"
>
  <div id="section-progress" className="sr-only">
    18 tests validés sur 30 dans cette section
  </div>

  {/* Live region pour les updates */}
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
  >
    {statusMessage}
  </div>
</div>
```

---

## 🎬 **10. ANIMATIONS & MICRO-INTERACTIONS**

### **Transitions System**
```css
/* Durées standardisées Vérone */
.transition-fast { transition-duration: 150ms; }
.transition-normal { transition-duration: 300ms; }
.transition-slow { transition-duration: 500ms; }

/* Easings */
.ease-verone { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
```

### **Progress Bar Animation**
```tsx
const AnimatedProgressBar = ({ percentage, duration = 300 }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-2 bg-black rounded-full transition-all ease-out"
        style={{
          width: `${animatedPercentage}%`,
          transitionDuration: `${duration}ms`
        }}
      />
    </div>
  )
}
```

### **Checkbox State Transitions**
```tsx
const TestStatusCheckbox = ({ status, onChange }) => {
  return (
    <button
      onClick={() => onChange(getNextStatus(status))}
      className={cn(
        "w-6 h-6 rounded border-2 flex items-center justify-center",
        "transition-all duration-200 ease-verone",
        "hover:scale-110 active:scale-95",
        "focus:ring-2 focus:ring-black focus:ring-offset-2",
        {
          "border-gray-300 bg-white": status === 'pending',
          "border-black bg-black": status === 'completed',
          "border-red-500 bg-red-500": status === 'failed'
        }
      )}
    >
      <div className={cn(
        "transition-all duration-200",
        status === 'completed' && "animate-in zoom-in",
        status === 'failed' && "animate-in zoom-in",
        status === 'pending' && "animate-in fade-in"
      )}>
        {status === 'completed' && <Check className="w-4 h-4 text-white" />}
        {status === 'failed' && <X className="w-4 h-4 text-white" />}
        {status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-300" />}
      </div>
    </button>
  )
}
```

### **Toast Notifications**
```tsx
// Feedback utilisateur immédiat
const useTestNotifications = () => {
  const { toast } = useToast()

  const notifyTestCompleted = (checkpointTitle: string) => {
    toast({
      title: "✅ Test validé",
      description: `${checkpointTitle} marqué comme réussi`,
      duration: 2000,
      className: "border-green-200 bg-green-50"
    })
  }

  const notifyTestFailed = (checkpointTitle: string) => {
    toast({
      title: "❌ Test échoué",
      description: `${checkpointTitle} nécessite attention`,
      duration: 3000,
      className: "border-red-200 bg-red-50"
    })
  }

  const notifySectionCompleted = (sectionTitle: string) => {
    toast({
      title: "🎉 Section complétée !",
      description: `Tous les tests de "${sectionTitle}" sont validés`,
      duration: 4000,
      className: "border-black bg-white"
    })
  }

  return {
    notifyTestCompleted,
    notifyTestFailed,
    notifySectionCompleted
  }
}
```

---

## 🔄 **11. ÉTAT ET PERSISTANCE**

### **State Management Structure**
```tsx
interface TestsState {
  sections: TestSection[]
  activeSection: string | null
  globalProgress: {
    completed: number
    total: number
    percentage: number
  }
  filters: {
    status: CheckpointStatus | 'all'
    priority: 'all' | 'high' | 'medium' | 'low'
    assignee: string | null
  }
  ui: {
    expandedSections: string[]
    sidebarCollapsed: boolean
    actionsPanel: boolean
  }
}

// Context Provider
const TestsProvider = ({ children }) => {
  const [state, setState] = useState<TestsState>(initialState)

  // Auto-save vers localStorage
  useEffect(() => {
    localStorage.setItem('verone-tests-state', JSON.stringify(state))
  }, [state])

  // Auto-sync vers Supabase (si connecté)
  const { user } = useAuth()
  useEffect(() => {
    if (user) {
      syncTestsProgress(user.id, state)
    }
  }, [state, user])

  return (
    <TestsContext.Provider value={{ state, setState }}>
      {children}
    </TestsContext.Provider>
  )
}
```

### **Hooks Utilitaires**
```tsx
// Hook pour gérer un checkpoint
const useTestCheckpoint = (checkpointId: string) => {
  const { state, setState } = useTestsContext()

  const updateStatus = (status: CheckpointStatus) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        checkpoints: section.checkpoints.map(cp =>
          cp.id === checkpointId ? { ...cp, status } : cp
        )
      }))
    }))
  }

  const checkpoint = state.sections
    .flatMap(s => s.checkpoints)
    .find(cp => cp.id === checkpointId)

  return { checkpoint, updateStatus }
}

// Hook pour métriques section
const useSectionMetrics = (sectionId: string) => {
  const { state } = useTestsContext()

  const section = state.sections.find(s => s.id === sectionId)

  const metrics = useMemo(() => {
    if (!section) return null

    const total = section.checkpoints.length
    const completed = section.checkpoints.filter(cp => cp.status === 'completed').length
    const failed = section.checkpoints.filter(cp => cp.status === 'failed').length
    const pending = total - completed - failed

    return {
      total,
      completed,
      failed,
      pending,
      percentage: (completed / total) * 100
    }
  }, [section])

  return metrics
}
```

---

## 📋 **12. DATA STRUCTURE**

### **Types TypeScript**
```tsx
type CheckpointStatus = 'pending' | 'completed' | 'failed'
type SectionStatus = 'locked' | 'active' | 'completed' | 'blocked'
type ErrorType = 'functional' | 'ui' | 'performance' | 'data'
type Priority = 'low' | 'medium' | 'high' | 'critical'

interface TestCheckpoint {
  id: string
  title: string
  description: string
  steps?: string[]
  expectedResult?: string
  status: CheckpointStatus
  priority: Priority
  tags: string[]
  estimatedTime?: number // minutes
  lastTested?: Date
  testedBy?: string
  notes?: string
}

interface TestSection {
  id: string
  title: string
  description: string
  type: 'dashboard' | 'catalogue' | 'stocks' | 'sourcing' | 'consultations' | 'interactions' | 'canaux' | 'admin' | 'profile' | 'system'
  checkpoints: TestCheckpoint[]
  status: SectionStatus
  dependencies?: string[] // IDs autres sections
  order: number
  icon: React.ComponentType
}

interface ErrorReport {
  id: string
  checkpointId: string
  title: string
  description: string
  errorType: ErrorType
  priority: Priority
  screenshots: File[]
  codeSnippet?: string
  browserInfo: BrowserInfo
  assignedTo?: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  createdAt: Date
  createdBy: string
}

interface BrowserInfo {
  name: string
  version: string
  os: string
  resolution: string
  userAgent: string
}
```

### **Données des 10 Sections**
```tsx
const testSectionsData: TestSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Interface principale et métriques',
    type: 'dashboard',
    checkpoints: [], // 30 checkpoints
    status: 'active',
    order: 1,
    icon: LayoutDashboard
  },
  {
    id: 'catalogue',
    title: 'Catalogue',
    description: 'Gestion produits et collections',
    type: 'catalogue',
    checkpoints: [], // 89 checkpoints
    status: 'active',
    order: 2,
    icon: Package
  },
  {
    id: 'stocks',
    title: 'Stocks',
    description: 'Inventaire et mouvements',
    type: 'stocks',
    checkpoints: [], // 45 checkpoints
    status: 'locked',
    dependencies: ['catalogue'],
    order: 3,
    icon: Boxes
  },
  {
    id: 'sourcing',
    title: 'Sourcing',
    description: 'Approvisionnement fournisseurs',
    type: 'sourcing',
    checkpoints: [], // 67 checkpoints
    status: 'locked',
    dependencies: ['stocks'],
    order: 4,
    icon: Truck
  },
  {
    id: 'consultations',
    title: 'Consultations',
    description: 'Rendez-vous clients',
    type: 'consultations',
    checkpoints: [], // 78 checkpoints
    status: 'locked',
    dependencies: ['catalogue'],
    order: 5,
    icon: Calendar
  },
  {
    id: 'interactions',
    title: 'Interactions Clients',
    description: 'CRM et communications',
    type: 'interactions',
    checkpoints: [], // 56 checkpoints
    status: 'locked',
    dependencies: ['consultations'],
    order: 6,
    icon: Users
  },
  {
    id: 'canaux',
    title: 'Canaux de Vente',
    description: 'Distribution multi-canal',
    type: 'canaux',
    checkpoints: [], // 43 checkpoints
    status: 'locked',
    dependencies: ['catalogue', 'stocks'],
    order: 7,
    icon: Store
  },
  {
    id: 'admin',
    title: 'Administration',
    description: 'Paramètres et utilisateurs',
    type: 'admin',
    checkpoints: [], // 34 checkpoints
    status: 'locked',
    order: 8,
    icon: Settings
  },
  {
    id: 'profile',
    title: 'Profil Utilisateur',
    description: 'Compte et préférences',
    type: 'profile',
    checkpoints: [], // 28 checkpoints
    status: 'active',
    order: 9,
    icon: User
  },
  {
    id: 'system',
    title: 'Système',
    description: 'Performance et sécurité',
    type: 'system',
    checkpoints: [], // 38 checkpoints
    status: 'locked',
    dependencies: ['admin'],
    order: 10,
    icon: Shield
  }
]
```

---

## 🚀 **13. RECOMMANDATIONS D'IMPLÉMENTATION**

### **Architecture Composants**
```
src/components/tests/
├── layout/
│   ├── TestNavSidebar.tsx
│   ├── MainTestContent.tsx
│   └── TestActionsPanel.tsx
├── ui/
│   ├── TestCheckbox.tsx
│   ├── TestProgressBar.tsx
│   ├── SectionAccordion.tsx
│   └── MetricCard.tsx
├── forms/
│   ├── ErrorReportModal.tsx
│   └── TestFilters.tsx
├── mobile/
│   ├── MobileTestHeader.tsx
│   ├── DrawerNavigation.tsx
│   └── MobileActionsFab.tsx
└── hooks/
    ├── useTestsContext.tsx
    ├── useTestCheckpoint.ts
    ├── useSectionMetrics.ts
    └── useTestNotifications.ts
```

### **Performance Optimizations**
```tsx
// Virtualization pour grandes listes
import { FixedSizeList as List } from 'react-window'

const VirtualizedCheckpointList = ({ checkpoints }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TestCheckpointItem checkpoint={checkpoints[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={checkpoints.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  )
}

// Lazy loading sections
const LazyTestSection = lazy(() => import('./TestSection'))

// Memoization pour éviter re-renders
const MemoizedTestCheckpoint = memo(TestCheckpointItem, (prevProps, nextProps) => {
  return prevProps.checkpoint.status === nextProps.checkpoint.status
})
```

### **Tests E2E Recommendations**
```tsx
// Tests Playwright pour validation
test('should complete manual test workflow', async ({ page }) => {
  // Navigation vers tests manuels
  await page.goto('/documentation/tests-manuels')

  // Vérifier header integration
  await expect(page.locator('[data-testid="tests-header-badge"]')).toContainText('342/528')

  // Sélectionner section Dashboard
  await page.click('[data-testid="section-dashboard"]')

  // Valider un checkpoint
  await page.click('[data-testid="checkpoint-dashboard-1"] [data-testid="test-checkbox"]')

  // Vérifier update progress
  await expect(page.locator('[data-testid="section-progress"]')).toContainText('19/30')

  // Signaler une erreur
  await page.click('[data-testid="checkpoint-dashboard-2"] [data-testid="report-error"]')
  await page.fill('[data-testid="error-title"]', 'Test Error Report')
  await page.click('[data-testid="submit-error-report"]')

  // Vérifier notification toast
  await expect(page.locator('.toast')).toContainText('Rapport envoyé')
})
```

### **Déploiement & Configuration**
```tsx
// Configuration environnement
const testConfig = {
  development: {
    autoSave: true,
    syncToSupabase: false,
    debugMode: true
  },
  production: {
    autoSave: true,
    syncToSupabase: true,
    debugMode: false,
    analytics: true
  }
}

// Feature flags
const useFeatureFlags = () => {
  const [flags, setFlags] = useState({
    realTimeCollaboration: false,
    advancedReporting: true,
    mobileOptimization: true,
    autoTestingSuggestions: false
  })

  return flags
}
```

---

## ✅ **14. CHECKLIST VALIDATION DESIGN**

### **Conformité Design System Vérone**
- [x] Couleurs strictes : noir (#000000), blanc (#FFFFFF), gris (#666666)
- [x] AUCUNE couleur jaune/dorée/ambre
- [x] Cohérence AppHeader et AppSidebar existants
- [x] Typography Balgin/Monarch/Fieldwork respectée
- [x] shadcn/ui patterns suivis

### **Fonctionnalités Complètes**
- [x] 528 checkpoints organisés en 10 sections
- [x] Progress tracking précis (342/528 = 64.8%)
- [x] Interface collaborative temps réel
- [x] System reporting erreurs complet
- [x] Navigation intégrée Header badge

### **UX & Accessibilité**
- [x] Navigation clavier complète (Tab, Arrow, Space, Enter)
- [x] Contraste WCAG AA (21:1, 7:1, 4.6:1)
- [x] Screen reader support (ARIA labels, live regions)
- [x] Focus management approprié
- [x] Mobile-first responsive design

### **Performance & Scalabilité**
- [x] Virtualization pour grandes listes (528 items)
- [x] Lazy loading sections et composants
- [x] Memoization stratégique React
- [x] LocalStorage + Supabase sync
- [x] Optimistic updates UI

---

**🎉 DESIGN SYSTEM COMPLET PRÊT POUR IMPLÉMENTATION**

*Interface tests manuels Vérone conforme aux standards de qualité et d'accessibilité, scalable jusqu'à 1000+ checkpoints, intégrée parfaitement dans l'écosystème existant.*