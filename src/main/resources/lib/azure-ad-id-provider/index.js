/**
 * azure-ad-id-provider module.
 * @module lib/azure-ad-id-provider
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
exports.array = require("./array");
exports.auth = require("./auth");
exports.jwt = require("./jwt");
exports.oauth2 = require("./oauth2");
exports.object = require("./object");

const lib = {
  xp: {
    auth: require("/lib/xp/auth"),
    portal: require("/lib/xp/portal"),
    event: require("/lib/xp/event"),
  },
  config: require("/lib/azure-ad-id-provider/config"),
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
const inFirstButNotInSecond = exports.array.inFirstButNotInSecond;
const createAndUpdateGroupsFromJwt = exports.auth.group.createAndUpdateGroupsFromJwt;
const createOrUpdateFromJwt = exports.auth.user.createOrUpdateFromJwt;
const modifyProfile = exports.auth.user.modifyProfile;
const jwtFromAccessToken = exports.jwt.fromAccessToken;
const requestAccessToken = exports.oauth2.requestAccessToken;
const toStr = exports.object.toStr;
const valueFromFormat = exports.object.valueFromFormat;
const getIdProviderConfig = lib.config.getIdProviderConfig;
const login = lib.xp.auth.login;

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
exports.handleIdProviderRequest = function (request) {
  log.debug("handleIdProviderRequest(" + toStr(request) + ")");

  const accessTokenResponse = requestAccessToken(request);
  log.debug("accessTokenResponse:" + toStr(accessTokenResponse));

  const json = JSON.parse(accessTokenResponse.body);
  log.debug("json:" + toStr(json));

  if (json.error) {
    log.error(toStr(json));
    throw new Error("Something went wrong when requesting access token.");
  }

  const jwt = jwtFromAccessToken({ accessToken: json.access_token });

  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));
  log.debug("jwt payload:" + toStr(jwt.payload));

  const user = createOrUpdateFromJwt({ jwt: jwt });

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
  lib.xp.event.send({
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
}; // function handleIdProviderRequest
