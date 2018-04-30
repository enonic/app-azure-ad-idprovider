/**
 * auth.group module.
 * @module lib/adfs-id-provider/auth/group
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
var lib = {
    adfsIdProvider: {
        array: require('/lib/adfs-id-provider/array'),
        auth: {
            sanitizeName: require('/lib/adfs-id-provider/auth/sanitizeName'),
            user: require('/lib/adfs-id-provider/auth/user')
        },
        context: require('/lib/adfs-id-provider/context'),
        object: require('/lib/adfs-id-provider/object')
    },
    xp: {
        auth: require('/lib/xp/auth'),
        portal: require('/lib/xp/portal')
    }
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
var inFirstButNotInSecond = lib.adfsIdProvider.array.inFirstButNotInSecond;
var runAsAdmin = lib.adfsIdProvider.context.runAsAdmin;
var isSet = lib.adfsIdProvider.object.isSet;
var toStr = lib.adfsIdProvider.object.toStr;
var valueFromFormat = lib.adfsIdProvider.object.valueFromFormat;
var sanitizeName = lib.adfsIdProvider.auth.sanitizeName.sanitizeName;
var getGroups = lib.adfsIdProvider.auth.user.getGroups;
var addMembers = lib.xp.auth.addMembers;
var createGroup = lib.xp.auth.createGroup;
var findPrincipals = lib.xp.auth.findPrincipals;
var getIdProviderConfig = lib.xp.auth.getIdProviderConfig;
var getMembers = lib.xp.auth.getMembers;
//var getMemberships        = lib.xp.auth.getMemberships;
var getPrincipal = lib.xp.auth.getPrincipal;
var modifyGroup = lib.xp.auth.modifyGroup;
var removeMembers = lib.xp.auth.removeMembers;

//──────────────────────────────────────────────────────────────────────────────
// auth.group methods
//──────────────────────────────────────────────────────────────────────────────

/**
 * Creates or modifies a group and returns the group.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.displayName
 * @param {string} params.description
 * @param {string} params.userStore
 * @returns {user}
 */
function createOrModify(params) {
    log.debug('createOrModify(' + toStr(params) + ')');

    var group = runAsAdmin(function () {
        return getPrincipal('group:' + params.userStore + ':' + params.name);
    });
    //log.debug('getPrincipalResult:' + toStr(group));

    if (group) {
        if (group.displayName === params.displayName && group.description === params.description) {
            log.debug('unchanged group:' + toStr(group));
        } else {
            group = modifyGroup({
                key: group._id,
                editor: function (c) {
                    c.displayName = params.displayName;
                    c.description = params.description;
                    return c;
                }
            });
            log.debug('modified group:' + toStr(group));
        }
    } else {
        runAsAdmin(function () {
            group = createGroup(params);
        });
        log.debug('created group:' + toStr(group));
    }
    return group;
}; // function createOrModify
exports.createOrModify = createOrModify;


/**
 * Adds a user to a group.
 * @param {Object} params
 * @param {string} params.groupKey
 * @param {string} params.userKey
 * @returns {undefined}
 */
function addUser(params) {
    log.debug('addUser(' + toStr(params) + ')');
    //getMembers(params.groupKey)
    //getMemberships(params.userKey)

    var addMembersResult = runAsAdmin(function () {
        return addMembers(params.groupKey, [params.userKey]);
    });
    log.debug('addMembersResult:' + toStr(addMembersResult)); // In Enonic XP 6.9.2 return undefined even if group is unmodified
};
exports.addUser = addUser;


/**
 * Removed a user from a group.
 * @param {Object} params
 * @param {string} params.groupKey
 * @param {string} params.userKey
 * @returns {undefined}
 */
function removeUser(params) {
    log.debug('removeUser(' + toStr(params) + ')');
    var removeMembersResult = runAsAdmin(function () {
        return removeMembers(params.groupKey, [params.userKey]);
    });
    log.debug('removeMembersResult:' + toStr(removeMembersResult));
};
exports.removeUser = removeUser;


/**
 * Creates and updates groups for a user based on the jwt.
 * @param {Object} params
 * @param {Object} params.jwt
 * @param {Object} params.user
 * @returns {}
 */
