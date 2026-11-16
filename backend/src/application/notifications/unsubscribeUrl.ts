import type { Locale } from '../../shared/constants';

export function buildUnsubscribeUrl(appUrl: string, locale: Locale, token: string): string {
  const base = appUrl.replace(/\/+$/, '');
  return `${base}/${locale}/unsubscribe?token=${encodeURIComponent(token)}`;
}
