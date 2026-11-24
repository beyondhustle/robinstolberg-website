
// E-Mail Prüfung gegen Bounces: Domain muss einen Mailserver haben, häufige Tippfehler fallen raus.
import { resolveMx } from "node:dns/promises";
const TIPPFEHLER = new Set(["gmial.com","gmai.com","gamil.com","gnail.com","gmail.co","gmail.de","gmx.dee","gmx.ed","web.dee","wbe.de","hotmial.com","hotmai.com","outlok.com","outlook.co","yaho.com","yahoo.co","icloud.co","iclod.com","t-onlin.de","t-onlie.de","tonline.de"]);
async function emailZustellbar(email) {
  const domain = email.split("@")[1] || "";
  if (TIPPFEHLER.has(domain)) return false;
  try {
    const mx = await Promise.race([resolveMx(domain), new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), 3000))]);
    return Array.isArray(mx) && mx.some(r => r && r.exchange && r.exchange !== ".");
  } catch (e) {
    // Domain existiert nicht oder hat keinen Mailserver: ablehnen. Bei Netzproblemen lieber durchlassen.
    return !["ENOTFOUND", "ENODATA", "ESERVFAIL", "ENONAME"].includes(e && e.code);
  }
}

// Workshop Anmeldung: trägt Kontakte über die SendFox API in die Liste ein und setzt Tags,
// bevor die Person zum Luma Checkout weitergeleitet wird.
// Nutzt dieselben Umgebungsvariablen wie der BOLT Test (niemals ins Repository schreiben):
//   SENDFOX_TOKEN    persönlicher API Token aus SendFox (Pflicht)
//   SENDFOX_LIST_ID  ID der Liste (optional; ohne sie wird die Liste "Beyond Hustle ..." gesucht)
// Tags: "workshop" (alle Workshop Interessenten) und der Tag des konkreten Termins (siehe WORKSHOPS).
// Fehlt ein Tag in SendFox, versucht die Funktion ihn anzulegen.

const API = "https://api.sendfox.com";
const LIST_NAME = /beyond\s*hustle/i;

// Erlaubte Workshops: Schlüssel aus dem Formular -> Tag in SendFox.
// Für einen neuen Termin hier eine Zeile ergänzen.
export const WORKSHOPS = {
  "emotionen-2026-11": "workshop-emotionen-2026-11",
};

let tagCache = null;
let listCache = null;

const env = (k) => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k];
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function sf(fetchImpl, token, path, opt = {}) {
  return fetchImpl(`${API}${path}`, { ...opt, headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(opt.body ? { "Content-Type": "application/json" } : {}) } });
}

async function paged(fetchImpl, token, path, maxPages) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const r = await sf(fetchImpl, token, `${path}?page=${page}`);
    if (!r.ok) throw new Error(`${path} ${r.status}`);
    const body = await r.json();
    const items = Array.isArray(body) ? body : (body.data || []);
    all.push(...items);
    const last = body.last_page ?? (body.meta && body.meta.last_page);
    if (!items.length || !last || page >= last) break;
  }
  return all;
}

async function loadTags(token, fetchImpl) {
  if (tagCache) return tagCache;
  const map = {};
  for (const t of await paged(fetchImpl, token, "/contact-tags", 20)) {
    const name = (t.name ?? t.title ?? t.label ?? "").toString().trim().toLowerCase();
    if (name && t.id != null) map[name] = t.id;
  }
  tagCache = map;
  return map;
}

async function findList(token, fetchImpl) {
  if (listCache) return listCache;
  const all = await paged(fetchImpl, token, "/lists", 10);
  const hit = all.find((l) => LIST_NAME.test(String(l.name || ""))) || (all.length === 1 ? all[0] : null);
  if (!hit) throw new Error("Liste nicht gefunden: " + all.map((l) => l.name).join(", "));
  listCache = Number(hit.id);
  return listCache;
}

async function createTag(token, fetchImpl, name) {
  try {
    const r = await sf(fetchImpl, token, "/contact-tags", { method: "POST", body: JSON.stringify({ name }) });
    if (!r.ok) return null;
    const b = await r.json();
    const id = b.id ?? (b.data && b.data.id);
    return id != null ? Number(id) : null;
  } catch { return null; }
}

export async function handle(req, fetchImpl = fetch) {
  if (req.method !== "POST") return json(405, { ok: false, error: "method" });

  let d;
  try { d = await req.json(); } catch { return json(400, { ok: false, error: "json" }); }

  // Honeypot: Bots füllen das versteckte Feld aus. Freundlich antworten, nichts speichern.
  if (d.website) return json(200, { ok: true });

  const email = String(d.email || "").trim().toLowerCase();
  const vorname = String(d.vorname || "").trim().slice(0, 60);
  const workshop = String(d.workshop || "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return json(400, { ok: false, error: "email" });
  if (!(await emailZustellbar(email))) return json(400, { ok: false, error: "email" });
  if (!vorname) return json(400, { ok: false, error: "vorname" });
  if (!WORKSHOPS[workshop]) return json(400, { ok: false, error: "workshop" });
  if (d.einwilligung !== true) return json(400, { ok: false, error: "einwilligung" });

  const token = env("SENDFOX_TOKEN");
  if (!token) {
    console.error("SENDFOX_TOKEN fehlt");
    return json(500, { ok: false, error: "config" });
  }
  let listId = parseInt(env("SENDFOX_LIST_ID"), 10);
  if (!listId) {
    try { listId = await findList(token, fetchImpl); }
    catch (e) { console.error(e.message); return json(500, { ok: false, error: "liste" }); }
  }

  const wanted = ["workshop", WORKSHOPS[workshop]];
  let tagIds = [], missing = [];
  try {
    const map = await loadTags(token, fetchImpl);
    for (const name of wanted) {
      let id = map[name.toLowerCase()];
      if (id == null) {
        id = await createTag(token, fetchImpl, name);
        if (id != null) map[name.toLowerCase()] = id;
      }
      if (id != null) tagIds.push(Number(id)); else missing.push(name);
    }
  } catch (e) {
    console.error("Tags konnten nicht geladen werden:", e.message);
    missing = wanted.slice();
  }
  if (missing.length) console.warn("Tags in SendFox nicht gefunden:", missing.join(", "));

  const payload = { email, first_name: vorname, lists: [listId] };
  if (tagIds.length) payload.contact_tags = tagIds;
  const ip = req.headers.get("x-nf-client-connection-ip");
  if (ip) payload.ip_address = ip;

  const r = await fetchImpl(`${API}/contacts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    console.error("SendFox Fehler", r.status, t.slice(0, 300));
    return json(502, { ok: false, error: "sendfox" });
  }

  return json(200, { ok: true, tags: wanted.filter((n) => !missing.includes(n)), tags_fehlen: missing });
}

export default (req) => handle(req);

export const config = { path: "/api/workshop" };
