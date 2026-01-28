#!/usr/bin/env python3
"""Parse ESLint output and group async errors by file."""

import re
import sys
from collections import defaultdict

def parse_eslint_output(filename):
    """Parse ESLint output and count async errors per file."""
    errors_by_file = defaultdict(int)
    current_file = None

    with open(filename, 'r') as f:
        for line in f:
            # Match file path lines (start with /)
            file_match = re.match(r'^(/[^\s]+\.(?:ts|tsx)):?$', line.strip())
            if file_match:
                current_file = file_match.group(1)
                continue

            # Match async error lines
            if current_file and ('no-floating-promises' in line or 'no-misused-promises' in line):
                if 'error' in line:
                    errors_by_file[current_file] += 1

    return errors_by_file

def main():
    lint_file = '/tmp/linkme-full-lint.txt'
    errors = parse_eslint_output(lint_file)

    # Sort by error count (descending)
    sorted_files = sorted(errors.items(), key=lambda x: x[1], reverse=True)

    print(f"📊 Total files with async errors: {len(sorted_files)}")
    print(f"📊 Total async errors: {sum(errors.values())}")
    print()
    print("Top 30 files with most async errors:")
    print("=" * 80)

    for i, (filepath, count) in enumerate(sorted_files[:30], 1):
        # Shorten path for readability
        short_path = filepath.replace('/Users/romeodossantos/verone-back-office-V1/apps/linkme/src/', '')
        print(f"{i:2d}. {count:2d} errors - {short_path}")

if __name__ == '__main__':
    main()
