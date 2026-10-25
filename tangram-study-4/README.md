# Tangram Study, stimulus set 4 (candles vs people, version 2): setup

This is a separate copy of the study with a new set of four pictures, tagged `stimulus_set: v7-candles` in every run.
Give it its own Google Sheet, following step 1 below with a new Sheet, so its data and dashboard stay separate from the first study.
Upload this whole folder to your repo as a new folder next to `tangram-study-site`, for example `tangram-study-4`.

Four study pages send each finished run to a Google Sheet. `dashboard.html` reads that Sheet and updates every 8 seconds.

| File | What it is |
|---|---|
| `candle.html` | Version A, candle frame |
| `person.html` | Version B, person frame |
| `baseline.html` | Version C, describe and label with no frame |
| `shape.html` | Version D, compare and pair with no naming |
| `dashboard.html` | Live results: similarity and pairing across all four |
| `index.html` | Researcher index with links to everything |
| `config.js` | Holds your Sheet's web app URL (the only file you edit) |
| `apps-script.gs` | The script that goes into the Google Sheet (not used by the site) |

## 1. Set up the Google Sheet (about 5 minutes)

1. Create a new Google Sheet, for example "Tangram Study responses".
2. Open **Extensions → Apps Script**. Delete what's there, paste in all of `apps-script.gs`, and save.
3. Click **Deploy → New deployment**. Under "Select type" (the gear icon), choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** and approve the permissions. Google will warn that the app isn't verified. Click **Advanced → Go to … (unsafe)**. It's your own script.
5. Copy the **Web app URL**. It ends in `/exec`.

## 2. Connect the site

Open `config.js` and paste the URL between the quotes:

```js
window.TANGRAM_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec'
};
```

## 3. Publish on GitHub Pages

1. Create a repository, for example `tangram-study`, and upload every file in this folder.
2. Open **Settings → Pages**. Under "Build and deployment", choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
3. After a minute the site is live at `https://<your-username>.github.io/tangram-study/`.

Participant links:

- `…/candle.html`
- `…/person.html`
- `…/baseline.html`
- `…/shape.html`

Your live view is `…/dashboard.html`.

## Before the talk

- Do one test run of each version. Each run should appear as a new row in the Sheet's `runs` tab and on the dashboard within about 10 seconds.
- Click **Start fresh from now** on the dashboard to hide your test runs. The rows stay in the Sheet. **Show all responses** brings them back. The setting is remembered in that browser only.
- `dashboard.html#demo` shows made-up numbers so you can preview the layout without real data.

## What gets stored

Each run is one row: condition, the six pairwise similarity ratings, the pairing chosen, the whole-picture descriptions, the comment, and the full run as JSON in the last column (with part labels, piece assignments and response times).

The dashboard's public read link returns only condition, ratings and pairing. It never returns descriptions or comments.

If a participant's upload fails, their page offers Try again, plus Download and Copy as a fallback.

## Changing the script later

After you edit `apps-script.gs` in the Sheet, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL.
