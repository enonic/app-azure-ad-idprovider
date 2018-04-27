/**
 * auth.user module.
 * @module lib/adfs-id-provider/auth/user
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
var lib = {
	adfsIdProvider: {
		auth: {
			sanitizeName: require('/lib/adfs-id-provider/auth/sanitizeName'),
		},
		context: require('/lib/adfs-id-provider/context'),
		object:  require('/lib/adfs-id-provider/object')
	},
	enonic: {
		util: {
			data: require('/lib/enonic/util/data')
		}
	},
	xp: {
		auth:   require('/lib/xp/auth'),
		portal: require('/lib/xp/portal')
	}
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
var sanitizeName        = lib.adfsIdProvider.auth.sanitizeName.sanitizeName;
var runAsAdmin          = lib.adfsIdProvider.context.runAsAdmin;
var toStr               = lib.adfsIdProvider.object.toStr;
var valueFromFormat     = lib.adfsIdProvider.object.valueFromFormat;
var forceArray          = lib.enonic.util.data.forceArray;
var createUser          = lib.xp.auth.createUser;
var findUsers           = lib.xp.auth.findUsers
var getIdProviderConfig = lib.xp.auth.getIdProviderConfig;
var getMemberships      = lib.xp.auth.getMemberships;
var xpGetProfile        = lib.xp.auth.getProfile;
var xpModifyProfile     = lib.xp.auth.modifyProfile;
var modifyUser          = lib.xp.auth.modifyUser;
var getUserStoreKey     = lib.xp.portal.getUserStoreKey;


//──────────────────────────────────────────────────────────────────────────────
// auth.user methods
//──────────────────────────────────────────────────────────────────────────────
/**
 * Creates or modifies a user and returns the user.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.displayName
 * @param {string} params.email
 * @param {string} params.userStore
 * @returns {user}
 */
 // NOTE: The user content has a disabled parameter, that could be used for something.
function createOrModify(params) {
	log.debug('createOrModify(' + toStr(params) + ')');

	// NOTE: Could have used getUser() instead.
	var findUsersParams = {
    	count: 1, // we check total, so just getting 1 is fine
    	query: "userstorekey = '" + params.userStore + "' AND login = '" + params.name + "'"
	};
	log.debug('findUsersParams:' + toStr(findUsersParams));
	var findUsersResult = runAsAdmin(function() {
		return findUsers(findUsersParams);
	});
	log.debug('findUsersResult:' + toStr(findUsersResult));

	var user;
	if(findUsersResult.total > 1) {
		var msg = 'Found multiple users with name:' + params.name;
		log.error(msg)
		throw new Error(msg);
	} else if (findUsersResult.total == 1) {
		user = findUsersResult.hits[0];
		if(user.displayName === params.displayName && user.email === params.email) {
			log.debug('unchanged user:' + toStr(user));
		} else {
			log.debug('before modify user:' + toStr(user));
			user = runAsAdmin(function() {
				return modifyUser({
					key: user.key,
					editor: function(c) {
						c.displayName = params.displayName;
						c.email = params.email;
						return c;
					}
				});
			});
			log.debug('modified user:' + toStr(user));
		}
	} else {
		runAsAdmin(function() {
			user = createUser(params);
		});
		log.debug('created user:' + toStr(user));
	}
	return user;
}; // function createOrModify
exports.createOrModify = createOrModify;


/**
 * Gets a user profile.
 * @param {Object} params
 * @param {string} params.key
 * @param {string} params.scope
 * @returns {profile}
 */
