/** Canaux d'échange fournisseur proposés dans le journal sourcing. */
export const JOURNAL_CHANNELS = {
  alibaba: { label: 'Alibaba', emoji: '🏭' },
  wechat: { label: 'WeChat', emoji: '💬' },
  whatsapp: { label: 'WhatsApp', emoji: '📱' },
  email: { label: 'Email', emoji: '📧' },
  phone: { label: 'Téléphone', emoji: '📞' },
  salon: { label: 'Salon', emoji: '🏢' },
  other: { label: 'Autre', emoji: '💼' },
} as const;

export type JournalChannel = keyof typeof JOURNAL_CHANNELS;

export function journalChannel(channel: string | null) {
  return channel && channel in JOURNAL_CHANNELS
    ? JOURNAL_CHANNELS[channel as JournalChannel]
    : JOURNAL_CHANNELS.other;
}
