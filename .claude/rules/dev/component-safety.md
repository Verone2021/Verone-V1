# Component Safety Rules — ZERO Swap, Targeted Fixes Only

## CRITICAL : No Component Swaps or Full Replacements

### Rule 1: Targeted Fixes Only

- Component fixes must change le MINIMUM necessaire
- Si un fix necessite > 30 lignes changees dans un seul fichier, DEMANDER a Romeo avant
- Changer > 50% d'un fichier = rollback automatique + redemander

### Rule 2: JAMAIS swapper un composant pour un autre

- JAMAIS remplacer un import de composant par un autre composant "equivalent" d'un autre package
- JAMAIS remplacer un modal local par un modal de package (meme si "meilleur")
- Si le composant local a un bug, fixer LE BUG dans le composant local
- Si le composant local doit utiliser un composant partage, l'IMPORTER a l'interieur — pas remplacer le parent

### Rule 3: Parent Component Awareness

Avant d'editer un composant a l'interieur d'un modal/form/layout :

1. Identifier le parent (modal wrapper, form container, layout)
2. Lister 3 choses qui NE DOIVENT PAS changer (layout, spacing, imports du parent)
3. Le parent est READ-ONLY sauf si Romeo demande explicitement de le modifier

### Rule 4: Visual Verification Required

Chaque fix de composant UI DOIT inclure :

- Screenshot AVANT le changement (Playwright)
- Screenshot APRES le changement (Playwright)
- Liste de 3 elements inchanges (positions boutons, couleurs, espacement)

### Rule 5: Import Stability

- Ne PAS ajouter de nouveaux imports de packages @verone/ sauf strictement necessaire
- Ne PAS changer l'ordre ou la source des imports existants
- Nouveaux imports de package = approbation explicite Romeo

## Exemple de FIX correct vs incorrect

**CORRECT** : "Le formulaire inline de creation d'organisation dans CustomerSection.tsx n'utilise pas l'autocomplete adresse. Fix : importer et ouvrir CustomerOrganisationFormModal depuis ce meme fichier quand l'utilisateur clique 'Nouveau organisation'."

**INCORRECT** : "Le formulaire inline est obsolete. Fix : remplacer l'import de CreateLinkMeOrderModal dans CommandesClient.tsx par la version du package @verone/orders." → Casse tout le layout.
