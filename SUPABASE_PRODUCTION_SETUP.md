# Guide Création Projet Supabase Production

## 🎯 Objectif
Créer un **nouveau projet Supabase dédié à la production**, séparé du projet de développement `dtxkxlttulmffvmexeai`.

## 🚀 Étapes de Création

### Étape 1 : Nouveau Projet Supabase

1. **Aller sur** [supabase.com](https://supabase.com)
2. **Se connecter** avec votre compte
3. **Cliquer sur "New project"**
4. **Remplir les informations** :
   ```
   Nom du projet : neo-budget-production
   Organisation : Votre organisation
   Région : Europe (eu-west-1) recommandée
   Mot de passe DB : [Générer un mot de passe fort]
   Plan : Free tier (suffisant pour commencer)
   ```
5. **Cliquer "Create new project"**
6. **Attendre 2-3 minutes** pour la création

### Étape 2 : Récupérer les Informations du Projet

Une fois créé, aller dans **Settings** → **API** :

```env
# NOTER CES VALEURS (à utiliser dans Vercel)
Project URL: https://VOTRE-NOUVEAU-PROJECT-REF.supabase.co
anon public key: eyJ... (longue clé qui commence par eyJ)
```

**📋 Format de référence :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-NOUVEAU-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE-NOUVELLE-CLE-ANON
```

## 📊 Configuration de la Base de Données

### Migration 1 : Schéma Principal

1. **Aller dans "SQL Editor"**
2. **Créer une nouvelle query**
3. **Copier le contenu COMPLET du fichier** `supabase/migrations/001_initial_schema.sql`
4. **Coller et exécuter** (bouton "Run" ou Ctrl+Enter)

**✅ Résultat attendu :**
- 5 tables créées (categories, budgets, expenses, recurring_expenses, favorite_categories)
- RLS activé sur toutes les tables
- Politiques de sécurité créées
- Index de performance créés

### Migration 2 : Données de Base

1. **Nouvelle query** dans SQL Editor
2. **Copier le contenu COMPLET du fichier** `supabase/migrations/002_seed_categories.sql`
3. **Coller et exécuter**

**✅ Résultat attendu :**
- 14 catégories créées (Logement, Auto, Santé, etc.)
- Toutes les catégories ont des icônes et couleurs

### Vérification de la Migration

**Tester avec cette requête :**
```sql
-- Vérifier que tout est bien créé
SELECT 
  'Tables' as type, 
  count(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Categories' as type, 
  count(*) as count 
FROM categories;
```

**Résultat attendu :**
```
type        | count
------------|-------
Tables      | 5
Categories  | 14
```

## 🔐 Configuration Authentification

### URLs et Redirections

Aller dans **Authentication** → **URL Configuration** :

**Site URL :**
```
https://VOTRE-DOMAINE.vercel.app
```

**Redirect URLs :**
```
https://VOTRE-DOMAINE.vercel.app/**
https://VOTRE-DOMAINE.vercel.app/auth/callback
https://VOTRE-DOMAINE.vercel.app/login
```

### Providers d'Authentification

Dans **Authentication** → **Providers** :
- ✅ **Email** : Activé (par défaut)
- 🔄 **Google OAuth** : Optionnel (configurer si souhaité)

### Configuration Email

Dans **Authentication** → **Email Templates** :
- **Confirm signup** : Personnaliser si souhaité
- **Magic link** : Personnaliser si souhaité
- **Reset password** : Personnaliser si souhaité

## 🛡️ Sécurité et Politiques

### Vérification RLS

Tester que Row Level Security fonctionne :
```sql
-- Cette requête ne doit retourner AUCUN résultat (utilisateur non connecté)
SELECT * FROM expenses;
SELECT * FROM budgets;
SELECT * FROM recurring_expenses;
SELECT * FROM favorite_categories;

-- Les catégories doivent être visibles (pas de RLS)
SELECT * FROM categories; -- Doit retourner 14 lignes
```

### Politiques de Sécurité

Vérifier que les politiques sont créées :
```sql
-- Lister toutes les politiques
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Politiques attendues pour chaque table :**
- `budgets` : "Users can view own budgets"
- `expenses` : "Users can view own expenses"  
- `recurring_expenses` : "Users can view own recurring_expenses"
- `favorite_categories` : "Users can view own favorites"

## 📈 Performance et Monitoring

### Index de Performance

Vérifier que les index sont créés :
```sql
-- Lister les index personnalisés
SELECT 
  schemaname, 
  tablename, 
  indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### Monitoring

Dans **Reports** :
- Activer les **API Logs**
- Activer les **Database Logs**
- Surveiller les **Performance Metrics**

## ✅ Checklist Final

### Base de Données
- [ ] 5 tables créées et visibles dans Table Editor
- [ ] 14 catégories insérées dans la table `categories`
- [ ] RLS activé sur toutes les tables utilisateur
- [ ] Politiques de sécurité fonctionnelles
- [ ] Index de performance créés

### Authentification  
- [ ] Site URL configurée avec domaine de production
- [ ] Redirect URLs configurées
- [ ] Email auth activé
- [ ] Templates d'email personnalisés (optionnel)

### API et Accès
- [ ] Project URL notée et sauvegardée
- [ ] Anon key notée et sauvegardée
- [ ] Pas de service role key exposée côté client

### Test Fonctionnel
```sql
-- Test rapide : cette requête doit fonctionner
SELECT 
  id,
  name,
  icon,
  color
FROM categories 
ORDER BY display_order
LIMIT 5;
```

## 🎯 Prochaine Étape

Une fois ce projet Supabase de production créé et configuré :

1. **Noter les nouvelles clés** (URL + anon key)
2. **Les configurer dans Vercel** (voir `ENVIRONMENT_SETUP.md`)
3. **Tester le déploiement** avec les nouvelles variables
4. **Vérifier l'authentification** sur le domaine de production

---

**🎉 Félicitations !** Vous avez maintenant un environnement de production propre et sécurisé, complètement séparé du développement.