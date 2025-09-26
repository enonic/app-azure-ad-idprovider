/**
 * auth module.
 * @module lib/azure-ad-id-provider/auth
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
exports.group = require("./group");
exports.sanitizeName = require("./sanitizeName");
exports.user = require("./user");

const lib = {
  azureAdIdProvider: {
    context: require("/lib/azure-ad-id-provider/context"),
    object: require("/lib/azure-ad-id-provider/object"),
  },
  xp: {
    auth: require("/lib/xp/auth"),
    portal: require("/lib/xp/portal"),
  },
  config: require("/lib/azure-ad-id-provider/config"),
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
const runAsAdmin = lib.azureAdIdProvider.context.runAsAdmin;
const toStr = lib.azureAdIdProvider.object.toStr;
const getIdProviderConfig = lib.config.getIdProviderConfig;
const logout = lib.xp.auth.logout;
const getSite = lib.xp.portal.getSite;
const loginUrl = lib.xp.portal.loginUrl;
const pageUrl = lib.xp.portal.pageUrl;

//──────────────────────────────────────────────────────────────────────────────
// Auth methods
//──────────────────────────────────────────────────────────────────────────────

/**
 * If the request has a redirectUrl and a valid ticket it returns the redirectUrl.
 * Or tries to get site from context and return its url.
 * Or fallbacks to /
 * @param {import("@enonic-types/core").Request} request
 * @returns {String}
 */
function getRedirectAfterLogoutUrl(request) {
  const redirectAfterLogoutUrl = (function () {
    if (request && request.validTicket && request.params && request.params.redirect) {
      return request.params.redirect;
    }
    const site = getSite();
    return site ? pageUrl({ id: site._id, type: "absolute" }) : "/";
  })();
  log.debug("redirectAfterLogoutUrl:" + toStr(redirectAfterLogoutUrl));
  return redirectAfterLogoutUrl;
}
exports.getRedirectAfterLogoutUrl = getRedirectAfterLogoutUrl;

/**
 * Redirects the browser to idProviderConfig.logoutUrl
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
exports.handleLogoutRequest = function (request) {
  log.debug("handleLogoutRequest(" + toStr(request) + ")");

  const logoutResult = logout();
  //log.debug('logoutResult:' + toStr(logoutResult)); // Always undefined in Enonix XP 6.9.2

  const redirectAfterLogoutUrl = getRedirectAfterLogoutUrl(request);

  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  let location = idProviderConfig.logoutUrl;
  const POST_LOGOUT_PARAM = "?post_logout_redirect_uri=";
  if (location.indexOf(POST_LOGOUT_PARAM) === -1) {
    location += POST_LOGOUT_PARAM + redirectAfterLogoutUrl;
  }
  log.debug("logoutLocation:" + location);

  const redirectResponse = {
    status: 307, // Temporary redirect // http://insanecoding.blogspot.no/2014/02/http-308-incompetence-expected.html
    headers: {
      Location: location,
    },
    postProcess: false,
    applyFilters: false,
  };
  log.debug("redirectResponse:" + toStr(redirectResponse));
  return redirectResponse;
};
