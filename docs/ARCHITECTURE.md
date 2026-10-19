# Architektura: WebRTC a SIP přes WebSockets (Kamailio)

## Přehled Architektury

```mermaid
flowchart TD
    subgraph BrowserA["Klient A (Alice - Browser / Vercel)"]
        JsSIP_A["JsSIP Klient"]
        Media_A["WebRTC Audio (Mic / Speaker)"]
    end

    subgraph Server["Server (Oracle Cloud Ubuntu)"]
        subgraph DockerCompose["Docker Compose"]
            Kamailio["Kamailio SIP Proxy (Port 4443 WSS / 5060 SIP)"]
            MariaDB["MariaDB (Uživatelé & Lokace)"]
        end
        Certbot["Let's Encrypt SSL/TLS"]
    end

    subgraph BrowserB["Klient B (Bob - Browser / Vercel)"]
        JsSIP_B["JsSIP Klient"]
        Media_B["WebRTC Audio (Mic / Speaker)"]
    end

    STUN["Google STUN Server (stun:stun.l.google.com:19302)"]

    %% Signalizace (SIP přes WebSockets)
    JsSIP_A -- "WSS: SIP REGISTER / INVITE" --> Kamailio
    Kamailio -- "WSS: SIP INVITE" --> JsSIP_B
    Kamailio <--> MariaDB

    %% Certifikát
    Certbot -. "Mount SSL certifikátu" .-> Kamailio

    %% ICE / STUN
    JsSIP_A -. "Zjištění veřejné IP/Portu" .-> STUN
    JsSIP_B -. "Zjištění veřejné IP/Portu" .-> STUN

    %% Média (P2P DTLS-SRTP)
    Media_A <== "P2P WebRTC Audio (DTLS-SRTP)" ==> Media_B
```

## Komponenty a toky dat

1. **Signalizace (SIP over WSS):**
   - Webový prohlížeč naváže šifrované spojení WebSocket (`wss://<domena>:4443`).
   - Kamailio zachytí WebSocket upgrade požadavek v `event_route[xhttp:request]` a přepne na SIP protokol.
   - Prohlížeče si vyměňují SIP zprávy (REGISTER, INVITE, 200 OK, ACK, BYE) a SDP (Session Description Protocol) zapouzdřené ve WebSocket rámcích.

2. **Databáze (MariaDB):**
   - Modul `auth_db` ověřuje uživatelská hesla (digest HA1) z tabulky `subscriber`.
   - Modul `usrloc` udržuje aktivní lokace a WebSocket spojení v tabulce `location`.

3. **Média (WebRTC DTLS-SRTP):**
   - Zvukový proud (audio) neprochází přes Kamailio – po signalizační fázi se naváže přímé peer-to-peer (P2P) spojení mezi prohlížeči.
   - Zabezpečení je zajištěno protokolem DTLS pro výměnu klíčů a SRTP pro šifrování hlasových paketů.
   - Překonání NAT je řešeno pomocí veřejného STUN serveru Google (`stun.l.google.com:19302`).
