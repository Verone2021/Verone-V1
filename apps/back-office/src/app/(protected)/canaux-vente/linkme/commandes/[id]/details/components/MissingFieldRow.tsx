'use client';

import { useEffect, useState } from 'react';

import { Check, Loader2, Pencil, UserPlus, X } from 'lucide-react';

import type {
  MissingField,
  MissingFieldInputType,
} from '../../../../utils/order-missing-fields';

// ── Mapping field key -> behaviour ────────────────────────────────

/**
 * Décrit comment éditer un champ missing depuis le bandeau :
 * - 'inline' : input direct (date, text, email, tel) sauvegardé sur la table
 *    `target` colonne `column`. Le parent fournit le handler save() qui
 *    connaît l'order et applique le UPDATE adapté.
 * - 'contact' : ouvre le ContactSelectionDialog existant pour le rôle
 *    correspondant (responsable / billing / delivery). Aucun input local.
 */
type EditConfig =
  | {
      type: 'inline';
      target: 'organisations' | 'sales_order_linkme_details';
      column: string;
      inputType: MissingFieldInputType;
    }
  | { type: 'contact'; role: 'responsable' | 'billing' | 'delivery' }
  | { type: 'unsupported' };

const INLINE_MAP: Record<string, Extract<EditConfig, { type: 'inline' }>> = {
  organisation_legal_name: {
    type: 'inline',
    target: 'organisations',
    column: 'legal_name',
    inputType: 'text',
  },
  organisation_siret: {
    type: 'inline',
    target: 'organisations',
    column: 'siret',
    inputType: 'text',
  },
  organisation_vat_number: {
    type: 'inline',
    target: 'organisations',
    column: 'vat_number',
    inputType: 'text',
  },
  organisation_billing_address: {
    type: 'inline',
    target: 'organisations',
    column: 'billing_address_line1',
    inputType: 'text',
  },
  organisation_billing_postal_code: {
    type: 'inline',
    target: 'organisations',
    column: 'billing_postal_code',
    inputType: 'text',
  },
  organisation_billing_city: {
    type: 'inline',
    target: 'organisations',
    column: 'billing_city',
    inputType: 'text',
  },
  desired_delivery_date: {
    type: 'inline',
    target: 'sales_order_linkme_details',
    column: 'desired_delivery_date',
    inputType: 'date',
  },
  delivery_address: {
    type: 'inline',
    target: 'sales_order_linkme_details',
    column: 'delivery_address',
    inputType: 'text',
  },
  delivery_postal_code: {
    type: 'inline',
    target: 'sales_order_linkme_details',
    column: 'delivery_postal_code',
    inputType: 'text',
  },
  delivery_city: {
    type: 'inline',
    target: 'sales_order_linkme_details',
    column: 'delivery_city',
    inputType: 'text',
  },
  mall_email: {
    type: 'inline',
    target: 'sales_order_linkme_details',
    column: 'mall_email',
    inputType: 'email',
  },
};

const CONTACT_FIELD_PREFIXES: Array<{
  prefix: string;
  role: 'responsable' | 'billing' | 'delivery';
}> = [
  { prefix: 'requester_', role: 'responsable' },
  { prefix: 'billing_', role: 'billing' },
  { prefix: 'delivery_contact_', role: 'delivery' },
];

// Clés synthétiques générées par dedupeContactFields ci-dessous, pour qu'une
// catégorie "contact" complète (3 champs nom/email/tél) ne s'affiche que sur
// une seule ligne actionnable.
const SYNTHETIC_CONTACT_KEYS: Record<
  string,
  'responsable' | 'billing' | 'delivery'
> = {
  __contact_responsable: 'responsable',
  __contact_billing: 'billing',
  __contact_delivery: 'delivery',
};

