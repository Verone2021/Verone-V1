#!/usr/bin/env python3
"""
Script pour extraire et grouper les erreurs async ESLint du Back-Office
Génère des batches de fichiers à corriger par priorité
"""

import subprocess
import re
from collections import defaultdict
from pathlib import Path

def get_eslint_errors():
    """Exécute ESLint et parse les erreurs"""
    result = subprocess.run(
        ["pnpm", "--filter", "@verone/back-office", "lint"],
        capture_output=True,
        text=True,
        cwd="/Users/romeodossantos/verone-back-office-V1"
    )

    output = result.stdout + result.stderr
    return output

def parse_errors(output):
    """Parse les erreurs ESLint par fichier"""
    errors_by_file = defaultdict(lambda: {"floating": 0, "misused": 0, "console": 0, "other": 0})

    current_file = None
    for line in output.split("\n"):
        # Détecter un nouveau fichier
        if line.startswith("/Users/romeodossantos/verone-back-office-V1/apps/back-office/"):
            current_file = line.strip()
            continue

        if current_file and "error" in line:
            if "no-floating-promises" in line:
                errors_by_file[current_file]["floating"] += 1
            elif "no-misused-promises" in line:
                errors_by_file[current_file]["misused"] += 1
            elif "no-console" in line:
                errors_by_file[current_file]["console"] += 1
            else:
                errors_by_file[current_file]["other"] += 1

    return errors_by_file

def create_batches(errors_by_file, batch_size=30):
    """Crée des batches de fichiers par priorité"""
    # Calculer le score de priorité (async errors seulement)
    files_with_scores = []
    for filepath, counts in errors_by_file.items():
        async_errors = counts["floating"] + counts["misused"]
        if async_errors > 0:
            files_with_scores.append({
                "path": filepath,
                "async_errors": async_errors,
                "floating": counts["floating"],
                "misused": counts["misused"],
                "console": counts["console"],
                "other": counts["other"]
            })

    # Trier par nombre d'erreurs async décroissant
    files_with_scores.sort(key=lambda x: x["async_errors"], reverse=True)

    # Créer des batches
    batches = []
    current_batch = []
    current_batch_errors = 0

    for file_info in files_with_scores:
        if current_batch_errors + file_info["async_errors"] > batch_size and current_batch:
            batches.append(current_batch)
            current_batch = []
            current_batch_errors = 0

        current_batch.append(file_info)
        current_batch_errors += file_info["async_errors"]

    if current_batch:
        batches.append(current_batch)

    return batches

def print_batches(batches):
    """Affiche les batches de façon lisible"""
    total_async = 0

    print("=" * 80)
    print("PLAN DE CORRECTION - ERREURS ASYNC BACK-OFFICE")
    print("=" * 80)
    print()

    for i, batch in enumerate(batches, 1):
        batch_async = sum(f["async_errors"] for f in batch)
        total_async += batch_async

        print(f"📋 BATCH {i}: {batch_async} erreurs async ({len(batch)} fichiers)")
        print("-" * 80)

        for file_info in batch:
            rel_path = file_info["path"].replace("/Users/romeodossantos/verone-back-office-V1/apps/back-office/", "")
            print(f"  • {rel_path}")
            print(f"    → {file_info['floating']} floating + {file_info['misused']} misused = {file_info['async_errors']} erreurs")

        print()

    print("=" * 80)
    print(f"TOTAL: {total_async} erreurs async à corriger dans {len(batches)} batches")
    print("=" * 80)

def main():
    print("🔍 Analyse des erreurs ESLint Back-Office...")
    print()

    output = get_eslint_errors()
    errors_by_file = parse_errors(output)

    # Statistiques globales
    total_floating = sum(counts["floating"] for counts in errors_by_file.values())
    total_misused = sum(counts["misused"] for counts in errors_by_file.values())
    total_console = sum(counts["console"] for counts in errors_by_file.values())
    total_other = sum(counts["other"] for counts in errors_by_file.values())

    print(f"📊 Statistiques:")
    print(f"  - Floating promises: {total_floating}")
    print(f"  - Misused promises: {total_misused}")
    print(f"  - Console: {total_console}")
    print(f"  - Autres: {total_other}")
    print(f"  - TOTAL ASYNC: {total_floating + total_misused}")
    print()

    # Créer les batches
    batches = create_batches(errors_by_file, batch_size=30)
    print_batches(batches)

    # Sauvegarder dans un fichier
    output_file = Path("/tmp/eslint-batches-bo.txt")
    with open(output_file, "w") as f:
        for i, batch in enumerate(batches, 1):
            f.write(f"BATCH {i}\n")
            for file_info in batch:
                f.write(f"{file_info['path']}\n")
            f.write("\n")

    print()
    print(f"✅ Batches sauvegardés dans: {output_file}")

if __name__ == "__main__":
    main()
