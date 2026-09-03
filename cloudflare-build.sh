#!/usr/bin/env bash
set -euo pipefail

rm -rf dist
mkdir -p dist

cp index.html event.html person.html sport.html hub.html live.html sports.html news.html community.html wear.html styles.css app.js dist/
cp -R live-sports-ui dist/live-sports-ui
cp -R assets dist/assets

cat > dist/_headers <<'EOF'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
EOF

cat > dist/_redirects <<'EOF'
/event/* /event.html 200
/person/* /person.html 200
/player/* /person.html 200
/athlete/* /person.html 200
/manager/* /person.html 200
/football /sport.html 200
/basketball /sport.html 200
/tennis /sport.html 200
/running /sport.html 200
/live /live.html 200
/sports /sports.html 200
/news /news.html 200
/community /community.html 200
/wear /wear.html 200
/contact /community.html 200
EOF

echo "UltraWear Cloudflare build complete: dist/"