export function getEditConfig(fieldKey: string): EditConfig {
  if (INLINE_MAP[fieldKey]) return INLINE_MAP[fieldKey];
  if (SYNTHETIC_CONTACT_KEYS[fieldKey]) {
    return { type: 'contact', role: SYNTHETIC_CONTACT_KEYS[fieldKey] };
  }
  for (const { prefix, role } of CONTACT_FIELD_PREFIXES) {
    if (fieldKey.startsWith(prefix)) return { type: 'contact', role };
  }
  return { type: 'unsupported' };
}

// ── Component ─────────────────────────────────────────────────────

interface MissingFieldRowProps {
  field: MissingField;
  /** Save handler for inline fields. Called with the new string value. */
  onSaveInline: (
    target: 'organisations' | 'sales_order_linkme_details',
    column: string,
    value: string
  ) => Promise<void>;
  /** Open the contact selection modal for the given role. */
  onOpenContactModal: (role: 'responsable' | 'billing' | 'delivery') => void;
}

export function MissingFieldRow({
  field,
  onSaveInline,
  onOpenContactModal,
}: MissingFieldRowProps) {
  const config = getEditConfig(field.key);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset local state when the field changes (e.g. parent refetch)
  useEffect(() => {
    if (!editing) setValue('');
  }, [editing]);

  if (config.type === 'unsupported') {
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-slate-700 px-2.5 py-1.5">
        <span className="truncate">{field.label}</span>
        <span className="text-[10px] italic text-slate-400 flex-shrink-0">
          Édition non disponible
        </span>
      </div>
    );
  }

  if (config.type === 'contact') {
    return (
      <div className="group flex items-center justify-between gap-2 text-xs text-slate-700 px-2.5 py-1.5 hover:bg-slate-50 transition-colors">
        <span className="truncate">{field.label}</span>
        <button
          type="button"
          onClick={() => onOpenContactModal(config.role)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 flex-shrink-0"
        >
          <UserPlus className="h-3 w-3" />
          Renseigner
        </button>
      </div>
    );
  }

  // config.type === 'inline'
  const handleSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await onSaveInline(config.target, config.column, value.trim());
      setEditing(false);
      setValue('');
    } catch (err) {
      console.error('[MissingFieldRow] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50">
        <span className="text-xs text-slate-700 flex-shrink-0">
          {field.label}
        </span>
        <input
          type={config.inputType}
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          disabled={saving}
          className="flex-1 min-w-0 h-7 rounded-md border border-slate-300 bg-white px-2 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:bg-slate-100"
        />
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={saving || !value.trim()}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 disabled:text-slate-300 flex-shrink-0"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Enregistrer
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setValue('');
          }}
          disabled={saving}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
          aria-label="Annuler"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-2 text-xs text-slate-700 px-2.5 py-1.5 hover:bg-slate-50 transition-colors">
      <span className="truncate">{field.label}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 flex-shrink-0"
      >
        <Pencil className="h-3 w-3" />
        Modifier
      </button>
    </div>
  );
}

/**
 * Quand plusieurs missing fields représentent en réalité le même contact
 * (ex: requester_name + requester_email + requester_phone), on les fusionne
 * en une seule ligne actionnable. Le helper renvoie le sous-ensemble à
 * réellement afficher : tous les champs `inline`/`unsupported` tels quels,
 * et UN SEUL champ par catégorie de contact rencontrée.
 */
export function dedupeContactFields(fields: MissingField[]): MissingField[] {
  const seenContactRoles = new Set<string>();
  const result: MissingField[] = [];
  for (const f of fields) {
    const cfg = getEditConfig(f.key);
    if (cfg.type === 'contact') {
      if (seenContactRoles.has(cfg.role)) continue;
      seenContactRoles.add(cfg.role);
      // Remplace le label flat (ex: "Nom du responsable") par un libellé
      // synthétique aligné sur l'action (ouvrir le modal contact).
      const synthetic: MissingField = {
        ...f,
        key: `__contact_${cfg.role}`,
        label:
          cfg.role === 'responsable'
            ? 'Contact responsable'
            : cfg.role === 'billing'
              ? 'Contact facturation'
              : 'Contact livraison',
      };
      result.push(synthetic);
    } else {
      result.push(f);
    }
  }
  return result;
}
