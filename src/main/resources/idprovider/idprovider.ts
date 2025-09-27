/**
 * idprovider module.
 * @module idprovider
 */

import { handleIdProviderRequest } from "/lib/azure-ad-id-provider";
import { redirectToAuthorizationUrl } from "/lib/azure-ad-id-provider/oauth2";
import { toStr } from "/lib/azure-ad-id-provider/object";
import { handleLogoutRequest } from "/lib/azure-ad-id-provider/auth";
import type { Request, Response } from "@enonic-types/core";

/**
 * Functions rendered. An ID provider controller exports a method for each type
 * of HTTP request that should be handled. The portal function idProviderUrl()
 * will create a dynamic URL to this function.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
export function get(request: Request<{ params: { code: string } }>): Response {
  log.debug("get(" + toStr(request) + ")");
  return handleIdProviderRequest(request);
}

/**
 * Optional function rendered in the case of a 401 error.
 * This function typically produces a login or error page.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
export function handle401(request: Request): Response {
  log.debug("handle401(" + toStr(request) + ")");
  return redirectToAuthorizationUrl(request);
}

/**
 * Function rendered. The portal function loginUrl() will create a dynamic URL
 * to this function.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
export function login(request: Request): Response {
  log.debug("login(" + toStr(request) + ")");
  return redirectToAuthorizationUrl(request);
}

/**
 * Function rendered. The portal function logoutUrl() will create a dynamic URL
 * to this function.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
export function logout(request: Request<{ params: { redirect: string } }>): Response {
  log.debug("logout(" + toStr(request) + ")");
  return handleLogoutRequest(request);
}

/**
 * Functions rendered. An ID provider controller exports a method for each type
 * of HTTP request that should be handled. The portal function idProviderUrl()
 * will create a dynamic URL to this function.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
export function post(request: Request<{ params: { code: string } }>): Response {
  log.debug("post(" + toStr(request) + ")");
  return handleIdProviderRequest(request);
}
