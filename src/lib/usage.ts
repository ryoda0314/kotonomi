// For the counts of use (src/components/usage.ts): where they are sent from (only a production build opened at the
// app's public address, never this computer while developing nor a preview of a deployment), and the kind of device
// they say. Pure: tested in tests/usage.test.mjs.

export type Platform = "ios" | "android" | "pc" | "other";

/** Whether a page at `origin` counts: a production build at `site`'s own origin. False when either is not an address. */
export function countsHere(origin: string, site: string, production: boolean): boolean {
  if (!production || !origin || !site) return false;
  try {
    return origin === new URL(site).origin;
  } catch {
    return false;
  }
}

/**
 * The kind of device, from what the browser says it is: an iPhone or iPad (an iPad says it is a Mac, but a Mac has no
 * touch screen), Android (which also says Linux), a computer, or something else.
 */
export function platformOf(userAgent: string, maxTouchPoints: number): Platform {
  if (typeof userAgent !== "string" || !userAgent) return "other";
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return "ios";
  if (/Android/.test(userAgent)) return "android";
  if (/Windows|Macintosh|CrOS|X11|Linux/.test(userAgent)) return "pc";
  return "other";
}
