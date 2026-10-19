# WebRTC SIP Frontend (JsSIP Client)

Jednoduchý webový klient využívající **JsSIP** pro registraci a směrování hovorů přes WebSockets do Kamailio proxy serveru.

## Rychlý start lokálně

1. Nainstalujte závislosti:
   ```bash
   npm install
   ```

2. Nakonfigurujte `.env` (volitelné):
   ```bash
   cp .env.example .env
   ```
   Upravte hodnoty pro `VITE_SIP_WS_SERVER` a `VITE_SIP_DOMAIN`.

3. Spusťte vývojový server:
   ```bash
   npm run dev
   ```
   Aplikace poběží na `http://localhost:3000`.

## Sestavení pro produkci

```bash
npm run build
```
Výsledné statické soubory budou ve složce `dist/`.

## Nasazení na Vercel (Fáze 3)

1. Připojte repozitář na [Vercel](https://vercel.com).
2. Jako Root Directory zvolte složku `frontend`.
3. Vercel automaticky detekuje Vite:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Přidejte environment proměnné (`VITE_SIP_WS_SERVER`, `VITE_SIP_DOMAIN`).
5. Klikněte na **Deploy** (získáte HTTPS hosting zdarma pro přístup k mikrofonu).
