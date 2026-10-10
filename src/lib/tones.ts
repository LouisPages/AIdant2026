import type { CircleFamily } from "@/data/types";

/** Teintes de familles de cercles (voir DESIGN.md, « Teintes de familles de cercles »). */
export type FamilyTone = "rose" | "lavender" | "sage" | "sand" | "peach";

export const familyTone: Record<CircleFamily, FamilyTone> = {
  lien: "rose",
  situation: "lavender",
  contexte: "sage",
  parcours: "sand",
  besoin: "peach",
};

// Classes littérales pour que Tailwind les détecte.
export const toneStyles: Record<FamilyTone, { soft: string; dot: string }> = {
  rose: { soft: "bg-fam-rose text-fam-rose-ink", dot: "bg-fam-rose-ink" },
  lavender: { soft: "bg-fam-lavender text-fam-lavender-ink", dot: "bg-fam-lavender-ink" },
  sage: { soft: "bg-fam-sage text-fam-sage-ink", dot: "bg-fam-sage-ink" },
  sand: { soft: "bg-fam-sand text-fam-sand-ink", dot: "bg-fam-sand-ink" },
  peach: { soft: "bg-fam-peach text-fam-peach-ink", dot: "bg-fam-peach-ink" },
};

export const toneFor = (family: CircleFamily) => toneStyles[familyTone[family]];
