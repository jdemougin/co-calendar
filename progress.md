# co-calendar - Progress

## ✅ Réalisé

### Setup Initial
- [x] Installation de Node.js et npm
- [x] Installation des dépendances (`npm install`)
- [x] Configuration du `.env` avec Google OAuth credentials
- [x] Lancement du serveur de développement (`npm run dev`)

### UI/UX Améliorations
- [x] Changement du titre "Logger d'Activités" → **"co-calendar"**
- [x] Changement du logo Calendar → **Zap** (plus fun)
- [x] Suppression des textes "Planification" et "Configurez vos créneaux horaires"
- [x] Déplacement de la déconnexion dans le modal Settings
- [x] Ajout des informations debug dans le modal Settings
- [x] Ajout des selecteurs pour changer agenda cible (TPS) et référence (Vérif)

### Corrections de Bugs
- [x] Suppression des tirets `- ` entre catégorie et type dans les événements Google Calendar
  - Avant : `#cda - Cours`
  - Après : `#cda Cours`

### Features
- [x] Authentification Google OAuth fonctionnelle
- [x] Synchronisation avec Google Calendar
- [x] Détection des conflits d'horaires
- [x] Pré-remplissage auto depuis l'agenda de référence
- [x] Notifications quotidiennes configurables
- [x] PWA (Progressive Web App) avec Service Worker

## 📋 À Faire

### Déploiement
- [ ] Créer repo GitHub
- [ ] Connecter à Vercel
- [ ] Configurer les variables d'environnement sur Vercel
- [ ] Ajouter URI de redirection OAuth dans Google Cloud Console
- [ ] Deployer en production

### Améliorations Futures (Nice to have)
- [ ] Thème dark mode
- [ ] Plus de catégories/types personnalisables
- [ ] Historique des activités
- [ ] Export CSV/PDF
- [ ] Synchronisation bidirectionnelle

## 🔗 Liens Utiles

- **Google Cloud Console** : https://console.cloud.google.com/
- **Vercel Dashboard** : https://vercel.com/dashboard
- **GitHub** : https://github.com/

## 📝 Notes de Développement

### Structure du projet
```
co-calendar/
├── src/           # React frontend (Vite)
├── server.ts      # Express backend + OAuth
├── vite.config.ts # Config Vite
└── package.json   # Dependencies
```

### Credentials Google (NE PAS COMMITER)
- CLIENT_ID: Dans `.env`
- CLIENT_SECRET: Dans `.env`
- Redirect URI pour dev: `http://localhost:3000/auth/callback`
- Redirect URI pour prod: `https://ton-app.vercel.app/auth/callback`

### Commandes utiles
```bash
npm run dev      # Lancer en développement
npm run build    # Builder pour production
npm run preview  # Prévisualiser la build
npm run lint     # Vérifier les erreurs TypeScript
```

---

**Last Updated**: 19 mars 2026
