/* Website-Rekord für das Karten-Quiz
   GET  /api/rekord  → { punkte, datum }   aktueller Rekord aller Besucher
   POST /api/rekord  { punkte }            neuer Versuch; wird nur gespeichert, wenn er höher ist
   Gespeichert wird mit Netlify Blobs (kostenloser Speicher von Netlify, keine Einrichtung nötig). */
import { getStore } from "@netlify/blobs";

const MAX_PUNKTE = 500;   // 5 Länder × höchstens 100 Punkte
const MIN_PUNKTE = 5;     // jedes Land bringt mindestens 1 Punkt
const keinCache = { "cache-control": "no-store" };

export default async (req) => {
  const store = getStore("karten-quiz");
  const aktuell = (await store.get("rekord", { type: "json" })) || { punkte: 0, datum: null };

  if (req.method === "GET") {
    return Response.json(aktuell, { headers: keinCache });
  }

  if (req.method === "POST") {
    let daten;
    try { daten = await req.json(); } catch { return Response.json({ fehler: "Kein gültiges JSON" }, { status: 400 }); }
    const punkte = Number(daten && daten.punkte);
    if (!Number.isInteger(punkte) || punkte < MIN_PUNKTE || punkte > MAX_PUNKTE) {
      return Response.json({ fehler: "Ungültige Punktzahl" }, { status: 400 });
    }
    if (punkte > aktuell.punkte) {
      const neu = { punkte, datum: new Date().toISOString() };
      await store.setJSON("rekord", neu);
      return Response.json({ ...neu, neu: true }, { headers: keinCache });
    }
    return Response.json({ ...aktuell, neu: false }, { headers: keinCache });
  }

  return new Response("Nicht erlaubt", { status: 405, headers: { allow: "GET, POST" } });
};

export const config = { path: "/api/rekord" };