exports.createAndUpdateGroupsFromJwt = function (params) {

    var idProviderConfig = getIdProviderConfig();
    log.debug('idProviderConfig:' + toStr(idProviderConfig));

    var createAndUpdateGroupsOnLogin = !!idProviderConfig.createAndUpdateGroupsOnLogin;
    log.debug('createAndUpdateGroupsOnLogin:' + toStr(createAndUpdateGroupsOnLogin));

    if (!createAndUpdateGroupsOnLogin) {
        return;
    }
    var dnFormat = '${dn}';
    var dn = valueFromFormat({
        format: dnFormat,
        data: params.jwt.payload
    });
    if (!dn) {
        throw new Error('Could not generate dn from mapping:' + dnFormat);
    }
    log.debug('dn:' + toStr(dn));

    var groupKeysInXp = getGroups(params.user.key).filter(function (group) {
        return group.description.startsWith('{"dn":'); // Only groups from AD
    }).map(function (group) {
        return group.key;
    });
    log.debug('groupKeysInXp:' + toStr(groupKeysInXp));

    var groupKeysinAd = [];

    var dnArray = [];
    var pathArray = [];
    dn.split(',').reverse().forEach(function (rdn) {
        var rdnParts = rdn.split('=', 2);
        log.debug('rdnParts:' + toStr(rdnParts));

        var rdnName = rdnParts[0];
        log.debug('rdnName:' + toStr(rdnName));

        var rdnValue = rdnParts[1]; // TODO: http://www.rlmueller.net/CharactersEscaped.htm
        log.debug('rdnValue:' + toStr(rdnValue));

        if (rdnName !== 'CN') {
            dnArray.push(rdn);
            if (rdnName === 'OU') { // Not DC
                pathArray.push(rdnValue);

                var path = pathArray.join('/');
                var createOrModifyParams = {
                    name: sanitizeName(path),
                    displayName: path,
                    description: JSON.stringify({
                        dn: Array.prototype.slice.call(dnArray).reverse().join(',') // NOTE: Operate on a copy since reverse modifies in place.
                    }),
                    userStore: params.user.userStore
                }
                log.debug('createOrModifyParams:' + toStr(createOrModifyParams));

                // Process all groups in case the have changes.
                var group = createOrModify(createOrModifyParams);

                groupKeysinAd.push(group.key);
            } // if(rdnName !== 'CN')
        }
    });
    log.debug('groupKeysinAd:' + toStr(groupKeysinAd));

    var newGroupKeys = inFirstButNotInSecond(groupKeysinAd, groupKeysInXp);
    log.debug('newGroupKeys:' + toStr(newGroupKeys));

    var oldGroupKeys = inFirstButNotInSecond(groupKeysInXp, groupKeysinAd);
    log.debug('oldGroupKeys:' + toStr(oldGroupKeys));

    newGroupKeys.forEach(function (groupKey) {
        addUser({
            groupKey: groupKey,
            userKey: params.user.key
        });
    }); // newGroupKeys.forEach

    oldGroupKeys.forEach(function (groupKey) {
        removeUser({
            groupKey: groupKey,
            userKey: params.user.key
        });
        // Group may become empty, if syncing implemented could check if group still in AD FS.
    });

}; // createAndUpdateGroupsFromJwt


exports.debugAllGroups = function () {
    var findPrincipalsResult = runAsAdmin(function () {
        return findPrincipals({
            //start: 0,
            //count: 10,
            type: 'group',
            //userStore: 'adfs'
            //userStore: 'system'
        });
    });
    //log.debug('findPrincipalsResult:' + toStr(findPrincipalsResult));

    findPrincipalsResult.hits.forEach(function (group) {
        var getPrincipalResult = runAsAdmin(function () {
            return getPrincipal(group.key);
        });
        //log.debug('getPrincipalResult:' + toStr(getPrincipalResult)); // Does not show members

        var getMembersResult = runAsAdmin(function () {
            return getMembers(group.key)
        });
        log.debug('getMembers(' + group.key + ') --> ' + toStr(getMembersResult));
    });
};
