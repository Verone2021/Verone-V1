# Vérone - Application Métier Professionnelle

## 🏢 **Nature de l'Application**

**Vérone Back Office** est une **application métier B2B** spécialisée dans la décoration et le mobilier d'intérieur haut de gamme.

### **Caractéristiques Métier**

- **Utilisateurs** : Équipe interne Vérone (propriétaire, administrateurs, commerciaux)
- **Context** : Environnement professionnel avec authentification robuste
- **Données** : Données réelles Supabase (jamais de mock/fake data)
- **Workflow** : Processus métier complexes (catalogue → commandes → facturation)

## 👥 **Système d'Authentification**

### **Rôles Hiérarchiques**

1. **Propriétaire** (Owner) - Accès total, configuration système
2. **Administrateur** (Admin) - Gestion utilisateurs, modules principaux
3. **Commercial** - Catalogue, commandes, clients
4. **Consultation** - Lecture seule

### **RLS (Row Level Security)**

- Politiques Supabase actives sur toutes les tables
- Utilisateurs authentifiés = accès selon leur rôle
- **JAMAIS** de contournement ou de données publiques

## 🏗️ **Architecture Modulaire**

### **Modules Interconnectés**

- **Catalogue** → Produits, collections, conditionnements
- **Stock** → Disponibilités, mouvements, réservations
- **Commandes** → Devis, achats, ventes, workflow
- **Facturation** → Billing, comptabilité, exports
- **CRM** → Organisations, contacts, historique
- **Intégrations** → Brevo, Meta/Google, partenaires

### **Relations Business**

- **Organisation** (fournisseur/client) → **Contacts** (multiples)
- **Produit** → **Conditionnements** → **Stock** → **Commandes**
- **Collection** → **Produits** → **Catalogues partageables**

## 📊 **Données Métier Réelles**

### **Organisations**

- **Fournisseurs** : Fabricants, grossistes, importateurs
- **Clients Pro** : Architectes, décorateurs, entreprises
- **Clients Particuliers** : Clients finaux (limité)

### **Produits & Catalogue**

- **241 produits importés** depuis Airtable
- **Collections thématiques** pour catalogues clients
- **Conditionnements multiples** (unité, lot, palette)
- **Exports automatisés** (PDF branded, feeds Meta/Google)

### **Contacts Business**

- **Contacts fournisseurs** : Commercial, technique, facturation
- **Contacts clients** : Acheteur, décideur, prescripteur
- **Workflow** : 1 contact principal + contacts spécialisés par organisation

## 🎯 **Business Rules Critiques**

### **Validation Métier**

- Email unique par organisation (pas globalement)
- 1 seul contact principal actif par organisation
- Organisation obligatoire de type supplier/customer
- Utilisateur authentifié obligatoire (created_by)

### **Contraintes Business**

- **SLOs** : Dashboard <2s, Feeds <10s, PDF <5s
- **Intégrité** : Références organisationnelles cohérentes
- **Audit** : Traçabilité complète (created_by, timestamps)

## 🚨 **Règles Développement**

### **Données Réelles Obligatoires**

```typescript
// ❌ INTERDIT ABSOLU
const mockData = [...]
const fakeContacts = [...]

// ✅ OBLIGATOIRE
const { contacts, loading } = useContacts()
const result = await createContact(realData)
```

### **Tests Manuels Chrome**

- **Jamais** de tests automatisés Playwright/Jest
- **Toujours** tests manuels dans Chrome DevTools
- Validation avec vraies données Supabase

### **Think → Test → Code → Verify**

1. Analyser business rules dans `manifests/`
2. Tester manuellement le workflow
3. Implémenter solution minimale
4. Vérifier avec données réelles

## 💡 **Contexte Utilisateur**

Quand l'utilisateur dit "depuis la page détail fournisseur", il navigue dans :

- `src/app/contacts-organisations/suppliers/[supplierId]/page.tsx`
- Composant `ContactsManagementSection` avec `organisationId` valide
- Utilisateur authentifié comme propriétaire/admin
- Organisation existante en base de données

**Jamais d'ambiguïté** : C'est un workflow métier professionnel avec données réelles.
