# Závěrečná zpráva: WebRTC and WebSockets in Kamailio PBX

## a. Title
**WebRTC and WebSockets in Kamailio PBX**
* **Autor:** Tomáš Kirnig
* **Předmět:** MKZO
* **Datum:** 2026

---

## b. Description
> **Vysvětlení rozdílu mezi tradičním SIPem a WebRTC (transport přes WSS, DTLS-SRTP pro média).**

### 1. Tradiční SIP vs. WebRTC SIP
* **Tradiční SIP:**
  - Transportní vrstva: UDP nebo TCP na portu 5060.
  - Média: Nekódovaný RTP přes náhodné UDP porty.
  - Klient: Specializovaný software / hardware (tzv. tlustý klient jako MicroSIP, Zoiper, IP telefon).
* **WebRTC SIP:**
  - Transportní vrstva: Zabezpečený WebSocket (WSS – TLS) přes port 443 / 4443. Webový prohlížeč nativně neumí otevírat surové UDP sockety pro SIP, proto využívá WebSocket rozhraní.
  - Média: Šifrovaný přenos pomocí **DTLS-SRTP** (Secure Real-time Transport Protocol). Prohlížeče striktně vyžadují end-to-end šifrování médií.
  - NAT Traversal: Integrovaný ICE (Interactive Connectivity Establishment) protokol využívající STUN a případně TURN servery pro překonání symetrických i asymetrických NATů.

---

## c. Task Solution
> **Architektura (Docker + Kamailio + Vercel frontend), ukázky JavaScript kódu pro inicializaci hovoru, ukázka kamailio.cfg úprav.**

### 1. Architektura systému
* **Backend:** 
  - Oracle Cloud Ubuntu instance (Always Free).
  - Docker Compose orchestrace:
    - **MariaDB 10.11:** Ukládání uživatelských účtů (tabulka `subscriber`) a aktuálních lokací (`location`).
    - **Kamailio 5.8:** SIP Proxy s moduly `db_mysql`, `tls`, `websocket`, `nathelper`.
  - Let's Encrypt SSL/TLS certifikát pro WSS.
* **Frontend:**
  - React + Vite aplikace nasazená na **Vercel** (poskytuje HTTPS certifikát pro přístup k mikrofonu).
  - Knihovna **JsSIP** pro správu SIP relace v prohlížeči.

### 2. Ukázka konfigurace Kamailio (`kamailio.cfg`)
```text
#!define WITH_MYSQL
#!define WITH_AUTH
#!define WITH_USRLOCDB
#!define WITH_TLS
#!define WITH_WEBSOCKETS
```
*HTTP upgrade na WebSocket:*
```c
event_route[xhttp:request] {
    if ($hdr(Upgrade) =~ "websocket" && $hdr(Connection) =~ "Upgrade" && $rm =~ "GET") {
        if (ws_handle_handshake()) {
            exit;
        }
    }
    xhttp_reply("404", "Not Found", "", "");
}
```

### 3. Ukázka JavaScript inicializace klienta (JsSIP)
```javascript
const socket = new JsSIP.WebSocketInterface('wss://tvoje-domena.duckdns.org:4443');
const configuration = {
  sockets: [socket],
  uri: 'sip:alice@tvoje-domena.duckdns.org',
  password: 'heslo',
};
const ua = new JsSIP.UA(configuration);
ua.start();
```

---

## d. Conclusion
> **Dosažené výsledky, úspěšný test hovoru, zhodnocení výhod použití prohlížeče místo tlustého klienta.**

* **Výsledky testování:**
  - Registrace Alice a Boba v databázi MariaDB.
  - Úspěšný hlasový hovor mezi dvěma klienty (prohlížeči).
  - Obousměrný přenos zvuku ověřený přes HTML5 `<audio>` element.
* **Zhodnocení přínosů WebRTC:**
  - Nulová nutnost instalace dodatečného softwaru (stačí odkaz na webovou stránku).
  - Využití moderních webových standardů a šifrování out-of-the-box.
  - Jednoduchá integrace do stávajících webových systémů a portálů.

---

## e. References
1. [JsSIP Documentation](https://jssip.net/documentation/)
2. [Kamailio SIP Server Documentation](https://www.kamailio.org/wikidocs/)
3. [RFC 7118 - The WebSocket Protocol as a Transport for the Session Initiation Protocol (SIP)](https://datatracker.ietf.org/doc/html/rfc7118)
4. [RFC 3261 - SIP: Session Initiation Protocol](https://datatracker.ietf.org/doc/html/rfc3261)
5. [RFC 8825 - Overview: Real-Time Protocols for WebRTC](https://datatracker.ietf.org/doc/html/rfc8825)
