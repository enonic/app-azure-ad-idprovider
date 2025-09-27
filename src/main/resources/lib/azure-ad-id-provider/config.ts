import { getIdProviderConfig as getIdProviderConfigAuth } from "/lib/xp/auth";
import { getIdProviderKey } from "/lib/xp/portal";
import { getConfigForIdProvider } from "/lib/configFile/configFile";
import type { HttpRequestParams } from "/lib/http-client";

export type GroupFilter = {
  regexp: string;
  parsedRegExp?: RegExp;
  and: boolean;
  groupProperty: string;
};

export type IdProviderConfig = {
  logoutUrl: string;
  pageSize: string;
  createAndUpdateGroupsOnLoginFromGraphApi: string | boolean;
  proxy?: HttpRequestParams["proxy"];
  clientId: string;
  tenantId: string;
  forceHttpsOnRedirectUri: string;
  clientSecret: string;
  groupFilter: GroupFilter[] | GroupFilter;
  user: {
    name: string;
    displayName: string;
    email: string;
  };
  profile: {
    from: string;
    to: string;
  }[];
};

export function getIdProviderConfig(): IdProviderConfig {
  return (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (getConfigForIdProvider(getIdProviderKey()) as IdProviderConfig) ?? getIdProviderConfigAuth<IdProviderConfig>()!
  );
}
