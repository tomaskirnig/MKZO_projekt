# 📖 Projektová Dokumentace (I pro úplné začátečníky)

Tento dokument slouží jako živý přehled projektu: **co už v repozitáři máme, jak to funguje a proč jsou věci udělané zrovna takhle**. 

---

## 1. O čem tenhle projekt vlastně je? (Vysvětlení v lidské řeči)

Představ si, že chceš v prohlížeči (např. v Chromu) kliknout na tlačítko a zavolat kamarádovi na druhý počítač.

### Problém:
1. **Klasická telefonie (SIP):** Běžné internetové telefony používají protokol SIP a posílají data přes UDP porty. Jenže webový prohlížeč z bezpečnostních důvodů **neumí** přímo otevírat surové UDP pakety.
2. **WebRTC:** Moderní prohlížeče sice umí přenášet zvuk a video v reálném čase přímo mezi sebou (**WebRTC**), ale samy od sebe nevědí, *komu* a *kam* vlastně zavolat. Nemají telefonní seznam ani způsob, jak tomu druhému poslat zprávu *"Zvoň, někdo ti volá!"*.

### Řešení v tomto projektu:
* **Kamailio jako ústředna:** Kamailio funguje jako inteligentní telefonní ústředna (SIP Proxy).
* **WebSockets jako most:** Naučíme Kamailio přijímat spojení přes WebSockets (`ws://` a šifrované `wss://`), což je protokol, kterému webové prohlížeče perfektně rozumí.
* **Výsledek:** Prohlížeč pošle přes WebSocket žádost o hovor do Kamailia, Kamailio zazvoní na druhý prohlížeč a jakmile se hovor přijme, zvuk už proudí přímo mezi oběma prohlížeči (peer-to-peer).

---

## 2. Co už v repozitáři máme hotové? (Aktuální stav)

| Komponenta | Co to je | Kde to najdeš | Proč to máme |
| :--- | :--- | :--- | :--- |
| **Docker Compose** | Spouštěč služeb | [`docker-compose.yml`](docker-compose.yml) | Spustí databázi i telefonní server jedním příkazem bez složité instalace na systém. |
| **Konfigurace Kamailio** | Mozek ústředny | [`kamailio/kamailio.cfg`](kamailio/kamailio.cfg) | Říká Kamailiu, že má mluvit přes WebSockets, ověřovat hesla v databázi a směrovat hovory. |
| **TLS šifrování** | Zabezpečení | [`kamailio/tls.cfg`](kamailio/tls.cfg) | Zajišťuje bezpečné WSS (`wss://`) spojení na portu `4443`. Bez HTTPS/WSS prohlížeč odmítne přístup k mikrofonu. |
| **MariaDB (databáze)** | Paměť ústředny | V rámci `docker-compose` | Pamatuje si registrované uživatele (jméno, heslo) a to, kde jsou zrovna připojení (lokace). |
| **Pomocné skripty** | Pohodlné příkazy | [`kamailio/scripts/`](kamailio/scripts/) | `init-db.sh` vytvoří tabulky v databázi, `add-user.sh` přidá nového uživatele (např. Alici a Boba). |
| **Certifikáty** | Klíče pro SSL | [`certs/`](certs/) | Skript `generate-self-signed.sh` pro lokální testování + složka pro budoucí Let's Encrypt. |
| **Webový klient** | Telefon v prohlížeči | [`frontend/`](frontend/) | React aplikace s knihovnou **JsSIP** – má políčka pro login, input pro volaného a tlačítka Call / Hangup. |
| **Ignorované soubory** | Bezpečnostní filtr | [`.gitignore`](.gitignore) | Chrání před únikem privátních klíčů, hesel z `.env`, databáze i objemných `node_modules`. |
| **Šablony proměnných** | Konfigurace prostředí | [`.env.example`](.env.example) | Vzor pro nastavení domény, hesel a cest k certifikátům. |
| **Dokumentace** | Schémata a šablona | [`docs/`](docs/) | Diagram toku dat (`ARCHITECTURE.md`) a šablona závěrečné zprávy k odevzdání (`REPORT_TEMPLATE.md`). |

---

## 3. Podrobné vysvětlení souborů (Jak to do sebe zapadá)

### A. `docker-compose.yml`
Tento soubor je jako stavební plán pro Docker. Definuje dvě propojené služby:
1. **`mariadb`:** Databázový server. Běží na pozadí a čeká na dotazy od Kamailia. Má svůj svazek `mariadb_data`, aby se data neztratila při restartu.
2. **`kamailio`:** Samotná ústředna. Sestaví se z `kamailio/Dockerfile` a má otevřené porty:
   - `5060` (běžný SIP – pro jistotu nebo klasické softphony),
   - `4443` (šifrovaný WSS – sem se připojuje náš webový klient),
   - `8080` (nešifrovaný WS pro lokální ladění).

### B. `kamailio/kamailio.cfg`
Tohle je nejdůležitější konfigurační soubor backendu. Na začátku obsahuje direktivy:
```text
#!define WITH_MYSQL        # Zapne podporu databáze MySQL / MariaDB
#!define WITH_AUTH         # Zapne ověřování uživatelů heslem
#!define WITH_USRLOCDB     # Zapne ukládání online uživatelů do databáze
#!define WITH_TLS          # Zapne šifrování certifikátem
#!define WITH_WEBSOCKETS   # Zapne podporu protokolu WebSockets
```
Dále obsahuje klíčový blok `event_route[xhttp:request]`:
Když se prohlížeč pokusí připojit přes WebSocket, pošle HTTP požadavek s hlavičkou `Upgrade: websocket`. Kamailio tento požadavek odchytí, zavolá funkci `ws_handle_handshake()` a přepne toto spojení do režimu obousměrného SIP kanálu.

