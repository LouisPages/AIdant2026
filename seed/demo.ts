import type { AvatarKey } from "@/lib/types";

/** Profil de démonstration : accès direct à l'application, sans passer par l'accueil. */
export const demoProfile: { pseudo: string; avatar: AvatarKey; bio: string } = {
  pseudo: "Camomille",
  avatar: "flower",
  bio: "J'accompagne mon conjoint depuis quelques années, concerné par la maladie de Parkinson. La fatigue pèse en ce moment. Je viens ici chercher un peu d'écoute et des astuces du quotidien.",
};

/** Cercles rejoints par défaut dans le profil de démonstration. */
export const demoJoined = ["c-d-maladie-de-parkinson", "c-conjoints", "c-solos"];

/** Profil vide, utilisé après suppression des données de l'utilisateur. */
export const emptyProfile: { pseudo: string; avatar: AvatarKey; bio: string } = {
  pseudo: "Camomille",
  avatar: "flower",
  bio: "",
};
