// Where the counts of use (src/components/usage.ts) are sent from: only a production build opened at the app's public
// address, never this computer while developing nor a preview of a deployment. Pure: tested in tests/usage.test.mjs.

/** Whether a page at `origin` counts: a production build at `site`'s own origin. False when either is not an address. */
export function countsHere(origin: string, site: string, production: boolean): boolean {
  if (!production || !origin || !site) return false;
  try {
    return origin === new URL(site).origin;
  } catch {
    return false;
  }
}
