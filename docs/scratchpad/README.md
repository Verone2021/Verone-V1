# Scratchpad — Communication inter-agents

## Regles

- Chaque fichier = 1 jour de travail ou 1 feature.
- Le coordinateur ECRIT les plans et rapports.
- Les sous-agents LISENT ce qui les concerne et ECRIVENT leur verdict.
- Aucun agent ne communique directement avec un autre.
- Apres merge de la PR, les fichiers du jour sont archives ou supprimes.

## Conventions de nommage

- `dev-plan-YYYY-MM-DD.md` : Plan avant implementation
- `dev-report-YYYY-MM-DD.md` : Rapport apres implementation
- `review-report-YYYY-MM-DD.md` : Verdict reviewer (PASS/FAIL)
- `verify-report-YYYY-MM-DD.md` : Rapport validation (types/build/tests)
- `deploy-report-YYYY-MM-DD.md` : Rapport deploiement

## Droits

| Fichier       | Qui ecrit      | Qui lit                 |
| ------------- | -------------- | ----------------------- |
| dev-plan      | coordinateur   | dev-agent               |
| dev-report    | dev-agent      | reviewer-agent          |
| review-report | reviewer-agent | coordinateur, ops-agent |
| verify-report | verify-agent   | coordinateur            |
| deploy-report | ops-agent      | coordinateur, Romeo     |
