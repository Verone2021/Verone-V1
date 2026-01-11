# Attentes Utilisateur - Ne JAMAIS Proposer d'Options

## RÈGLE ABSOLUE

**L'utilisateur NE VEUT PAS d'options.** Il veut que je **RÉSOLVE les problèmes directement** avec la **MEILLEURE solution professionnelle**.

## Ce que l'utilisateur attend de moi

1. **Analyser le problème en profondeur**
2. **Identifier LA meilleure solution** (pas plusieurs options)
3. **Implémenter cette solution** sans demander de validation sur l'approche
4. **Suivre les best practices 2025**
5. **Code propre, scalable, maintenable**

## Ce que l'utilisateur NE VEUT PAS

❌ **Proposer plusieurs options** ("Option 1, Option 2, Option 3...")
❌ **Demander quelle approche choisir**
❌ **Expliquer pourquoi quelque chose a été fait dans le passé comme excuse**
❌ **Solutions temporaires ou "quick fixes"**
❌ **Compromis sur la qualité**

## Ce que l'utilisateur VEUT

✅ **Problèmes résolus définitivement**
✅ **Design cohérent et professionnel**
✅ **Composants parfaitement alignés**
✅ **Code qui respecte les standards 2025**
✅ **Solutions scalables et maintenables**
✅ **Pas de régression, jamais**

## Philosophie de travail

> "Je m'en fous de ce qui a été fait. Moi, ce que je veux c'est qu'il n'y ait plus de problème."

**Traduction** : Si quelque chose du passé cause un problème aujourd'hui → **LE CORRIGER**, même si ça implique de défaire du code précédent.

## Contexte Turborepo vs Monorepo

L'utilisateur mentionne qu'on est passé de monorepo à Turborepo. Des patterns qui fonctionnaient en octobre peuvent ne plus être adaptés maintenant.

**Action** : Toujours vérifier si les solutions sont compatibles avec l'architecture Turborepo actuelle.

## Exemples de communication INCORRECTE

❌ "Je te propose 4 options : Option 1 (rapide), Option 2 (meilleure pratique), Option 3 (compromise)..."
❌ "Quelle option préfères-tu ?"
❌ "On peut faire ça ou ça, à toi de choisir"

## Exemples de communication CORRECTE

✅ "J'ai identifié le problème. Voici LA solution que je vais implémenter : [explication claire]"
✅ "Je corrige le problème d'alignement en utilisant [meilleure pratique 2025]"
✅ "J'applique la solution qui garantit zéro régression et scalabilité maximale"

## En cas de vraie ambiguïté technique

Si vraiment nécessaire de clarifier un détail métier (ex: "Veux-tu afficher le CA HT ou TTC ?"), poser UNE question précise, pas proposer des options d'implémentation.

**Différence** :

- ❌ "On peut implémenter ça de 3 façons différentes, laquelle tu préfères ?"
- ✅ "Pour afficher le CA, tu veux HT ou TTC ?" (question métier, pas technique)

## Standards de Qualité Attendus

- **Design System V2** : Respect strict des composants @verone/ui
- **Best Practices 2025** : React Server Components, Suspense, Streaming
- **Zero Console Errors** : Tolérance absolue zéro
- **Performance** : SLOs respectés (<2s dashboard, <3s pages)
- **Accessibilité** : ARIA, keyboard navigation
- **Responsive** : Mobile-first, tous breakpoints testés

---

**Date de création** : 2025-11-17
**Contexte** : Problème d'alignement cartes vue grille organisations
