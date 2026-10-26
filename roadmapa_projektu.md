# Projekt: WebSockets v Kamailio (WebRTC SIP Proxy)
**Cíl:** Zprovoznit server pro směrování hovorů mezi webovými klienty pomocí WebRTC a SIP přes WebSockets.

---

## 📊 Přehled stavu projektu

| Fáze | Popis | Stav vývoje v kódu | Stav nasazení / testů |
| :--- | :--- | :---: | :---: |
| **Fáze 1** | Infrastruktura a certifikáty (Cloud / Lokál) | 🟡 Připraveno (skripty / šablony) | ⬜ Čeká na spuštění |
| **Fáze 2** | Backend (Kamailio, MariaDB, WSS v Dockeru) | 🟢 **100 % hotovo v repozitáři** | ⬜ Čeká na spuštění na serveru |
| **Fáze 3** | Frontend (WebRTC webový klient JsSIP + React) | 🟢 **100 % hotovo v repozitáři** | ⬜ Čeká na propojení s Vercel |
| **Fáze 4** | Integrace a E2E testing hovorů | 🟡 Připraveno k testování | ⬜ Čeká na provedení |
| **Fáze 5** | Dokumentace a podklady k odevzdání | 🟢 Podklady a šablony hotové | ⬜ Čeká na doplnění výsledků |

---

## Fáze 1: Infrastruktura a Certifikáty (Odhad: 1-2 dny)

Cílem je zajistit běhové prostředí pro backend a platný SSL certifikát, bez kterého prohlížeče odmítají WebSockets i přístup k mikrofonu.

### Lokální testování (Připraveno):
* [x] **Generátor lokálních certifikátů:** Připraven skript [`certs/generate-self-signed.sh`](certs/generate-self-signed.sh) pro běh na `localhost`.

