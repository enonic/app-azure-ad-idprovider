"use strict";

/**
 * portal module.
 * @module lib/azure-ad-id-provider/portal
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
const lib = {
  azureAdIdProvider: {
    object: require("/lib/azure-ad-id-provider/object"),
  },
  xp: {
    auth: require("/lib/xp/auth"),
    httpClient: require("/lib/http-client"),
    portal: require("/lib/xp/portal"),
  },
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
const toStr = lib.azureAdIdProvider.object.toStr;
const getSite = lib.xp.portal.getSite;
const pageUrl = lib.xp.portal.pageUrl;

//──────────────────────────────────────────────────────────────────────────────
// Portal methods
//──────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether an url is absolute or relative
 * @param {uri} url
 * @returns {Boolean} true or false
 */
// http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
function isAbsoluteUrl(url) {
  log.debug("isAbsoluteUrl(" + toStr(url) + ")");
  const r = new RegExp("^(?:[a-z]+:)?//", "i");
  //var r = new RegExp('^\\s*(?:[a-z0-9]+:)?//', i); // Handle whitespace at the beginning and scheme with digits?
  const bool = r.test(url);
  log.debug("isAbsoluteUrl(" + toStr(url) + ") --> " + toStr(bool));
  return bool;
}
exports.isAbsoluteUrl = isAbsoluteUrl;

/**
 * Gets the absolute url for the current site.
 * @returns {absoluteSiteUrl}
 */
function getAbsoluteSiteUrl() {
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
exports.getAbsoluteSiteUrl = getAbsoluteSiteUrl;

/**
 * Normalizes the path of an url and returns an absolute url.
 * @param {string} params.path
 * @param {import("@enonic-types/core").Request} params.request
 * @returns {String}
 */
function getAbsoluteUrlFromPath(params) {
  log.debug("getAbsoluteUrlFromPath(" + toStr(params) + ")");
  const siteUri = params.request ? params.request.url : getAbsoluteSiteUrl();
  log.debug("siteUri:" + toStr(siteUri));
  const absoluteUrl = siteUri;
  log.debug("getAbsoluteUrlFromPath(" + toStr(params) + ") --> " + toStr(absoluteUrl));
  return absoluteUrl;
}
exports.getAbsoluteUrlFromPath = getAbsoluteUrlFromPath;

/**
 * If the request has a redirectUrl and a valid ticket it returns normalized redirectUrl.
 * Or simply returns the request url.
 * @param {import("@enonic-types/core").Request} request
 * @returns {url}
 */
exports.getReturnToUrl = function (request) {
  //log.debug('getReturnToUrl(' + toStr(request) + ')');
  if (request.params && request.params.redirect && request.validTicket) {
    return isAbsoluteUrl(request.params.redirect)
      ? request.params.redirect
      : getAbsoluteUrlFromPath({
          path: request.params.redirect,
          request: request,
        });
  }
  return request.url;
};
