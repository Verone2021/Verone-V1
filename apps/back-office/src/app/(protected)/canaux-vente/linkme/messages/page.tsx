/**
 * Redirect page (BO-MSG-018) :
 * /canaux-vente/linkme/messages → /parametres/messagerie?direction=sent&kind=info_request
 *
 * L'ancien Centre de messagerie LinkMe (4 onglets : Infos manquantes,
 * En attente, Historique, Notifications affiliés) est absorbé par le
 * HUB messagerie centralisé. Les demandes d'infos LinkMe apparaissent
 * désormais dans /parametres/messagerie avec le filtre "Demandes infos".
 */

import { redirect } from 'next/navigation';

export default function LinkmeMessagesPage() {
  redirect('/parametres/messagerie?direction=sent&kind=info_request');
}
