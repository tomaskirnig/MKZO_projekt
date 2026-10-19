# WebSockets v Kamailio (WebRTC SIP Proxy) - Projekt MKZO

**Cíl:** Zprovoznit server pro směrování hovorů mezi webovými klienty pomocí WebRTC a SIP přes WebSockets.

---

## 📁 Struktura repozitáře

```
├── docker-compose.yml          # Konfigurace kontejnerů MariaDB a Kamailio
├── .env.example                # Šablona proměnných prostředí (doména, porty, hesla)
├── roadmapa_projektu.md        # Kompletní plán projektu (Fáze 1 až 5)
├── kamailio/                   # Backend – Kamailio SIP Server
│   ├── Dockerfile              # Sestavení Kamailia s moduly pro MySQL, TLS a WebSockets
│   ├── kamailio.cfg            # Konfigurace směrování, autentizace a WebSocket handshake
│   ├── tls.cfg                 # Konfigurace TLS/SSL certifikátů pro port 4443
│   └── scripts/
│       ├── init-db.sh          # Inicializace tabulek v databázi (kamdbctl create)
│       └── add-user.sh         # Přidání testovacích SIP účtů (kamctl add)
├── certs/                      # Složka pro certifikáty (privkey.pem, fullchain.pem)
│   └── generate-self-signed.sh # Generátor self-signed certifikátu pro lokální vývoj
├── frontend/                   # Frontend – WebRTC SIP webový klient (React + Vite + JsSIP)
│   ├── src/
│   │   ├── App.jsx             # UI pro přihlášení, stav spojení a tlačítka Call / Hangup
│   │   └── App.css             # Styly rozhraní
│   └── package.json            # Závislosti (jssip, react, lucide-react)
└── docs/                       # Dokumentace k odevzdání
    ├── ARCHITECTURE.md         # Architektonický diagram a popis toku zpráv
    └── REPORT_TEMPLATE.md      # Šablona závěrečné zprávy dle zadání
```

---

## 🚀 Rychlý start pro vývoj

### 1. Příprava konfigurace
Zkopírujte šablonu proměnných:
```bash
cp .env.example .env
```
V `.env` můžete nastavit vlastní hesla nebo doménu. Pro lokální testování je výchozí nastavení připraveno.

### 2. Certifikáty pro TLS / WSS
Pro lokální testování byly vygenerovány self-signed certifikáty v `certs/`. Kdykoliv je můžete přegenerovat:
```bash
./certs/generate-self-signed.sh localhost
```
*(Na produkčním serveru Oracle Cloud se sem namapuje složka Let's Encrypt `/etc/letsencrypt/live/<domena>` dle Fáze 1).*

### 3. Spuštění Backend infrastruktury
Spusťte MariaDB a Kamailio:
```bash
docker compose up -d
```

### 4. Inicializace databáze a testovací uživatelé
Po prvním spuštění MariaDB inicializujte databázové schéma Kamailia:
```bash
./kamailio/scripts/init-db.sh
```

Vytvořte testovací účty:
```bash
./kamailio/scripts/add-user.sh alice@localhost heslo123
./kamailio/scripts/add-user.sh bob@localhost heslo456
```

### 5. Spuštění Frontendu
V samostatném terminálu přejděte do složky `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Otevřete `http://localhost:3000` v prohlížeči.

---

## 🌐 Nasazení na Cloud (Oracle Cloud & Vercel)

Podrobný postup podle fází projektu naleznete v [roadmapa_projektu.md](roadmapa_projektu.md):

1. **Oracle Cloud (Fáze 1):**
   - Vytvořte Ubuntu instanci a otevřete porty `22`, `80`, `443`, `4443` a `5060`.
   - Nasměrujte bezplatnou doménu (např. z DuckDNS.org) na IP serveru.
   - Spusťte `sudo certbot certonly --standalone -d tvoje-domena.duckdns.org`.
   - V `.env` nastavte `SSL_CERTS_DIR=/etc/letsencrypt/live/tvoje-domena.duckdns.org`.

2. **Vercel (Fáze 3):**
   - Propojte GitHub repozitář s [Vercel](https://vercel.com).
   - Nastavte Root Directory na `frontend`.
   - Vercel automaticky nasadí aplikaci s platným HTTPS certifikátem pro přístup k mikrofonu.

---

## 📚 Dokumentace a odevzdání

- [Podrobná dokumentace projektu s vysvětlením (DOKUMENTACE.md)](DOKUMENTACE.md)
- [Architektura systému a toky dat](docs/ARCHITECTURE.md)
- [Šablona závěrečné zprávy pro odevzdání](docs/REPORT_TEMPLATE.md)