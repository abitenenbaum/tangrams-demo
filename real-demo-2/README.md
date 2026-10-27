# Tangram Study, real-demo-2: setup

Two versions (`light.html`, `person.html`) send each finished run to a Google Sheet; `dashboard.html` shows similarity and pairing live. Every run is tagged `stimulus_set: demo2-v1`. Participants describe each picture (no part labeling), rate the six pairs, then make two pairs.

Item codes:
- `CT`: Candle · twisted
- `LS`: Lamp · straight-on
- `CS`: Candle · straight-on
- `LT`: Lamp · twisted

## Setup
1. Make a new Google Sheet. Open Extensions → Apps Script, paste in all of `apps-script.gs`, save.
2. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone. Deploy, approve, copy the URL ending in `/exec`.
3. Paste that URL into `config.js`.
4. Upload this whole folder to your GitHub repo next to the others. Links: `https://<you>.github.io/<repo>/real-demo-2/light.html`, `…/person.html`, `…/dashboard.html`.

Before the talk: do a test run of each, check the row appears in the Sheet and on the dashboard, then click "Start fresh from now" on the dashboard.

After editing the script later: Deploy → Manage deployments → pencil → Version: New version → Deploy (keeps the URL). `rebuildFromJson` refills columns from each row's json; `buildLabels` is not useful here since there are no part labels.