### Produkce na Cloud Serveru:
* [ ] **1. Server (Oracle Cloud Always Free):**
  * Založ Always Free instanci (Ubuntu). AMD Micro instance je obvykle ihned dostupná, u ARM Ampere bývá občas plná kapacita regionu.
  * V Oracle Cloud Security Lists povol příchozí porty:
    * `22/tcp` (SSH)
    * `80/tcp` a `443/tcp` (Let's Encrypt certbot HTTP-01 challenge)
    * `4443/tcp` (Kamailio WSS)
    * `5060/udp` a `5060/tcp` (volitelně pro klasický SIP)
  * > **Důležité (Firewall v Ubuntu):** Oracle Cloud instance mívají v Ubuntu předkonfigurované interní `iptables`. Po otevření portů v cloudové konzoli je nutné povolit porty i v OS:
    > ```bash
    > sudo iptables -I INPUT -p tcp --dport 4443 -j ACCEPT
    > sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
    > sudo netfilter-persistent save
    > ```
* [ ] **2. Doména:**
  * Zaregistruj free subdoménu (např. na [DuckDNS.org](https://www.duckdns.org)) a nasměruj ji na veřejnou IP adresu Oracle serveru.
* [ ] **3. SSL/TLS Certifikát (Let's Encrypt):**
  * Nainstaluj certbot a vygeneruj platný certifikát:
    ```bash
    sudo apt update && sudo apt install -y certbot
    sudo certbot certonly --standalone -d tvoje-domena.duckdns.org
    ```
  * Certifikáty se uloží do `/etc/letsencrypt/live/tvoje-domena.duckdns.org/`.
* [ ] **4. Docker & Docker Compose na serveru:**
  * Nainstaluj Docker engine a plugin Docker Compose na server podle oficiálního návodu.

---

## Fáze 2: Konfigurace Backend (Kamailio v Dockeru) (Odhad: 2-4 dny)

V repozitáři je celá tato fáze již kompletně nakódována a připravena ke spuštění.

* [x] **1. Konfigurace Kamailio pro WebSockets & TLS:**
  * Připraven [`kamailio/kamailio.cfg`](kamailio/kamailio.cfg) s aktivními direktivami:
    ```text
    #!define WITH_MYSQL
    #!define WITH_AUTH
    #!define WITH_USRLOCDB
    #!define WITH_TLS
    #!define WITH_WEBSOCKETS
    ```
  * Nastaven `event_route[xhttp:request]` s voláním `ws_handle_handshake()`, který přepíná HTTP WebSocket upgrade na SIP transport.
  * Připraven [`kamailio/tls.cfg`](kamailio/tls.cfg) s konfigurací WSS na portu 4443.
  * Vytvořen [`kamailio/Dockerfile`](kamailio/Dockerfile) s instalací potřebných modulů (`kamailio-websocket-modules`, `kamailio-tls-modules`, `kamailio-mysql-modules`).
* [x] **2. Docker Compose stack:**
  * Připraven [`docker-compose.yml`](docker-compose.yml) propojující službu `mariadb` (v10.11 s volume) a `kamailio`.
  * Konfigurace mapování certifikátů přes proměnnou `SSL_CERTS_DIR` v [`.env.example`](.env.example):
    * Pro lokál: `./certs`
    * Pro produkci na serveru: `/etc/letsencrypt/live/tvoje-domena.duckdns.org`
* [x] **3. Správa databáze a uživatelů:**
  * Vytvořen pomocný skript [`kamailio/scripts/init-db.sh`](kamailio/scripts/init-db.sh) pro vytvoření schématu tabulek pomocí `kamdbctl create`.
  * Vytvořen pomocný skript [`kamailio/scripts/add-user.sh`](kamailio/scripts/add-user.sh) pro přidávání SIP účtů (např. Alice a Boba) pomocí `kamctl add`.

### Co zbývá provést (Nasazení):
* [ ] Naklonovat repozitář na server, zkopírovat `.env.example` do `.env` a nastavit doménu a cestu k certifikátům.
* [ ] Spustit `docker compose up -d`.
* [ ] Spustit `./kamailio/scripts/init-db.sh` a vytvořit uživatele přes `./kamailio/scripts/add-user.sh`.

---

## Fáze 3: Vývoj Frontendu (Webový klient) (Odhad: 2-3 dny)

Klientská aplikace je již plně vyvinutá v repozitáři ve složce [`frontend/`](frontend/).

* [x] **1. Výběr a integrace knihovny:**
  * Použita knihovna **JsSIP** (verze 3.13+) v moderní React aplikaci běžící na Vite.
* [x] **2. Uživatelské rozhraní a WebRTC logika:**
  * Hotová komponenta [`frontend/src/App.jsx`](frontend/src/App.jsx) s:
    * Konfigurací domény a WSS serveru (`wss://<domena>:4443`).
    * SIP registrací (`JsSIP.UA`) a sledováním stavů spojení (WebSocket connecting, connected, registered, call states).
    * Ovládáním hovorů (Call / Hangup / Answer / Reject).
    * Zvukovým HTML5 prvkem `<audio id="remoteAudio" autoplay></audio>`.
    * Správně nastavenými ICE/STUN servery (`stun:stun.l.google.com:19302`) v `pcConfig` při odeslání a přijetí hovoru.
    * Real-time oknem s diagnostickými logy pro snadný debugging.
* [x] **3. Build & konfigurace prostředí:**
  * Podpora proměnných prostředí `VITE_SIP_DOMAIN` a `VITE_SIP_WS_SERVER`.

### Co zbývá provést (Nasazení na Vercel):
* [ ] Nahrát změny na GitHub.
* [ ] Propojit repozitář s [Vercel.com](https://vercel.com) (nastavit *Root Directory* na `frontend`).
* [ ] Nastavit Environment Variables na Vercelu pro produkční doménu (nebo vyplnit přímo v UI klienta).
* [ ] Získat HTTPS URL z Vercelu (např. `https://webrtc-kamailio.vercel.app`).

---

## Fáze 4: Integrace a Testing (Odhad: 1-2 dny)

* [ ] **1. Lokální test hovoru (volitelné pro ověření před nasazením):**
  * Spustit lokální kontejnery: `docker compose up -d`.
  * Vygenerovat certifikát: `./certs/generate-self-signed.sh localhost`.
  * Spustit frontend: `cd frontend && npm run dev`.
  * Otevřít ve dvou oknech prohlížeče (Alice a Bob) a provést hovor. *(Pozn.: Pro self-signed certifikát je nutné nejprve v prohlížeči ručně potvrdit bezpečnostní výjimku na `https://localhost:4443`).*
* [ ] **2. Produkční E2E test přes internet:**
  * Otevřít Vercel aplikaci na dvou nezávislých zařízeních (např. notebook a smartphone na mobilních datech).
  * Přihlásit se jako Alice a Bob s doménou `tvoje-domena.duckdns.org`.
  * Ověřit SIP registraci (zelený stav "Online").
  * Zahájit hovor z jednoho zařízení a potvrdit na druhém.
  * Ověřit obousměrný přenos hlasu (WebRTC DTLS-SRTP P2P).
* [ ] **3. Troubleshooting (kontrolní body):**
  * Konzole prohlížeče (F12) – ověřit SDP nabídku/odpověď (`offer` / `answer`).
  * WSS handshake – ověřit, že prohlížeč nehlásí `ERR_CERT_COMMON_NAME_INVALID` nebo chybu spojení WebSocketu.
  * Firewall – ověřit průchodnost portu `4443/tcp`.

---

## Fáze 5: Dokumentace a odevzdání (Odhad: 1 den)

Podklady a struktura pro odevzdání jsou předpřipraveny v repozitáři:
* [x] **Podrobný popis fungování:** Vytvořena [DOKUMENTACE.md](DOKUMENTACE.md) s vysvětlením principů SIP, WSS a toku zpráv.
* [x] **Diagram architektury:** Vytvořen [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) včetně sekvenčních diagramů.
* [x] **Šablona závěrečné zprávy:** Připravena [docs/REPORT_TEMPLATE.md](docs/REPORT_TEMPLATE.md) se strukturou dle zadání:
  * **a. Title:** WebRTC and WebSockets in Kamailio PBX
  * **b. Description:** Rozdíl mezi klasickým SIPem (UDP) a WebRTC (WSS + DTLS-SRTP).
  * **c. Task solution:** Architektura (Docker + Kamailio + Vercel frontend), kód JsSIP, konfigurace `kamailio.cfg`.
  * **d. Conclusion:** Výsledky, výhody webového klienta oproti tlustému klientu.
  * **e. References:** Odkazy na dokumentaci JsSIP, Kamailio a standardy (RFC 7118, RFC 3261).

### Co zbývá provést:
* [ ] Doplnit do [docs/REPORT_TEMPLATE.md](docs/REPORT_TEMPLATE.md) reálné screenshoty funkčního hovoru z Fáze 4 a exportovat do PDF (pokud zadání vyžaduje PDF).
