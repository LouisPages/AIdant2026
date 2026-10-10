/**
 * Normalisation anti-contournement, sans réseau. Un message qui veut passer entre les mailles écrit « c0nnard »,
 * « c o n n a r d », « con.nard », glisse des caractères invisibles ou des lettres cyrilliques identiques aux
 * nôtres. On ramène tout cela à une forme canonique avant d'appliquer les règles et les listes de mots.
 *
 * Deux formes sont produites :
 *   light   casse, accents, invisibles, homoglyphes : les chiffres et la ponctuation sont intacts, pour les règles
 *           qui en dépendent (téléphone, e-mail, « 10 mg ») ;
 *   deep    light + leetspeak, lettres espacées et séparateurs intra-mot recollés : pour les insultes et l'argot.
 *
 * Le texte publié reste l'original : la normalisation ne sert qu'au contrôle.
 */

export type Normalized = {
  original: string;
  light: string;
  deep: string;
  /** Vrai si le texte contenait des caractères déguisés (homoglyphes, leetspeak, lettres espacées, invisibles). */
  obfuscated: boolean;
};

// Caractères invisibles ou de mise en forme glissés entre les lettres d'un mot pour tromper un filtre.
const INVISIBLE = /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFE00-\uFE0F\uFEFF\u3164\uFFA0]/g;

// Lettres d'autres alphabets visuellement identiques aux lettres latines (cyrillique, grec, quelques symboles).
const HOMOGLYPHS: Record<string, string> = {
  а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", і: "i", ј: "j", ѕ: "s", һ: "h", к: "k", м: "m", т: "t", в: "b", н: "h", ԁ: "d", ɡ: "g", ո: "n", ց: "g",
  А: "a", Е: "e", О: "o", Р: "p", С: "c", У: "y", Х: "x", І: "i", Ј: "j", Ѕ: "s", Н: "h", К: "k", М: "m", Т: "t", В: "b",
  α: "a", ο: "o", ν: "v", ρ: "p", τ: "t", ε: "e", ι: "i", κ: "k", υ: "u", χ: "x", η: "n", ϲ: "c",
  Α: "a", Ο: "o", Ρ: "p", Τ: "t", Ε: "e", Ι: "i", Κ: "k", Χ: "x", Β: "b", Ν: "n", Μ: "m", Ζ: "z", Η: "h", ı: "i",
};
const HOMOGLYPH_RE = new RegExp(`[${Object.keys(HOMOGLYPHS).join("")}]`, "g");

// Ligatures et lettres légitimes du français ou de langues voisines : ramenées à leurs lettres, sans rien de suspect.
const LIGATURES: Record<string, string> = { œ: "oe", æ: "ae", ß: "ss", ø: "o", ł: "l", đ: "d" };
const LIGATURE_RE = /[œæßøłđ]/g;

// Leetspeak : chiffres et symboles qui remplacent une lettre à l'intérieur d'un mot (« c0nnard », « m3rde », « $alope »).
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s", "€": "e" };
const LEET_RE = /[0134578@$€]/g;
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const stripAccents = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "");

/** Casse, accents, apostrophes typographiques : ce que tout message ordinaire subit, sans rien y voir de suspect. */
const base = (text: string) =>
  stripAccents(text.normalize("NFKC").toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”«»]/g, '"'))
    .replace(LIGATURE_RE, (c) => LIGATURES[c] ?? c)
    .replace(/\s+/g, " ")
    .trim();

/** Casse, accents, invisibles, homoglyphes. */
export function lightNormalize(text: string): string {
  return base(text.replace(INVISIBLE, "").replace(HOMOGLYPH_RE, (c) => HOMOGLYPHS[c] ?? c));
}

/**
 * Un mot est « leet » s'il commence par une lettre (ou un symbole-lettre), contient au moins un chiffre ou symbole
 * de la table et reste majoritairement alphabétique. « 10mg », « 06 12 34 » ou une adresse e-mail ne sont pas touchés.
 */
function unleet(token: string): string {
  if (EMAIL_LIKE.test(token)) return token;
  if (!/^[a-z@$€!|]/.test(token)) return token;
  const letters = (token.match(/[a-z]/g) ?? []).length;
  const leet = (token.match(LEET_RE) ?? []).length;
  if (leet === 0 || letters < 2 || letters < leet) return token;
  return token.replace(LEET_RE, (c) => LEET[c] ?? c);
}

/** Lettres espacées ou séparées (« c o n n a r d », « c.o.n.n.a.r.d », « con_nard », « con*nard ») recollées. */
function reglue(text: string): string {
  return (
    text
      // suite d'au moins quatre lettres isolées séparées par un espace, un point, un tiret, un tiret bas ou une étoile
      .replace(/\b(?:[a-z][ .\-_*]){3,}[a-z]\b/g, (m) => m.replace(/[ .\-_*]/g, ""))
      // séparateurs à l'intérieur d'un mot (pas le tiret, courant en français : « belle-mère »)
      .replace(/([a-z])[._*]+(?=[a-z])/g, "$1")
  );
}

export function normalizeText(text: string): Normalized {
  const light = lightNormalize(text);
  const deep = reglue(light)
    .split(/(\s+)/)
    .map((part) => (/\s/.test(part) ? part : unleet(part)))
    .join("");
  const obfuscated = light !== base(text) || deep !== light;
  return { original: text, light, deep, obfuscated };
}
