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
| `admin.html` | Gestion avancée : sauvegardes, copie de sécurité, retour au contenu d'origine |

## Photos

Les photos du dossier `images` sont des photos libres de droits (Pexels). Pour en changer, déposez une photo avec le même nom (voir `images/LISEZ-MOI.txt`), ou remplacez-la directement depuis le mode édition.

## Modifier le site (Espace employés)

Compte de test du prototype : nom d'employé **Jane**, mot de passe **123**.

1. Sur n'importe quelle page, cliquez sur **Espace employés** en haut à droite et connectez-vous.
2. Le **mode édition** s'ouvre, avec un panneau à droite (en bas sur téléphone) qu'on peut réduire en un carré « Édition ».
3. Tout se modifie directement sur la page :
   - **Textes** : cliquez sur un titre ou un paragraphe et tapez. Le panneau montre aussi la version anglaise.
   - **Boutons, liens et menu** : cliquez dessus pour changer le texte (FR/EN) et l'adresse du lien.
   - **Photos** : cliquez sur une photo pour la remplacer (fichier ou adresse web) et écrire sa description pour les personnes non voyantes.
   - **Listes** (activités et calendrier, nouvelles, initiatives, équipe, bénévoles, partenaires, commanditaires) : boutons « Modifier », « Supprimer » et « + Ajouter ».
   - **Sections** : « Masquer » cache une section aux visiteurs ; « + Bloc dessous » ajoute un nouveau bloc.
   - **Blocs** : Texte, Image et texte, Appel à l'action, Cartes. On peut les modifier, les monter, les descendre ou les supprimer.
   - **Coordonnées, heures et annonce** : le téléphone, le courriel, l'adresse (et la carte), les heures et le bandeau d'annonce.
4. Les changements s'enregistrent tout de suite dans ce navigateur. Le bouton « Annuler » revient en arrière.
5. Pour publier pour tous les visiteurs, cliquez sur **Publier** : un fichier `data.js` est téléchargé ; remplacez `js/data.js` du site par ce fichier.

Dans la version finale, la connexion serait vérifiée par le serveur avec de vrais comptes, et « Publier » mettrait le site à jour automatiquement.

## Lien entre les besoins de la cliente et le site (pour la présentation)

| Besoin de l'appel d'offre | Ce que le site offre |
|---|---|
| Public qui ne parle pas français comme langue première | Site complet en français et en anglais, avec un bouton sur chaque page. Bandeau « Bienvenue » en 7 langues et langues parlées par l'équipe affichées |
| Inclusion, clarté, profils variés | Phrases courtes et simples, section « Première fois? C'est simple » en 3 étapes, menu de 8 rubriques claires |
| Accessibilité (personnes non voyantes ou malvoyantes) | Structure compatible avec les lecteurs d'écran (titres, repères, étiquettes de formulaires), lien « Aller au contenu », navigation entière au clavier, texte de remplacement sur chaque photo, calendrier en vrai tableau avec une liste équivalente, messages d'erreur lus à voix haute. Boutons « Écouter la page » (lecture à voix haute en français ou en anglais, avec surlignage du passage lu), « Agrandir le texte » et « Contraste élevé ». Police Atkinson Hyperlegible, conçue pour les personnes malvoyantes |
| Adapté aux appareils mobiles | Mise en page qui s'ajuste aux téléphones et aux tablettes, menu compact, boutons de 48 px minimum |
| Contenu modifiable par les employés | Bouton « Espace employés » sur chaque page : après connexion, tout le site se modifie directement sur la page (textes, liens, photos, listes, sections), avec ajout de blocs et bouton « Annuler » |
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
- `js/editor.js` : connexion et mode édition directement sur les pages
- `js/admin.js` : gestion avancée (`admin.html`)

Dans les pages HTML, le français est écrit dans la balise et l'anglais dans l'attribut `data-en`.
