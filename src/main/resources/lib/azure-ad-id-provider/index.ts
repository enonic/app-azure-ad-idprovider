/**
 * azure-ad-id-provider module.
 * @module lib/azure-ad-id-provider
 */
import { login } from "/lib/xp/auth";
import { send as sendEvent } from "/lib/xp/event";
import { getIdProviderConfig } from "/lib/azure-ad-id-provider/config";
import { createAndUpdateGroupsFromJwt } from "./auth/group";
import { createOrUpdateFromJwt, modifyProfile } from "./auth/user";
import { fromAccessToken } from "./jwt";
import { requestAccessToken } from "./oauth2";
import { toStr } from "./object";
import type { Request, Response } from "@enonic-types/core";

//──────────────────────────────────────────────────────────────────────────────
// ADFS ID provider methods
//──────────────────────────────────────────────────────────────────────────────
/**
 * This method is called when the user is redirected back after logging into SSO.
 * It can create or update user, profile and group membership based on jwt data received in an accesstoken.
 * Then it will login the user and redirect the user back to the page that was requested before login.
 * @param {import("@enonic-types/core").Request} request
 * @returns {import("@enonic-types/core").Response}
 */
export function handleIdProviderRequest(request: Request<{ params: { code: string } }>): Response {
  log.debug("handleIdProviderRequest(" + toStr(request) + ")");

  const accessTokenResponse = requestAccessToken(request);
  log.debug("accessTokenResponse:" + toStr(accessTokenResponse));

  const json = JSON.parse(accessTokenResponse.body ?? "{}") as {
    error: string;
    access_token: string;
    expires_in: number;
  };
  log.debug("json:" + toStr(json));

  if (json.error) {
    log.error(toStr(json));
    throw new Error("Something went wrong when requesting access token.");
  }

  const jwt = fromAccessToken({ accessToken: json.access_token });

  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));
  log.debug("jwt payload:" + toStr(jwt.payload));

  const user = createOrUpdateFromJwt({ jwt });

  if (json.expires_in) {
    const now = new Date();
    //json.expires_in = 2; // NOTE: TODO: DEBUGGING expire in 2 seconds (will autoLogin as not expired on SSO...)
    const expiresAt = new Date(now.getTime() + 1000 * json.expires_in);
    log.debug("expires_in:" + toStr(json.expires_in) + " now:" + toStr(now) + " expiresAt:" + toStr(expiresAt));
    modifyProfile({
      key: user.key,
      profile: { expiresAt: expiresAt },
      scope: "accessToken",
      log: false,
    });
  }

  createAndUpdateGroupsFromJwt({
    accessToken: json.access_token,
    jwt: jwt,
    user: user,
  });

  const loginResult = login({
    user: user.login,
    idProvider: user.idProvider,
    skipAuth: true,
  });
  log.debug("loginResult:" + toStr(loginResult));

  // Fire event that a user is logged in
  sendEvent({
    type: "azure.user.login",
    distributed: true,
    data: user,
  });

  const location = request.cookies && request.cookies.enonicXpReturnToUrl ? request.cookies.enonicXpReturnToUrl : "/";

  return {
    // redirect to origUrl
    status: 307,
    headers: {
      Location: location,
    },
    postProcess: false,
    applyFilters: false,
  };
}
