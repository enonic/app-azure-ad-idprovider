const CONFIG_DEFAULTS = {
  logoutUrl:
    "https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A8080%2F",
  user: {
    name: "${oid}",
    displayName: "${given_name} ${family_name} <${upn}>",
    email: "${upn}",
  },
} as const;

export function getDefaults(): typeof CONFIG_DEFAULTS {
  return CONFIG_DEFAULTS;
}
