# Reconquête Réunion — Portail v8

Portail statique GitHub Pages : informations publiques nationales et réunionnaises, programme, documents, TV et médiathèque vidéo.

## Rubriques principales
- `index.html` : accueil / tableau de bord
- `decouvrir.html` : présentation et fonctionnement
- `national.html` : activité publique nationale
- `reunion.html` : activité de la fédération à La Réunion
- `tv.html` : Reconquête Réunion TV
- `programme.html` : programme & positions avec sources
- `agenda.html` : agenda National / Réunion
- `documents.html` : centre de ressources
- `dossiers.html` : dossiers locaux
- `mediatheque.html` : interviews + discours & meetings
- `equipe.html`, `faq.html`, `recherche.html`, `contact.html`

## Chaîne YouTube Reconquête Réunion
La page `tv.html` et l'accueil intègrent la chaîne :
`https://www.youtube.com/channel/UCusNNj9ORiV5VKHqMzyIJ_A`

L'intégration utilise la playlist des mises en ligne de la chaîne, donc les nouvelles vidéos de cette chaîne apparaissent automatiquement dans le lecteur.

## Médiathèque V8
La médiathèque est séparée en deux catégories :
1. **Interviews publiques**
2. **Discours & meetings**

Filtres disponibles : personnalité, source/média, année, thème, origine manuelle/automatique et recherche libre.

Fichiers de données :
- `interviews-data.js` : archive d'interviews déjà vérifiées ;
- `discours-data.js` : archive de discours et meetings déjà vérifiés ;
- `auto-media-data.js` : entrées ajoutées automatiquement.

## Mise à jour automatique quotidienne
Le workflow `.github/workflows/update-media.yml` lance `automation/update_media.py` chaque jour à **07 h 17, heure de La Réunion**, et peut aussi être lancé manuellement depuis l'onglet **Actions** de GitHub.

### Niveau 1 — sans aucune clé API
Le script lit les flux YouTube publics des chaînes officielles configurées dans `automation/config.json` :
- Éric Zemmour ;
- Sarah Knafo ;
- Reconquête Réunion.

Il ajoute uniquement les titres identifiables comme **interview**, **discours** ou **meeting**. Les autres vidéos sont ignorées.

### Niveau 2 — recherche élargie dans les médias
Pour rechercher automatiquement de nouvelles interviews sur YouTube chez BFMTV, LCI, Europe 1, CNEWS, etc. :

1. Créer une clé **YouTube Data API v3** dans Google Cloud.
2. Dans le dépôt GitHub : **Settings → Secrets and variables → Actions → New repository secret**.
3. Nom du secret : `YOUTUBE_API_KEY`
4. Valeur : votre clé API.
5. Enregistrer.

Au prochain passage du workflow, le script recherche les nouvelles vidéos concernant Éric Zemmour et Sarah Knafo, mais ne conserve que les chaînes dont le nom figure dans `trusted_media_names` de `automation/config.json`.

> Si le secret `YOUTUBE_API_KEY` n'existe pas, le workflow continue normalement avec les chaînes officielles seulement.

## Anti-doublons et classement
Le script compare les identifiants YouTube avec les archives déjà présentes. Une vidéo existante n'est pas ajoutée deux fois. Les résultats sont ensuite classés automatiquement par date dans `mediatheque.html`.

Le classement thématique automatique repose sur des mots-clés (immigration, sécurité, économie, Europe, international, élections, école, agriculture, numérique, institutions). Il peut être corrigé manuellement dans les fichiers de données si nécessaire.

## Modifier les sources surveillées
Éditer `automation/config.json` :
- `official_channels` : chaînes surveillées par RSS ;
- `trusted_media_names` : noms de médias acceptés dans la recherche YouTube ;
- `search_people` : personnalités recherchées ;
- `lookback_days` : période de recherche à chaque passage.

## Publication GitHub Pages
Téléverser tous les fichiers de ce dossier à la racine du dépôt `Reconquete-Reunion`, puis committer sur la branche publiée par GitHub Pages.

Le workflow a besoin de l'autorisation **contents: write**, déjà déclarée dans le fichier YAML, pour committer `auto-media-data.js` lorsqu'une nouvelle vidéo est détectée. Sur un dépôt public inactif pendant 60 jours, GitHub peut désactiver automatiquement les workflows planifiés ; il suffit alors de les réactiver dans l'onglet Actions.

## Important
Le site est un portail politique identifié. Les résumés, positions et contenus doivent rester attribués à leurs sources publiques. Pour les archives vidéo, conserver la date, le média ou la chaîne, et le lien vers la publication d'origine.
