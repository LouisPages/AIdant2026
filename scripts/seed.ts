/**
 * Alimente la table DynamoDB avec le contenu de départ (dossier seed/) : `npm run db:seed`.
 * Idempotent : relancer le script réécrit le contenu partagé (les données des utilisateurs ne sont pas touchées).
 * Les dates écrites en clair dans seed/ (« Il y a 2 h », « Hier, 18:42 »…) deviennent des dates ISO relatives à maintenant.
 */
import { batchDelete, batchPut, queryPartition, queryType, TABLE, REGION, type Item } from "../src/lib/db/client";
import { keys } from "../src/lib/db/keys";
import { allCircles, charter, familyLabels } from "../seed/circles";
import { conversations } from "../seed/conversations";
import { demoProfile, demoJoined, emptyProfile } from "../seed/demo";
import { members, suggestedPseudos } from "../seed/members";
import { deriveThreadTags, memberTags } from "../seed/tags";
import { isKnownTag } from "../src/lib/tags";
import { helpResources, moderationCases } from "../seed/moderation";
import { demoAnswers, questions, relatedTopics, seedTopics } from "../seed/questionnaire";
import { resources } from "../seed/resources";
import { aiSuggestions, articleIds, articleTopics, peopleRecommendations } from "../seed/solutions";
import { threads } from "../seed/threads";

const NOW = new Date();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const weekdayIndex: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
};

function atClock(base: Date, hh: number, mm: number) {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, 0, 0);
}

/** Convertit une indication de temps en clair en date ISO, par rapport à maintenant. */
function parseTime(label: string): string {
  const text = label.trim().toLowerCase();

  let m = text.match(/^il y a (\d+) (min|h|jours?|semaines?|mois)$/);
  if (m) {
    const n = Number(m[1]);
    const unit = m[2];
    const ms =
      unit === "min"
        ? n * MIN
        : unit === "h"
          ? n * HOUR
          : unit.startsWith("jour")
            ? n * DAY
            : unit === "mois"
              ? n * 30 * DAY
              : n * 7 * DAY;
    return new Date(NOW.getTime() - ms).toISOString();
  }
  if (text === "hier") return new Date(NOW.getTime() - 30 * HOUR).toISOString();

  m = text.match(/^(hier|ce matin|[a-zéû]+), (\d{1,2}):(\d{2})$/);
  if (m) {
    const [, day, hh, mm] = m;
    const h = Number(hh);
    const min = Number(mm);
    if (day === "hier") return atClock(new Date(NOW.getTime() - DAY), h, min).toISOString();
    if (day === "ce matin") {
      let d = atClock(NOW, h, min);
      if (d > NOW) d = new Date(d.getTime() - DAY);
      return d.toISOString();
    }
    const target = weekdayIndex[day];
    if (target !== undefined) {
      for (let back = 1; back <= 7; back++) {
        const d = atClock(new Date(NOW.getTime() - back * DAY), h, min);
        if (d.getDay() === target && d < NOW) return d.toISOString();
      }
    }
  }
  throw new Error(`Indication de temps non reconnue : « ${label} »`);
}

const items: Item[] = [];
const add = (k: ReturnType<(typeof keys)["member"]>, data: Record<string, unknown>) =>
  items.push({ ...k, ...data } as Item);

// Cercles (y compris les cercles « maladie / handicap »)
allCircles.forEach((c, i) => add(keys.circle(c.id, i), { ...c, order: i }));

// Membres fictifs
Object.values(members).forEach((mb) => add(keys.member(mb.id), { ...mb, tags: memberTags[mb.id] ?? [] }));

// Vérification des références (cercles, auteurs, ressources) avant toute écriture.
{
  const circleIds = new Set(allCircles.map((c) => c.id));
  const resourceIds = new Set(Object.keys(resources));
  const threadIds = new Set<string>();
  for (const [id, list] of [
    ...allCircles.map((c) => [`cercle ${c.id}`, c.tags ?? []] as const),
    ...Object.entries(memberTags).map(([id, l]) => [`membre ${id}`, l] as const),
  ]) {
    for (const tag of list) if (!isKnownTag(tag)) throw new Error(`Tag inconnu « ${tag} » (${id})`);
  }
  for (const id of Object.keys(memberTags)) if (!members[id]) throw new Error(`Tags pour un membre inconnu : ${id}`);
  for (const t of threads) {
    if (threadIds.has(t.id)) throw new Error(`Fil en double : ${t.id}`);
    threadIds.add(t.id);
    if (!circleIds.has(t.circleId)) throw new Error(`Fil ${t.id} : cercle inconnu « ${t.circleId} »`);
    if (!members[t.authorId]) throw new Error(`Fil ${t.id} : auteur inconnu « ${t.authorId} »`);
    if (t.resourceId && !resourceIds.has(t.resourceId)) throw new Error(`Fil ${t.id} : ressource inconnue « ${t.resourceId} »`);
    for (const r of t.replies) {
      if (!members[r.authorId]) throw new Error(`Réponse ${r.id} : auteur inconnu « ${r.authorId} »`);
    }
  }
}

