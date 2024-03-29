const test = require('/lib/xp/testing');
const testUtils = require('/testUtils');



const updateConfigFileMocks = testUtils.mockAndGetUpdaterFunc(
  "/lib/configFile/configFile.js",
  {
    getAllIdProviderNames: null,
    shouldAutoInit: null,
    getConfigForIdProvider: null
  }
);
const updateBeanMocks = testUtils.mockAndGetUpdaterFunc(
  "/lib/configFile/services/bean.js",
  {
    getIdProviders: null,
    createIdProvider: null
  }
);



// Require the lib under test after mocking what it uses:
const lib = require('./initIDProvider');



/////////////////////////////////////////////

exports.test_initIDProvider_initUserStores_addOnlyNewIDPs_ifShouldAutoInit = () => {
    const CREATED_IDPS = {};
    let addedProviders = 0;

    updateConfigFileMocks({
        getAllIdProviderNames: () => ["myidp1", "myidp2", "myidp3", "myidp4"],
        shouldAutoInit: () => true,
        getConfigForIdProvider: (idProviderName) => ({
            displayName: "Mock " + idProviderName,
            description: "Mock description",
        })
    });

    updateBeanMocks({
        getIdProviders: () => [
            {
                "key": "myidp1",
                "displayName": "Mock idp1",
                "idProviderConfig": {
                    "applicationKey": "com.enonic.app.oidcidprovider",
                    "config": []
                }
            },
            {
                "key": "myidp2",
                "displayName": "Mock idp2",
                "idProviderConfig": {
                    "applicationKey": "com.enonic.app.oidcidprovider",
                    "config": []
                }
            }
        ],
        createIdProvider: (params) => {
            CREATED_IDPS[params.name] = params;
            addedProviders++;
            return true;
        }
    });

    lib.initUserStores();

    // Only myidp3 and -4 should have been added, since myidp1 and -2 are already in system repo,
    // according to the mocked getIdProviders:

    test.assertEquals(2, addedProviders);

    test.assertEquals(undefined, CREATED_IDPS['myidp1']);
    test.assertEquals(undefined, CREATED_IDPS['myidp2']);

    test.assertEquals("myidp3", CREATED_IDPS['myidp3'].name);
    test.assertEquals(app.name, CREATED_IDPS['myidp3'].idProviderConfig.applicationKey);
    test.assertTrue(Array.isArray(CREATED_IDPS['myidp3'].permissions));
    test.assertEquals(0, CREATED_IDPS['myidp3'].permissions.length);

    test.assertEquals("myidp4", CREATED_IDPS['myidp4'].name);
    test.assertEquals(app.name, CREATED_IDPS['myidp4'].idProviderConfig.applicationKey);
    test.assertTrue(Array.isArray(CREATED_IDPS['myidp4'].permissions));
    test.assertEquals(0, CREATED_IDPS['myidp4'].permissions.length);
};

exports.test_initIDProvider_initUserStores_addNoNewIDPs_ifNoAutoInit = () => {
    const CREATED_IDPS = {};
    let addedProviders = 0;

    updateConfigFileMocks({

        // The important difference:
        shouldAutoInit: () => false,

        getAllIdProviderNames: () => ["myidp1", "myidp2", "myidp3", "myidp4"],
        getConfigForIdProvider: (idProviderName) => ({
            displayName: "Mock " + idProviderName,
            description: "Mock description",
        })
    });

    updateBeanMocks({
        getIdProviders: () => [
            {
                "key": "myidp1",
                "displayName": "Mock idp1",
                "idProviderConfig": {
                    "applicationKey": "com.enonic.app.oidcidprovider",
                    "config": []
                }
            },
            {
                "key": "myidp2",
                "displayName": "Mock idp2",
                "idProviderConfig": {
                    "applicationKey": "com.enonic.app.oidcidprovider",
                    "config": []
                }
            }
        ],
        createIdProvider: (params) => {
            CREATED_IDPS[params.name] = params;
            addedProviders++;
            return true;
        }
    });

    lib.initUserStores();

    //  myidp1 and myidp2 are already in system repo,
    // but shouldAutoInit = false (mocked), so nothing's created:

    test.assertEquals(0, addedProviders);

    test.assertEquals(undefined, CREATED_IDPS['myidp1']);
    test.assertEquals(undefined, CREATED_IDPS['myidp2']);
    test.assertEquals(undefined, CREATED_IDPS['myidp3']);
    test.assertEquals(undefined, CREATED_IDPS['myidp4']);
};


