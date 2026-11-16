#!/usr/bin/env bash
# Regroupe et minifie : assets/{site,motion,ux}.css -> assets/app.min.css
#                       assets/{cloth,site,motion}.js -> assets/app.min.js
# Usage : ./build.sh   (nécessite Node ; esbuild est téléchargé à la volée)
set -euo pipefail
cd "$(dirname "$0")/assets"
cat site.css motion.css ux.css > /tmp/ak-all.css
cat cloth.js site.js motion.js > /tmp/ak-all.js
npx --yes esbuild /tmp/ak-all.css --minify --loader:.css=css --outfile=app.min.css
npx --yes esbuild /tmp/ak-all.js  --minify --target=es2018 --outfile=app.min.js
ls -l app.min.css app.min.js
