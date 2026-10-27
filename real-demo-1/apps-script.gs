/**
 * Tangram Study: receives runs from the study pages and serves them to the dashboard.
 * Paste this into Extensions > Apps Script of a Google Sheet, then Deploy > New deployment >
 * Web app (Execute as: Me, Who has access: Anyone). Put the /exec URL in config.js.
 */
const SHEET = 'runs';
const PAIRS = ['ED-EU', 'SD-SU', 'EU-SU', 'ED-SD', 'ED-SU', 'EU-SD'];
const ITEMS = ['ED', 'SU', 'EU', 'SD'];
const HEADER = ['received_at', 'run_id', 'condition', 'stimulus_set', 'started_at', 'finished_at', 'total_ms']
  .concat(PAIRS.map(p => 'sim_' + p))
  .concat(['partition_type', 'partition'])
  .concat(ITEMS.map(c => 'name_' + c))
  .concat(['comment', 'json']);

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); }
  if (sh.getLastRow() === 0) { sh.appendRow(HEADER); sh.setFrozenRows(1); }
  else {
    // Keep the header row in step with this script (fixes old column names).
    const cur = sh.getRange(1, 1, 1, HEADER.length).getValues()[0];
    if (cur.join('|') !== HEADER.join('|')) { sh.getRange(1, 1, 1, HEADER.length).setValues([HEADER]); sh.setFrozenRows(1); }
  }
  return sh;
}

// Stop text that starts with = + - @ from being read as a formula.
function safe_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

// One sheet row for one run.
function rowFor_(r, receivedAt) {
  const sim = {};
  (r.similarity || []).forEach(s => { sim[String(s.pair)] = s.rating; });
  const items = r.items || {};
  return [receivedAt, r.run_id, r.condition, r.stimulus_set, r.started_at, r.finished_at, r.total_ms]
    .concat(PAIRS.map(p => (p in sim) ? sim[p] : ''))
    .concat([r.pairing ? r.pairing.partition_type : '', r.pairing ? r.pairing.partition : ''])
    .concat(ITEMS.map(c => (items[c] && items[c].whole) || ''))
    .concat([r.comment || '', JSON.stringify(r).slice(0, 49000)]);
}

// Run once from the editor to refill every row's columns from its json (keeps received_at).
function rebuildFromJson() {
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return;
  const vals = sh.getRange(2, 1, n, sh.getLastColumn()).getValues();
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  let jc = head.indexOf('json'); if (jc < 0) jc = HEADER.length - 1;
  const out = vals.map(v => {
    const t = v[0];
    try { return rowFor_(JSON.parse(String(v[jc] || v[v.length - 1])), t instanceof Date ? t.toISOString() : String(t)).map(safe_); }
    catch (e) { return v.slice(0, HEADER.length).concat(Array(Math.max(0, HEADER.length - v.length)).fill('')); }
  });
  sh.getRange(2, 1, n, HEADER.length).setValues(out);
  if (sh.getLastColumn() > HEADER.length) sh.getRange(1, HEADER.length + 1, n + 1, sh.getLastColumn() - HEADER.length).clearContent();
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const r = JSON.parse(e.postData.contents);
    if (!r || !r.run_id || !Array.isArray(r.similarity)) return out_({ ok: false, error: 'not a run' });
    const sh = sheet_();
    if (sh.getLastRow() > 1) {
      const dup = sh.getRange(2, 2, sh.getLastRow() - 1, 1).createTextFinder(String(r.run_id)).matchEntireCell(true).findNext();
      if (dup) return out_({ ok: true, duplicate: true });
    }
    const row = rowFor_(r, new Date().toISOString());
    sh.appendRow(row.map(safe_));
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// The dashboard reads this: one object per run, without names or comments.
function doGet() {
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return out_({ runs: [] });
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const col = name => head.indexOf(name);
  const vals = sh.getRange(2, 1, n, sh.getLastColumn()).getValues();
  const runs = vals.map(v => {
    const sim = {};
    PAIRS.forEach(p => { const x = v[col('sim_' + p)]; if (x !== '' && x !== null) sim[p] = Number(x); });
    const t = v[col('received_at')];
    return { received_at: t instanceof Date ? t.toISOString() : String(t), condition: v[col('condition')], stimulus_set: v[col('stimulus_set')], sim: sim, partition_type: v[col('partition_type')] };
  });
  return out_({ runs: runs });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run from the editor: builds a "labels" tab with one row per named part.
function buildLabels() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const src = sheet_();
  const head = src.getRange(1, 1, 1, src.getLastColumn()).getValues()[0];
  const jc = head.indexOf('json');
  const rows = [['run_id', 'condition', 'item', 'shown_position', 'description', 'part_label', 'pieces']];
  if (src.getLastRow() > 1) src.getRange(2, 1, src.getLastRow() - 1, src.getLastColumn()).getValues().forEach(v => {
    if (!v[jc]) return;
    const r = JSON.parse(String(v[jc]));
    Object.keys(r.items || {}).sort().forEach(code => {
      const it = r.items[code];
      (it.parts || []).forEach(p => rows.push([r.run_id, r.condition, code, it.order_index + 1, it.whole, p.label, p.pieces.join(' ')]));
    });
  });
  let out = ss.getSheetByName('labels');
  if (out) out.clear(); else out = ss.insertSheet('labels');
  out.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  out.setFrozenRows(1);
}
