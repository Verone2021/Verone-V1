#!/usr/bin/env python3
"""
Docs Audit Apply - Apply triage actions from docs-audit-v4.sh JSON report.

Usage:
    # Dry-run (default, safe)
    python3 docs-audit-apply.py --report reports/docs-audit-v4-*.json

    # Apply archive actions
    python3 docs-audit-apply.py --report reports/docs-audit-v4-*.json --apply --mode archive

    # Apply delete actions (dangerous!)
    python3 docs-audit-apply.py --report reports/docs-audit-v4-*.json --apply --mode delete

    # With git commit
    python3 docs-audit-apply.py --report reports/docs-audit-v4-*.json --apply --commit

    # On a new branch
    python3 docs-audit-apply.py --report reports/docs-audit-v4-*.json --apply --branch chore/docs-cleanup
"""

from __future__ import annotations
import argparse
import datetime
import json
import subprocess
import sys
from pathlib import Path


def run_git(args: list[str], cwd: Path) -> tuple[int, str]:
    """Run a git command and return (returncode, output)."""
    result = subprocess.run(
        ["git"] + args,
        cwd=str(cwd),
        capture_output=True,
        text=True
    )
    return result.returncode, result.stdout.strip()


def main():
    parser = argparse.ArgumentParser(
        description="Apply docs triage actions from JSON report"
    )
    parser.add_argument(
        "--report",
        required=True,
        help="Path to docs-audit-v4 JSON report"
    )
    parser.add_argument(
        "--mode",
        choices=["archive", "delete"],
        default="archive",
        help="What to do with DELETE_CANDIDATE files (default: archive)"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually apply changes (default is dry-run)"
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Create a git commit after applying"
    )
    parser.add_argument(
        "--branch",
        default="",
        help="Create and checkout a new branch before applying"
    )
    parser.add_argument(
        "--actions",
        default="ARCHIVE,DELETE_CANDIDATE",
        help="Comma-separated list of actions to process (default: ARCHIVE,DELETE_CANDIDATE)"
    )
    args = parser.parse_args()

    # Load report
    report_path = Path(args.report)
    if not report_path.exists():
        print(f"ERROR: Report not found: {report_path}")
        sys.exit(1)

    data = json.loads(report_path.read_text(encoding="utf-8"))
    root_dir = Path(data.get("root_dir", ".")).resolve()
    docs_dir = Path(data.get("docs_dir", root_dir / "docs")).resolve()

    # Parse actions to process
    actions_to_process = set(a.strip().upper() for a in args.actions.split(","))

    # Prepare archive directory
    stamp = datetime.datetime.now().strftime("%Y-%m")
    archive_dir = docs_dir / "archives" / f"stale-{stamp}"

    # Collect files to process
    moves: list[tuple[Path, Path]] = []
    deletes: list[Path] = []

    for f in data.get("files", []):
        action = f.get("action", "KEEP")
        if action not in actions_to_process:
            continue

        rel_path = f.get("path", "")
        src = docs_dir / rel_path

        if not src.exists():
            continue

        # Skip if already in archives
        if "archives/" in rel_path:
            continue

        if action == "ARCHIVE":
            moves.append((src, archive_dir / src.name))
        elif action == "DELETE_CANDIDATE":
            if args.mode == "delete":
                deletes.append(src)
            else:
                # Archive instead of delete (safer)
                moves.append((src, archive_dir / src.name))

    # Summary
    print("=" * 60)
    print("DOCS AUDIT APPLY")
    print("=" * 60)
    print(f"Report:    {report_path}")
    print(f"Root:      {root_dir}")
    print(f"Mode:      {args.mode}")
    print(f"Actions:   {', '.join(sorted(actions_to_process))}")
    print(f"Dry-run:   {not args.apply}")
    print()
    print(f"Files to move:   {len(moves)}")
    print(f"Files to delete: {len(deletes)}")
    print()

    if not moves and not deletes:
        print("Nothing to do!")
        return

    # Preview
    if moves:
        print("MOVES (to archives/):")
        for src, dst in moves[:20]:
            print(f"  {src.relative_to(docs_dir)} -> {dst.relative_to(docs_dir)}")
        if len(moves) > 20:
            print(f"  ... and {len(moves) - 20} more")
        print()

    if deletes:
        print("DELETES (permanent!):")
        for d in deletes[:20]:
            print(f"  {d.relative_to(docs_dir)}")
        if len(deletes) > 20:
            print(f"  ... and {len(deletes) - 20} more")
        print()

    if not args.apply:
        print("-" * 60)
        print("DRY-RUN: No changes made.")
        print("Add --apply to execute these changes.")
        return

    # Create branch if requested
    if args.branch:
        code, _ = run_git(["checkout", "-b", args.branch], cwd=root_dir)
        if code != 0:
            # Branch might exist, try switching
            run_git(["checkout", args.branch], cwd=root_dir)
        print(f"Switched to branch: {args.branch}")

    # Create archive directory
    archive_dir.mkdir(parents=True, exist_ok=True)

    # Apply moves
    moved = 0
    for src, dst in moves:
        # Handle collision
        if dst.exists():
            stem = dst.stem
            suffix = dst.suffix
            ts = datetime.datetime.now().strftime("%H%M%S")
            dst = dst.with_name(f"{stem}_{ts}{suffix}")

        try:
            src.rename(dst)
            moved += 1
        except Exception as e:
            print(f"  ERROR moving {src}: {e}")

    # Apply deletes
    deleted = 0
    for d in deletes:
        try:
            d.unlink()
            deleted += 1
        except Exception as e:
            print(f"  ERROR deleting {d}: {e}")

    print("-" * 60)
    print(f"APPLIED: {moved} moved, {deleted} deleted")

    # Git commit
    if args.commit:
        run_git(["add", "-A"], cwd=root_dir)

        msg = f"chore(docs): auto-archive stale documentation ({stamp})"
        if args.mode == "delete" and deleted > 0:
            msg = f"chore(docs): cleanup stale documentation ({stamp})"

        code, _ = run_git(["commit", "-m", msg], cwd=root_dir)
        if code == 0:
            print(f"Committed: {msg}")
        else:
            print("No changes to commit (or commit failed)")


if __name__ == "__main__":
    main()
