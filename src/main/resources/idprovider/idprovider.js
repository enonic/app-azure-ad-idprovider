/**
 * idprovider module.
 * @module idprovider
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
const azureAdIdProviderLib = require("/lib/azure-ad-id-provider");

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
const toStr = azureAdIdProviderLib.object.toStr;

//──────────────────────────────────────────────────────────────────────────────
// Implement id provider API
//──────────────────────────────────────────────────────────────────────────────

/**
 * Optional function executed if the current user is unauthenticated.
 * This functions allows you to, for example,
 * handle web tokens or other request headers.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
// NOTE: We only want to redirect to login page when a user is unauthorized
// So there is currently nothing to do in autoLogin.
/*exports.autoLogin = function(request) {
	log.debug('autoLogin(' + toStr(request) + ')');
};*/

/**
 * Functions rendered. An ID provider controller exports a method for each type
 * of HTTP request that should be handled. The portal function idProviderUrl()
 * will create a dynamic URL to this function.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
exports.get = function (request) {
  // portal.idProviderUrl
  log.debug("get(" + toStr(request) + ")");
  return azureAdIdProviderLib.handleIdProviderRequest(request);
};

/**
 * Optional function rendered in the case of a 401 error.
 * This function typically produces a login or error page.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
exports.handle401 = function (request) {
  log.debug("handle401(" + toStr(request) + ")");
  return azureAdIdProviderLib.oauth2.redirectToAuthorizationUrl(request);
};

/**
 * Function rendered. The portal function loginUrl() will create a dynamic URL
 * to this function.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
exports.login = function (request) {
  log.debug("login(" + toStr(request) + ")");
  return azureAdIdProviderLib.oauth2.redirectToAuthorizationUrl(request);
};

/**
 * Function rendered. The portal function logoutUrl() will create a dynamic URL
 * to this function.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
exports.logout = function (request) {
  log.debug("logout(" + toStr(request) + ")");
  return azureAdIdProviderLib.auth.handleLogoutRequest(request);
};

/**
 * Functions rendered. An ID provider controller exports a method for each type
 * of HTTP request that should be handled. The portal function idProviderUrl()
 * will create a dynamic URL to this function.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
exports.post = function (request) {
  log.debug("post(" + toStr(request) + ")");
  return azureAdIdProviderLib.handleIdProviderRequest(request);
};
