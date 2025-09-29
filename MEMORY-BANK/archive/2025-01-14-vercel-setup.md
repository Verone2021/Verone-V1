# 🚀 Vercel Deployment Setup - Vérone Back Office

## Phase 3: Connection Repository GitHub → Vercel

### 📋 Prerequisites Complete
✅ **Repository GitHub** : https://github.com/Verone2021/Verone-backoffice.git
✅ **Configuration Vercel** : `vercel.json` créé avec settings optimaux
✅ **Variables d'environnement** : Template configuré pour production

---

## 🎯 Actions Manuelles Requises

### **1. Authentification Vercel**
```bash
# Dans le terminal du projet
npx vercel login
# → Suivre le processus d'authentification web
```

### **2. Connecter le Repository**
```bash
# Option A: Import depuis GitHub (Recommandé)
# → Aller sur https://vercel.com/dashboard
# → "Add New..." → "Project"
# → "Import Git Repository"
# → Sélectionner "Verone2021/Verone-backoffice"

# Option B: CLI
npx vercel --prod
# → Suivre les prompts de configuration
```

### **3. Configuration Variables d'Environnement**

Dans le dashboard Vercel → Project Settings → Environment Variables :

| **Variable** | **Value** | **Environment** |
|-------------|-----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://aorroydfjsrygmosnzrl.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `[Récupérer depuis Supabase Dashboard]` | Production only |
| `BREVO_API_KEY` | `[À configurer]` | Production, Preview |
| `BREVO_WEBHOOK_SECRET` | `[À configurer]` | Production, Preview |
| `NODE_ENV` | `production` | Production |

---

## ⚙️ Configuration Automatique Créée

### **`vercel.json` Features**
```json
{
  "name": "verone-back-office",
  "framework": "nextjs",
  "alias": ["verone-backoffice.vercel.app"],
  "buildCommand": "npm run build",
  "functions": { "src/app/api/**/*.ts": { "runtime": "nodejs18.x" } },
  "headers": [ /* CORS configured for API routes */ ],
  "rewrites": [ /* /feeds/* → /api/feeds/* */ ]
}
```

### **Fonctionnalités Activées**
- ✅ **Auto-deployment** : Push to main → déploiement automatique
- ✅ **Preview deployments** : PRs → URLs preview automatiques
- ✅ **Edge Functions** : API routes optimisées
- ✅ **CORS** : Headers configurés pour feeds externes
- ✅ **URL Aliases** : verone-backoffice.vercel.app

---

## 🚦 Validation Déploiement

### **Tests Post-Déploiement**
```bash
# 1. Sanity check
curl https://verone-backoffice.vercel.app/

# 2. API health check
curl https://verone-backoffice.vercel.app/api/health

# 3. Feeds endpoint test
curl https://verone-backoffice.vercel.app/feeds/facebook.csv

# 4. Dashboard load test
curl -I https://verone-backoffice.vercel.app/dashboard
```

### **SLOs à Vérifier**
- ⏱️ **Dashboard** : <2s load time
- ⏱️ **API responses** : <1s moyenne
- ⏱️ **Feeds generation** : <10s
- 🔗 **Uptime** : >99.5%

---

## 🔐 Security Configuration

### **Supabase RLS Policies**
Vérifier que les policies sont actives en production :
```sql
-- Vérifier RLS activé
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

### **Environment Variables Security**
- ❌ **Jamais exposer** `SUPABASE_SERVICE_ROLE_KEY` côté client
- ✅ **Utiliser** `NEXT_PUBLIC_*` uniquement pour variables publiques
- ✅ **Rotation** régulière des API keys Brevo

---

## 📊 Monitoring Setup

### **Vercel Analytics** (Recommandé)
```bash
npm install @vercel/analytics
```

Dans `src/app/layout.tsx` :
```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### **Performance Monitoring**
- 📈 **Core Web Vitals** automatique via Vercel
- 📊 **Business metrics** : conversion catalogues → devis
- 🚨 **Alertes** : SLOs dépassés, erreurs API

---

## 🎯 Next Steps After Deployment

1. **✅ Validate** : Tous les SLOs respectés
2. **🧪 Test** : Workflows complets via Playwright
3. **📊 Monitor** : Setup alerting pour équipe
4. **🔄 CI/CD** : Validation pipeline automatique

---

## 🚨 Troubleshooting Common Issues

### **Build Failures**
```bash
# Local build test
npm run build
npm run start
```

### **Environment Variables Missing**
```bash
# Verify in Vercel dashboard
npx vercel env ls
```

### **Supabase Connection Issues**
```bash
# Test connection
curl -H "apikey: YOUR_ANON_KEY" \
     "https://aorroydfjsrygmosnzrl.supabase.co/rest/v1/organisations"
```

---

**Status**: ⚡ Ready for manual Vercel connection
**Estimated Time**: 10-15 minutes pour setup complet