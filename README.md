# Reconquête Réunion — Portail V9

Cette version conserve la partie **National** dans son état V8 et développe la partie **La Réunion**.

## Ce qui est nouveau en V9

- `reunion.html` : nouveau tableau de bord local.
- `reunion-actualites.html` : archive locale avec recherche et filtres.
- `reunion-communiques.html` : archive séparée des communiqués de la fédération.
- `reunion-agenda.html` : agenda local.
- `reunion-terrain.html` : activité de proximité par zones Nord, Est, Sud, Ouest.
- `local-auto-data.js` : publications publiques récupérées depuis le site officiel de la fédération.
- `local-manual-data.js` : événements et comptes rendus ajoutés manuellement par l’équipe locale.
- `local.js` : moteur d’affichage local.
- `automation/update_local.py` : récupération automatique des articles et communiqués publics.
- `.github/workflows/update-local.yml` : lancement quotidien de la mise à jour locale.

## National en standby

Les fichiers `national.html` et `programme.html` n’ont pas été modifiés pour la V9.
Le workflow vidéo V8 est conservé.

## Mise à jour automatique locale

Le workflow **Mise a jour actualites Reunion** s’exécute tous les jours vers 07:37 à La Réunion (03:37 UTC) et peut aussi être lancé manuellement depuis l’onglet **Actions**.

Il consulte :

`https://fede974.parti-reconquete.fr/articles`

Il repère les liens publics contenant `/article/` et `/communique-de-presse/`, les classe puis met à jour `local-auto-data.js`.

Le script n’écrase pas volontairement les anciennes entrées : il fusionne les liens déjà archivés avec les nouveaux.

## Ajouter un événement local

Modifier `local-manual-data.js` et ajouter une entrée de type `evenement` :

```js
{
  "date": "2026-10-11",
  "type": "evenement",
  "title": "Nom de l'événement",
  "url": "",
  "source": "Reconquête Réunion",
  "sourceKind": "Agenda local",
  "zone": "Ouest",
  "commune": "Le Port",
  "time": "",
  "themes": ["Vie de la fédération"],
  "excerpt": "Informations pratiques.",
  "auto": false
}
```

## Ajouter un compte rendu terrain

Même principe, avec `"type": "terrain"` et une zone parmi :

- `Nord`
- `Est`
- `Sud`
- `Ouest`

## Déploiement

Le site reste compatible GitHub Pages. Après envoi des fichiers sur la branche `main`, GitHub Pages republie automatiquement le site.

## Important

Les articles et communiqués repris sont des publications politiques du mouvement : le portail les identifie comme telles et renvoie vers les sources officielles. Les données factuelles ajoutées dans les dossiers locaux doivent être sourcées séparément.
