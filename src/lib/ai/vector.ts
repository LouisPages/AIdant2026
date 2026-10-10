/** Outils vectoriels purs (aucun appel réseau). */
import { createHash } from "node:crypto";

export const dot = (a: Float32Array, b: Float32Array) => {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
};

/** Cosinus (les vecteurs Titan sont déjà normalisés, mais on ne le suppose pas). */
export function cosine(a: Float32Array, b: Float32Array): number {
  const d = dot(a, b);
  const n = Math.sqrt(dot(a, a) * dot(b, b));
  return n === 0 ? 0 : d / n;
}

/** Float32 vers octets (4 fois plus compact que des nombres DynamoDB). */
export const packVector = (v: ArrayLike<number>): Uint8Array =>
  new Uint8Array(Float32Array.from(v as ArrayLike<number>).buffer);

export function unpackVector(bytes: Uint8Array): Float32Array {
  // Copie nécessaire : le tampon d'origine peut ne pas être aligné sur 4 octets.
  const copy = new Uint8Array(bytes);
  return new Float32Array(copy.buffer, 0, Math.floor(copy.byteLength / 4));
}

/** Empreinte courte d'un texte, pour ne recalculer un vecteur que si le texte change. */
export const hashText = (text: string) => createHash("sha1").update(text).digest("hex").slice(0, 16);

/** Ramène des valeurs sur [0, 1] (min-max). Un ensemble sans écart donne 0 partout. */
export function minMax(values: number[]): number[] {
  if (values.length === 0) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return hi - lo < 1e-9 ? values.map(() => 0) : values.map((v) => (v - lo) / (hi - lo));
}
