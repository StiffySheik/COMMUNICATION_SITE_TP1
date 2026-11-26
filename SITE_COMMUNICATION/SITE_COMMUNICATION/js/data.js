/*
  Contenu modifiable du site Citoyens en action.
  Ce fichier est le contenu par défaut. Les employés le modifient sans code
  depuis admin.html (Espace employés), puis peuvent exporter un nouveau data.js.
  Chaque texte existe en français (fr) et en anglais (en).
*/
window.DEFAULT_CONTENT = {
  "version": 1,

  "org": {
    "phone": "450 555-0142",
    "email": "info@citoyensenaction.org",
    "address": "945, ch. de Chambly, Longueuil (Québec) J4H 4A9",
    "hours": [
      { "days": { "fr": "Lundi au vendredi", "en": "Monday to Friday" }, "time": { "fr": "9 h à 17 h", "en": "9 a.m. to 5 p.m." } },
      { "days": { "fr": "Samedi", "en": "Saturday" }, "time": { "fr": "10 h à 14 h", "en": "10 a.m. to 2 p.m." } },
      { "days": { "fr": "Dimanche", "en": "Sunday" }, "time": { "fr": "Fermé", "en": "Closed" } }
    ]
  },

  "texts": {
    "fr": {
      "announcement": "Collecte de denrées des Fêtes : déposez vos dons à notre local jusqu'au 19 décembre.",
      "home_hero_title": "Votre communauté a besoin de vous. On vous montre par où commencer.",
      "home_hero_text": "Bénévolat, entraide, ateliers et rencontres en Montérégie. Que vous soyez étudiant, nouvel arrivant ou retraité, il y a une place pour vous.",
      "home_mission": "Depuis 9 ans, Citoyens en action favorise l'engagement citoyen, l'entraide et la participation de chacun à la vie de sa communauté. Nous faisons le lien entre les personnes qui veulent aider et les organismes qui ont besoin de bras.",
      "home_newsletter": "Une fois par mois, les initiatives citoyennes de la région et les activités à venir. Pas de publicité."
    },
    "en": {
      "announcement": "Holiday food drive: drop off your donations at our office until December 19.",
      "home_hero_title": "Your community needs you. We'll show you where to start.",
      "home_hero_text": "Volunteering, mutual aid, workshops and gatherings in Montérégie. Whether you're a student, a newcomer or retired, there's a place for you.",
      "home_mission": "For 9 years, Citoyens en action has encouraged civic engagement, mutual aid and everyone's participation in community life. We connect people who want to help with organizations that need a hand.",
      "home_newsletter": "Once a month: civic initiatives in the region and upcoming activities. No advertising."
    }
  },

  "activities": [
    {
      "id": "a1", "date": "2026-11-28", "time": "10:00", "category": "benevolat",
      "title": { "fr": "Tri de denrées pour la guignolée", "en": "Food sorting for the holiday drive" },
      "place": { "fr": "Local de Citoyens en action", "en": "Citoyens en action office" },
      "desc": { "fr": "Aidez-nous à trier et emballer les dons qui seront remis à 200 familles de Longueuil.", "en": "Help us sort and pack donations for 200 families in Longueuil." }
    },
    {
      "id": "a2", "date": "2026-12-03", "time": "18:30", "category": "atelier",
      "title": { "fr": "Atelier : comment se faire entendre au conseil municipal", "en": "Workshop: how to be heard at city council" },
      "place": { "fr": "Local de Citoyens en action", "en": "Citoyens en action office" },
      "desc": { "fr": "Poser une question, déposer une pétition, suivre un dossier. Atelier gratuit, en français avec soutien en anglais.", "en": "Ask a question, file a petition, follow an issue. Free workshop, in French with English support." }
    },
    {
      "id": "a3", "date": "2026-12-06", "time": "13:00", "category": "entraide",
      "title": { "fr": "Distribution de vêtements d'hiver", "en": "Winter clothing distribution" },
      "place": { "fr": "Centre communautaire du Vieux-Longueuil", "en": "Vieux-Longueuil community centre" },
      "desc": { "fr": "Manteaux, bottes et mitaines offerts gratuitement aux familles et aux nouveaux arrivants.", "en": "Free coats, boots and mittens for families and newcomers." }
    },
    {
      "id": "a4", "date": "2026-12-12", "time": "17:00", "category": "evenement",
      "title": { "fr": "Souper communautaire des Fêtes", "en": "Community holiday dinner" },
      "place": { "fr": "Salle paroissiale Saint-Antoine", "en": "Saint-Antoine parish hall" },
      "desc": { "fr": "Un repas partagé pour rencontrer vos voisins. Apportez un plat de votre culture si vous le souhaitez.", "en": "A shared meal to meet your neighbours. Bring a dish from your culture if you like." }
    },
    {
      "id": "a5", "date": "2026-12-19", "time": "09:30", "category": "benevolat",
      "title": { "fr": "Emballage de cadeaux pour enfants", "en": "Gift wrapping for children" },
      "place": { "fr": "Local de Citoyens en action", "en": "Citoyens en action office" },
      "desc": { "fr": "Activité idéale pour une première expérience de bénévolat. Aucune expérience requise.", "en": "A great first volunteering experience. No experience needed." }
    },
    {
      "id": "a6", "date": "2027-01-14", "time": "18:30", "category": "atelier",
      "title": { "fr": "Nouveaux arrivants : découvrir les organismes de la région", "en": "Newcomers: discover local organizations" },
      "place": { "fr": "Bibliothèque Raymond-Lévesque", "en": "Raymond-Lévesque library" },
      "desc": { "fr": "Une soirée pour connaître les ressources de la Rive-Sud et trouver où vous impliquer.", "en": "An evening to learn about South Shore resources and find where to get involved." }
    },
    {
      "id": "a7", "date": "2027-01-24", "time": "10:00", "category": "sensibilisation",
      "title": { "fr": "Campagne : le froid et l'itinérance", "en": "Campaign: cold weather and homelessness" },
      "place": { "fr": "Place Charles-Le Moyne", "en": "Place Charles-Le Moyne" },
      "desc": { "fr": "Kiosque d'information et distribution de trousses chaudes avec nos partenaires.", "en": "Information booth and warm kit distribution with our partners." }
    },
    {
      "id": "a8", "date": "2027-02-07", "time": "14:00", "category": "evenement",
      "title": { "fr": "Après-midi jeux intergénérationnel", "en": "Intergenerational games afternoon" },
      "place": { "fr": "Résidence Le Montarville", "en": "Le Montarville residence" },
      "desc": { "fr": "Jeunes et aînés se retrouvent autour de jeux de société. Collation offerte.", "en": "Young people and seniors get together over board games. Snacks provided." }
    }
  ],

  "news": [
    {
      "id": "n1", "date": "2026-11-18",
      "title": { "fr": "Une subvention pour la participation citoyenne", "en": "A grant for civic participation" },
      "summary": { "fr": "Grâce à une nouvelle subvention, nous lançons un site Web et doublons le nombre d'ateliers offerts en 2027.", "en": "Thanks to a new grant, we're launching a website and doubling the number of workshops in 2027." },
      "body": { "fr": "Cette aide financière nous permettra de mieux faire connaître nos initiatives, d'offrir des ateliers dans plus de quartiers et de faciliter l'inscription des bénévoles en ligne.", "en": "This funding will help us promote our initiatives, offer workshops in more neighbourhoods and make volunteer sign-up easier online." }
    },
    {
      "id": "n2", "date": "2026-10-30",
      "title": { "fr": "Bilan de la corvée de nettoyage des berges", "en": "Riverbank clean-up: the results" },
      "summary": { "fr": "85 citoyens ont ramassé plus de 400 kg de déchets le long du fleuve en une seule matinée.", "en": "85 residents collected over 400 kg of waste along the river in a single morning." },
      "body": { "fr": "Merci à tous les participants et à nos partenaires. Une deuxième corvée aura lieu au printemps.", "en": "Thank you to all participants and partners. A second clean-up will take place in the spring." }
    },
    {
      "id": "n3", "date": "2026-10-12",
      "title": { "fr": "Portrait de bénévole : Amina, arrivée il y a un an", "en": "Volunteer profile: Amina, who arrived a year ago" },
      "summary": { "fr": "« Le bénévolat m'a permis de rencontrer mes voisins et de pratiquer mon français. »", "en": "“Volunteering helped me meet my neighbours and practise my French.”" },
      "body": { "fr": "Amina donne trois heures par semaine à l'aide aux devoirs. Elle raconte comment elle a trouvé sa place dans la communauté.", "en": "Amina gives three hours a week to homework help. She shares how she found her place in the community." }
    }
  ],

  "initiatives": [
    {
      "id": "i1", "year": "2025", "photo": "images/initiative-1.jpg",
      "title": { "fr": "Le Frigo partagé", "en": "The Community Fridge" },
      "desc": { "fr": "Un réfrigérateur en libre-service où commerces et citoyens déposent des aliments pour réduire le gaspillage.", "en": "A self-serve fridge where shops and residents leave food to reduce waste." },
      "impact": { "fr": "3 tonnes d'aliments redistribuées", "en": "3 tonnes of food redistributed" }
    },
    {
      "id": "i2", "year": "2024", "photo": "images/initiative-2.jpg",
      "title": { "fr": "Jumelage Bienvenue", "en": "Welcome Pairing" },
      "desc": { "fr": "Des citoyens accompagnent des nouveaux arrivants pendant leurs premiers mois : épicerie, transport, démarches.", "en": "Residents support newcomers during their first months: groceries, transit, paperwork." },
      "impact": { "fr": "64 familles jumelées", "en": "64 families paired" }
    },
    {
      "id": "i3", "year": "2023", "photo": "images/initiative-3.jpg",
      "title": { "fr": "Jardins de ruelle", "en": "Alley Gardens" },
      "desc": { "fr": "Transformation de ruelles asphaltées en jardins collectifs entretenus par les voisins.", "en": "Turning paved alleys into shared gardens looked after by neighbours." },
      "impact": { "fr": "5 ruelles verdies", "en": "5 alleys greened" }
    },
    {
      "id": "i4", "year": "2022", "photo": "images/initiative-4.jpg",
      "title": { "fr": "Aînés branchés", "en": "Connected Seniors" },
      "desc": { "fr": "Des jeunes bénévoles aident les aînés à utiliser leur téléphone et leur tablette.", "en": "Young volunteers help seniors use their phones and tablets." },
      "impact": { "fr": "220 aînés accompagnés", "en": "220 seniors helped" }
    }
  ],

  "team": [
    { "name": "Jane Aubertin", "role": { "fr": "Directrice générale", "en": "Executive Director" }, "langs": "Français, English" },
    { "name": "Karim Benali", "role": { "fr": "Coordonnateur des bénévoles", "en": "Volunteer Coordinator" }, "langs": "Français, العربية, English" },
    { "name": "Sophie Tremblay", "role": { "fr": "Responsable des ateliers", "en": "Workshop Lead" }, "langs": "Français" },
    { "name": "Diego Ramírez", "role": { "fr": "Agent de communication", "en": "Communications Officer" }, "langs": "Français, Español, English" }
  ],

  "volunteers": [
    { "name": "Amina Diallo", "role": { "fr": "Aide aux devoirs", "en": "Homework help" } },
    { "name": "Gérard Lapointe", "role": { "fr": "Accueil au local", "en": "Front desk" } },
    { "name": "Lin Zhang", "role": { "fr": "Jumelage Bienvenue", "en": "Welcome Pairing" } },
    { "name": "Maxime Roy", "role": { "fr": "Logistique des événements", "en": "Event logistics" } },
    { "name": "Olena Kovalenko", "role": { "fr": "Traduction", "en": "Translation" } },
    { "name": "Thérèse Gagnon", "role": { "fr": "Frigo partagé", "en": "Community Fridge" } }
  ],

  "partners": [
    { "name": "Banque alimentaire Rive-Sud", "desc": { "fr": "Collectes de denrées et distribution", "en": "Food drives and distribution" } },
    { "name": "Maison des familles de Longueuil", "desc": { "fr": "Aide aux devoirs et activités familiales", "en": "Homework help and family activities" } },
    { "name": "Accueil Nouveaux Horizons", "desc": { "fr": "Intégration des nouveaux arrivants", "en": "Newcomer integration" } },
    { "name": "Résidence Le Montarville", "desc": { "fr": "Activités intergénérationnelles", "en": "Intergenerational activities" } },
    { "name": "Collectif Vert Montérégie", "desc": { "fr": "Corvées et verdissement", "en": "Clean-ups and greening" } },
    { "name": "Regroupement étudiant Engagés", "desc": { "fr": "Stages et bénévolat étudiant", "en": "Internships and student volunteering" } }
  ],

  "sponsors": [
    { "name": "Caisse solidaire de la Rive-Sud", "tier": "or" },
    { "name": "Fondation Montérégie Ensemble", "tier": "or" },
    { "name": "Épicerie Chez Martine", "tier": "argent" },
    { "name": "Imprimerie Chambly", "tier": "argent" },
    { "name": "Café du Coin", "tier": "ami" },
    { "name": "Pharmacie Saint-Charles", "tier": "ami" }
  ]
};
