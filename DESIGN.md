# Identité visuelle — Guide pour l'agent de dev

> Périmètre : règles graphiques uniquement, sans aucune spécification fonctionnelle.
> Les valeurs ci-dessous sont exactes : les appliquer telles quelles (hex, px, durées).

## 1. Atmosphère

Apaisante, douce, rassurante et aérée
Mots-clés : calme · clarté · douceur · confiance · espace.
Le rendu général est lumineux : beaucoup de blanc, des teintes bleu-vert pastel, des surfaces légères et des respirations généreuses.

## 2. Couleurs

Répartition visuelle : **~70 % blanc/whitesmoke · ~20 % teal · ~10 % bleu ciel**.

### Neutres (dominants)
| Rôle | Hex |
|---|---|
| Fond d'écran (whitesmoke) | `#F5F5F5` |
| Surface (cartes, barre d'onglets, modales) | `#FFFFFF` |
| Bordure / séparateur | `#E6E9E7` |
| Texte principal | `#1F2A25` |
| Texte secondaire | `#5C6B64` |
| Texte désactivé / placeholder / icône inactive | `#9AA6A0` |

### Teal principal (majeur)
| Rôle | Hex |
|---|---|
| Teal principal : boutons, icône et libellé actifs, éléments interactifs | `#5FA8AB` |
| Teal foncé : état pressé, texte coloré, liens, titres accentués | `#2F6F73` |
| Teal clair : fonds de sélection, badges, zones douces | `#DFEFEF` |

### Bleu ciel (accent, mineur)
| Rôle | Hex |
|---|---|
| Bleu ciel : puces, badges, détails décoratifs, accents d'état | `#A9CBE8` |
| Bleu marine : texte et icône posés sur le bleu ciel | `#24476B` |
| Bleu ciel très clair : fonds de sections ou de mise en avant douce | `#EAF3FA` |

### États
| Rôle | Couleur | Fond associé |
|---|---|---|
| Succès | `#5FA8AB` | `#DFEFEF` |
| Information | `#24476B` | `#EAF3FA` |
| Alerte | `#C99A4B` | `#F8EFDD` |
| Erreur | `#C46A6A` | `#F7E4E4` |

### Règles d'usage
- Le fond de chaque écran est `#F5F5F5` ; les cartes et surfaces sont `#FFFFFF`.
- Chaque écran comporte un seul bouton primaire teal plein.
- Le texte posé sur le teal principal est blanc `#FFFFFF`, en graisse 600.
- Le texte coloré sur fond blanc utilise le teal foncé `#2F6F73`.
- Le bleu ciel s'emploie en petites touches : puces, badges, détails.
- Les aplats et fonds sont unis (couleurs pleines).
- Les noirs sont remplacés par `#1F2A25`.

## 3. Typographie

- **Police : DM Sans** (repli : Poppins, system-ui, sans-serif), unique famille de l'application.
- Chargement via Google Fonts, graisses 400 / 500 / 600.

| Usage | Taille | Graisse | Interligne |
|---|---|---|---|
| Titre d'écran (H1) | 28 px | 600 | 1.25 |
| Titre de section (H2) | 22 px | 600 | 1.3 |
| Titre de carte (H3) | 18 px | 600 | 1.35 |
| Corps | 16 px | 400 | 1.5 |
| Corps secondaire | 14 px | 400 | 1.45 |
| Légende / label | 12 px | 500 | 1.4 |
| Bouton | 16 px | 600 | 1 |

- Casse normale : majuscule en début de phrase uniquement.
- Texte principal `#1F2A25`, texte secondaire `#5C6B64`.

## 4. Formes et arrondis

Arrondi modéré et cohérent sur toute l'application.

| Élément | Rayon |
|---|---|
| Cartes, modales, bottom sheets (coins hauts) | 16 px |
| Boutons, champs de saisie, éléments de liste | 12 px |
| Badges, chips, puces | 8 px |
| Avatars | cercle (50 %) |

- Bordure standard : 1 px `#E6E9E7`.

## 5. Profondeur et ombres

Ombres très douces et diffuses, teintées teal, pour un effet flottant léger.

- Carte : `box-shadow: 0 4px 20px rgba(47, 111, 115, 0.08);`
- Élément surélevé (modale, bottom sheet) : `box-shadow: 0 8px 32px rgba(47, 111, 115, 0.12);`
- Barre d'onglets : `box-shadow: 0 -2px 16px rgba(47, 111, 115, 0.06);`

## 6. Espacements

- Grille de base : **4 px** (valeurs : 4, 8, 12, 16, 20, 24, 32, 40).
- Marge latérale d'écran : 20 px.
- Padding interne des cartes : 16 px.
- Espace entre cartes : 12 px.
- Espace entre sections : 24 px.
- Densité aérée : privilégier l'espace blanc.

## 7. Composants (aspect uniquement)

- **Bouton primaire** : fond `#5FA8AB`, texte blanc 16 px / 600, rayon 12 px, hauteur 48 px, état pressé `#2F6F73`.
- **Bouton secondaire** : fond transparent, bordure 1 px `#5FA8AB`, texte `#2F6F73`, même gabarit.
- **Bouton tertiaire** : texte `#2F6F73`, sans fond ni bordure.
- **Champ de saisie** : fond blanc, bordure 1 px `#E6E9E7`, rayon 12 px, hauteur 48 px. Focus : bordure 1,5 px `#5FA8AB` + halo `0 0 0 3px #DFEFEF`.
- **Carte** : fond blanc, bordure 1 px `#E6E9E7`, rayon 16 px, padding 16 px, ombre carte.
- **Puce / badge bleu ciel** : fond `#A9CBE8`, texte `#24476B`, rayon 8 px, 12 px / 500, padding 3 px 10 px.
- **Badge teal clair** : fond `#DFEFEF`, texte `#2F6F73`, rayon 8 px.
- **Chip sélectionné** : fond `#5FA8AB`, texte blanc, rayon 8 px.
- **Séparateur** : 1 px `#E6E9E7`.

## 8. Iconographie

- Bibliothèque : **Lucide** (ou équivalent en ligne fine et arrondie).
- Style : ligne uniquement, trait 1.5 px, extrémités et jointures arrondies, taille 24 px (20 px en inline).
- Couleurs : `#9AA6A0` par défaut, `#5FA8AB` pour l'état actif, `#24476B` sur fond bleu ciel.
- Les états vides et les accents se composent d'icônes en ligne posées sur des fonds `#DFEFEF` ou `#EAF3FA`.

## 9. Navigation

Barre d'onglets fixe en bas, icônes + libellés.

- Fond `#FFFFFF`, hauteur 64 px + safe area, ombre de la barre d'onglets.
- 4 à 5 onglets.
- Libellé : 12 px, graisse 500.
- Onglet inactif : icône et libellé `#9AA6A0`.
- Onglet actif : icône et libellé en teal principal `#5FA8AB`, directement sur le fond blanc de la barre. L'icône active a la même taille, le même trait et la même position que les icônes inactives ; seule sa couleur change.
- En-tête d'écran : fond `#F5F5F5`, titre H1 aligné à gauche.

## 10. Animations

Micro-animations douces et discrètes.

- Durée : 200–300 ms. Courbe par défaut : `cubic-bezier(0.25, 0.8, 0.25, 1)`.
- Apparition d'écran / carte : fade + léger slide vertical (8–12 px).
- Pression sur bouton ou carte : `scale(0.97)` avec retour légèrement rebondissant (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- Changement d'onglet : fade 200 ms.
- Les animations se réduisent à un simple fade quand `prefers-reduced-motion` est activé.

## 11. Rendu pour la démo web

- L'application s'affiche comme un **écran mobile** : largeur max 430 px, centrée, hauteur pleine page.
- Sur grand écran, le fond autour du conteneur mobile est `#F5F5F5`, le conteneur porte l'ombre carte.
- Viewport mobile-first, cibles tactiles de 44 px minimum.

## 12. Checklist de conformité

- [ ] Fond `#F5F5F5` sur tous les écrans, cartes blanches
- [ ] Teal `#5FA8AB` pour les actions principales, bleu ciel `#A9CBE8` en accent
- [ ] Texte des boutons primaires en blanc, 16 px / 600
- [ ] DM Sans, tailles de la section 3
- [ ] Rayons 16 / 12 / 8 px
- [ ] Ombres douces teintées teal
- [ ] Icônes Lucide en ligne 1.5 px
- [ ] Barre d'onglets blanche, onglet actif en teal principal sans entourage
- [ ] Animations 200–300 ms avec gestion de `prefers-reduced-motion`