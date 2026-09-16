# Reconquête Réunion — Portail v3

Version structurée comme un portail d'information.

## Rubriques principales
- `index.html` : accueil / tableau de bord
- `decouvrir.html` : présentation et fonctionnement
- `national.html` : activité publique nationale
- `reunion.html` : activité de la fédération à La Réunion
- `tv.html` : Reconquête Réunion TV
- `programme.html` : programme & positions, avec sources
- `agenda.html` : agenda National / Réunion
- `documents.html` : centre de ressources
- `dossiers.html` : dossiers locaux
- `equipe.html` : équipe et responsables
- `faq.html` : questions fréquentes
- `recherche.html` : moteur de recherche interne
- `contact.html` : contact

## Mise en ligne GitHub Pages
Téléverser le contenu de ce dossier à la racine du dépôt `Reconquete-Reunion`, puis committer sur la branche publiée par GitHub Pages.

## Important avant publication
Les contenus sont des gabarits. Remplacer les exemples par des informations vérifiées. Pour chaque position politique ou publication nationale, indiquer la nature du contenu, la date et la source officielle.


## Chaîne YouTube officielle
La page `tv.html` et la section TV de l'accueil intègrent la playlist des dernières vidéos de la chaîne officielle :
https://www.youtube.com/channel/UCusNNj9ORiV5VKHqMzyIJ_A

L'intégration utilise la playlist automatique des mises en ligne de la chaîne (`UUusNNj9ORiV5VKHqMzyIJ_A`), ce qui permet d'afficher les nouvelles vidéos sans modifier le code du site.


## Mise à jour programme national
La page `programme.html` présente les 11 grands axes du programme public national de Reconquête sous forme de résumés attribués, avec lien systématique vers `https://www.parti-reconquete.fr/programme`. Source consultée le 16 septembre 2026.


## Version 6 — vidéo nationale et archives d'interviews
- `tv.html` contient désormais une rubrique « Du national » avec les dernières publications vidéo publiques d'Éric Zemmour et Sarah Knafo.
- Les lecteurs reposent sur les playlists de mises en ligne YouTube, ce qui permet une mise à jour automatique de la première vidéo affichée.
- `interviews.html` sert d'archive des interviews publiques avec date, média et source.
- Pour ajouter un entretien, dupliquer une carte `media-card` dans `interviews.html` et renseigner la date, le média et le lien public.
