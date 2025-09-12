# Configuration des Environnements - Neo Budget

## 📋 Vue d'ensemble

Cette application utilise **deux environnements séparés** pour garantir la sécurité et l'isolation des données :

- 🏠 **Développement Local** : Tests et développement avec données de test
- 🚀 **Production** : Application live avec données réelles des utilisateurs

## 🏗️ Architecture des Environnements

```
┌─────────────────────┬─────────────────────────────────────┐
│ DÉVELOPPEMENT       │ PRODUCTION                          │
├─────────────────────┼─────────────────────────────────────┤
│ localhost:3000      │ https://votre-domaine.vercel.app    │
│ Projet Supabase Dev │ Projet Supabase Prod (NOUVEAU)      │
│ Données de test     │ Données réelles utilisateurs        │
│ .env.local          │ Variables Vercel                     │
└─────────────────────┴─────────────────────────────────────┘
```

## 🏠 ENVIRONNEMENT DE DÉVELOPPEMENT (Déjà configuré)

### ✅ État actuel
- **Projet Supabase** : `dtxkxlttulmffvmexeai` (DÉVELOPPEMENT)
- **URL locale** : `http://localhost:3000`
- **Fichier config** : `.env.local` ✅ Configuré
- **Base de données** : Tables et données de test créées

### 🔧 Configuration actuelle
```env
NEXT_PUBLIC_SUPABASE_URL=https://dtxkxlttulmffvmexeai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (clé de développement)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 🌐 Supabase Auth - Développement
- **Site URL** : `http://localhost:3000`
- **Redirect URLs** : `http://localhost:3000/**`
- **Dashboard** : [Projet Dev](https://supabase.com/dashboard/project/dtxkxlttulmffvmexeai)

---

## 🚀 ENVIRONNEMENT DE PRODUCTION (À configurer)

### ⚠️ IMPORTANT : Nouveau projet requis
**NE PAS utiliser le projet de développement en production !**

### Étape 1 : Créer le projet Supabase Production

1. **Aller sur** [supabase.com](https://supabase.com)
2. **Créer un nouveau projet** (bouton "New project")
3. **Nommer le projet** : `neo-budget-production`
4. **Choisir une région** : Europe (eu-west-1) ou proche de vos utilisateurs
5. **Mot de passe DB** : Générer un mot de passe fort
6. **Attendre la création** (~2 minutes)

### Étape 2 : Configuration de la base de données Production

1. **Aller dans SQL Editor** du nouveau projet
2. **Exécuter les migrations** dans l'ordre :

```sql
-- 1. Copier-coller le contenu de supabase/migrations/001_initial_schema.sql
-- 2. Exécuter la requête
-- 3. Copier-coller le contenu de supabase/migrations/002_seed_categories.sql  
-- 4. Exécuter la requête
```

### Étape 3 : Configuration Auth Production

Dans le nouveau projet Supabase → **Authentication** → **URL Configuration** :

- **Site URL** : `https://VOTRE-DOMAINE.vercel.app`
- **Redirect URLs** :
  ```
  https://VOTRE-DOMAINE.vercel.app/**
  https://VOTRE-DOMAINE.vercel.app/auth/callback
  https://VOTRE-DOMAINE.vercel.app/login
  ```

### Étape 4 : Récupérer les clés Production

Dans **Settings** → **API** du nouveau projet :
- ✅ **URL** : `https://NOUVEAU-PROJET-ID.supabase.co`
- ✅ **anon/public key** : `eyJ...` (clé anonyme publique)

---

## 🔧 Configuration Vercel Production

### Variables d'environnement Vercel

Dans votre dashboard Vercel → **Project Settings** → **Environment Variables** :

```env
# Supabase Production (NOUVEAU PROJET)
NEXT_PUBLIC_SUPABASE_URL=https://NOUVEAU-PROJET-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=NOUVELLE-CLE-ANON-PROD

# URL Application
NEXT_PUBLIC_APP_URL=https://VOTRE-DOMAINE.vercel.app
```

### Déploiement automatique

1. **Connecter le dépôt GitHub** à Vercel
2. **Branch principale** : `main`
3. **Auto-deploy** : Activé sur push vers `main`

---

## 📁 Fichiers de Configuration

### Résumé des fichiers

```
neo-budget/
├── .env.local                 # ✅ Développement (configuré)
├── .env.production.local      # 🔄 Test build prod en local
├── .env.example              # 📋 Template et documentation
├── .gitignore                # 🚫 Ignore tous les .env*
└── ENVIRONMENT_SETUP.md      # 📖 Ce guide
```

### Utilisation des fichiers

- **`.env.local`** : Utilisé automatiquement en développement (`npm run dev`)
- **`.env.production.local`** : Pour tester les builds de production localement
- **Vercel Dashboard** : Variables pour la production réelle
- **`.env.example`** : Documentation et template pour nouveaux développeurs

---

## 🚦 Commandes de Test

### Test Développement
```bash
npm run dev
# Utilise .env.local automatiquement
# URL: http://localhost:3000
```

### Test Build Production Local
```bash
# 1. Configurer .env.production.local avec les vraies valeurs
# 2. Builder avec l'environnement de production
NODE_ENV=production npm run build
npm run start
```

### Test Production Réelle
```bash
# Deploy sur Vercel (utilise les variables Vercel)
vercel --prod
```

---

## 🔒 Sécurité et Bonnes Pratiques

### ✅ Ce qui est bien
- **Projets Supabase séparés** : Isolation complète des données
- **Variables d'environnement distinctes** : Pas de mélange dev/prod  
- **RLS identique** : Même politiques de sécurité sur les deux projets
- **Fichiers .env dans .gitignore** : Pas de secrets dans Git

### ⚠️ À éviter absolument
- ❌ **Utiliser le projet dev en production**
- ❌ **Mélanger les clés d'environnement**
- ❌ **Commit des fichiers .env**
- ❌ **Données de test en production**

### 🔐 Checklist Sécurité
- [ ] Nouveau projet Supabase pour la production
- [ ] Clés API différentes entre dev et prod
- [ ] RLS activé sur toutes les tables (dev et prod)
- [ ] Site URLs correctement configurées
- [ ] Variables Vercel configurées (pas en local)
- [ ] Pas de .env* dans Git

---

## 🐛 Dépannage

### Erreur "Invalid JWT" en production
➡️ **Cause** : Mélange des clés dev/prod
➡️ **Solution** : Vérifier les variables Vercel

### Erreur CORS en production  
➡️ **Cause** : Site URL incorrect dans Supabase Auth
➡️ **Solution** : Vérifier l'URL dans le projet Supabase de production

### Base de données vide en production
➡️ **Cause** : Migrations non exécutées sur le projet de production
➡️ **Solution** : Exécuter les fichiers SQL dans le bon ordre

### Build qui échoue
➡️ **Cause** : Variables d'environnement manquantes
➡️ **Solution** : Vérifier toutes les variables dans Vercel

---

## 📞 Support

### Dashboards utiles
- **[Vercel Dashboard](https://vercel.com/dashboard)** : Déploiements et variables
- **[Supabase Dev](https://supabase.com/dashboard/project/dtxkxlttulmffvmexeai)** : Projet de développement
- **Supabase Prod** : Lien disponible après création du nouveau projet

### Commandes de diagnostic
```bash
# Vérifier les variables d'environnement
echo $NEXT_PUBLIC_SUPABASE_URL

# Vérifier le build
npm run build

# Vérifier la configuration Vercel
vercel env ls
```

---

**🎯 Objectif** : Deux environnements parfaitement séparés et sécurisés pour un développement serein et une production stable.