export function computeDueDate(
  paymentTerms: string | null | undefined,
  issueDate: string
): string {
  const issueDateMs = new Date(issueDate).getTime();
  switch (paymentTerms) {
    case 'immediate':
      return issueDate;
    case 'net_15':
      return new Date(issueDateMs + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    case 'net_30':
      return new Date(issueDateMs + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    case 'net_60':
      return new Date(issueDateMs + 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    default:
      return new Date(issueDateMs + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
  }
}
