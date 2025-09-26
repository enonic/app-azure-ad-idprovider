/**
 * auth.user module.
 * @module lib/azure-ad-id-provider/auth/user
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
const lib = {
  azureAdIdProvider: {
    auth: {
      sanitizeName: require("/lib/azure-ad-id-provider/auth/sanitizeName"),
    },
    context: require("/lib/azure-ad-id-provider/context"),
    object: require("/lib/azure-ad-id-provider/object"),
  },
  enonic: {
    util: {
      data: require("/lib/util/data"),
    },
  },
  xp: {
    auth: require("/lib/xp/auth"),
    portal: require("/lib/xp/portal"),
    common: require("/lib/xp/common"),
    event: require("/lib/xp/event"),
  },
  config: require("/lib/azure-ad-id-provider/config"),
  defaults: require("/lib/configFile/defaults"),
};

const CONFIG_DEFAULTS = lib.defaults.getDefaults();

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
const sanitizeName = lib.azureAdIdProvider.auth.sanitizeName.sanitizeName;
const runAsAdmin = lib.azureAdIdProvider.context.runAsAdmin;
const toStr = lib.azureAdIdProvider.object.toStr;
const valueFromFormat = lib.azureAdIdProvider.object.valueFromFormat;
const forceArray = lib.enonic.util.data.forceArray;
const createUser = lib.xp.auth.createUser;
const findUsers = lib.xp.auth.findUsers;
const getIdProviderConfig = lib.config.getIdProviderConfig;
const getMemberships = lib.xp.auth.getMemberships;
const xpGetProfile = lib.xp.auth.getProfile;
const xpModifyProfile = lib.xp.auth.modifyProfile;
const modifyUser = lib.xp.auth.modifyUser;
const getIdProviderKey = lib.xp.portal.getIdProviderKey;

//──────────────────────────────────────────────────────────────────────────────
// auth.user methods
//──────────────────────────────────────────────────────────────────────────────
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
function createOrModify(params) {
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

  let user;
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
      user = runAsAdmin(function () {
        return modifyUser({
          key: user.key,
          editor: function (c) {
            c.displayName = params.displayName;
            c.email = params.email;
            return c;
          },
        });
      });

      lib.xp.event.send({
        type: "azure.user.modify",
        distributed: true,
        data: user,
      });

      log.debug("modified user:" + toStr(user));
    }
  } else {
    runAsAdmin(function () {
      user = createUser(params);
    });

    lib.xp.event.send({
      type: "azure.user.create",
      distributed: true,
      data: user,
    });
    log.debug("created user:" + toStr(user));
  }
  return user;
} // function createOrModify
exports.createOrModify = createOrModify;

/**
 * Gets a user profile.
 * @param {Object} params
 * @param {string} params.key
 * @param {string} params.scope
 * @returns {profile}
 */
exports.getProfile = function (params) {
  const getProfileParams = { key: params.key };
  if (params.scope) {
    getProfileParams.scope = params.scope;
  }
  const getProfileResult = runAsAdmin(function () {
    return xpGetProfile(getProfileParams);
  });
  log.debug("getProfile(" + toStr(params) + ") --> " + toStr(getProfileResult));
  return getProfileResult;
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
function modifyProfile(params) {
  const modifyProfileParams = {
    key: params.key,
    scope: "adfs",
    editor: function (c) {
      if (!c) {
        c = {};
      }
      Object.keys(params.profile).forEach(function (property) {
        c[property] = params.profile[property];
      });
      return c;
    },
  };
  if (params.scope) {
    modifyProfileParams.scope = params.scope;
  }
  const modifyProfileResult = runAsAdmin(function () {
    return xpModifyProfile(modifyProfileParams);
  });
  if (params.log != false) {
    log.debug("modifyProfile(" + toStr(params) + ") --> " + toStr(modifyProfileResult));
  }
  return modifyProfileResult;
}
exports.modifyProfile = modifyProfile;

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
function setPathToValue(object, path, value) {
  const a = path.split(".");
  let o = object;
  for (let i = 0; i < a.length - 1; i++) {
    const n = a[i];
    if (n in o) {
      o = o[n];
    } else {
      o[n] = {};
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
function enrichProfileFromJwt(params) {
  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  if (!idProviderConfig.profile) {
    return;
  }
  forceArray(idProviderConfig.profile).forEach(function (property) {
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
  }); // forEach property
} // function enrichProfileFromJwt
exports.enrichProfileFromJwt = enrichProfileFromJwt;

/**
 * Gets a list of groups a user is a member of.
 * @param {string} principalKey
 * @returns {groups}
 */
exports.getGroups = function (principalKey) {
  const principals = runAsAdmin(function () {
    return getMemberships(principalKey);
  });
  log.debug("getGroups(" + toStr(principalKey) + ") principals:" + toStr(principals));
  const groups = principals.filter(function (principal) {
    return principal.type === "group";
  });
  log.debug("getGroups(" + toStr(principalKey) + ") -->" + toStr(groups));
  return groups;
};

/**
 * Gets a list of keys for groups a user is a member of.
 * @param {string} principalKey
 * @returns {groupKeys[]}
 */
exports.getGroupKeys = function (principalKey) {
  const groups = exports.getGroups(principalKey);
  const groupKeys = groups.map(function (group) {
    return group.key;
  });
  log.debug("getGroupKeys(" + toStr(principalKey) + ") -->" + toStr(groupKeys));
  return groupKeys;
};

/**
 * Gets a list of roles a user has.
 * @param {string} principalKey
 * @returns {roles[]}
 */
exports.getRoles = function (principalKey) {
  const principals = runAsAdmin(function () {
    return getMemberships(principalKey);
  });
  log.debug("getRoles(" + toStr(principalKey) + ") principals:" + toStr(principals));
  const roles = principals.filter(function (principal) {
    return principal.type === "role";
  });
  log.debug("getRoles(" + toStr(principalKey) + ") -->" + toStr(roles));
  return roles;
};

/**
 * Creates or updates a user and its profile based on data in jwt.
 * @param {Object} params
 * @param {Object} params.jwt
 * @returns {user}
 */
exports.createOrUpdateFromJwt = function (params) {
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
  userName = lib.xp.common.sanitize(userName);

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

  const user = createOrModify({
    name: userName,
    displayName: userDisplayName,
    email: userEmail,
    idProvider: getIdProviderKey(),
  });

  enrichProfileFromJwt({
    key: user.key,
    jwt: params.jwt,
  });

  return user;
}; // createOrUpdateFromJwt

exports.debugAllUsers = function () {
  const findUsersResult = runAsAdmin(function () {
    return findUsers({
      count: -1,
      includeProfile: true,
      query: "",
    });
  });
  log.debug("findUsersResult:" + toStr(findUsersResult)); // Does not show profile?
  /*findUsersResult.hits.forEach(function(user) {
		var getProfileResult = runAsAdmin(function() {
			return xpGetProfile({
				key: user.key
				//scope
			});
		});
		log.debug('getProfile({ key: '+ user.key +' }) --> ' + toStr(getProfileResult));
	});*/
}; // debugAllUsers
