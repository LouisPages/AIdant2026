# Entre aidants — MVP visuel

Démo mobile-first d'un espace de soutien entre pairs pour les aidants (Nello). Hackathon aidants, équipe Kata.

Toutes les données (cercles, fils, membres, questionnaire, ressources, solutions, modération) et celles de l'utilisateur (profil, réponses, cercles rejoints, messages, signalements) sont stockées dans **Amazon DynamoDB** (compte Workshop Studio). L'identité visuelle suit [`DESIGN.md`](./DESIGN.md), le périmètre suit [`functional_specifications_v0.md`](./functional_specifications_v0.md).

## Lancer

1. Copier `.env.example` en `.env.local` et renseigner les identifiants temporaires du Workshop Studio (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`). Ils expirent : les renouveler puis redémarrer le serveur.
2. Créer et alimenter la base (une seule fois) :

```bash
npm install
npm run db:create   # crée la table DynamoDB « aidants » (idempotent)
npm run db:seed     # écrit le contenu de départ du dossier seed/ (idempotent)
npm run dev
```

Chaque navigateur reçoit un identifiant de session anonyme (cookie `sid`, géré par `src/proxy.ts`). Ses données sont enregistrées sous `USER#<sid>` avec un TTL de 90 jours, et peuvent être exportées ou supprimées depuis `/profile/data`. Le schéma de la table est documenté dans `src/lib/db/keys.ts`.

Puis ouvrir http://localhost:3000. Le parcours commence par l'écran d'accueil, puis le consentement, le questionnaire (6 écrans), le profil (pseudo, avatar, description proposée automatiquement), puis les cercles recommandés, avant d'arriver sur la page Cercles.

| Route | Contenu |
|---|---|
| `/` | Accueil |
| `/onboarding/*` | Consentement, questionnaire (6 écrans), profil (pseudo, avatar, description modifiable), cercles suggérés (recherche, nombre de membres) |
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
src/context/        état de l'interface, alimenté par le contenu et les données de session lus en base
src/app/actions.ts  Server Actions : toutes les écritures (validation, identité via le cookie de session)
src/lib/db/         accès DynamoDB (client, schéma des clés, contenu partagé, utilisateur, modération)
src/lib/services/   couche « IA » : recommandations et modération (règles pour l'instant)
seed/               contenu de départ, chargé dans DynamoDB par `npm run db:seed`
scripts/            création de la table et seed
```

## Brancher Amazon Bedrock

Les fonctions de `src/lib/services/index.ts` lisent déjà le contenu dans DynamoDB ; leur classement est encore à base de règles :

- `recommendCircles(answers)` : classement des cercles et explications
- `moderateMessage(text)` : modération avant publication
- `detectDistress(text)` : détection de détresse
- `findSimilarThreads(text, circleId)` : fils déjà traités
- `getRelevantThreads(joined, answers)` : classement des messages du fil Cercles
- `recommendSolutions(answers)` : articles, suggestions et aidants recommandés

Pour passer sur Amazon Bedrock : appeler `@aws-sdk/client-bedrock-runtime` depuis le corps de ces fonctions (ce sont des Server Functions : les identifiants restent côté serveur). Les signatures ne changent pas. Les variables d'environnement attendues sont dans `.env.example`. Next.js peut être déployé sur AWS Amplify Hosting.


