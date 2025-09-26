//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
const lib = {
  configFile: require("/lib/configFile/configFile"),
  xp: {
    auth: require("/lib/xp/auth"),
    portal: require("/lib/xp/portal"),
  },
};

const getIdProviderConfig = function () {
  const idProviderName = lib.xp.portal.getIdProviderKey();
  const idProviderConfig = lib.configFile.getConfigForIdProvider(idProviderName) || lib.xp.auth.getIdProviderConfig();
  return idProviderConfig;
};
exports.getIdProviderConfig = getIdProviderConfig;
