#!/usr/bin/env bash
set -e

echo "=== Inicializace databáze Kamailio ==="
echo "Spouštím kamdbctl uvnitř kontejneru kamailio_sip..."

docker compose exec kamailio kamdbctl create

echo "=== Databáze byla úspěšně vytvořena! ==="
