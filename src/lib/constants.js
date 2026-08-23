// App-wide constants. Keep the support address in one place so it can be
// changed without hunting through screens.

export const SUPPORT_EMAIL = 'hammad@mauksolutions.com'

/** mailto: link with a pre-filled subject so replies arrive already triaged. */
export function supportMailto(subject = 'StrikeLine support', body) {
  const params = new URLSearchParams({ subject })
  if (body) params.set('body', body)
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`
}
