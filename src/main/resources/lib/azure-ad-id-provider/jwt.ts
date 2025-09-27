/**
 * Jwt module.
 * @module lib/azure-ad-id-provider/jwt
 */
import { base64UrlDecode } from "/lib/text-encoding";
import { readText } from "/lib/xp/io";
import { toStr } from "./object";

// oid:         Object ID. Contains a unique identifier of an object in Azure AD. This value is immutable and cannot be reassigned or reused. Use the object ID to identify an object in queries to Azure AD.
// family_name: Last Name. Provides the last name, surname, or family name of the user as defined in the Azure AD user object.
// given_name:  First Name. Provides the first or "given" name of the user, as set on the Azure AD user object.
// unique_name: Name. Provides a human readable value that identifies the subject of the token. This value is not guaranteed to be unique within a tenant and is designed to be used only for display purposes.
// upn:         User Principal Name. Stores the user name of the user principal.
// groups:      Groups. Provides object IDs that represent the subject's group memberships. These values are unique (see Object ID) and can be safely used for managing access, such as enforcing authorization to access a resource. The groups included in the groups claim are configured on a per-application basis, through the "groupMembershipClaims" property of the application manifest. A value of null will exclude all groups, a value of "SecurityGroup" will include only Active Directory Security Group memberships, and a value of "All" will include both Security Groups and Office 365 Distribution Lists.

//──────────────────────────────────────────────────────────────────────────────
// Jwt methods
//──────────────────────────────────────────────────────────────────────────────
export interface JwtHeader {
  typ: string;
  alg: string;
  x5t: string;
}

export interface JwtPayload {
  aud: string;
  iss: string;
  iat: string;
  exp: string;
  upn: string;
  oid: string;
  auth_time: string;
  authmethod: string;
  ver: string;
  appid: string;
}

export type Jwt = {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
};

/**
 * base64UrlDecode an accessToken and JSON.parse its header and payload. Return an object with header, payload and signature.
 * @param {import("@enonic-types/core").Request} request
 * @returns {Jwt} jwt
 */
export function fromAccessToken(params: { accessToken: string }): Jwt {
  const jwtParts = params.accessToken.split(".").map((base64url) => {
    const stream = base64UrlDecode(base64url);

    if (!stream) {
      throw new Error("Invalid base64url");
    }

    return readText(stream);
  });

  const jwt = {
    header: JSON.parse(jwtParts[0]) as JwtHeader,
    payload: JSON.parse(jwtParts[1]) as JwtPayload,
    signature: jwtParts[2],
  };
  log.debug("jwt:" + toStr(jwt));
  return jwt;
}
