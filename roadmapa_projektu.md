# Projekt: WebSockets v Kamailio (WebRTC SIP Proxy)
**Cíl:** Zprovoznit server pro směrování hovorů mezi webovými klienty pomocí WebRTC a SIP přes WebSockets.

## Fáze 1: Infrastruktura a Certifikáty (Odhad: 1-2 dny)
1. **Server (Oracle Cloud):**
   * Založ "Always Free" instanci (Ubuntu). AMD Micro instance je bez problémů dostupná, u ARM Ampere bývá občas plná kapacita regionu.
   * V Oracle Cloud Security Lists povol příchozí porty: `22` (SSH), `80` a `443` (pro získání certifikátu), `4443` (Kamailio WSS).
2. **Doména:**
   * Zaregistruj si free subdoménu (např. na DuckDNS.org) a nasměruj ji na veřejnou IP Oracle serveru.
3. **SSL/TLS Certifikát:**
   * Nainstaluj `certbot` a vygeneruj Let's Encrypt certifikát: 
     `sudo certbot certonly --standalone -d tvoje-domena.duckdns.org`
   * Prohlížeče striktně vyžadují platný certifikát pro přístup k mikrofonu a pro WSS spojení.
4. **Docker:**
   * Nainstaluj Docker a Docker Compose pro kontejnerizaci backendu.

## Fáze 2: Konfigurace Backend (Kamailio v Dockeru) (Odhad: 2-4 dny)
Největší technická výzva projektu.
1. **Příprava konfigurace:**
   * Stáhni si výchozí `kamailio.cfg` pro aktuální verzi.
   * Přidej na úplný začátek souboru tyto direktivy, které zapnou zabudovanou logiku:
     ```text
     #!define WITH_MYSQL
     #!define WITH_AUTH
     #!define WITH_USRLOCDB
     #!define WITH_TLS
     #!define WITH_WEBSOCKETS
     ```
2. **Docker Compose:**
   * Vytvoř `docker-compose.yml`, který spustí kontejner s databází (MariaDB) a kontejner s Kamailiem.
   * Namapuj složku s Let's Encrypt certifikáty (`/etc/letsencrypt`) do kontejneru Kamailia (read-only), aby k nim měl TLS modul přístup.
3. **Založení uživatelů:**
   * Přes nástroj `kamctl` (přímo v kontejneru) vytvoř testovací SIP účty, např.:
     `kamctl add alice@tvoje-domena.duckdns.org heslo123`
     `kamctl add bob@tvoje-domena.duckdns.org heslo456`

## Fáze 3: Vývoj Frontendu (Webový klient) (Odhad: 2-3 dny)
Jako programátor zde využiješ své silné stránky.
1. **Knihovna:** Použij **JsSIP** (je modernější a lépe dokumentovaná pro začátečníky než SIP.js).
2. **Aplikace (React / Vanilla JS):**
   * **Konfigurace klienta:** Nastav WSS URL na `wss://tvoje-domena.duckdns.org:4443` a přihlašovací údaje (Alice/Bob).
   * **UI:** Vytvoř jednoduchý layout – input pro zadání volaného čísla, tlačítko "Call" a "Hangup".
   * **Média:** Nezapomeň do HTML přidat element `<audio id="remoteAudio" autoplay></audio>`, do kterého JsSIP pustí přijatý zvukový stream.
   * **NAT (STUN):** V konfiguraci `JsSIP.UA` přidej do `sockets` nastavení pro ICE servery: `urls: 'stun:stun.l.google.com:19302'`.
3. **Nasazení:**
   * Zdrojáky nahraj na GitHub a propoj s **Vercel**. Tím získáš zdarma HTTPS hosting pro svůj frontend.

## Fáze 4: Integrace a Testing (Odhad: 1-2 dny)
1. Otevři frontend ve dvou různých prohlížečích (nebo na PC a na mobilu).
2. Přihlas se do jednoho jako Alice, do druhého jako Bob.
3. Zavolej z jednoho do druhého.
4. **Troubleshooting (pokud není zvuk):**
   * Zkontroluj v konzoli prohlížeče (F12) výměnu SDP (Session Description Protocol).
   * Ověř, zda prohlížeč hlásí chyby s certifikátem WSS.
   * Pokud by P2P spojení absolutně selhávalo kvůli firemní/školní síti, zkus použít mobilní data pro jeden z klientů.

## Fáze 5: Dokumentace a odevzdání (Odhad: 1 den)
Struktura podle zadání:
* **a. Title:** WebRTC and WebSockets in Kamailio PBX
* **b. Description:** Vysvětlení rozdílu mezi tradičním SIPem a WebRTC (transport přes WSS, DTLS-SRTP pro média).
* **c. Task solution:** Architektura (Docker + Kamailio + Vercel frontend), ukázky JavaScript kódu pro inicializaci hovoru, ukázka `kamailio.cfg` úprav.
* **d. Conclusion:** Dosažené výsledky, úspěšný test hovoru, zhodnocení výhod použití prohlížeče místo tlustého klienta.
* **e. References:** Odkazy na dokumentaci JsSIP, Kamailio a RFC standardy (např. RFC 7118 pro SIP přes WebSockets).