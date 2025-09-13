# Règles métier — Intégrations Externes

## Feeds Publicitaires (Meta/Google)

### Règles d'éligibilité produits
- **Statut requis** : `actif = true` ET `discontinue = false`
- **Visibilité** : Au moins une interface activée (particuliers OU professionnels)
- **Image obligatoire** : Au moins une image principale valide
- **Prix valide** : Prix de vente > 0 et cohérent avec prix d'achat
- **Catégorisation** : Produit assigné à une sous-catégorie complète

### Format et timing
- **Fréquence** : Export quotidien automatique à 06h00 UTC
- **Format CSV** : Conforme specs Facebook Business Manager et Google Merchant Center
- **Encoding** : UTF-8 avec BOM pour compatibilité Excel
- **Limite** : 10,000 produits max par feed (pagination si nécessaire)

### Mapping des statuts
```
en_stock → "in stock"
sur_commande → "preorder" 
rupture → "out of stock"
discontinue → EXCLU du feed
```

### Authentification feeds
- **Token d'accès** : JWT avec expiration 24h
- **Rate limiting** : 10 requêtes/minute par token
- **Logging** : Toutes les requêtes loggées avec IP et timestamp
- **Monitoring** : Alertes si génération feed > 30s ou échec

## Webhook Brevo (Marketing)

### Événements supportés
- **delivered** : Email bien livré → Marquer contact comme actif
- **opened** : Ouverture email → Incrémenter score engagement  
- **clicked** : Clic dans email → Créer opportunité si nouveau
- **unsubscribed** : Désabonnement → Marquer contact comme opt-out
- **bounced** : Erreur livraison → Marquer email comme invalide

### Validation webhook
- **Signature Brevo** : Vérification HMAC-SHA256 obligatoire
- **Timeout** : Réponse HTTP 200 dans les 5s max
- **Idempotence** : Gestion des doublons par `message_id`
- **Retry policy** : Brevo retry 3 fois avec backoff exponentiel

### Traitement des données
- **Stockage immédiat** : Tous événements en table `brevo_events` 
- **Enrichissement différé** : Processing asynchrone pour analytics
- **RGPD compliance** : Anonymisation automatique si demandée
- **Rétention** : 13 mois puis archivage ou suppression

### Segmentation automatique
- **Prospects chauds** : ≥2 clics dans 30 jours
- **Clients engagés** : Ouverture dans 7 derniers jours  
- **À réactiver** : Aucune interaction depuis 90 jours
- **Inactifs** : Pas d'ouverture depuis 180 jours

## Collections Partageables

### Génération de liens
- **Format URL** : `https://verone.com/c/{collection_id}?token={secure_token}`
- **Token sécurisé** : 32 caractères alphanumériques, unique par collection
- **Durée de vie** : 30 jours par défaut, configurable de 1 à 365 jours
- **Protection optionnelle** : Mot de passe supplémentaire si sensible

### Tracking des consultations
- **Métriques collectées** : IP, user-agent, timestamp, durée session
- **Anonymisation** : IP tronquée après 24h pour RGPD
- **Analytics** : Nombre de vues, temps moyen, taux rebond
- **Notifications** : Email au commercial à la première consultation

### Export PDF
- **Déclenchement** : On-demand depuis lien partagé ou back-office
- **Génération** : Max 10s pour collections <50 produits
- **Template** : Branding Véron avec logo, coordonnées, CGV
- **Contenu** : Images haute résolution, prix selon type client
- **Stockage** : 7 jours en cache puis régénération si demandé

## Intégration CRM (Phase 2)

### Synchronisation contacts
- **Source** : Formulaires site + imports CSV + webhooks Brevo
- **Déduplication** : Par email en priorité, puis nom+téléphone
- **Enrichissement** : Score engagement basé sur interactions
- **RGPD** : Consentement explicite requis pour marketing

### Workflow opportunités  
- **Déclencheurs** : Demande devis, consultation catalogue, engagement fort
- **Assignation** : Commercial selon zone géographique ou type client
- **Suivi** : États prédéfinis (nouveau, qualifié, devis, négociation, gagné/perdu)
- **Relances** : Notifications automatiques selon délais paramétrés

## Monitoring et Observabilité

### SLO (Service Level Objectives)
- **Disponibilité feeds** : ≥99.5% uptime
- **Latence webhook** : ≤2s P95 response time  
- **Taux erreur** : ≤1% des requêtes feeds en échec
- **Fraîcheur données** : Feeds générés <6h après modification produit

### Alertes critiques
- **Feed generation failed** : Échec génération quotidienne
- **Webhook timeout** : >5s response time ou erreur 5xx
- **Token expiration** : Tokens feeds expirant dans <24h
- **Storage quota** : >80% espace disque utilisé pour PDF/images

Ces règles garantissent une intégration robuste avec les systèmes externes tout en maintenant la performance et la fiabilité du système Vérone.