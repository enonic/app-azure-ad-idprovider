const test = require('/lib/xp/testing');
const testUtils = require('/testUtils');

let getIdProviderConfigWasRun;
test.mock(
  "/lib/xp/auth",
  {
    getIdProviderConfig: () => {
      getIdProviderConfigWasRun = true;
      return {
        configOrigin: "data layer (/lib/xp/auth)",
        wasRun: true
      }
    }
  }
);

test.mock("/lib/xp/portal", {
  getIdProviderKey: () => 'mockIdProvider'
});


const updateConfigFileMocks = testUtils.mockAndGetUpdaterFunc(
  "/lib/configFile/configFile.js",
  {
    getConfigForIdProvider: () => null // (idProviderName) => mocks.configFile.getConfigForIdProvider(idProviderName)
  }
);


// Require the lib under test after mocking what it uses:
const lib = require('./config');


exports.test_getIdProviderConfig_fromFile_whenConfigFileReturnsSomething = () => {
  getIdProviderConfigWasRun = false;
  updateConfigFileMocks({
    getConfigForIdProvider: () => ({
      configStemsFrom: ".cfg file"
    })
  });

  const idProviderConfig = lib.getIdProviderConfig();

  test.assertEquals(".cfg file", idProviderConfig.configStemsFrom);
  test.assertEquals(undefined, idProviderConfig.configOrigin);
  test.assertFalse(getIdProviderConfigWasRun);
}



exports.test_getIdProviderConfig_fromDataLayer_whenConfigFileReturnsNull = () => {
  getIdProviderConfigWasRun = false;
  updateConfigFileMocks({
    getConfigForIdProvider: () => null
  });

  const idProviderConfig = lib.getIdProviderConfig();

  test.assertEquals("data layer (/lib/xp/auth)", idProviderConfig.configOrigin);
  test.assertEquals(undefined, idProviderConfig.configStemsFrom);
  test.assertTrue(getIdProviderConfigWasRun);
}



exports.test_getIdProviderConfig_fromDataLayer_whenConfigFileReturnsUndefined = () => {
  getIdProviderConfigWasRun = false;
  updateConfigFileMocks({
    getConfigForIdProvider: () => undefined
  });

  const idProviderConfig = lib.getIdProviderConfig();

  test.assertEquals("data layer (/lib/xp/auth)", idProviderConfig.configOrigin);
  test.assertEquals(undefined, idProviderConfig.configStemsFrom);
  test.assertTrue(getIdProviderConfigWasRun);
}
