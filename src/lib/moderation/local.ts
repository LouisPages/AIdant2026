/**
 * Contrôle local en français : premier filet (cas évidents, instantané) et dernier filet quand AWS ne répond pas.
 * Règles prudentes sur ce qui est ambigu (mieux vaut laisser un juge trancher que refuser un aidant à bout), mais
 * fermes sur l'évident : insultes, argot de mort appliqué à une personne, mépris de la personne aidée, menaces,
 * coordonnées, consignes de dose. Les expressions du quotidien (« je crève de fatigue », « elle me saoule ») passent.
 *
 * Les règles tournent sur les deux formes normalisées (voir `normalize.ts`) : la forme légère garde chiffres et
 * ponctuation (téléphone, e-mail, doses), la forme profonde recolle « c0nnard » ou « c o n n a r d ».
 * Fonction pure, sans réseau.
 */
import { normalizeText, type Normalized } from "./normalize";
import type { BlockCategory, Signal } from "./types";

/**
 * Construit une alternative tolérante aux lettres répétées (« connnard », « saloooope ») à partir de mots écrits
 * sans accent. Un `*` final accepte une terminaison (pluriel, féminin, conjugaison).
 */
const lex = (...words: string[]) =>
  words
    .map((w) => {
      const open = w.endsWith("*");
      const body = (open ? w.slice(0, -1) : w)
        .split("")
        .map((c) => (c === " " ? String.raw`\s+` : /[a-z]/.test(c) ? `${c}+` : c))
        .join("");
      return String.raw`\b${body}${open ? String.raw`\w*` : String.raw`\b`}`;
    })
    .join("|");

// « crever de fatigue / de chaud / d'envie » : expressions courantes, jamais visées.
const NOT_DE = String.raw`(?!\s+(?:de|d'))`;

// Insultes et injures (envers un membre, un groupe ou la personne aidée). Les mots seuls suffisent : dans un espace
// d'entraide, aucun usage acceptable de « connard » adressé à quelqu'un n'existe.
// Seuls les mots sans usage acceptable figurent ici. « débile », « incapable » ou « ridicule » qualifient aussi des
// formulaires ou des situations : ils sont laissés aux juges, qui voient la cible.
const INSULTS = lex(
  "connard*", "connasse*", "conard*", "conasse*", "salope", "salopes", "salaud*", "salopard*", "enfoire*", "cretin*",
  "pourriture*", "raclure*", "batard*", "encule*", "enculer", "pute", "putes", "putain de toi", "fils de pute", "fdp", "ntm",
  "nique ta mere", "nique ta", "va te faire foutre", "va te faire voir", "allez vous faire foutre", "va chier", "allez chier",
  "ta gueule", "ferme ta gueule", "vos gueules", "pauvre con", "pauvre conne", "sale con",
  "sale conne", "gros con", "grosse conne", "espece de con", "espece de conne", "espece d'idiot*", "espece d'imbecile*",
  "espece de debile*", "espece d'abruti*", "espece d'incapable*", "espece d'ordure*", "sale ordure*", "bande de con*",
  "bande d'incapable*", "bande d'abruti*", "bande de debile*", "t'es debile", "tu es debile", "vous etes debiles",
  "t'es un abruti", "t'es une abrutie", "tocard*", "trou du cul", "trouduc*", "branleur*", "branleuse*", "casse couilles",
  "casse-couilles", "pauvre type", "pauvre merde", "petite merde", "grosse merde", "sous merde", "sous-merde", "vieille folle",
  "vieux fou", "vieille peau", "vieille bique", "vieux con", "vieille conne", "vieux croulant*", "vieille croulante*",
  "bon a rien", "bonne a rien", "bons a rien", "bonnes a rien", "nul a chier", "nulle a chier", "nuls a chier",
);

// Haine : slurs et attaques sur l'origine, la religion, l'orientation, le handicap.
const HATE = lex(
  "negre*", "negresse*", "youpin*", "bougnoule*", "bicot*", "chinetoque*", "niakoue*", "tapette", "tapettes", "pedale",
  "pedales", "pede", "pedes", "sale pede*", "gouine*", "travelo*", "sale arabe*", "sale noir*", "sale juif*", "sale juive*",
  "sale blanc*", "sale race", "sale musulman*", "sale chretien*", "sale rom", "sale roms", "sale gitan*", "sale handicape*",
  "sale vieux", "sale vieille", "sale etranger*", "sale immigre*", "retourne dans ton pays", "sous-homme*", "sous homme*",
);

