//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
var lib = {
  configFile: require('/lib/configFile/configFile'),
  xp: {
    auth:       require('/lib/xp/auth'),
    portal:     require('/lib/xp/portal')
  }
};

var getIdProviderConfig = function () {
  var idProviderName = lib.xp.portal.getIdProviderKey();
  var idProviderConfig = lib.configFile.getConfigForIdProvider(idProviderName) || lib.xp.auth.getIdProviderConfig();
  return idProviderConfig;
};
exports.getIdProviderConfig = getIdProviderConfig;