exports.getProfile = function(params) {
	var getProfileParams = { key: params.key };
	if(params.scope) { getProfileParams.scope = params.scope; }
	var getProfileResult = runAsAdmin(function() {
		return xpGetProfile(getProfileParams);
	});
	log.debug('getProfile('+ toStr(params) +') --> ' + toStr(getProfileResult));
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
	var modifyProfileParams = {
		key: params.key,
		editor: function(c) {
			if (!c) { c = {}; }
			Object.keys(params.profile).forEach(function(property) {
				c[property] = params.profile[property];
			});
			return c;
		}
	};
	if(params.scope) { modifyProfileParams.scope = params.scope; }
	var modifyProfileResult = runAsAdmin(function() {
		return xpModifyProfile(modifyProfileParams);
	});
	if(params.log != false) {
		log.debug('modifyProfile(' + toStr(params) + ') --> ' + toStr(modifyProfileResult));
	}
	return modifyProfileResult;
};
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
	var a = path.split('.');
	var o = object;
	for (var i = 0; i < a.length - 1; i++) {
		var n = a[i];
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
	var idProviderConfig = getIdProviderConfig();
	log.debug('idProviderConfig:' + toStr(idProviderConfig));

	if(!idProviderConfig.profile) { return }
	forceArray(idProviderConfig.profile).forEach(function(property) {
		modifyProfile({
			key: params.key,
			profile: setPathToValue(
				{},
				property.to,
				valueFromFormat({
					format: property.from,
					data:   params.jwt.payload
				}))
		});
	}); // forEach property
}; // function enrichProfileFromJwt
exports.enrichProfileFromJwt = enrichProfileFromJwt;


/**
 * Gets a list of groups a user is a member of.
 * @param {string} principalKey
 * @returns {groups}
 */
exports.getGroups = function(principalKey) {
	var principals = runAsAdmin(function() {
		return getMemberships(principalKey);
	});
	log.debug('getGroups(' + toStr(principalKey) + ') principals:' + toStr(principals));
	var groups = principals.filter(function(principal) {
		return principal.type === 'group';
	});
	log.debug('getGroups(' + toStr(principalKey) + ') -->' + toStr(groups));
	return groups;
};


/**
 * Gets a list of keys for groups a user is a member of.
 * @param {string} principalKey
 * @returns {groupKeys[]}
 */
exports.getGroupKeys = function(principalKey) {
	var groups = exports.getGroups(principalKey);
	var groupKeys = groups.map(function(group) {
		return group.key;
	});
	log.debug('getGroupKeys(' + toStr(principalKey) + ') -->' + toStr(groupKeys));
	return groupKeys;
};


/**
 * Gets a list of roles a user has.
 * @param {string} principalKey
 * @returns {roles[]}
 */
exports.getRoles = function(principalKey) {
	var principals = runAsAdmin(function() {
		return getMemberships(principalKey);
	});
	log.debug('getRoles(' + toStr(principalKey) + ') principals:' + toStr(principals));
	var roles = principals.filter(function(principal) {
		return principal.type === 'role';
	});
	log.debug('getRoles(' + toStr(principalKey) + ') -->' + toStr(roles));
	return roles;
};


/**
 * Creates or updates a user and its profile based on data in jwt.
 * @param {Object} params
 * @param {Object} params.jwt
 * @returns {user}
 */
exports.createOrUpdateFromJwt = function(params) {

	var idProviderConfig = getIdProviderConfig();
	log.debug('idProviderConfig:' + toStr(idProviderConfig));

	var userNameFormat = idProviderConfig.user && idProviderConfig.user.name || '${oid}';
	var userName = valueFromFormat({
		format: userNameFormat,
		data:   params.jwt.payload
	});

	if(!userName) {
		throw new Error('Could not generate username from mapping:' + userNameFormat);
	}
	userName = sanitizeName(userName);

	var userDisplayNameFormat = idProviderConfig.user && idProviderConfig.user.displayName || '${given_name} ${family_name} (${unique_name}) <${upn}>';
	var userDisplayName = valueFromFormat({
		format: userDisplayNameFormat,
		data:   params.jwt.payload
	});

	if(!userDisplayName) {
		throw new Error('Could not generate user displayName from mapping:' + userDisplayNameFormat);
	}

	var userEmailFormat = idProviderConfig.user && idProviderConfig.user.email || '${upn}';
	var userEmail = valueFromFormat({
		format: userEmailFormat,
		data:   params.jwt.payload
	});

	if(!userEmail) {
		throw new Error('Could not generate user email from mapping:' + userEmailFormat);
	}

	var user = createOrModify({
		name:        userName,
		displayName: userDisplayName,
		email:       userEmail,
		userStore:   getUserStoreKey()
	});

	enrichProfileFromJwt({
		key: user.key,
		jwt: params.jwt
	});

	return user;
}; // createOrUpdateFromJwt


exports.debugAllUsers = function() {
	var findUsersResult = runAsAdmin(function() {
		return findUsers({
			count: -1,
			includeProfile: true,
			query: '',
		});
	});
	log.debug('findUsersResult:' + toStr(findUsersResult)); // Does not show profile?
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
