gestion-ppve/
│
├── index.html              # 🔐 Page de connexion
├── gestion-casiers.html    # 📦 Dashboard principal (288 casiers)
├── admin-test.html         # 👥 Gestion utilisateurs/permissions
├── Antho.html              # 🎭 Gestion équipements
├── inscription.html        # ✍️ Création de compte
│
├── firebase.json           # ⚙️ Config Firebase Hosting
├── firestore.rules         # 🔒 Règles de sécurité Firestore
│
├── robots.txt              # 🤖 SEO
├── sitemap.xml             # 🗺️ Plan du site
│
└── README.md               # 📖 Documentation
# Gestion Unifiée PPVE – Digit 2.0

## Présentation

Cette application web centralise la gestion des casiers et des équipements de ventilation (masques, tuyaux, moteurs, batteries) pour un usage industriel Lean, robuste et évolutif.

- Interface moderne, responsive, et intuitive
- Dashboard centralisé (KPIs casiers + équipements)
- Navigation par onglets (Casiers / Équipements)
- Persistance locale (localStorage, prêt à évoluer cloud)
- Code modulaire (unified-app.js)

## Structure du projet

```
/ (racine)
│  index.html           # Interface principale unifiée
│  unified-app.js       # Toute la logique JS (casiers + équipements)
│  README.md            # Ce guide
│  robots.txt           # (optionnel, SEO)
│  sitemap.xml          # (optionnel, SEO)
│  firebase.json        # (optionnel, hébergement Firebase)
│  firestore.rules      # (optionnel, sécurité Firebase)
│
├─ functions/           # (optionnel, Cloud Functions si besoin)
├─ assets/              # (optionnel, images, logos)
```

## Utilisation

1. Ouvrez `index.html` dans votre navigateur.
2. Gérez vos casiers et équipements via l’interface (onglets).
3. Les données sont stockées localement (localStorage).
4. Prêt à être déployé sur GitHub Pages, Firebase Hosting, ou tout hébergeur statique.

## Déploiement GitHub

- Gardez uniquement les fichiers/dossiers listés ci-dessus.
- Supprimez tous les anciens HTML, TXT, scripts, backups, etc.
- Initialisez un dépôt Git (`git init`), puis :

```sh
git add index.html unified-app.js README.md
# Ajoutez robots.txt, sitemap.xml, firebase.json, firestore.rules si besoin
git commit -m "Version Lean Digit 2.0"
git remote add origin <votre_repo_github>
git push -u origin main
```

- Pour GitHub Pages :
  - Paramétrez la branche principale comme source
  - Accédez à votre site sur https://<votre_user>.github.io/<repo>

## Évolutions possibles
- Connexion cloud multi-utilisateur (Firebase, Supabase, etc.)
- Authentification, gestion des droits
- Export/Import CSV, PDF, Excel
- API REST ou GraphQL
- Responsive mobile/industriel

## Support
Pour toute question ou évolution, ouvrez une issue sur le dépôt GitHub.

---
© 2025 – Projet Lean, robuste, et prêt pour l’industrie.
