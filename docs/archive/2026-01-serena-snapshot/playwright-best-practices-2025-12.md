# Playwright MCP - Bonnes Pratiques (2025-12)

## Problème Résolu

Les sessions Claude Code étaient constamment coupées à cause du message `[OUTPUT TRUNCATED - exceeded 4000 token limit]` lors des appels `browser_snapshot` qui génèrent énormément de texte (tout le DOM de la page).

## Règles Obligatoires

### ❌ ÉVITER : browser_snapshot pour les vérifications

```typescript
// ❌ Génère ~10,000+ tokens, souvent tronqué
mcp__playwright__browser_snapshot();
```

### ✅ PRÉFÉRER : Outils légers et ciblés

#### 1. Screenshots pour vérifications visuelles

```typescript
// ✅ Léger, visuel, pas de troncature
mcp__playwright__browser_take_screenshot();

// Avec élément ciblé
mcp__playwright__browser_take_screenshot({
  element: 'Section commandes',
  ref: 'e123',
});
```

#### 2. Evaluate pour extraire données ciblées

```typescript
// ✅ Extraire uniquement les données nécessaires
mcp__playwright__browser_evaluate({
  function: `() => {
    return Array.from(document.querySelectorAll('.order-number'))
      .map(el => el.textContent);
  }`,
});

// ✅ Compter des éléments
mcp__playwright__browser_evaluate({
  function: `() => document.querySelectorAll('tr.order-row').length`,
});

// ✅ Vérifier présence d'erreurs
mcp__playwright__browser_evaluate({
  function: `() => {
    const errors = document.querySelectorAll('.error, [class*="error"]');
    return errors.length > 0 ? Array.from(errors).map(e => e.textContent) : [];
  }`,
});
```

#### 3. Console messages pour debugging

```typescript
// ✅ Vérifier erreurs console (léger)
mcp__playwright__browser_console_messages({ onlyErrors: true });
```

### Quand utiliser browser_snapshot ?

- **Uniquement** quand on a besoin de trouver les `ref` pour interagir avec des éléments
- **Avant** de cliquer/remplir un formulaire pour obtenir les références exactes
- **Jamais** pour simplement "vérifier" qu'une page fonctionne

## Workflow Recommandé

```typescript
// 1. Navigation
mcp__playwright__browser_navigate('http://localhost:3000/page');

// 2. Vérification rapide (sans snapshot)
mcp__playwright__browser_console_messages({ onlyErrors: true });
mcp__playwright__browser_take_screenshot();

// 3. Si besoin d'interagir, ALORS snapshot pour obtenir refs
mcp__playwright__browser_snapshot();

// 4. Interaction
mcp__playwright__browser_click({ element: 'Bouton', ref: 'e42' });

// 5. Vérification post-action avec screenshot
mcp__playwright__browser_take_screenshot();
```

## Règles de Limitation des Retours

### Limiter les données extraites

```typescript
// ❌ Jamais de dump complet
browser_evaluate({ function: `() => document.body.innerHTML` });

// ✅ Limiter à 20 items max
browser_evaluate({
  function: `() => {
    const items = Array.from(document.querySelectorAll('.item'));
    return items.slice(0, 20).map(i => i.textContent);
  }`,
});

// ✅ Extraire uniquement les métriques nécessaires
browser_evaluate({
  function: `() => ({
    count: document.querySelectorAll('.order').length,
    total: document.querySelector('.total')?.textContent
  })`,
});
```

### Utiliser /compact proactivement

- Si multiples navigations dans une session → `/compact` avant de continuer
- Si erreur "context too long" → `/compact` immédiat

## Impact

- Réduction de ~80% des tokens utilisés par Playwright
- Sessions plus longues sans coupure
- Meilleure expérience utilisateur
- `/compact` fonctionne sans erreur "Tool names must be unique"

---

Créé : 2025-12-17
Contexte : Sessions coupées fréquemment lors exploration LinkMe/Bubble
