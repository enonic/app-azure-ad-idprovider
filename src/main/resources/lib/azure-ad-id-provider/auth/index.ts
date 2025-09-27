import { toStr } from "/lib/azure-ad-id-provider/object";
import { logout } from "/lib/xp/auth";
import { getSite, pageUrl } from "/lib/xp/portal";
import { getIdProviderConfig } from "/lib/azure-ad-id-provider/config";
import type { Request, Response } from "@enonic-types/core";

/**
 * If the request has a redirectUrl and a valid ticket it returns the redirectUrl.
 * Or tries to get site from context and return its url.
 * Or fallbacks to /
 * @param {import("@enonic-types/core").Request} request
 * @returns {String}
 */
export function getRedirectAfterLogoutUrl(request: Request<{ params: { redirect: string } }>): string {
  const redirectAfterLogoutUrl = (() => {
    if (request && request.validTicket && request.params && request.params.redirect) {
      return request.params.redirect;
    }
    const site = getSite();
    return site ? pageUrl({ id: site._id, type: "absolute" }) : "/";
  })();
  log.debug("redirectAfterLogoutUrl:" + toStr(redirectAfterLogoutUrl));
  return redirectAfterLogoutUrl;
}

/**
 * Redirects the browser to idProviderConfig.logoutUrl
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
export function handleLogoutRequest(request: Request<{ params: { redirect: string } }>): Response {
  log.debug("handleLogoutRequest(" + toStr(request) + ")");

  logout();
  //log.debug('logoutResult:' + toStr(logoutResult)); // Always undefined in Enonix XP 6.9.2

  const redirectAfterLogoutUrl = getRedirectAfterLogoutUrl(request);

  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  let location: string = idProviderConfig.logoutUrl;
  const POST_LOGOUT_PARAM = "?post_logout_redirect_uri=";
  if (location.indexOf(POST_LOGOUT_PARAM) === -1) {
    location += POST_LOGOUT_PARAM + redirectAfterLogoutUrl;
  }
  log.debug("logoutLocation:" + location);

  const redirectResponse: Response = {
    status: 307, // Temporary redirect // http://insanecoding.blogspot.no/2014/02/http-308-incompetence-expected.html
    headers: {
      Location: location,
    },
    postProcess: false,
    applyFilters: false,
  };
  log.debug("redirectResponse:" + toStr(redirectResponse));
  return redirectResponse;
}