// Argot de mort appliqué à une personne, mépris de la personne aidée, humour noir sur sa fin de vie ou sa maladie.
// Les formules ambiguës (« vivement que ça se termine », « il devient gâteux ») sont laissées aux juges.
const IRRESPECT = [
  lex("clamser", "clamse*", "clamsa*", "canner", "calanche*", "calancha*"),
  String.raw`crev\w*\s+la\s+gueule\s+ouverte`,
  String.raw`cass\w*\s+sa\s+pipe`,
  String.raw`pass\w*\s+l'arme\s+a\s+gauche`,
  String.raw`vivement\s+qu'?(?:il|elle|ils|elles)\s+(?:\w+\s+)?(?:meure|meurt|meurent|creve|crevent|clamse|y\s+passe|lache\s+la\s+rampe|casse\s+sa\s+pipe)`,
  String.raw`\b(?:il|elle|ils|elles|le vieux|la vieille|ma mere|mon pere|ma femme|mon mari|mamie|papi|papy)\s+(?:va|vont|est\s+en\s+train\s+de|sont\s+en\s+train\s+de|devrait|pourrait)\s+(?:bientot\s+|enfin\s+|vite\s+)?crever\b${NOT_DE}`,
  String.raw`\bautant\s+qu'?(?:il|elle)\s+(?:creve|meure)\b`,
  String.raw`\b(?:il|elle)\s+va\s+(?:bientot\s+|enfin\s+)?y\s+passer\b`,
  String.raw`\bquel(?:le)?\s+boulet\b`,
  String.raw`\bce\s+boulet\b`,
  String.raw`\bpoids\s+mort\b`,
  String.raw`\b(?:vieux|vieille)\s+(?:con|conne|croulant|croulante|machin|truc|debris|sac|carne|peau)\b`,
  String.raw`\b(?:ce|cette)\s+(?:vieux\s+|vieille\s+)?(?:croulant|croulante|legume|debris|momie|loque|epave|zombie)\b`,
  String.raw`\b(?:est|devenu|devenue|devient|c'est|comme)\s+(?:un|une)\s+(?:vrai|vraie)?\s*(?:legume|momie|loque|epave|zombie)\b`,
  String.raw`fait\s+(?:le|la|sa)\s+(?:legume|momie|plante\s+verte|zombie)`,
  String.raw`meriterait\s+de\s+(?:mourir|crever|disparaitre)`,
  String.raw`merite\s+de\s+(?:mourir|crever)`,
  String.raw`bon\s+debarras`,
  String.raw`\b(?:hate|presse)\s+qu'?(?:il|elle)\s+(?:meure|creve|y\s+passe)`,
  String.raw`\bqu'?(?:il|elle)\s+creve\b${NOT_DE}`,
].join("|");

const VIOLENCE = [
  String.raw`je\s+vais\s+(?:te|le|la|les|vous|lui)\s+(?:tuer|massacrer|buter|frapper|cogner|defoncer|eclater|exploser|crever|faire\s+la\s+peau|peter\s+la\s+gueule|casser\s+la\s+gueule|etrangler|etouffer|noyer)`,
  String.raw`\b(?:tu|vous)\s+(?:vas|va|allez)\s+(?:crever|morfler|le\s+payer)\b${NOT_DE}`,
  String.raw`\bcreve[sz]?\s+(?:donc|sale|connard|salope|espece|charogne)`,
  String.raw`je\s+(?:te|vous)\s+(?:retrouverai|aurai|attends\s+dehors)`,
  String.raw`je\s+sais\s+ou\s+(?:tu\s+habites|vous\s+habitez)`,
].join("|");

const SEXUAL = lex(
  "bite", "bites", "porno*", "photos nues", "photo nue", "nudes", "soiree coquine", "soirees coquines", "plan cul", "plan q",
  "sexto*", "cochonne", "cochonnes", "rencontre coquine", "massage coquin",
);

