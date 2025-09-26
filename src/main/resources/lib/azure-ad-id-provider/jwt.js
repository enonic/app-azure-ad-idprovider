/**
 * Jwt module.
 * @module lib/azure-ad-id-provider/jwt
 */

// oid:         Object ID. Contains a unique identifier of an object in Azure AD. This value is immutable and cannot be reassigned or reused. Use the object ID to identify an object in queries to Azure AD.
// family_name: Last Name. Provides the last name, surname, or family name of the user as defined in the Azure AD user object.
// given_name:  First Name. Provides the first or "given" name of the user, as set on the Azure AD user object.
// unique_name: Name. Provides a human readable value that identifies the subject of the token. This value is not guaranteed to be unique within a tenant and is designed to be used only for display purposes.
// upn:         User Principal Name. Stores the user name of the user principal.
// groups:      Groups. Provides object IDs that represent the subject's group memberships. These values are unique (see Object ID) and can be safely used for managing access, such as enforcing authorization to access a resource. The groups included in the groups claim are configured on a per-application basis, through the "groupMembershipClaims" property of the application manifest. A value of null will exclude all groups, a value of "SecurityGroup" will include only Active Directory Security Group memberships, and a value of "All" will include both Security Groups and Office 365 Distribution Lists.

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
exports.object = require("./object");

const lib = {
  enonic: {
    textEncoding: require("/lib/text-encoding"),
  },
  xp: {
    io: require("/lib/xp/io"),
  },
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
const toStr = exports.object.toStr;
const base64UrlDecode = lib.enonic.textEncoding.base64UrlDecode;
const readText = lib.xp.io.readText;

//──────────────────────────────────────────────────────────────────────────────
// Jwt methods
//──────────────────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} JwtHeader
 * @property {String} typ - Type
 * @property {String} alg - Algorithm : Algorithm that was used to sign the token.
 * @property {String} x5t - Particular public key that was used to sign the token.
 */

/**
 * @typedef {Object} JwtPayload
 * @property {String} aud - Audience : The intended recipient of the token. The application that receives the token must verify that the audience value is correct and reject any tokens intended for a different audience.
 * @property {String} iss - Issuer : Identifies the security token service (STS) that constructs and returns the token. In the tokens that Azure AD returns, the issuer is sts.windows.net. The GUID in the Issuer claim value is the tenant ID of the Azure AD directory. The tenant ID is an immutable and reliable identifier of the directory.
 * @property {String} iat - IssuedAt : Stores the time at which the token was issued. It is often used to measure token freshness.
 * @property {String} exp - Expiration time : The time when the token expires. For the token to be valid, the current date/time must be less than or equal to the exp value. The time is represented as the number of seconds from January 1, 1970 (1970-01-01T0:0:0Z) UTC until the time the token was issued.
 * @property {String} upn - User Principal Name : Stores the user name of the user principal.
 * @property {String} auth_time -
 * @property {String} authmethod -
 * @property {String} ver - Version : The version of the JWT token, typically 1.0.
 * @property {String} appid - Application ID : Identifies the application that is using the token to access a resource. The application can act as itself or on behalf of a user. The application ID typically represents an application object, but it can also represent a service principal object in Azure AD.
 */

/**
 * @typedef {Object} Jwt
 * @property {JwtHeader} header
 * @property {JwtPayload} payload
 * @property {String} signature
 */

/**
 * base64UrlDecode an accessToken and JSON.parse its header and payload. Return an object with header, payload and signature.
 * @param {import("@enonic-types/core").Request} request
 * @returns {Jwt} jwt
 */
exports.fromAccessToken = function (params) {
  const jwtParts = params.accessToken.split(".").map(function (base64url) {
    //log.debug('base64url:' + toStr(base64url));
    const stream = base64UrlDecode(base64url);
    const decoded = readText(stream);
    //log.debug('decoded:' + toStr(decoded));
    return decoded;
  });
  //log.debug('jwtParts:' + toStr(jwtParts));
  const jwt = {
    header: JSON.parse(jwtParts[0]),
    payload: JSON.parse(jwtParts[1]),
    signature: jwtParts[2],
  };
  log.debug("jwt:" + toStr(jwt));
  return jwt;
}; // function fromAccessToken
