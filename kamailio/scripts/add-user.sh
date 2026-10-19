#!/usr/bin/env bash
set -e

if [ "$#" -lt 2 ]; then
    echo "Použití: $0 <sip_username[@domain]> <password>"
    echo "Příklad: $0 alice@tvoje-domena.duckdns.org heslo123"
    echo "Příklad: $0 bob@tvoje-domena.duckdns.org heslo456"
    exit 1
fi

USER_URI="$1"
PASSWORD="$2"

echo "Přidávám uživatele $USER_URI do Kamailio..."
docker compose exec kamailio kamctl add "$USER_URI" "$PASSWORD"
echo "Uživatel $USER_URI byl úspěšně přidán!"
