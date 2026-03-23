# Plan de Durcissement DMARC — veronecollections.fr

**Date de creation** : 2026-03-20
**A executer** : Semaine du 2026-04-07 (dans ~3 semaines)
**Responsable** : Romeo (avec aide Claude)

---

## C'est quoi DMARC en termes simples ?

DMARC est un **gardien de securite pour tes emails**. Il dit aux boites mail (Gmail, Outlook, etc.) :

> "Voici comment verifier si un email venant de @veronecollections.fr est vraiment de nous. Et voici quoi faire si c'est un faux."

### Les 3 niveaux de protection

Imagine DMARC comme un vigile a l'entree d'un club :

| Niveau          | Valeur         | Ce que fait le vigile                                 | Quand l'utiliser                                                                |
| --------------- | -------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Observation** | `p=none`       | "Je note tout mais je laisse passer tout le monde"    | **Maintenant** — on observe qui envoie des emails depuis notre domaine          |
| **Quarantaine** | `p=quarantine` | "Les suspects, je les mets en salle d'attente (spam)" | **Dans 3 semaines** — apres avoir verifie que nos emails legitimes passent bien |
| **Rejet**       | `p=reject`     | "Les faux, je les bloque a la porte"                  | **Dans 2 mois** — quand on est 100% sur que tout est bien configure             |

**Aujourd'hui on est en `p=none`** (observation). C'est normal et recommande pour commencer.

---

## Pourquoi ne pas mettre `p=reject` tout de suite ?

Si on bloque trop vite, on risque de **bloquer nos propres emails** par accident. Exemples :

- Un service qu'on a oublie qui envoie des emails depuis notre domaine
- Un forwarding d'email mal configure
- Un nouveau service (newsletter, etc.) pas encore autorise dans le SPF

C'est pour ca qu'on observe d'abord 2-3 semaines, on verifie que tout va bien, PUIS on durcit.

---

## Ce que Romeo va recevoir par email

Avec `p=none`, Gmail et Outlook envoient des **rapports DMARC** a `veronebyromeo@gmail.com`. Ce sont des fichiers XML (pas tres lisibles), mais ils disent :

- Combien d'emails ont ete envoyes depuis `veronecollections.fr`
- Lesquels ont passe SPF et DKIM (= legitimes)
- Lesquels ont echoue (= potentiellement frauduleux ou mal configures)

**Tu n'as pas besoin de lire ces rapports toi-meme.** Quand on passera a l'etape suivante, Claude les analysera pour toi.

---

## Plan d'action (3 etapes)

### Etape 1 : Observation (FAIT - 2026-03-20)

- [x] Ajouter record DMARC `p=none`
- [x] Ajouter record SPF sur domaine racine
- [ ] Attendre 2-3 semaines pour recevoir les rapports

**Rien a faire** — on attend.

### Etape 2 : Quarantaine (Semaine du 2026-04-07)

**Demande a Claude** : "On doit passer le DMARC en quarantaine pour veronecollections.fr, regarde le plan dans `docs/current/site-internet/DMARC-HARDENING-PLAN.md`"

Claude devra :

1. Verifier les rapports DMARC recus (demander a Romeo de forward un rapport)
2. Confirmer que tous les emails legitimes passent SPF + DKIM
3. Modifier le record DNS sur Hostinger :

```
Ancien : v=DMARC1; p=none; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r
Nouveau : v=DMARC1; p=quarantine; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r
```

**Effet** : Les emails frauduleux iront en **spam** au lieu d'etre livres normalement.

### Etape 3 : Rejet total (Semaine du 2026-05-18)

**Demande a Claude** : "On doit passer le DMARC en reject pour veronecollections.fr"

Claude devra :

1. Verifier qu'aucun email legitime n'a ete mis en spam depuis l'etape 2
2. Modifier le record DNS sur Hostinger :

```
Ancien : v=DMARC1; p=quarantine; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r
Nouveau : v=DMARC1; p=reject; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r
```

**Effet** : Les emails frauduleux seront **completement bloques**. Protection maximale.

---

## Resume visuel

```
Mars 2026          Avril 2026         Mai 2026
    |                  |                  |
    v                  v                  v
 p=none            p=quarantine       p=reject
 (observer)        (spam les faux)    (bloquer les faux)
    |                  |                  |
 On regarde        On verifie         Protection
 qui envoie        que ca marche      maximale
```

---

## Configuration DNS actuelle (reference)

Record DMARC actuel sur Hostinger :

- **Type** : TXT
- **Nom** : `_dmarc`
- **Valeur** : `v=DMARC1; p=none; rua=mailto:veronebyromeo@gmail.com; pct=100; adkim=r; aspf=r`
- **TTL** : 14400

Pour modifier : Hostinger > Domaines > veronecollections.fr > DNS > Modifier le record TXT `_dmarc`

---

## Checklist avant de durcir

Avant chaque etape de durcissement, verifier :

- [ ] Emails transactionnels (Resend/app.veronecollections.fr) arrivent bien ?
- [ ] Emails Google Workspace arrivent bien ?
- [ ] Aucun service oublie qui envoie depuis @veronecollections.fr ?
- [ ] Rapports DMARC montrent 0 echec sur les emails legitimes ?

Si un de ces points echoue → rester au niveau actuel et investiguer.
