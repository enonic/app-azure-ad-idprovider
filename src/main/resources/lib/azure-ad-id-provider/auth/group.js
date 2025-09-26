/**
 * auth.group module.
 * @module lib/azure-ad-id-provider/auth/group
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
const lib = {
  azureAdIdProvider: {
    array: require("/lib/azure-ad-id-provider/array"),
    auth: {
      sanitizeName: require("/lib/azure-ad-id-provider/auth/sanitizeName"),
      user: require("/lib/azure-ad-id-provider/auth/user"),
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
    httpClient: require("/lib/http-client"),
  },
  config: require("/lib/azure-ad-id-provider/config"),
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
const inFirstButNotInSecond = lib.azureAdIdProvider.array.inFirstButNotInSecond;
const runAsAdmin = lib.azureAdIdProvider.context.runAsAdmin;
const toStr = lib.azureAdIdProvider.object.toStr;
const sanitizeName = lib.azureAdIdProvider.auth.sanitizeName.sanitizeName;
const getGroups = lib.azureAdIdProvider.auth.user.getGroups;
const addMembers = lib.xp.auth.addMembers;
const createGroup = lib.xp.auth.createGroup;
const getIdProviderConfig = lib.config.getIdProviderConfig;
const getPrincipal = lib.xp.auth.getPrincipal;
const modifyGroup = lib.xp.auth.modifyGroup;
const removeMembers = lib.xp.auth.removeMembers;
const sendRequest = lib.xp.httpClient.request;
const forceArray = lib.enonic.util.data.forceArray;

//──────────────────────────────────────────────────────────────────────────────
// auth.group methods
//──────────────────────────────────────────────────────────────────────────────

/**
 * Creates or modifies a group and returns the group.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.displayName
 * @param {string} params.description
 * @param {string} params.idProvider
 * @returns {user}
 */
function createOrModify(params) {
  log.debug("createOrModify(" + toStr(params) + ")");

  let group = runAsAdmin(function () {
    return getPrincipal("group:" + params.idProvider + ":" + params.name);
  });
  //log.debug('getPrincipalResult:' + toStr(group));

  if (group) {
    if (group.displayName === params.displayName && group.description === params.description) {
      log.debug("unchanged group:" + toStr(group));
    } else {
      group = runAsAdmin(function () {
        return modifyGroup({
          key: group.key,
          editor: function (c) {
            c.displayName = params.displayName;
            c.description = params.description || "";
            return c;
          },
        });
      });
      log.debug("modified group:" + toStr(group));
    }
  } else {
    runAsAdmin(function () {
      group = createGroup(params);
    });
    log.debug("created group:" + toStr(group));
  }
  return group;
} // function createOrModify
exports.createOrModify = createOrModify;

/**
 * Adds a user to a group.
 * @param {Object} params
 * @param {string} params.groupKey
 * @param {string} params.userKey
 * @returns {undefined}
 */
function addUser(params) {
  const addMembersResult = runAsAdmin(function () {
    return addMembers(params.groupKey, [params.userKey]);
  });
  log.debug("addMembersResult:" + toStr(addMembersResult)); // In Enonic XP 6.9.2 return undefined even if group is unmodified
}
exports.addUser = addUser;

/**
 * Removed a user from a group.
 * @param {Object} params
 * @param {string} params.groupKey
 * @param {string} params.userKey
 * @returns {undefined}
 */
function removeUser(params) {
  log.debug("removeUser(" + toStr(params) + ")");
  const removeMembersResult = runAsAdmin(function () {
    return removeMembers(params.groupKey, [params.userKey]);
  });
  log.debug("removeMembersResult:" + toStr(removeMembersResult));
}
exports.removeUser = removeUser;

/**
 * Creates and updates groups for a user based on the jwt.
 * @param {Object} params
 * @param {Object} params.jwt
 * @param {Object} params.user
 * @returns {}
 */