### C. `kamailio/tls.cfg`
Prohlížeče (Chrome, Firefox) striktně zakazují nešifrovaný přístup k mikrofonu a odmítají WebSockets z nezabezpečených stránek. Tento soubor říká Kamailiu, kde na disku najde soubory:
- `fullchain.pem` (veřejný certifikát)
- `privkey.pem` (soukromý klíč)

### D. `frontend/` (React + JsSIP)
Webový klient, který simuluje fyzický telefonní přístroj:
- **`JsSIP.UA`:** Vytvoří softwarového SIP agenta přímo v paměti prohlížeče.
- **`JsSIP.WebSocketInterface`:** Zajistí transportní spojení na adresu `wss://domena:4443`.
- **STUN server (`stun:stun.l.google.com:19302`):** Pomáhá prohlížeči zjistit jeho skutečnou veřejnou IP adresu a port, pokud sedí za domácím Wi-Fi routerem (NAT traversal).
- **`<audio id="remoteAudio" autoplay>`:** HTML5 prvek, do kterého se po přijetí hovoru automaticky napojí zvuk přicházející od druhého účastníka.

---

## 4. Jak probíhá hovor krok za krokem?

```
[Prohlížeč Alice]               [Kamailio Server]               [MariaDB]               [Prohlížeč Bob]
       |                                |                           |                          |
       | --- 1. WebSocket Handshake --> |                           |                          |
       | <--- 2. Spojení navázáno ----- |                           |                          |
       |                                |                           |                          |
       | --- 3. REGISTER (Alice) -----> |                           |                          |
       | <--- 4. 401 Unauthorized ----- | (Výzva k zadání hesla)   |                          |
       | --- 5. REGISTER + Heslo -----> | --- 6. Ověř heslo ------> |                          |
       |                                | <--- 7. Heslo sedí ------ |                          |
       | <--- 8. 200 OK (Online) ------ |                           |                          |
       |                                |                           |                          |
       | --- 9. INVITE (Volám Boba) --> |                                                      |
       |    (obsahuje SDP nabídku)      | --- 10. INVITE (přeposlání) -----------------------> |
       |                                | <--- 11. 180 Ringing (Zvoní) ----------------------- |
       | <--- 12. 180 Ringing --------- |                                                      |
       |                                | <--- 13. 200 OK (Bob zvedl hovor) ------------------ |
       | <--- 14. 200 OK -------------- |                                                      |
       | --- 15. ACK -----------------> | --- 16. ACK ---------------------------------------> |
       |                                |                                                      |
       | ==================== 17. ZVUK PROUDÍ PŘÍMO (WebRTC DTLS-SRTP) ====================== |
```

> **Důležitá poznámka:** Všimni si kroku 17. Kamailio řídí **pouze signalizaci** (kdo komu volá a domluvení parametrů). Samotný hlas (audio stream) vůbec neprochází serverem, ale teče napřímo mezi oběma prohlížeči šifrovaně přes WebRTC. Server tak není přetěžován zpracováním zvuku.

---

## 5. Jak to spustit a otestovat na svém počítači?

Pokud chceš projekt vyzkoušet lokálně:

### Krok 1: Spusť backend (Kamailio a MariaDB)
V kořenu projektu:
```bash
docker compose up -d
```
*(Pokud Docker hlásí oprávnění k docker.sock, použij `sudo docker compose up -d`)*

### Krok 2: Vytvoř databázi a testovací uživatele
Počkej cca 5 sekund, než MariaDB nastartuje, a spusť:
```bash
# Vytvoření tabulek
./kamailio/scripts/init-db.sh

# Vytvoření testovacích účtů
./kamailio/scripts/add-user.sh alice@localhost heslo123
./kamailio/scripts/add-user.sh bob@localhost heslo456
```

### Krok 3: Spusť frontend
V novém okně terminálu:
```bash
cd frontend
npm run dev
```
Otevři si v prohlížeči `http://localhost:3000`.

---

## 6. Co nás čeká v dalších fázích? (Podle roadmapy)

1. **Fáze 1 (Infrastruktura na Cloudu):**
   - Zprovoznit bezplatnou instanci v Oracle Cloudu (Ubuntu).
   - Založit doménu zdarma na DuckDNS (např. `tomas-kamailio.duckdns.org`).
   - Vygenerovat pravý certifikát přes Let's Encrypt (`certbot`).
2. **Fáze 2 (Nasazení na server):**
   - Spustit náš připravený `docker-compose.yml` přímo na Oracle serveru s ostrým certifikátem.
3. **Fáze 3 (Frontend na Vercel):**
   - Propojit složku `frontend` s Vercel.com pro bezplatný HTTPS web.
4. **Fáze 4 (Testování):**
   - Otevřít web na dvou zařízeních (PC + mobil), přihlásit Alice a Boba a provést skutečný hovor.
5. **Fáze 5 (Odevzdání):**
   - Vyplnit předpřipravenou šablonu zprávy v [`docs/REPORT_TEMPLATE.md`](docs/REPORT_TEMPLATE.md).
