const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const plural = (n: number, unit: string) => `${n} ${unit}${n > 1 ? "s" : ""}`;

/** « À l'instant », « Il y a 2 h », « Hier », « Il y a 3 jours »… à partir d'une date ISO. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, now - t);
  if (diff < MIN) return "À l'instant";
  if (diff < HOUR) return `Il y a ${Math.floor(diff / MIN)} min`;
  if (diff < DAY) return `Il y a ${Math.floor(diff / HOUR)} h`;

  const days = Math.floor(diff / DAY);
  if (days === 1) return "Hier";
  if (days < 14) return `Il y a ${plural(days, "jour")}`;
  if (days < 60) return `Il y a ${plural(Math.floor(days / 7), "semaine")}`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

const weekdays = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const pad = (n: number) => String(n).padStart(2, "0");
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Horodatage d'un message privé : « Hier, 18:42 », « Lundi, 21:10 », « Aujourd'hui, 08:20 ». */
export function formatChat(iso: string, now: number = Date.now()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const clock = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const days = Math.round((dayStart(new Date(now)) - dayStart(d)) / DAY);
  if (days <= 0) return `Aujourd'hui, ${clock}`;
  if (days === 1) return `Hier, ${clock}`;
  if (days < 7) return `${weekdays[d.getDay()]}, ${clock}`;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}, ${clock}`;
}