const RULES: { category: BlockCategory; pattern: RegExp; form: "light" | "deep" | "both" }[] = [
  { category: "coordonnees", form: "light", pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/ },
  { category: "coordonnees", form: "light", pattern: /(?:\+33|0033|\b0)\s?[1-9](?:[\s.-]?\d{2}){4}\b/ },
  // Numéro épelé en toutes lettres : « zéro six douze trente-quatre… ».
  { category: "coordonnees", form: "both", pattern: /\bz[eé]ro\s+(?:six|sept|un|deux|trois|quatre|cinq)\s+(?:\w+[\s-]+){2,}\w+/ },
  // Réseaux et messageries : seul un identifiant personnel est visé, pas la mention d'un service.
  {
    category: "coordonnees",
    form: "light",
    pattern:
      /\b(?:whatsapp|telegram|signal|snap(?:chat)?|insta(?:gram)?|facebook|tiktok|discord)\s*:\s*@?[a-z0-9_.]{3,}|(?<![a-z0-9])@[a-z0-9_]{3,}\b|\bmon\s+(?:insta|snap|tiktok|discord)\s+(?:c'est|est)\s+@?[a-z0-9_.]{3,}/,
  },
  {
    // Consigne à la deuxième personne ; un récit (« le médecin lui donne 10 mg ») est laissé aux juges.
    category: "medical",
    form: "light",
    pattern:
      /(?:donnez|donne[\s-]lui|prenez|mettez|rajoutez|ajoutez|essayez|filez|vous\s+pouvez\s+(?:lui\s+)?(?:donner|mettre|rajouter)|faut\s+(?:lui\s+)?(?:donner|mettre|rajouter)|faites\s+pareil)\b.{0,30}\b\d+\s?(?:mg|milligrammes?|comprimes?|cachets?|gouttes?|gelules?|ml)|doubl\w*\s+la\s+dose|augment\w*\s+la\s+dose|tripl\w*\s+la\s+dose|arret\w*\s+(?:son|le|leur|tout|ce|ses)\s+(?:traitement|medicament|medoc)|supprim\w*\s+(?:la|sa|une)\s+(?:derniere\s+)?prise|\d+\s?mg\s+de\s+plus/,
  },
  { category: "violence", form: "both", pattern: new RegExp(VIOLENCE) },
  { category: "irrespect", form: "both", pattern: new RegExp(IRRESPECT) },
  { category: "ton", form: "both", pattern: new RegExp(HATE) },
  { category: "ton", form: "both", pattern: new RegExp(INSULTS) },
  { category: "contenu", form: "both", pattern: new RegExp(SEXUAL) },
];

/** Détresse grave : idées noires, perte de sens. Tournures à la première personne : « qu'elle disparaisse » n'en est pas. */
const DISTRESS = new RegExp(
  [
    "n'en peux plus",
    "mieux sans moi",
    "plus la force",
    // « en finir » tout court ou avec la vie, pas « en finir avec cette paperasse ».
    String.raw`en\s+finir(?!\s+avec\s+(?!tout\b|la\s+vie|cette\s+vie|moi\b))`,
    "me suicid",
    "envie de mourir",
    "plus envie de vivre",
    String.raw`(?:envie|pense|penser|aimerais|voudrais|veux)\s+(?:de\s+|a\s+|d')?disparaitre|si\s+je\s+disparaissais`,
    "me tuer",
    "tout arreter",
    "plus l'interet de continuer",
    "plus d'issue",
    "plus de raison de vivre",
    "a quoi bon continuer",
    "me foutre en l'air",
    String.raw`me\s+jeter\s+(?:par|sous|du)`,
    "ne plus me reveiller",
    "pas me reveiller",
  ].join("|"),
);

/** Dévalorisation de soi : publiée, mais l'équipe est prévenue et de l'aide est proposée. */
const SELF_DENIGRATION = new RegExp(
  [
    String.raw`je\s+suis\s+(?:une|un)\s+(?:merde|poids|monstre|rate|ratee|catastrophe|echec|fardeau|incapable|nullite|boulet|moins\s+que\s+rien|sous[\s-]merde)`,
    String.raw`je\s+suis\s+(?:nulle?|inutile|incapable|minable|pathetique|lamentable|pitoyable|une\s+nullite|a\s+chier)\b`,
    String.raw`je\s+suis\s+(?:une|un)\s+mauvai[sse]*\s+(?:fille|fils|mari|femme|epoux|epouse|parent|aidant|aidante|mere|pere|conjoint|conjointe)`,
    String.raw`je\s+(?:ne\s+)?sers?\s+a\s+rien`,
    String.raw`je\s+suis\s+bonne?\s+a\s+rien`,
    String.raw`je\s+me\s+deteste`,
    String.raw`je\s+me\s+degoute`,
    String.raw`je\s+ne\s+vaux\s+rien`,
    String.raw`je\s+suis\s+la\s+pire`,
    String.raw`je\s+(?:me\s+)?(?:hais|deteste)\s+(?:ce\s+que\s+je\s+suis|moi[\s-]meme)`,
    String.raw`je\s+ne\s+merite\s+(?:pas|rien)`,
  ].join("|"),
);

export type LocalResult = { category?: BlockCategory; signal: Signal | null; normalized: Normalized };

/**
 * Les règles de refus sont évaluées sur la forme indiquée. Les règles d'autodénigrement sont exclues du refus :
 * « je suis une merde » n'est pas une insulte envers autrui, même si « merde » figure dans un lexique.
 */
export function localCheck(text: string | Normalized): LocalResult {
  const n = typeof text === "string" ? normalizeText(text) : text;
  const selfOnly = SELF_DENIGRATION.test(n.deep) && !INSULT_TARGETS_OTHER.test(n.deep);
  const hit = RULES.find((r) => {
    if (selfOnly && r.category === "ton") return false;
    const forms = r.form === "both" ? [n.light, n.deep] : [n[r.form]];
    return forms.some((f) => r.pattern.test(f));
  });
  const signal: Signal | null = DISTRESS.test(n.deep) ? "detresse" : SELF_DENIGRATION.test(n.deep) ? "autodenigrement" : null;
  return { category: hit?.category, signal, normalized: n };
}

// Si le message se dévalorise ET s'en prend à quelqu'un d'autre (« je suis nulle et toi un connard »), le refus prime.
const INSULT_TARGETS_OTHER = new RegExp(String.raw`\b(?:tu|toi|vous|t'|il|elle|ils|elles|ces|ceux|celles|les)\b[^.!?]{0,40}(?:${INSULTS})`);
