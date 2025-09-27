/**
 * auth.user module.
 * @module lib/azure-ad-id-provider/auth/user
 */
import { sanitizeName } from "/lib/azure-ad-id-provider/auth/sanitizeName";
import { runAsAdmin } from "/lib/azure-ad-id-provider/context";
import { toStr, valueFromFormat } from "/lib/azure-ad-id-provider/object";
import { forceArray } from "/lib/util/data";
import {
  createUser,
  findUsers,
  getMemberships,
  getProfile as xpGetProfile,
  modifyProfile as xpModifyProfile,
  modifyUser,
  type Group,
  type GroupKey,
  type Role,
  type UserKey,
  type User,
  type GetProfileParams,
  type RoleKey,
  type ModifyProfileParams as XPModifyProfileParams,
} from "/lib/xp/auth";
import { getIdProviderKey } from "/lib/xp/portal";
import { sanitize } from "/lib/xp/common";
import { send as sendEvent } from "/lib/xp/event";
import { getIdProviderConfig } from "/lib/azure-ad-id-provider/config";
import { getDefaults } from "/lib/configFile/defaults";
import type { Jwt } from "/lib/azure-ad-id-provider/jwt";

const CONFIG_DEFAULTS = getDefaults();

type CreateOrModifyParams = {
  name: string;
  displayName: string;
  email: string;
  idProvider: string;
};

/**
 * Creates or modifies a user and returns the user.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.displayName
 * @param {string} params.email
 * @param {string} params.idProvider
 * @returns {user}
 */
// NOTE: The user content has a disabled parameter, that could be used for something.
export function createOrModify(params: CreateOrModifyParams) {
  log.debug("createOrModify(" + toStr(params) + ")");

  // NOTE: Could have used getUser() instead.
  const findUsersParams = {
    count: 1, // we check total, so just getting 1 is fine
    query: "userstorekey = '" + params.idProvider + "' AND login = '" + params.name + "'",
  };
  log.debug("findUsersParams:" + toStr(findUsersParams));
  const findUsersResult = runAsAdmin(function () {
    return findUsers(findUsersParams);
  });
  log.debug("findUsersResult:" + toStr(findUsersResult));

  let user: User | null = null;
  if (findUsersResult.total > 1) {
    const msg = "Found multiple users with name:" + params.name;
    log.error(msg);
    throw new Error(msg);
  } else if (findUsersResult.total == 1) {
    user = findUsersResult.hits[0];
    if (user.displayName === params.displayName && user.email === params.email) {
      log.debug("unchanged user:" + toStr(user));
    } else {
      log.debug("before modify user:" + toStr(user));
      user = runAsAdmin(() => {
        return modifyUser({
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          key: user.key,
          editor: function (c) {
            c.displayName = params.displayName;
            c.email = params.email;
            return c;
          },
        });
      });

      sendEvent({
        type: "azure.user.modify",
        distributed: true,
        data: user ?? undefined,
      });

      log.debug("modified user:" + toStr(user));
    }
  } else {
    runAsAdmin(function () {
      user = createUser(params);
    });

    sendEvent({
      type: "azure.user.create",
      distributed: true,
      data: user ?? undefined,
    });
    log.debug("created user:" + toStr(user));
  }
  return user;
}

/**
 * Gets a user profile.
 * @param {Object} params
 * @param {string} params.key
 * @param {string} params.scope
 * @returns {profile}
 */
export function getProfile(params: { key: UserKey; scope?: string }) {
  const getProfileParams: GetProfileParams = { key: params.key };
  if (params.scope) {
    getProfileParams.scope = params.scope;
  }

  const getProfileResult = runAsAdmin(() => {
    return xpGetProfile(getProfileParams);
  });
  log.debug("getProfile(" + toStr(params) + ") --> " + toStr(getProfileResult));
  return getProfileResult;
}

type ModifyProfileParams = {
  key: UserKey;
  profile: Record<string, unknown>;
  log?: boolean;
  scope?: string;
};

/**
 * Does not remove old propeties, only overwrites existing and add new ones.
 * Otherwise it would not play well with scopes.
 * @param {Object} params
 * @param {string} params.key
 * @param {string} params.scope
 * @param {Object} params.profile
 * @param {Object} params.log - Log this change? Default is true
 * @returns {profile}
 */
export function modifyProfile(params: ModifyProfileParams): Record<string, unknown> | null {
  const modifyProfileParams: XPModifyProfileParams<Record<string, unknown>> = {
    key: params.key,
    scope: "adfs",
    editor: (c) => {
      if (!c) {
        c = {};
      }
      Object.keys(params.profile).forEach((property) => {
        c[property] = params.profile[property];
      });
      return c;
    },
  };
  if (params.scope) {
    modifyProfileParams.scope = params.scope;
  }
  const modifyProfileResult = runAsAdmin(() => xpModifyProfile(modifyProfileParams));
  if (params.log !== false) {
    log.debug("modifyProfile(" + toStr(params) + ") --> " + toStr(modifyProfileResult));
  }
  return modifyProfileResult;
}

