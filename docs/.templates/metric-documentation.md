# Documentation Métrique - [Nom Métrique]

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

## Table des matières

- [Vue d'Ensemble](#vue-densemble)
- [Définition Technique](#définition-technique)
- [Formule de Calcul](#formule-de-calcul)
- [Source de Données](#source-de-données)
- [Fréquence de Mise à Jour](#fréquence-de-mise-à-jour)
- [Accès et Permissions](#accès-et-permissions)
- [Visualisation](#visualisation)
- [Dépendances](#dépendances)
- [Exemples et Cas d'Usage](#exemples-et-cas-dusage)
- [Troubleshooting](#troubleshooting)
- [Liens Connexes](#liens-connexes)

---

## Vue d'Ensemble

### Nom Technique

**Hook** : `[useNomHook]` (ex: `useTotalOrders`)
**Composant** : `[NomComposant]` (ex: `OrdersKPICard`)
**Fichier** : `/Users/romeodossantos/verone-back-office-V1/src/hooks/metrics/[nom-hook].ts`

### Description Business

[Description en langage métier de ce que mesure cette métrique - 2-3 phrases]

Exemple : "Cette métrique calcule le nombre total de commandes enregistrées dans le système, tous statuts confondus. Elle permet de suivre l'activité commerciale globale et d'identifier les tendances de croissance."

---

## Définition Technique

### Type de Métrique

- [ ] Compteur (Count)
- [ ] Somme (Sum)
- [ ] Moyenne (Average)
- [ ] Taux/Ratio (Rate/Ratio)
- [ ] Agrégat Complexe

### Unité de Mesure

**Unité** : [Nombre, €, %, Jours, etc.]
**Format d'Affichage** : [Ex: "1 234", "12,45 €", "85%"]

---

## Formule de Calcul

### Requête SQL

```sql
-- Requête principale
SELECT
  COUNT(*) as total_orders
FROM orders
WHERE
  tenant_id = :tenant_id
  AND deleted_at IS NULL
  [CONDITIONS ADDITIONNELLES]
```

### Calcul Programmatique

```typescript
// Logique dans le hook ou la fonction
const calculateMetric = (data: DataType[]): number => {
  // Étapes de calcul
  const filtered = data.filter(item => item.condition);
  const total = filtered.reduce((acc, item) => acc + item.value, 0);
  return total;
};
```

### Pseudo-Code Formule

```
[NomMétrique] = [Formule mathématique simplifiée]

Exemple:
Taux_Conversion = (Commandes_Validées / Devis_Envoyés) × 100
```

---

## Source de Données

### Tables Supabase

| Table            | Colonnes Utilisées   | Filtres Appliqués                 |
| ---------------- | -------------------- | --------------------------------- |
| `[table_name]`   | `column1`, `column2` | `tenant_id`, `deleted_at IS NULL` |
| `[table_name_2]` | `column3`            | Jointure avec `[table_name]`      |

### Triggers Associés

| Trigger          | Table Cible | Action        | Description          |
| ---------------- | ----------- | ------------- | -------------------- |
| `[trigger_name]` | `[table]`   | INSERT/UPDATE | [Description action] |

**Fichier** : `/Users/romeodossantos/verone-back-office-V1/supabase/migrations/[timestamp]_[trigger_name].sql`

---

## Fréquence de Mise à Jour

### Type de Rafraîchissement

- [ ] Temps Réel (Real-time via Supabase Realtime)
- [ ] Polling (Intervalle : [X secondes/minutes])
- [ ] On Demand (Déclenché manuellement)
- [ ] Batch (Exécution planifiée : [daily/hourly/etc.])

### Latence Attendue

**Latence cible** : < [X ms/s]
**Latence mesurée** : [X ms/s] (dernière mesure : [date])

### Cache Strategy

**Durée cache** : [X minutes/heures]
**Invalidation** : [Conditions d'invalidation]

---

## Accès et Permissions

### Par Rôle

| Rôle  | Lecture    | Modification              | Export       | Notes             |
| ----- | ---------- | ------------------------- | ------------ | ----------------- |
| Owner | ✅ Complet | ✅ Indirect (via actions) | ✅ CSV/PDF   | Accès total       |
| Admin | ✅ Complet | ❌ Lecture seule          | ⚠️ Anonymisé | Restrictions RGPD |

### RLS Policies

**Policy Lecture** : `[nom_policy]`
**Fichier** : `/Users/romeodossantos/verone-back-office-V1/supabase/migrations/[timestamp]_rls_[table].sql`

```sql
-- Exemple policy
CREATE POLICY "[policy_name]" ON [table_name]
FOR SELECT
USING (tenant_id = auth.tenant_id());
```

---

## Visualisation

### Type de Graphique

**Composant Recharts** : `[BarChart / LineChart / PieChart / AreaChart / etc.]`
**Props Spécifiques** :

```typescript
{
  dataKey: "[key_name]",
  stroke: "#3b86d1", // Vérone Primary
  fill: "url(#gradient-primary)",
  // Autres props...
}
```

### Position Dashboard

**Section** : [Haut / Milieu / Bas]
**Colonne** : [1/3, 2/3, Full width]
**Composant Container** : `[KPICard / ChartContainer / etc.]`

### Configuration Visuelle

```typescript
// Exemple configuration
const chartConfig = {
  title: '[Titre Affiché]',
  description: '[Description courte]',
  color: 'var(--verone-primary)',
  icon: '[IconName]',
  trend: {
    enabled: true,
    comparison: 'month-over-month', // ou "year-over-year"
  },
};
```

---

## Dépendances

### Métriques Liées

| Métrique Dépendante | Relation | Description                         |
| ------------------- | -------- | ----------------------------------- |
| `[useAutreMetric1]` | Input    | Utilisée dans le calcul             |
| `[useAutreMetric2]` | Output   | Calculée à partir de cette métrique |

### Modules Interconnectés

- **Module 1** : [Description interconnexion]
- **Module 2** : [Description interconnexion]

### APIs Externes

| Service        | Endpoint          | Usage         |
| -------------- | ----------------- | ------------- |
| [Service Name] | `[/api/endpoint]` | [Description] |

---

## Exemples et Cas d'Usage

### Exemple 1 : [Titre Cas d'Usage]

**Contexte** : [Description situation]

**Données d'entrée** :

```json
{
  "tenant_id": "uuid-example",
  "date_range": "2025-01-01 to 2025-10-16",
  "filters": { "status": "validated" }
}
```

**Résultat attendu** :

```json
{
  "metric_value": 1234,
  "trend": "+15%",
  "comparison_period": "previous_month"
}
```

**Interprétation Business** : [Explication résultat]

---

### Exemple 2 : [Titre Cas d'Usage]

[Même structure que Exemple 1]

---

## Troubleshooting

### Problèmes Courants

#### Erreur 1 : [Titre Erreur]

**Symptôme** : [Description]
**Cause probable** : [Raison]
**Solution** :

1. [Étape 1]
2. [Étape 2]

#### Erreur 2 : [Titre Erreur]

**Symptôme** : [Description]
**Cause probable** : [Raison]
**Solution** :

1. [Étape 1]

### Performance Issues

**Seuil alerte** : Calcul > [X ms/s]
**Optimisations appliquées** :

- [Optimisation 1]
- [Optimisation 2]

### Validation Données

**Contraintes** :

- [ ] Valeur >= 0 (pas de négatifs)
- [ ] Type Number/BigInt
- [ ] Précision décimale : [X chiffres]

---

## Liens Connexes

### Documentation Technique

- [Hook Implementation](/Users/romeodossantos/verone-back-office-V1/src/hooks/metrics/[nom-hook].ts)
- [Trigger SQL](/Users/romeodossantos/verone-back-office-V1/supabase/migrations/[timestamp]_trigger.sql)
- [Composant Visualisation](/Users/romeodossantos/verone-back-office-V1/src/components/dashboard/[component-name].tsx)

### Documentation Business

- [Business Rules - Metrics](/Users/romeodossantos/verone-back-office-V1/manifests/business-rules/METRICS.md)
- [Dashboard PRD](/Users/romeodossantos/verone-back-office-V1/manifests/prd/DASHBOARD.md)

### Ressources Connexes

- [Schéma Database](/Users/romeodossantos/verone-back-office-V1/docs/database/schema-overview.md)
- [Calculs Formules](/Users/romeodossantos/verone-back-office-V1/docs/metrics/calculations.md)
- [Dashboard KPIs Overview](/Users/romeodossantos/verone-back-office-V1/docs/metrics/dashboard-kpis.md)

---

**Retour** : [Documentation Métriques](/Users/romeodossantos/verone-back-office-V1/docs/metrics/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
