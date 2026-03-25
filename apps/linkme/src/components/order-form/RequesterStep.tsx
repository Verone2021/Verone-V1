import type { StepProps } from './types';

/**
 * ÉTAPE 1 : DEMANDEUR
 * Collecte les informations de la personne qui passe la commande
 */
export function OpeningStep1Requester({ data, errors, updateData }: StepProps) {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Personne qui passe la commande
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Vos coordonnées en tant que demandeur
        </p>
      </div>

      {/* Nom complet */}
      <div>
        <label
          htmlFor="requesterName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nom complet <span className="text-red-500">*</span>
        </label>
        <input
          id="requesterName"
          type="text"
          value={data.requester.name}
          onChange={e =>
            updateData({
              requester: { ...data.requester, name: e.target.value },
            })
          }
          placeholder="Jean Dupont"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors['requester.name'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['requester.name']}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="requesterEmail"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="requesterEmail"
          type="email"
          value={data.requester.email}
          onChange={e =>
            updateData({
              requester: { ...data.requester, email: e.target.value },
            })
          }
          placeholder="jean.dupont@pokawa.fr"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors['requester.email'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['requester.email']}
          </p>
        )}
      </div>

      {/* Téléphone */}
      <div>
        <label
          htmlFor="requesterPhone"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          id="requesterPhone"
          type="tel"
          value={data.requester.phone}
          onChange={e =>
            updateData({
              requester: { ...data.requester, phone: e.target.value },
            })
          }
          placeholder="06 12 34 56 78"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors['requester.phone'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['requester.phone']}
          </p>
        )}
      </div>

      {/* Rôle/Fonction */}
      <div>
        <label
          htmlFor="requesterPosition"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Rôle/Fonction
        </label>
        <input
          id="requesterPosition"
          type="text"
          value={data.requester.position}
          onChange={e =>
            updateData({
              requester: { ...data.requester, position: e.target.value },
            })
          }
          placeholder="Directeur régional"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="requesterNotes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes (optionnel)
        </label>
        <textarea
          id="requesterNotes"
          value={data.requester.notes}
          onChange={e =>
            updateData({
              requester: { ...data.requester, notes: e.target.value },
            })
          }
          placeholder="Ex: Architecte pour le projet de rénovation..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Informations complémentaires pertinentes
        </p>
      </div>
    </div>
  );
}