// Fils et réponses : du plus récent au plus ancien (l'ordre d'écriture sert d'ordre d'affichage).
// Une réponse sans heure est datée peu après le fil, sans jamais dépasser « maintenant ».
const datedThreads = threads
  .map((t, index) => ({ t, index, createdAt: parseTime(t.time) }))
  .sort((x, y) => y.createdAt.localeCompare(x.createdAt) || x.index - y.index);

datedThreads.forEach(({ t, createdAt }, order) => {
  const { replies, time: _time, ...rest } = t;
  void _time;
  const circle = allCircles.find((c) => c.id === t.circleId)!;
  const tags = deriveThreadTags(t, circle, t.resourceId ? articleTopics[t.resourceId] : []);
  add(keys.thread(t.id, createdAt), { ...rest, tags, createdAt, order });
  const base = new Date(createdAt).getTime();
  replies.forEach((r, i) => {
    const { time: rt, ...r2 } = r;
    const auto = Math.min(NOW.getTime() - 2 * MIN, base + (i + 1) * (25 + ((i * 17 + order * 7) % 50)) * MIN);
    const replyAt = new Date((rt ? new Date(parseTime(rt)).getTime() : auto) + i * 1000).toISOString();
    add(keys.reply(t.id, r.id, replyAt), { ...r2, threadId: t.id, createdAt: replyAt });
  });
});

// Ressources (articles proposés dans « Solutions » : ordre et thèmes)
for (const r of Object.values(resources)) {
  const articleOrder = articleIds.indexOf(r.id);
  add(keys.resource(r.id), {
    ...r,
    topics: articleTopics[r.id] ?? [],
    ...(articleOrder >= 0 ? { articleOrder } : {}),
  });
}

// Suggestions IA et aidants recommandés
aiSuggestions.forEach((s, i) => add(keys.suggestion(s.id, i), { ...s, order: i }));
peopleRecommendations.forEach((p, i) => add(keys.person(p.memberId, i), { ...p, order: i }));

// Questionnaire
questions.forEach((q, i) => add(keys.question(i), { ...q, order: i }));

// Contenus éditoriaux
add(keys.content("familyLabels"), { value: familyLabels });
add(keys.content("charter"), { value: charter });
add(keys.content("pseudos"), { value: suggestedPseudos });
add(keys.content("helpResources"), { value: helpResources });
add(keys.content("topics"), { value: { seedTopics, relatedTopics } });

// Modération
moderationCases.forEach((c, i) =>
  add(keys.moderation(c.id, i), { ...c, receivedAt: parseTime(c.receivedAt), order: i }),
);

// Profil et conversations de démonstration (copiés dans la partition d'un nouvel utilisateur)
add(keys.demoUser(), {
  profile: demoProfile,
  emptyProfile,
  answers: demoAnswers,
  joined: demoJoined,
  consent: true,
});
for (const c of conversations) {
  add(keys.demoConv(c.memberId), { memberId: c.memberId, status: c.status, circleId: c.circleId });
  c.messages.forEach((msg, i) => {
    const { time, ...rest } = msg;
    const createdAt = new Date(new Date(parseTime(time)).getTime() + i * 1000).toISOString();
    add(keys.demoMsg(c.memberId, msg.id, createdAt), { ...rest, memberId: c.memberId, createdAt });
  });
}

async function main() {
  const seen = new Set<string>();
  for (const it of items) {
    const id = `${it.PK}|${it.SK}`;
    if (seen.has(id)) throw new Error(`Clé en double : ${id}`);
    seen.add(id);
  }
  if (process.argv.includes("--dry")) {
    console.log(`${items.length} éléments prêts (simulation, rien n'est écrit).`);
    return;
  }
  // Les réponses et les messages de démonstration portent leur date dans leur clé : on supprime
  // les anciens avant d'écrire, sinon chaque exécution les dupliquerait.
  const stale = [...(await queryType("reply")), ...(await queryPartition("DEMO#conversation"))];
  if (stale.length > 0) {
    console.log(`Nettoyage de ${stale.length} anciennes réponses et conversations de démonstration…`);
    await batchDelete(stale.map(({ PK, SK }) => ({ PK, SK })));
  }
  console.log(`Écriture de ${items.length} éléments dans « ${TABLE} » (${REGION})…`);
  await batchPut(items);
  console.log("Contenu de départ enregistré.");
}

main().catch((e) => {
  console.error(`Échec : ${(e as { name?: string }).name ?? ""} ${(e as { message?: string }).message ?? e}`);
  process.exit(1);
});
