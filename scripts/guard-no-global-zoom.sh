#!/bin/bash
# Guard CI: Bloque zoom/scale/matrix/transform global qui casserait le layout desktop

set -e

echo "🔍 Searching for global zoom/scale/transform..."

FOUND=0

# Chercher zoom: dans html/body
if rg -q "html.*zoom\s*:" apps/back-office/src 2>/dev/null; then
  echo "❌ BLOCKED: Found 'zoom:' on html"
  rg "html.*zoom\s*:" apps/back-office/src -A 2
  FOUND=1
fi

if rg -q "body.*zoom\s*:" apps/back-office/src 2>/dev/null; then
  echo "❌ BLOCKED: Found 'zoom:' on body"
  rg "body.*zoom\s*:" apps/back-office/src -A 2
  FOUND=1
fi

# Chercher scale( dans layout root (hors keyframes)
if rg -q "transform.*scale\(" apps/back-office/src/app/layout.tsx 2>/dev/null; then
  echo "❌ BLOCKED: Found 'scale()' in root layout"
  rg "transform.*scale\(" apps/back-office/src/app/layout.tsx -A 2
  FOUND=1
fi

# Chercher matrix( dans layout root
if rg -q "matrix\(" apps/back-office/src/app/layout.tsx 2>/dev/null; then
  echo "❌ BLOCKED: Found 'matrix()' in root layout"
  rg "matrix\(" apps/back-office/src/app/layout.tsx -A 2
  FOUND=1
fi

# Chercher flex justify-center dans PublicLayout (cause du bug original)
if rg -q "flex.*justify-center" apps/back-office/src/components/layout/public-layout.tsx 2>/dev/null; then
  echo "❌ BLOCKED: Found 'flex justify-center' in PublicLayout (causes width limitation)"
  rg "flex.*justify-center" apps/back-office/src/components/layout/public-layout.tsx -A 2
  FOUND=1
fi

if [ $FOUND -eq 0 ]; then
  echo "✅ PASS: No global zoom/scale/transform found"
  echo "✅ PASS: PublicLayout does not limit width with flex justify-center"
  exit 0
else
  echo ""
  echo "🚨 CRITICAL: Global zoom/scale or width-limiting wrapper detected!"
  echo "This will break desktop layout. Remove it."
  exit 1
fi
