# Prototype du site Web : Citoyens en action

Pour ouvrir le site, double-cliquez sur `index.html`. Il s'ouvre dans votre navigateur et fonctionne sans installation ni serveur.

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : mission, valeurs, services, photos, activités à venir, nouvelles, infolettre |
| `impliquer.html` | S'impliquer : façons de participer, formulaire « Devenir bénévole », demande de bénévoles pour les organismes |
| `activites.html` | Calendrier des activités (filtrable) et liste complète |
| `initiatives.html` | Nos initiatives (projets réalisés) |
| `nouvelles.html` | Articles et nouvelles, inscription à l'infolettre |
| `equipe.html` | L'équipe et les bénévoles (liste fictive) |
| `partenaires.html` | Partenaires et commanditaires |
| `contact.html` | Formulaire de contact, coordonnées, heures, plan d'accès (carte) |
| `don.html` | Don en ligne sécurisé (maquette) |
| `admin.html` | Espace employés pour modifier le contenu |

## Ajouter les photos

Déposez les photos dans le dossier `images` avec les noms indiqués dans `images/LISEZ-MOI.txt`. Elles remplacent automatiquement les emplacements gris.

## Modifier le contenu (Espace employés)

1. Ouvrez `admin.html` (lien « Espace employés » au bas de chaque page).
2. Cliquez sur « Se connecter ». La connexion est simulée dans le prototype.
3. Vous pouvez ajouter, modifier ou supprimer des activités (le calendrier se met à jour) et des nouvelles. Vous pouvez aussi changer les textes de l'accueil, le bandeau d'annonce, les coordonnées et les heures.
4. Les changements apparaissent tout de suite sur le site, dans ce navigateur.
5. Pour publier les changements pour tous les visiteurs, allez dans l'onglet « Sauvegarde », cliquez sur « Télécharger data.js » et remplacez `js/data.js`.

Dans la version finale, l'espace employés serait relié à une base de données avec de vrais comptes. Les changements seraient alors publiés automatiquement.

## Lien entre les besoins de la cliente et le site (pour la présentation)

| Besoin de l'appel d'offre | Ce que le site offre |
|---|---|
| Public qui ne parle pas français comme langue première | Site complet en français et en anglais, avec un bouton sur chaque page. Bandeau « Bienvenue » en 7 langues et langues parlées par l'équipe affichées |
| Inclusion, clarté, profils variés | Phrases courtes et simples, section « Première fois? C'est simple » en 3 étapes, menu de 8 rubriques claires |
| Accessibilité (personnes non voyantes ou malvoyantes) | Structure compatible avec les lecteurs d'écran (titres, repères, étiquettes de formulaires), lien « Aller au contenu », navigation entière au clavier, texte de remplacement sur chaque photo, calendrier en vrai tableau avec une liste équivalente, messages d'erreur lus à voix haute. Boutons « Agrandir le texte » et « Contraste élevé ». Police Atkinson Hyperlegible, conçue pour les personnes malvoyantes |
| Adapté aux appareils mobiles | Mise en page qui s'ajuste aux téléphones et aux tablettes, menu compact, boutons de 48 px minimum |
| Contenu modifiable par les employés | Espace employés sans code : activités, calendrier, nouvelles, textes, annonce, heures |
| Design : engagement, solidarité, ouverture, communauté | Logo de trois cercles qui se rejoignent, quatre couleurs associées aux quatre valeurs, photos aux formes variées qui représentent la diversité des gens |
| Calendrier modifiable | Calendrier mensuel avec filtre par catégorie, alimenté par l'espace employés |
| Formulaires (bénévoles, organismes, contact) | Formulaires avec validation claire et messages de confirmation |
| Don en ligne sécurisé | Montants suggérés, don mensuel, paiement confié à un fournisseur certifié PCI DSS (par exemple Stripe ou PayPal) |
| Plan d'accès | Carte intégrée, accès en fauteuil roulant, autobus, stationnement |
| Autres fonctionnalités pertinentes | Bandeau d'annonce, infolettre, impact concret des dons, section « Proposer une initiative » |

## Structure technique

- `css/style.css` : apparence du site
- `js/data.js` : contenu modifiable (activités, nouvelles, équipe, partenaires, textes)
- `js/i18n.js` : textes du menu et des messages (FR/EN)
- `js/main.js` : langue, menu, calendrier, formulaires, photos
- `js/admin.js` : espace employés

Dans les pages HTML, le français est écrit dans la balise et l'anglais dans l'attribut `data-en`.
