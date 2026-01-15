#!/bin/bash
# Script de résolution automatique des conflits récurrents
# Utilisé par split-pr37-smart.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour résoudre les conflits dans ACTIVE.md
resolve_active_md() {
    local file=".claude/work/ACTIVE.md"

    if ! grep -q "<<<<<<< HEAD" "$file" 2>/dev/null; then
        return 0  # Pas de conflit
    fi

    log_info "Résolution automatique de $file..."

    # Stratégie : Fusionner les tâches des deux versions
    # 1. Extraire les tâches de HEAD (version actuelle)
    # 2. Extraire les tâches du commit (version incoming)
    # 3. Fusionner en évitant les doublons

    python3 << 'PYTHON_SCRIPT'
import re

with open('.claude/work/ACTIVE.md', 'r') as f:
    content = f.read()

# Extraire les sections
match = re.search(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> ([a-f0-9]+)', content, re.DOTALL)

if not match:
    print("No conflict markers found")
    exit(0)

head_content = match.group(1)
incoming_content = match.group(2)
commit_sha = match.group(3)

# Extraire les tâches (lignes commençant par - [ ] ou - [x])
def extract_tasks(text):
    return [line for line in text.split('\n') if re.match(r'^\s*-\s+\[([ x])\]', line)]

head_tasks = extract_tasks(head_content)
incoming_tasks = extract_tasks(incoming_content)

# Fusionner (incoming prend priorité, puis HEAD pour les uniques)
merged_tasks = []
seen_task_ids = set()

# D'abord les tâches incoming (nouvelles)
for task in incoming_tasks:
    # Extraire le Task ID
    task_id_match = re.search(r'(BO|LM|WEB)-[A-Z]+-\d+', task)
    if task_id_match:
        task_id = task_id_match.group(0)
        if task_id not in seen_task_ids:
            merged_tasks.append(task)
            seen_task_ids.add(task_id)
    else:
        merged_tasks.append(task)

# Puis les tâches HEAD qui ne sont pas déjà présentes
for task in head_tasks:
    task_id_match = re.search(r'(BO|LM|WEB)-[A-Z]+-\d+', task)
    if task_id_match:
        task_id = task_id_match.group(0)
        if task_id not in seen_task_ids:
            merged_tasks.append(task)
            seen_task_ids.add(task_id)

# Reconstruire le fichier
merged_text = '\n'.join(merged_tasks)

# Remplacer le conflit par la version fusionnée
result = re.sub(
    r'<<<<<<< HEAD\n.*?\n=======\n.*?\n>>>>>>> [a-f0-9]+',
    merged_text,
    content,
    flags=re.DOTALL
)

with open('.claude/work/ACTIVE.md', 'w') as f:
    f.write(result)

print("✅ ACTIVE.md conflict resolved")
PYTHON_SCRIPT

    log_success "$file résolu automatiquement"
}

# Fonction pour résoudre les conflits dans package.json
resolve_package_json() {
    local file="package.json"

    if ! grep -q "<<<<<<< HEAD" "$file" 2>/dev/null; then
        return 0  # Pas de conflit
    fi

    log_info "Résolution automatique de $file..."

    # Stratégie : Fusionner les scripts (garder les deux versions)
    python3 << 'PYTHON_SCRIPT'
import re
import json

with open('package.json', 'r') as f:
    content = f.read()

# Extraire les sections en conflit
match = re.search(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> ([a-f0-9]+)', content, re.DOTALL)

if not match:
    exit(0)

head_content = match.group(1)
incoming_content = match.group(2)

# Parser les scripts de chaque version
def extract_scripts(text):
    scripts = {}
    for line in text.split('\n'):
        # Chercher les lignes de script: "name": "command"
        script_match = re.match(r'^\s*"([^"]+)":\s*"([^"]+)"', line)
        if script_match:
            scripts[script_match.group(1)] = script_match.group(2)
    return scripts

head_scripts = extract_scripts(head_content)
incoming_scripts = extract_scripts(incoming_content)

# Fusionner (incoming écrase HEAD si même nom)
merged_scripts = {**head_scripts, **incoming_scripts}

# Reconstruire les lignes
lines = []
for i, (name, cmd) in enumerate(merged_scripts.items()):
    comma = ',' if i < len(merged_scripts) - 1 else ''
    lines.append(f'    "{name}": "{cmd}"{comma}')

merged_text = '\n'.join(lines)

# Remplacer le conflit
result = re.sub(
    r'<<<<<<< HEAD\n.*?\n=======\n.*?\n>>>>>>> [a-f0-9]+',
    merged_text,
    content,
    flags=re.DOTALL
)

with open('package.json', 'w') as f:
    f.write(result)

print("✅ package.json conflict resolved")
PYTHON_SCRIPT

    log_success "$file résolu automatiquement"
}

# Fonction pour résoudre les conflits dans CLAUDE.md
resolve_claude_md() {
    local file="CLAUDE.md"

    if ! grep -q "<<<<<<< HEAD" "$file" 2>/dev/null; then
        return 0  # Pas de conflit
    fi

    log_info "Résolution automatique de $file..."

    # Stratégie : Prendre la version incoming (plus récente)
    sed -i '' '/<<<<<<< HEAD/,/=======/{/<<<<<<< HEAD/d; /=======/d; d;}' "$file"
    sed -i '' '/>>>>>>> [a-f0-9]\{7\}/d' "$file"

    log_success "$file résolu automatiquement"
}

# Fonction principale
main() {
    local files_with_conflicts=$(git diff --name-only --diff-filter=U 2>/dev/null)

    if [ -z "$files_with_conflicts" ]; then
        log_info "Aucun conflit à résoudre"
        return 0
    fi

    log_warning "Conflits détectés sur :"
    echo "$files_with_conflicts" | sed 's/^/  - /'
    echo ""

    # Résoudre les conflits connus
    if echo "$files_with_conflicts" | grep -q "\.claude/work/ACTIVE\.md"; then
        resolve_active_md
    fi

    if echo "$files_with_conflicts" | grep -q "package\.json"; then
        resolve_package_json
    fi

    if echo "$files_with_conflicts" | grep -q "CLAUDE\.md"; then
        resolve_claude_md
    fi

    # Vérifier s'il reste des conflits non résolus
    local remaining_conflicts=$(git diff --name-only --diff-filter=U 2>/dev/null)

    if [ -n "$remaining_conflicts" ]; then
        log_error "Conflits non résolus automatiquement :"
        echo "$remaining_conflicts" | sed 's/^/  - /'
        return 1
    fi

    log_success "Tous les conflits résolus automatiquement ✓"
    return 0
}

main "$@"
