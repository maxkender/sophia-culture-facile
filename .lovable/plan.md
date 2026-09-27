# Clarifier les noms de compte et les erreurs de formulaire

## Résultat attendu
- Retirer tout format imposé au nom d’utilisateur TikTok : le créateur choisit un nom lié à la culture générale ou un autre nom pertinent.
- Ne plus suggérer un prénom, `sophia.` ou une structure particulière.
- Afficher des erreurs compréhensibles et directement actionnables à la place des messages techniques.

## Modifications
- Réécrire la consigne et l’exemple du nom de compte dans le guide de création.
- Ajouter une validation claire, bilingue, champ par champ aux candidatures UGC et slideshow : e-mail, téléphone avec indicatif, liens, âge, vidéo et champs obligatoires.
- Ajouter les mêmes contrôles explicites aux formulaires du compte créateur : compte TikTok, profil, paiement alternatif et publication d’un post.
- Centraliser la traduction des erreurs techniques inattendues pour éviter d’afficher des textes internes ou des erreurs de validation brutes.
- Conserver les contrôles côté serveur et leur donner des messages lisibles pour les cas qui échappent au navigateur.

## Vérification
- Tester des e-mails, téléphones et liens invalides dans les deux langues.
- Vérifier qu’aucune erreur technique brute n’est affichée dans les parcours créateurs.
- Vérifier que le projet compile sans erreur.

## Limites
- Aucun changement aux règles métier, aux candidatures existantes ou aux données enregistrées.
- Les formulaires professeurs et administrateurs ne sont pas modifiés dans cette passe ; le périmètre concerne les candidatures et l’espace créateurs évoqués ici.
