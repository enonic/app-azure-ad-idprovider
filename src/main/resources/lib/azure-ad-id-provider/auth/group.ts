/**
 * auth.group module.
 * @module lib/azure-ad-id-provider/auth/group
 */
import { forceArray } from "/lib/util/data";
import {
  addMembers,
  createGroup,
  modifyGroup,
  removeMembers,
  getPrincipal,
  type GroupKey,
  type UserKey,
  type Group,
  type CreateGroupParams,
  type User,
} from "/lib/xp/auth";
import { inFirstButNotInSecond } from "/lib/azure-ad-id-provider/array";
import { runAsAdmin } from "/lib/azure-ad-id-provider/context";
import { request as sendRequest, type HttpRequestParams } from "/lib/http-client";
import { toStr } from "../object";
import { sanitizeName } from "/lib/azure-ad-id-provider/auth/sanitizeName";
import { getIdProviderConfig, type GroupFilter } from "/lib/azure-ad-id-provider/config";
import { getGroups } from "/lib/azure-ad-id-provider/auth/user";
import type { Jwt } from "/lib/azure-ad-id-provider/jwt";

/**
 * Creates or modifies a group and returns the group.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.displayName
 * @param {string} params.description
 * @param {string} params.idProvider
 * @returns {user}
 */
export function createOrModify(params: CreateGroupParams & { displayName: string }): Group | null {
  log.debug("createOrModify(" + toStr(params) + ")");

  const group = runAsAdmin(() => getPrincipal(`group:${params.idProvider}:${params.name}`));

  if (group) {
    if (group.displayName === params.displayName && group.description === params.description) {
      log.debug("unchanged group:" + toStr(group));
      return group;
    } else {
      return runAsAdmin(() =>
        modifyGroup({
          key: group.key,
          editor: function (c) {
            c.displayName = params.displayName;
            c.description = params.description ?? "";
            return c;
          },
        }),
      );
    }
  } else {
    return runAsAdmin(() => createGroup(params));
  }
}

/**
 * Adds a user to a group.
 * @param {Object} params
 * @param {string} params.groupKey
 * @param {string} params.userKey
 * @returns {undefined}
 */
export function addUser(params: { groupKey: GroupKey; userKey: UserKey }): void {
  runAsAdmin(() => {
    addMembers(params.groupKey, [params.userKey]);
  });
}

/**
 * Removed a user from a group.
 * @param {Object} params
 * @param {string} params.groupKey
 * @param {string} params.userKey
 * @returns {undefined}
 */
export function removeUser(params: { groupKey: GroupKey; userKey: UserKey }): void {
  runAsAdmin(() => {
    removeMembers(params.groupKey, [params.userKey]);
  });
}

type CreateAndUpdateGroupsFromJwtParams = {
  jwt: Jwt;
  user: User;
  accessToken: string;
};

/**
 * Creates and updates groups for a user based on the jwt.
 * @param {Object} params
 * @param {Object} params.jwt
 * @param {Object} params.user
 * @returns {}
 */
export function createAndUpdateGroupsFromJwt(params: CreateAndUpdateGroupsFromJwtParams): void {
  const idProviderConfig = getIdProviderConfig();
  log.debug("idProviderConfig:" + toStr(idProviderConfig));

  const createAndUpdateGroupsOnLoginFromGraphApi = !!idProviderConfig.createAndUpdateGroupsOnLoginFromGraphApi;
  log.debug("createAndUpdateGroupsOnLoginFromGraphApi:" + toStr(createAndUpdateGroupsOnLoginFromGraphApi));

  if (createAndUpdateGroupsOnLoginFromGraphApi) {
    fromGraph(params);
    return;
  }
}

// get groups from graph api
function fromGraph(params: CreateAndUpdateGroupsFromJwtParams): void {
  const idProviderConfig = getIdProviderConfig();
  // https://docs.microsoft.com/en-us/graph/api/user-list-memberof?view=graph-rest-1.0&tabs=cs
  // https://developer.microsoft.com/en-us/graph/graph-explorer?request=me/memberOf&method=GET&version=v1.0&GraphUrl=https://graph.microsoft.com

  const pageSize = idProviderConfig.pageSize ? "?$top=" + idProviderConfig.pageSize : "";

  const groupRequest: HttpRequestParams = {
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

  const body = JSON.parse(groupResponse.body ?? "{}") as { value: unknown };
  if (body?.value) {
    // find users current ad groups
    const groupKeysInXp: GroupKey[] = getGroups(params.user.key)
      .filter((group) => {
        return group.key.startsWith(`group:${params.user.idProvider}:azure-ad-`); // Only groups from AD
      })
      .map((group) => group.key);

    // create or modify groups and add the user to the group
    let groups = body.value as Record<string, string>[];

    // filter groups
    if (idProviderConfig.groupFilter) {
      const groupFilters = forceArray(idProviderConfig.groupFilter);
      const checkGroups = groupFilters.reduce<Array<Array<GroupFilter>>>(
        (t, f) => {
          f.parsedRegExp = new RegExp(f.regexp);
          if (f.and || t[t.length - 1].length === 0) {
            t[t.length - 1].push(f);
          } else {
            t.push([f]);
          }
          return t;
        },
        [[]],
      );

      log.debug("groupFilters:" + toStr(checkGroups));

      groups = groups.reduce<Record<string, string>[]>((filteredGroups, group) => {
        for (let i = 0; i < checkGroups.length; i++) {
          const checkGroup = checkGroups[i];
          let match = false;
          for (let j = 0; j < checkGroup.length; j++) {
            const filter = checkGroup[j];
            if (filter.parsedRegExp?.test(group[filter.groupProperty])) {
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

    const groupKeysinAd: GroupKey[] = [];
    groups.forEach((adGroup) => {
      const xpGroup = createOrModify({
        idProvider: params.user.idProvider,
        name: sanitizeName("azure-ad-" + adGroup.id),
        displayName: adGroup.displayName,
        description: adGroup.description,
      });

      if (xpGroup?.key) {
        groupKeysinAd.push(xpGroup.key);
      }
    });
    log.debug("groupKeysinAd:" + toStr(groupKeysinAd));

    const newGroupKeys = inFirstButNotInSecond(groupKeysinAd, groupKeysInXp);
    log.debug("newGroupKeys:" + toStr(newGroupKeys));

    const oldGroupKeys = inFirstButNotInSecond(groupKeysInXp, groupKeysinAd);
    log.debug("oldGroupKeys:" + toStr(oldGroupKeys));

    newGroupKeys.forEach((groupKey) => {
      addUser({
        groupKey: groupKey,
        userKey: params.user.key,
      });
    });

    oldGroupKeys.forEach((groupKey) => {
      removeUser({
        groupKey: groupKey,
        userKey: params.user.key,
      });
    });
  } else {
    log.info("Could not load and create groups on login, turn on debug to see more infomation");
  }
}
