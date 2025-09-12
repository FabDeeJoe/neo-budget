# Configuration Vercel pour Neo Budget

## 🎯 Objectif
Configurer Vercel pour déployer l'application Neo Budget avec le nouveau projet Supabase de production.

## 🚀 Étapes de Configuration Vercel

### Étape 1 : Préparer le Dépôt GitHub

1. **Commit et push** toutes vos modifications :
```bash
git add .
git commit -m "Configure production environments

- Add production environment files
- Separate dev/prod Supabase configurations  
- Add comprehensive environment setup guides
- Ready for production deployment

🚀 Milestone 8: Production deployment ready"
git push origin main
```

### Étape 2 : Créer le Projet Vercel

#### Option A : Via Interface Web (Recommandé)
1. **Aller sur** [vercel.com](https://vercel.com)
2. **Se connecter** avec votre compte GitHub
3. **Cliquer "New Project"**
4. **Importer** votre repository `neo-budget`
5. **Configuration** :
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```
6. **NE PAS déployer encore** - cliquer "Configure Environment Variables" d'abord

#### Option B : Via CLI
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Initialiser le projet
vercel

# Suivre les prompts:
# ? Set up and deploy "~/Projects/neo-budget"? [Y/n] Y
# ? Which scope do you want to deploy to? [Votre compte]
# ? Link to existing project? [N/y] N  
# ? What's your project's name? neo-budget
# ? In which directory is your code located? ./
```

### Étape 3 : Configuration des Variables d'Environnement

⚠️ **IMPORTANT** : Utiliser les valeurs du **NOUVEAU projet Supabase de production**

#### Via Dashboard Vercel
1. **Aller dans** Project Settings → Environment Variables
2. **Ajouter ces variables** :

```env
# Production Supabase (NOUVEAU PROJET)
NEXT_PUBLIC_SUPABASE_URL
Valeur: https://VOTRE-NOUVEAU-PROJECT-REF.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY  
Valeur: VOTRE-NOUVELLE-CLE-ANON-PROD

# URL Application Production
NEXT_PUBLIC_APP_URL
Valeur: https://VOTRE-DOMAINE.vercel.app
```

#### Via CLI (Alternative)
```bash
# Configurer les variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production  
vercel env add NEXT_PUBLIC_APP_URL production

# Lister pour vérifier
vercel env ls
```

### Étape 4 : Domaine Personnalisé (Optionnel)

Si vous voulez un domaine personnalisé :

1. **Dans Vercel Dashboard** → Settings → Domains
2. **Ajouter votre domaine** : `votre-domaine.com`
3. **Configurer DNS** selon les instructions Vercel
4. **Mettre à jour** `NEXT_PUBLIC_APP_URL` avec votre domaine

**Sinon**, Vercel génère automatiquement : `neo-budget-xxx.vercel.app`

## 🔄 Déploiement et Tests

### Premier Déploiement

```bash
# Via CLI
vercel --prod

# Ou via Dashboard Vercel
# → Deployments → Deploy (branch main)
```

### Tests Post-Déploiement

1. **Ouvrir l'URL** de production
2. **Tester l'authentification** :
   - Inscription d'un nouvel utilisateur
   - Connexion/déconnexion
3. **Tester les fonctionnalités** :
   - Dashboard (doit être vide - normal)
   - Ajout d'une dépense
   - Gestion des budgets
   - Dépenses récurrentes

## 🔗 Synchronisation Supabase ↔ Vercel

### Mettre à Jour l'URL dans Supabase

Une fois le déploiement fait et l'URL finale connue :

1. **Aller dans Supabase Production** → Authentication → URL Configuration
2. **Mettre à jour Site URL** :
   ```
   https://neo-budget-xxx.vercel.app
   # OU votre domaine personnalisé
   https://votre-domaine.com
   ```
3. **Mettre à jour Redirect URLs** :
   ```
   https://neo-budget-xxx.vercel.app/**
   https://neo-budget-xxx.vercel.app/auth/callback
   https://neo-budget-xxx.vercel.app/login
   ```

### Mettre à Jour NEXT_PUBLIC_APP_URL

Dans Vercel → Environment Variables :
```env
NEXT_PUBLIC_APP_URL=https://neo-budget-xxx.vercel.app
```

**Puis redéployer** :
```bash
vercel --prod
```

## ⚡ Configuration Avancée

### Build et Performance

Dans `vercel.json` (déjà configuré) :
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1", "cdg1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Redirections et Caching

```json
{
  "redirects": [
    {
      "source": "/dashboard",
      "destination": "/",
      "permanent": false
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=86400"
        }
      ]
    }
  ]
}
```

## 🔍 Monitoring et Debugging

### Logs Vercel
```bash
# Voir les logs de build
vercel logs

# Logs en temps réel
vercel logs --follow
```

### Dashboard Vercel
- **Deployments** : Historique des déploiements
- **Functions** : Performance des API routes
- **Analytics** : Trafic et performance (plan payant)
- **Security** : Headers et certificats SSL

### Debugging Common Issues

**Build Failure:**
```bash
# Tester le build localement
npm run build

# Vérifier les variables d'env
echo $NEXT_PUBLIC_SUPABASE_URL
```

**Runtime Errors:**
```bash
# Vérifier les logs Vercel
vercel logs --since=1h
```

## ✅ Checklist de Déploiement

### Pré-déploiement
- [ ] Code committé et pushé sur GitHub
- [ ] Nouveau projet Supabase de production créé
- [ ] Base de données migrée (tables + catégories)
- [ ] Variables d'environnement récupérées

### Configuration Vercel  
- [ ] Projet Vercel créé et lié au repository
- [ ] Variables d'environnement configurées
- [ ] Framework détecté (Next.js)
- [ ] Build settings corrects

### Post-déploiement
- [ ] URL de production accessible
- [ ] Authentication fonctionnelle
- [ ] Dashboard s'affiche correctement
- [ ] Pas d'erreurs dans les logs
- [ ] Site URL mis à jour dans Supabase
- [ ] Tests fonctionnels passés

### Performance
- [ ] Build time < 3 minutes
- [ ] Bundle size < 200KB
- [ ] LCP < 2.5s
- [ ] Mobile-friendly

## 🚨 Dépannage

### Erreur "Invalid JWT"
**Cause** : Mauvaise clé API ou mélange dev/prod
**Solution** : Vérifier `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans Vercel

### Erreur CORS
**Cause** : Site URL pas configuré dans Supabase
**Solution** : Mettre à jour l'URL dans Supabase Auth

### Page blanche
**Cause** : Variable d'environnement manquante
**Solution** : Vérifier toutes les variables dans Vercel

### Build qui échoue
```bash
# Local debug
npm run build 2>&1 | tee build.log
```

## 🎯 URLs Importantes

Après déploiement, noter ces URLs :

```
🌐 Application: https://neo-budget-xxx.vercel.app
📊 Vercel Dashboard: https://vercel.com/dashboard  
🗄️  Supabase Production: https://supabase.com/dashboard/project/NOUVEAU-PROJECT-ID
📋 Environment Variables: https://vercel.com/dashboard/.../settings/environment-variables
```

---

**🎉 Félicitations !** Votre application Neo Budget est maintenant en production avec un environnement sécurisé et des données complètement séparées du développement.