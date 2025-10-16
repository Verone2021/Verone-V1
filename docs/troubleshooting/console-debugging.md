# Console Debugging - Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

## Table des matières

- [Introduction](#introduction)
- [Playwright MCP](#playwright-mcp)
- [Console Error Checking Protocol](#console-error-checking-protocol)
- [Zero Tolerance Rule](#zero-tolerance-rule)
- [Screenshots Evidence](#screenshots-evidence)
- [Exemples Debugging](#exemples-debugging)

---

## Introduction

Guide debugging via console browser utilisant MCP Playwright : Console Error Checking Protocol MANDATORY.

**À documenter** :

### Playwright MCP Usage
```typescript
// 1. Navigate to page
mcp__playwright__browser_navigate(url: "http://localhost:3000/dashboard")

// 2. Check console messages
mcp__playwright__browser_console_messages()

// 3. Take screenshot evidence
mcp__playwright__browser_take_screenshot()
```

### Console Error Checking Protocol
1. AVANT validation : Navigate + Check console
2. Si erreurs → STOP → Fix ALL → Re-test
3. Zero tolerance : 1 erreur = échec complet
4. Screenshot comme preuve validation

### Zero Tolerance Rule
- ❌ INTERDIT : Valider avec 1 seule erreur console
- ✅ OBLIGATOIRE : Console 100% clean avant success

**Référence** : CLAUDE.md section "Console Error Checking"

---

**Retour** : [Documentation Troubleshooting](/Users/romeodossantos/verone-back-office-V1/docs/troubleshooting/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
