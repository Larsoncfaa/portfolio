# Portfolio — Adama Kané

Ouvrir `index.html`. Aucune dépendance en ligne : polices et scripts sont inclus.

- `assets/site.css`, `motion.css`, `ux.css` — styles (base, mouvement, responsive/accessibilité)
- `assets/cloth.js`, `site.js`, `motion.js` — tissu généré, interactions, système de mouvement
- `assets/app.min.css` / `app.min.js` — ce que les pages chargent réellement
- Après toute modification d'un fichier source : `./build.sh` (Node requis) pour régénérer les deux fichiers minifiés.
