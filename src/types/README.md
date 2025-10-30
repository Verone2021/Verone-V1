# 📘 Vérone Types - Documentation

## Types Supabase

### Fichier principal : `database.ts`

**Source** : Généré automatiquement depuis schéma Supabase production

**⚠️ NE PAS MODIFIER MANUELLEMENT**

### Régénération des types

```bash
# Commande officielle
npx supabase gen types typescript --project-id aorroydfjsrygmosnzrl > src/types/database.ts
```

**Fréquence recommandée** :
- Après chaque migration Supabase appliquée en production
- Lorsque des erreurs TypeScript indiquent des tables/colonnes manquantes
- Au minimum 1 fois par mois

### Convention de naming

- `database.ts` : Types auto-générés Supabase (Database, Json)
- `*.ts` : Types métiers spécifiques (collections, variants, etc.)

### Historique

- **2025-10-28** : Consolidation `database.ts` (226K, 7151 lignes)
  - Suppression `supabase.ts` redondant
  - Ajout virgule manquante ligne 14 (fix parsing Database type)
  - Source : Supabase production via CLI

---

**Mainteneur** : Romeo Dos Santos
**Dernière mise à jour** : 2025-10-28
