/**
 * oauth2 module.
 * @module lib/azure-ad-id-provider/oauth2
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
const lib = {
  azureAdIdProvider: {
    object: require("/lib/azure-ad-id-provider/object"),
    portal: require("/lib/azure-ad-id-provider/portal"),
  },
  config: require("/lib/azure-ad-id-provider/config"),
  xp: {
    httpClient: require("/lib/http-client"),
    portal: require("/lib/xp/portal"),
  },
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
const toStr = lib.azureAdIdProvider.object.toStr;
const valueFromFormat = lib.azureAdIdProvider.object.valueFromFormat;
const getReturnToUrl = lib.azureAdIdProvider.portal.getReturnToUrl;
const getIdProviderConfig = lib.config.getIdProviderConfig;
const sendRequest = lib.xp.httpClient.request;
const getIdProviderKey = lib.xp.portal.getIdProviderKey;
const getIdProviderUrl = lib.xp.portal.idProviderUrl;

//──────────────────────────────────────────────────────────────────────────────
// Oauth2 methods
//──────────────────────────────────────────────────────────────────────────────

/**
 * Redirect the browser to the SSO login page so the user can login.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
exports.redirectToAuthorizationUrl = function (request) {
  log.debug("redirectToAuthorizationUrl(" + toStr(request) + ")");

  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  const clientId = idProviderConfig.clientId;
  let redirectUri = lib.xp.portal.idProviderUrl({ type: "absolute" });
  const forceHttpsOnRedirectUri = idProviderConfig.forceHttpsOnRedirectUri === "true";
  if (forceHttpsOnRedirectUri && redirectUri.indexOf("https://") === -1) {
    redirectUri = redirectUri.replace("http://", "https://");
  }
  log.debug("redirectUri:" + redirectUri);
  let returnToUrl = getReturnToUrl(request);
  if (forceHttpsOnRedirectUri && returnToUrl.indexOf("https://") === -1) {
    returnToUrl = returnToUrl.replace("http://", "https://");
  }
  log.debug("returnUrl:" + returnToUrl);
  const authorizationUrl = `https://login.microsoftonline.com/${idProviderConfig.tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid`;
  log.debug("authorizationUrl:" + authorizationUrl);
  const response = {
    body: "", // NOTE: Workaround for Safari so Content-Length header becomes 0 on /admin/tool
    status: 307, // Temporary redirect // http://insanecoding.blogspot.no/2014/02/http-308-incompetence-expected.html
    headers: {
      Location: authorizationUrl,
    },
    cookies: {
      enonicXpReturnToUrl: {
        value: returnToUrl, // So idProviderRequestHandler knows which url to redirect the user to
        path: "/",
      },
    },
    postProcess: false,
    applyFilters: false,
  };
  log.debug("redirectToAuthorizationUrl() response:" + toStr(response));
  return response;
}; // function redirectToAuthorizationUrl

/**
 * Ask the authentication provider directly (server to server) for an access token, using request.params.code and clientId.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
exports.requestAccessToken = function (request) {
  log.debug("requestAccessToken(" + toStr(arguments) + ")");

  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  let idProviderUrl = getIdProviderUrl({ type: "absolute" });
  const forceHttpsOnRedirectUri = idProviderConfig.forceHttpsOnRedirectUri === "true";
  if (forceHttpsOnRedirectUri && idProviderUrl.indexOf("https://") === -1) {
    idProviderUrl = idProviderUrl.replace("http://", "https://");
  }
  log.debug("idProviderUrl:" + toStr(idProviderUrl));

  const clientSecret = idProviderConfig.clientSecret;
  log.debug("clientSecret:" + toStr(clientSecret));

  const accessTokenRequest = {
    method: "POST",
    url: `https://login.microsoftonline.com/${idProviderConfig.tenantId}/oauth2/v2.0/token`,
    headers: {
      Accept: "appication/json",
    },
    params: {
      grant_type: "authorization_code",
      client_id: idProviderConfig.clientId,
      redirect_uri: idProviderUrl,
      code: request.params.code,
      scope: "openid",
      client_secret: clientSecret,
    },
    proxy: idProviderConfig.proxy,
  };
  log.debug("requestAccessToken: accessTokenRequest:" + toStr(accessTokenRequest));

  const accessTokenResponse = sendRequest(accessTokenRequest);
  log.debug("requestAccessToken: accessTokenResponse:" + toStr(accessTokenResponse));

  return accessTokenResponse;
  /* {
		"access_token":"thetoken", // JWT format
		"token_type":"bearer",
		"expires_in":3600
		// Because the Client did not authenticate itself with any client secret, no refresh token is issued
	}*/
};
