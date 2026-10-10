# Entre aidants — MVP visuel

Démo mobile-first d'un espace de soutien entre pairs pour les aidants (Nello). Hackathon aidants, équipe Kata.

Tout est **hardcodé** : aucun backend, aucune persistance. L'identité visuelle suit [`DESIGN.md`](./DESIGN.md), le périmètre suit [`functional_specifications_v0.md`](./functional_specifications_v0.md).

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000. Le parcours commence par l'écran d'accueil, puis le consentement, le questionnaire (6 écrans), le pseudo, les cercles recommandés et la présentation rédigée par l'IA.

| Route | Contenu |
|---|---|
| `/` | Accueil |
| `/onboarding/*` | Consentement, questionnaire (6 écrans), pseudo, cercles suggérés (recherche, nombre de membres), présentation modifiable |
| `/circles` | Fil des messages les plus pertinents, filtre par cercles, recherche |
| `/solutions` | Articles Nello, suggestions IA, aidants recommandés |
| `/circles/[id]`, `.../thread/[tid]` | Fil d'un cercle, discussion, signalement, contact privé |
| `/messages`, `/messages/[id]` | Messagerie privée, sélecteur Messages / Demandes |
| `/profile`, `/profile/data` | Profil (description publique, caractéristiques, mes cercles), notifications, export, suppression |
| `/moderation` | Back-office de modération (volontairement absent de la navigation) |

La modération est invisible côté utilisateur : un message publié apparaît sans écran intermédiaire. Les trois cas types (ton jugeant, dose de médicament, détresse) sont visibles uniquement sur `/moderation`.

## Structure

```
src/app/            routes (groupes : onboarding, app, admin)
src/components/     composants UI (ui/), barre d'onglets, cartes
src/context/        état global de la démo (React context)
src/data/           toutes les données hardcodées
src/lib/services/   couche « IA » mockée
```

## Brancher AWS plus tard

L'interface n'appelle que `src/lib/services/index.ts` :

- `recommendCircles(answers)` : classement des cercles et explications
- `moderateMessage(text)` : modération avant publication
- `detectDistress(text)` : détection de détresse
- `findSimilarThreads(text, circleId)` : fils déjà traités
- `summarizeThread(thread)` : résumé d'un fil
- `generateIntro(answers)` : présentation pré-rédigée (modifiable par l'utilisateur)
- `getRelevantThreads(joined, answers)` : classement des messages du fil Cercles
- `recommendSolutions(answers)` : articles, suggestions et aidants recommandés

Pour passer sur Amazon Bedrock : remplacer le corps de ces fonctions par un appel à un Route Handler ou une Server Action utilisant `@aws-sdk/client-bedrock-runtime` (les identifiants restent côté serveur). Les variables d'environnement attendues sont dans `.env.example` (à copier en `.env.local`). Next.js peut être déployé sur AWS Amplify Hosting.

