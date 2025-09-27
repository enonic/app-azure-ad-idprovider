/**
 * portal module.
 * @module lib/azure-ad-id-provider/portal
 */
import { toStr } from "/lib/azure-ad-id-provider/object";
import { getSite, pageUrl } from "/lib/xp/portal";
import type { Request } from "@enonic-types/core";

/**
 * Checks whether an url is absolute or relative
 * @param {uri} url
 * @returns {Boolean} true or false
 */
// http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
export function isAbsoluteUrl(url: string): boolean {
  log.debug("isAbsoluteUrl(" + toStr(url) + ")");
  const r = new RegExp("^(?:[a-z]+:)?//", "i");
  const bool = r.test(url);
  log.debug("isAbsoluteUrl(" + toStr(url) + ") --> " + toStr(bool));
  return bool;
}

/**
 * Gets the absolute url for the current site.
 * @returns {absoluteSiteUrl}
 */
export function getAbsoluteSiteUrl(): string {
  const site = getSite();
  if (!site) {
    const msg = "Unable to getSite!";
    log.error(msg);
    throw new Error(msg);
  }
  const absoluteSiteUrl = pageUrl({ id: site._id, type: "absolute" });
  log.debug("getAbsoluteSiteUrl() --> " + toStr(absoluteSiteUrl));
  return absoluteSiteUrl;
}

export type GetAbsoluteUrlFromPathParams = {
  request: Request;
};

/**
 * Normalizes the path of an url and returns an absolute url.
 * @param {string} params.path
 * @param {import("@enonic-types/core").Request} params.request
 * @returns {String}
 */
export function getAbsoluteUrlFromPath(params: GetAbsoluteUrlFromPathParams): string {
  return params.request ? params.request.url : getAbsoluteSiteUrl();
}

/**
 * If the request has a redirectUrl and a valid ticket it returns normalized redirectUrl.
 * Or simply returns the request url.
 * @param {import("@enonic-types/core").Request} request
 * @returns {url}
 */
export function getReturnToUrl(request: Request<{ params: { redirect?: string } }>): string {
  if (request.params && request.params.redirect && request.validTicket) {
    return isAbsoluteUrl(request.params.redirect)
      ? request.params.redirect
      : getAbsoluteUrlFromPath({
          request: request,
        });
  }
  return request.url;
}