exports.createAndUpdateGroupsFromJwt = function (params) {
  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  const createAndUpdateGroupsOnLoginFromGraphApi = !!idProviderConfig.createAndUpdateGroupsOnLoginFromGraphApi;
  log.debug("createAndUpdateGroupsOnLoginFromGraphApi:" + toStr(createAndUpdateGroupsOnLoginFromGraphApi));

  if (createAndUpdateGroupsOnLoginFromGraphApi) {
    return fromGraph(params);
  }
}; // createAndUpdateGroupsFromJwt

// get groups from graph api
function fromGraph(params) {
  const idProviderConfig = getIdProviderConfig();
  // https://docs.microsoft.com/en-us/graph/api/user-list-memberof?view=graph-rest-1.0&tabs=cs
  // https://developer.microsoft.com/en-us/graph/graph-explorer?request=me/memberOf&method=GET&version=v1.0&GraphUrl=https://graph.microsoft.com

  const pageSize = idProviderConfig.pageSize ? "?$top=" + idProviderConfig.pageSize : "";

  const groupRequest = {
    method: "GET",
    url: "https://graph.microsoft.com/v1.0/users/" + params.jwt.payload.oid + "/memberOf" + pageSize,
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + params.accessToken,
    },
    proxy: idProviderConfig.proxy,
  };

  log.debug("createAndUpdateGroupsOnLoginFromGraphApi request: " + toStr(groupRequest));

  const groupResponse = sendRequest(groupRequest);
  log.debug("createAndUpdateGroupsOnLoginFromGraphApi response: " + toStr(groupResponse));

  const body = JSON.parse(groupResponse.body);
  if (body && body.value) {
    // find users current ad groups
    const groupKeysInXp = getGroups(params.user.key)
      .filter(function (group) {
        return group.key.startsWith("group:" + params.user.idProvider + ":azure-ad-"); // Only groups from AD
      })
      .map(function (group) {
        return group.key;
      });

    // create or modify groups and add the user to the group
    let groups = body.value;

    // filter groups
    if (idProviderConfig.groupFilter) {
      const groupFilters = forceArray(idProviderConfig.groupFilter);
      const checkGroups = groupFilters.reduce(
        (t, f) => {
          f.regexp = new RegExp(f.regexp);
          if (f.and === true || t[t.length - 1].length === 0) {
            t[t.length - 1].push(f);
          } else {
            t.push([f]);
          }
          return t;
        },
        [[]],
      );

      log.debug("groupFilters:" + toStr(checkGroups));

      groups = groups.reduce((filteredGroups, group) => {
        for (let i = 0; i < checkGroups.length; i++) {
          const checkGroup = checkGroups[i];
          let match = false;
          for (let j = 0; j < checkGroup.length; j++) {
            const filter = checkGroup[j];
            if (filter.regexp.test(group[filter.groupProperty])) {
              match = true;
            } else {
              match = false;
              break;
            }
          }
          if (match) {
            filteredGroups.push(group);
            break;
          }
        }
        return filteredGroups;
      }, []);
      log.debug("groupsAfterFilter:" + toStr(groups));
    }

    const groupKeysinAd = [];
    groups.forEach(function (adGroup) {
      const xpGroup = createOrModify({
        idProvider: params.user.idProvider,
        name: sanitizeName("azure-ad-" + adGroup.id),
        displayName: adGroup.displayName,
        description: adGroup.description,
      });
      groupKeysinAd.push(xpGroup.key);
    });
    log.debug("groupKeysinAd:" + toStr(groupKeysinAd));

    const newGroupKeys = inFirstButNotInSecond(groupKeysinAd, groupKeysInXp);
    log.debug("newGroupKeys:" + toStr(newGroupKeys));

    const oldGroupKeys = inFirstButNotInSecond(groupKeysInXp, groupKeysinAd);
    log.debug("oldGroupKeys:" + toStr(oldGroupKeys));

    newGroupKeys.forEach(function (groupKey) {
      addUser({
        groupKey: groupKey,
        userKey: params.user.key,
      });
    });

    oldGroupKeys.forEach(function (groupKey) {
      removeUser({
        groupKey: groupKey,
        userKey: params.user.key,
      });
    });
  } else {
    log.info("Could not load and create groups on login, turn on debug to see more infomation");
  }
}
