// BOLT Test: trägt Kontakte über die SendFox API in die Liste ein und setzt Tags.
// Benötigte Umgebungsvariablen in Netlify (niemals ins Repository schreiben):
//   SENDFOX_TOKEN    persönlicher API Token aus SendFox
//   SENDFOX_LIST_ID  ID der Liste, in die eingetragen wird
// Die Tags müssen in SendFox mit genau diesen Namen angelegt sein:
//   bolt-unter-20, bolt-20-30, bolt-ueber-30, Freiheitspaket 2026

const API = "https://api.sendfox.com";
const ROLLEN = ["Unternehmer mit Team", "Selbstständig mit Kunden", "Nebenberuflich selbstständig", "Angestellt"];
const QUELLEN = { freiheitspaket: "Freiheitspaket 2026" };

let tagCache = null; // Name (klein) -> ID, bleibt pro warmer Function Instanz erhalten

const env = (k) => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k];
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export function bandTag(sek) {
  if (sek < 20) return "bolt-unter-20";
  if (sek <= 30) return "bolt-20-30";
  return "bolt-ueber-30";
}

async function loadTags(token, fetchImpl) {
  if (tagCache) return tagCache;
  const map = {};
  for (let page = 1; page <= 20; page++) {
    const r = await fetchImpl(`${API}/contact-tags?page=${page}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (!r.ok) throw new Error(`contact-tags ${r.status}`);
    const body = await r.json();
    const items = Array.isArray(body) ? body : (body.data || []);
    for (const t of items) {
      const name = (t.name ?? t.title ?? t.label ?? "").toString().trim().toLowerCase();
      if (name && t.id != null) map[name] = t.id;
    }
    const last = body.last_page ?? (body.meta && body.meta.last_page);
    if (!items.length || !last || page >= last) break;
  }
  tagCache = map;
  return map;
}

export async function handle(req, fetchImpl = fetch) {
  if (req.method !== "POST") return json(405, { ok: false, error: "method" });

  let d;
  try { d = await req.json(); } catch { return json(400, { ok: false, error: "json" }); }

  // Honeypot: Bots füllen das versteckte Feld aus. Freundlich antworten, nichts speichern.
  if (d.website) return json(200, { ok: true });

  const email = String(d.email || "").trim().toLowerCase();
  const vorname = String(d.vorname || "").trim().slice(0, 60);
  const rolle = String(d.rolle || "");
  const sek = Number(d.sekunden);
  const quelle = String(d.quelle || "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return json(400, { ok: false, error: "email" });
  if (!vorname) return json(400, { ok: false, error: "vorname" });
  if (!ROLLEN.includes(rolle)) return json(400, { ok: false, error: "rolle" });
  if (!Number.isFinite(sek) || sek < 1 || sek > 300) return json(400, { ok: false, error: "sekunden" });
  if (d.einwilligung !== true) return json(400, { ok: false, error: "einwilligung" });

  const token = env("SENDFOX_TOKEN");
  const listId = parseInt(env("SENDFOX_LIST_ID"), 10);
  if (!token || !listId) {
    console.error("SENDFOX_TOKEN oder SENDFOX_LIST_ID fehlt");
    return json(500, { ok: false, error: "config" });
  }

  const wanted = [bandTag(Math.round(sek))];
  if (QUELLEN[quelle]) wanted.push(QUELLEN[quelle]);

  let tagIds = [], missing = [];
  try {
    const map = await loadTags(token, fetchImpl);
    for (const name of wanted) {
      const id = map[name.toLowerCase()];
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

export const config = { path: "/api/bolt" };
