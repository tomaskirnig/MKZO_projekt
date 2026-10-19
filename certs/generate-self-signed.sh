#!/usr/bin/env bash
# Generování dočasných self-signed certifikátů pro lokální testování WSS
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
DOMAIN="${1:-localhost}"

echo "Generuji self-signed SSL certifikát pro doménu: $DOMAIN"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$DIR/privkey.pem" \
  -out "$DIR/fullchain.pem" \
  -subj "/CN=$DOMAIN"

echo "Certifikáty uloženy v $DIR:"
echo " - $DIR/fullchain.pem"
echo " - $DIR/privkey.pem"
echo "Poznámka: Pro produkci na Oracle Cloud použijte Let's Encrypt (certbot) podle roadmapy."
