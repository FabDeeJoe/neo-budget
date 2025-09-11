# Configuration Supabase - Budget Tracker

## 🚨 Erreur "Base de données non configurée" ?

Si vous voyez cette erreur sur le dashboard, c'est que les tables Supabase n'existent pas encore. Suivez ces étapes :

## 🏗️ Configuration initiale

### 1. Accéder à Supabase
- Aller sur [supabase.com](https://supabase.com)
- Se connecter à votre projet : `dtxkxlttulmffvmexeai`
- Aller dans **SQL Editor**

### 2. Créer les tables (Schema)
Copier-coller le contenu COMPLET du fichier `supabase/migrations/001_initial_schema.sql` dans l'éditeur SQL et l'exécuter.

**⚠️ Important :** Ce fichier contient :
- Création des 5 tables principales
- Index pour les performances
- Politiques RLS (Row Level Security)  
- Fonctions et triggers
- Extensions nécessaires

### 3. Insérer les catégories
Copier-coller le contenu du fichier `supabase/migrations/002_seed_categories.sql` et l'exécuter.

**✅ Résultat :** 14 catégories seront créées (Logement, Auto, Santé, etc.)

### 4. Configurer l'authentification
- Aller dans **Authentication > Settings**
- **Site URL** : `http://localhost:3002` (dev) ou votre domaine (prod)
- **Redirect URLs** : `http://localhost:3002/**`
- Activez "Enable email confirmations" si souhaité

## 🧪 Tester la configuration

1. Rafraîchir la page du dashboard : http://localhost:3002
2. L'erreur devrait disparaître
3. Vous devriez voir le dashboard vide (normal, aucune dépense/budget créé)

## 📊 État actuel de l'application

### ✅ Fonctionnalités complétées

**Milestone 0 : Projet Setup** 🟢
- Next.js 15 + TypeScript + Tailwind CSS v4
- Structure de projet complète
- Variables d'environnement configurées

**Milestone 1 : Authentification** 🟢  
- Connexion email/mot de passe
- Interface mobile-first responsive
- Support thème sombre système
- Protection des routes
- Gestion des sessions

**Milestone 2 : Opérations Base de Données** 🟢
- Hooks React pour expenses/budgets/favorites
- CRUD complet avec validation Zod
- Mises à jour en temps réel (Supabase channels)
- Queue hors-ligne avec retry automatique
- Optimistic updates

**Milestone 3 : Dashboard** 🟢
- Interface complète mobile-first
- Cartes budget avec barres de progression colorées
- Sélecteur de mois avec navigation
- Résumé budgétaire avec calculs intelligents
- Indicateurs de statut (connexion, queue hors-ligne)
- Tri automatique par consommation critique

### 🔧 Architecture technique

**Frontend :**
- React 19 + Next.js 15 (App Router)
- Tailwind CSS v4 avec thème sombre
- shadcn/ui pour les composants
- TypeScript strict
- Bundle size : ~182kB (excellent !)

**Backend :**
- Supabase (Auth + PostgreSQL + Real-time)
- Row Level Security activé
- 5 tables optimisées avec index
- 14 catégories fixes predéfinies

**État offline :**
- LocalStorage queue automatique
- Retry avec backoff exponentiel
- Synchronisation transparente

## 🎯 Prochaines étapes (Milestone 4)

Une fois la DB configurée, nous implémenterons le **système d'ajout de dépenses ultra-rapide** :

1. **FAB (Floating Action Button)** - bouton vert flottant
2. **Clavier numérique** - saisie du montant en 1 tap
3. **Grille des 6 catégories favorites** - sélection en 1 tap  
4. **Sauvegarde automatique** - aucune confirmation nécessaire
5. **Objectif** : Ajouter une dépense en < 5 secondes ⚡

## 🐛 Dépannage

### Erreur : "relation does not exist"
➡️ Les tables ne sont pas créées, exécutez les migrations SQL

### Erreur : "RLS policy violation"  
➡️ Vérifiez que vous êtes connecté et que les politiques RLS sont bien créées

### Dashboard vide après configuration
➡️ **Normal !** Aucun budget/dépense n'est créé. Le Milestone 4 permettra d'ajouter des données.

### Problème de thème sombre
➡️ L'app détecte automatiquement le thème système et s'adapte

---

**🚀 L'application est prête !** Une fois la DB configurée, vous aurez un tracker de budget ultra-performant avec synchronisation temps réel.