/**
 * Sets the value of a property on a path within an object.
 * Useful for variable paths. Made to avoid using eval().
 * CAVEAT: Only supports dot notation, not bracket notation.
 * @param {Object} object
 * @param {string} path
 * @param {*} value
 * @returns {Object}
 */
// http://stackoverflow.com/questions/6842795/dynamic-deep-setting-for-a-javascript-object
function setPathToValue(object: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const a = path.split(".");
  let o = object;
  for (let i = 0; i < a.length - 1; i++) {
    const n = a[i];
    if (n in o) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      o = o[n];
    } else {
      o[n] = {};
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      o = o[n];
    }
  }
  o[a[a.length - 1]] = value;
  return o;
}

/**
 * Enriches the a user profile based on which fields are mapped in idProviderConfig.profile.
 * @param {Object} params
 * @param {string} params.key user._id
 * @param {Object} params.jwt
 * @returns {}
 */
export function enrichProfileFromJwt(params: { key: UserKey; jwt: Jwt }) {
  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  if (!idProviderConfig.profile) {
    return;
  }

  forceArray(idProviderConfig.profile).forEach((property) => {
    if (property.from && property.to) {
      modifyProfile({
        key: params.key,
        profile: setPathToValue(
          {},
          property.to,
          valueFromFormat({
            format: property.from,
            data: params.jwt.payload,
          }),
        ),
      });
    }
  });
}

/**
 * Gets a list of groups a user is a member of.
 * @param {string} principalKey
 * @returns {groups}
 */
export function getGroups(principalKey: UserKey | GroupKey): Group[] {
  const principals = runAsAdmin(() => {
    return getMemberships(principalKey);
  });
  log.debug("getGroups(" + toStr(principalKey) + ") principals:" + toStr(principals));
  const groups = principals.filter(function (principal) {
    return principal.type === "group";
  });
  log.debug("getGroups(" + toStr(principalKey) + ") -->" + toStr(groups));
  return groups;
}

/**
 * Gets a list of keys for groups a user is a member of.
 * @param {string} principalKey
 * @returns {groupKeys[]}
 */
export function getGroupKeys(principalKey: UserKey | GroupKey): (GroupKey | RoleKey)[] {
  const groups = getGroups(principalKey);
  const groupKeys = groups.map(function (group) {
    return group.key;
  });
  log.debug("getGroupKeys(" + toStr(principalKey) + ") -->" + toStr(groupKeys));
  return groupKeys;
}

/**
 * Gets a list of roles a user has.
 * @param {string} principalKey
 * @returns {roles[]}
 */
export function getRoles(principalKey: UserKey | GroupKey): (Group | Role)[] {
  const principals = runAsAdmin(function () {
    return getMemberships(principalKey);
  });
  log.debug("getRoles(" + toStr(principalKey) + ") principals:" + toStr(principals));
  const roles = principals.filter(function (principal) {
    return principal.type === "role";
  });
  log.debug("getRoles(" + toStr(principalKey) + ") -->" + toStr(roles));
  return roles;
}

/**
 * Creates or updates a user and its profile based on data in jwt.
 * @param {Object} params
 * @param {Object} params.jwt
 * @returns {user}
 */
export function createOrUpdateFromJwt(params: { jwt: Jwt }): User {
  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  const userNameFormat = (idProviderConfig.user && idProviderConfig.user.name) || CONFIG_DEFAULTS.user.name;
  let userName = valueFromFormat({
    format: userNameFormat,
    data: params.jwt.payload,
  });

  if (!userName) {
    throw new Error("Could not generate username from mapping:" + userNameFormat);
  }

  //Keep first sanitization to improve backward compatibility rate
  userName = sanitizeName(userName);
  userName = sanitize(userName);

  const userDisplayNameFormat =
    (idProviderConfig.user && idProviderConfig.user.displayName) || CONFIG_DEFAULTS.user.displayName;
  const userDisplayName = valueFromFormat({
    format: userDisplayNameFormat,
    data: params.jwt.payload,
  });

  if (!userDisplayName) {
    throw new Error("Could not generate user displayName from mapping:" + userDisplayNameFormat);
  }

  const userEmailFormat = (idProviderConfig.user && idProviderConfig.user.email) || CONFIG_DEFAULTS.user.email;
  const userEmail = valueFromFormat({
    format: userEmailFormat,
    data: params.jwt.payload,
  });

  if (!userEmail) {
    throw new Error("Could not generate user email from mapping:" + userEmailFormat);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = createOrModify({
    name: userName,
    displayName: userDisplayName,
    email: userEmail,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    idProvider: getIdProviderKey()!,
  })!;

  enrichProfileFromJwt({
    key: user?.key,
    jwt: params.jwt,
  });

  return user;
}
