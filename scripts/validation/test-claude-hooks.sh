#!/bin/bash
# [BO-AUDIT-004] Test reel des hooks repares.
# On simule exactement ce que Claude Code envoie : le JSON du hook sur stdin.
cd /Users/romeodossantos/verone-back-office-V1 || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

get_hook() {
  python3 - "$1" "$2" <<'PY'
import json, sys
matcher_key, needle = sys.argv[1], sys.argv[2]
d = json.load(open('.claude/settings.json'))
for event in ('PreToolUse', 'PostToolUse'):
    for g in d['hooks'].get(event, []):
        if matcher_key in g.get('matcher', ''):
            for hk in g['hooks']:
                if needle in hk['command']:
                    print(hk['command'])
                    sys.exit(0)
sys.exit(1)
PY
}

run() {
  local label="$1" hook="$2" payload="$3" expect="$4"
  printf '%s' "$hook" > /tmp/_h.sh
  printf '%s' "$payload" | bash /tmp/_h.sh >/tmp/_out 2>/tmp/_err
  local code=$?
  local verdict
  if [ "$expect" = "block" ]; then
    [ "$code" = "2" ] && verdict="OK bloque (exit 2)" || verdict="ECHEC — attendu exit 2, obtenu $code"
  else
    [ "$code" = "0" ] && verdict="OK passe" || verdict="ECHEC — attendu exit 0, obtenu $code"
  fi
  printf '%-52s %s\n' "$label" "$verdict"
  [ -s /tmp/_err ] && printf '%s\n' "      stderr: $(head -c 110 /tmp/_err)"
}

echo "=== 1. Task-ID sur git commit ==="
H=$(get_hook 'Bash(git commit*)' 'Task ID')
run "message avec [BO-AUDIT-004]" "$H" '{"tool_input":{"command":"git commit -m \"[BO-AUDIT-004] chore: x\""}}' pass
run "message sans Task-ID" "$H" '{"tool_input":{"command":"git commit -m \"correction rapide\""}}' block
run "commit -F - (heredoc, tolere)" "$H" '{"tool_input":{"command":"git commit -F -"}}' pass

echo
echo "=== 2. push sur main ==="
H=$(get_hook 'Bash(git push*main*)' 'push direct')
run "git push origin main" "$H" '{"tool_input":{"command":"git push origin main"}}' block
run "git push origin ma-branche" "$H" '{"tool_input":{"command":"git push origin chore/x"}}' pass

echo
echo "=== 3. PR vers main ==="
H=$(get_hook 'gh pr merge' 'ciblent staging')
run "gh pr create --base main" "$H" '{"tool_input":{"command":"gh pr create --base main"}}' block
run "gh pr create --base staging" "$H" '{"tool_input":{"command":"gh pr create --base staging"}}' pass

echo
echo "=== 4. serveur de dev ==="
H=$(get_hook 'Bash(*)' 'lance les serveurs')
run "pnpm dev" "$H" '{"tool_input":{"command":"pnpm dev"}}' block
run "pnpm turbo run build" "$H" '{"tool_input":{"command":"pnpm turbo run build"}}' pass
run "pnpm dev:stop (ne doit pas bloquer)" "$H" '{"tool_input":{"command":"pnpm dev:stop"}}' pass

echo
echo "=== 5. zero any ==="
H=$(get_hook 'Edit(*) || Write(*)' 'any detecte')
run "code avec : any" "$H" '{"tool_input":{"new_string":"const x: any = 1;"}}' block
run "code avec as any" "$H" '{"tool_input":{"new_string":"foo(bar as any);"}}' block
run "code propre" "$H" '{"tool_input":{"new_string":"const x: number = 1;"}}' pass
run "le mot company (faux positif ?)" "$H" '{"tool_input":{"new_string":"const company = 1;"}}' pass
