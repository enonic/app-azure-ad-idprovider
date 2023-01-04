const test = require('/lib/xp/testing');
const testUtils = require('/testUtils');

const updateConfigFileMocks = testUtils.mockAndGetUpdaterFunc(
  "/lib/configFile/configFile.js",
  {
    getConfigForIdProvider: () => null // (idProviderName) => mocks.configFile.getConfigForIdProvider(idProviderName)
  }
);

const updateAuthMocks = () => testUtils.mockAndGetUpdaterFunc(
  "/lib/xp/auth",
  {
    getIdProviderConfig: () => null
  }
);

test.mock("/lib/xp/portal", {
  getIdProviderKey: () => 'mockIdProvider'
});



// Require the lib under test after mocking what it uses:
