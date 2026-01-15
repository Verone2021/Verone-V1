#!/bin/bash
# Génère INDEX.md depuis les fichiers tasks/*.md

echo "# Tasks Index" > .tasks/INDEX.md
echo "" >> .tasks/INDEX.md
echo "| ID | Status | Priority | Commits |" >> .tasks/INDEX.md
echo "|----|--------|----------|---------|" >> .tasks/INDEX.md

for file in .tasks/*.md; do
  [[ "$file" == *"INDEX.md"* ]] && continue
  [[ "$file" == *"TEMPLATE.md"* ]] && continue

  id=$(grep "^id:" "$file" | cut -d: -f2 | xargs)
  status=$(grep "^status:" "$file" | cut -d: -f2 | xargs)
  priority=$(grep "^priority:" "$file" | cut -d: -f2 | xargs)
  commits=$(grep "^commits:" "$file" | cut -d: -f2 | xargs)

  echo "| $id | $status | $priority | $commits |" >> .tasks/INDEX.md
done

echo "" >> .tasks/INDEX.md
echo "Generated: $(date)" >> .tasks/INDEX.md
