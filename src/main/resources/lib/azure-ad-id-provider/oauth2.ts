/**
 * oauth2 module.
 * @module lib/azure-ad-id-provider/oauth2
 */
import { toStr } from "/lib/azure-ad-id-provider/object";
import { getIdProviderConfig } from "/lib/azure-ad-id-provider/config";
import { getReturnToUrl } from "/lib/azure-ad-id-provider/portal";
import { request as httpRequest, type HttpResponse, type HttpRequestParams } from "/lib/http-client";
import { idProviderUrl as getIdProviderUrl } from "/lib/xp/portal";
import type { Request, Response } from "@enonic-types/core";

/**
 * Redirect the browser to the SSO login page so the user can login.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
export function redirectToAuthorizationUrl(request: Request): Response {
  log.debug("redirectToAuthorizationUrl(" + toStr(request) + ")");

  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  const clientId = idProviderConfig.clientId;
  let redirectUri = getIdProviderUrl({ type: "absolute" });
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
}

/**
 * Ask the authentication provider directly (server to server) for an access token, using request.params.code and clientId.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
export function requestAccessToken(request: Request<{ params: { code: string } }>): HttpResponse {
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

  const accessTokenRequest: HttpRequestParams = {
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

  const accessTokenResponse = httpRequest(accessTokenRequest);
  log.debug("requestAccessToken: accessTokenResponse:" + toStr(accessTokenResponse));

  return accessTokenResponse;
  /* {
		"access_token":"thetoken", // JWT format
		"token_type":"bearer",
		"expires_in":3600
		// Because the Client did not authenticate itself with any client secret, no refresh token is issued
	}*/
}

export type AccessTokenResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
};
