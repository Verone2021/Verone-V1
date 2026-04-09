# Multi-Agent Workflow

## Principe

- **Romeo = Coordinateur** : cree les branches, decide qui travaille ou
- **Chaque Agent Claude = Specialist** : travaille sur UNE branche, ne switch JAMAIS

## Regles

- Agent ne cree JAMAIS de branche sans autorisation Romeo
- Agent ne switch JAMAIS vers une autre branche
- Agent push regulierement (save points)
- Romeo merge via PR quand feature complete

## Sessions Paralleles

Impossible de travailler sur 2 branches simultanement dans meme repo.
Option recommandee : sessions sequentielles (feature 1 → push → PR → feature 2).
