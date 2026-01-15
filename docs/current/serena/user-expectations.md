# Attentes Utilisateur - Communication

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- CLAUDE.md
  Owner: Romeo Dos Santos
  Created: 2025-11-17
  Updated: 2026-01-10

---

## Regle Absolue

**L'utilisateur NE VEUT PAS d'options.** Il veut que je **RESOLVE les problemes directement** avec la **MEILLEURE solution professionnelle**.

---

## Ce que l'utilisateur attend

1. **Analyser le probleme en profondeur**
2. **Identifier LA meilleure solution** (pas plusieurs options)
3. **Implementer cette solution** sans demander de validation sur l'approche
4. **Suivre les best practices 2025**
5. **Code propre, scalable, maintenable**

---

## Ce que l'utilisateur NE VEUT PAS

- Proposer plusieurs options ("Option 1, Option 2, Option 3...")
- Demander quelle approche choisir
- Expliquer pourquoi quelque chose a ete fait dans le passe comme excuse
- Solutions temporaires ou "quick fixes"
- Compromis sur la qualite

---

## Ce que l'utilisateur VEUT

- Problemes resolus definitivement
- Design coherent et professionnel
- Composants parfaitement alignes
- Code qui respecte les standards 2025
- Solutions scalables et maintenables
- Pas de regression, jamais

---

## Philosophie de travail

> "Je m'en fous de ce qui a ete fait. Moi, ce que je veux c'est qu'il n'y ait plus de probleme."

**Traduction** : Si quelque chose du passe cause un probleme aujourd'hui → **LE CORRIGER**, meme si ca implique de defaire du code precedent.

---

## Communication INCORRECTE

- "Je te propose 4 options : Option 1 (rapide), Option 2 (meilleure pratique)..."
- "Quelle option preferes-tu ?"
- "On peut faire ca ou ca, a toi de choisir"

## Communication CORRECTE

- "J'ai identifie le probleme. Voici LA solution que je vais implementer : [explication claire]"
- "Je corrige le probleme d'alignement en utilisant [meilleure pratique 2025]"
- "J'applique la solution qui garantit zero regression et scalabilite maximale"

---

## En cas de vraie ambiguite technique

Si vraiment necessaire de clarifier un detail metier (ex: "Veux-tu afficher le CA HT ou TTC ?"), poser UNE question precise, pas proposer des options d'implementation.

**Difference** :

- "On peut implementer ca de 3 facons differentes, laquelle tu preferes ?" ← FAUX
- "Pour afficher le CA, tu veux HT ou TTC ?" ← CORRECT (question metier, pas technique)

---

## Standards de Qualite

- **Design System V2** : Respect strict des composants @verone/ui
- **Best Practices 2025** : React Server Components, Suspense, Streaming
- **Zero Console Errors** : Tolerance absolue zero
- **Performance** : SLOs respectes (<2s dashboard, <3s pages)
- **Accessibilite** : ARIA, keyboard navigation
- **Responsive** : Mobile-first, tous breakpoints testes

---

## Regles Absolues

1. **JAMAIS** proposer d'options techniques
2. **TOUJOURS** implementer LA meilleure solution
3. **JAMAIS** compromis sur la qualite

---

## References

- `CLAUDE.md` - Instructions projet
- `docs/current/serena/claude-code-workflow.md` - Workflow
