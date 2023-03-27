const test = require('/lib/xp/testing');
const testUtils = require('/testUtils');



const updateGetDefaultsMock = testUtils.mockAndGetUpdaterFunc(
  "/lib/configFile/defaults.js",
  {
    getDefaults: () => ({
      defaults: "Mock",
    })
  }
);
const setMockDefaultsReturn = (defaultsToReturn) => updateGetDefaultsMock({
  getDefaults: () => defaultsToReturn
});


const lib = require('./defaultsProvider');




/////////////////////////////////



exports.test_defaultsProvider_addMissingValuesToConfig = () => {
  setMockDefaultsReturn({
    default1: "def one",
    default2: "def two",
  });
  const result = lib.withDefaults({
    config1: "conf one",
    config2: "conf two",
  });

  test.assertEquals(`{
    "config1": "conf one",
    "config2": "conf two",
    "default1": "def one",
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
};


exports.test_defaultsProvider_keepConfigValues = () => {
  setMockDefaultsReturn({
    matchingKey: "default not needed, there is one in the config",
    default2: "def two",
  });
  const result = lib.withDefaults({
    matchingKey: "KEEP THE CONFIG ONE",
    config2: "conf two",
  });

  test.assertEquals(`{
    "matchingKey": "KEEP THE CONFIG ONE",
    "config2": "conf two",
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
};


exports.test_defaultsProvider_overwriteConfigUndefined = () => {
  setMockDefaultsReturn({
    matchingKey: "OVERWRITE SINCE CONFIG IS UNDEFINED",
    default2: "def two",
  });
  const result = lib.withDefaults({
    matchingKey: undefined,
    config2: "conf two",
  });

  test.assertEquals(`{
    "matchingKey": "OVERWRITE SINCE CONFIG IS UNDEFINED",
    "config2": "conf two",
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
};


exports.test_defaultsProvider_overwriteConfigNull = () => {
  setMockDefaultsReturn({
    matchingKey: "OVERWRITE SINCE CONFIG IS NULL",
    default2: "def two",
  });
  const result = lib.withDefaults({
    matchingKey: null,
    config2: "conf two",
  });

  test.assertEquals(`{
    "matchingKey": "OVERWRITE SINCE CONFIG IS NULL",
    "config2": "conf two",
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
};




exports.test_defaultsProvider_keepConfigZero = () => {
  setMockDefaultsReturn({
    matchingKey: "default not needed, there is valid 0 in the config",
    default2: "def two",
  });
  const result = lib.withDefaults({
    matchingKey: 0,
    config2: "conf two",
  });

  test.assertEquals(`{
    "matchingKey": 0,
    "config2": "conf two",
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
};

exports.test_defaultsProvider_keepConfigEmptyString = () => {
  setMockDefaultsReturn({
    matchingKey: "default not needed, there is valid emptystring in the config",
    default2: "def two",
  });
  const result = lib.withDefaults({
    matchingKey: "",
    config2: "conf two",
  });

  test.assertEquals(`{
    "matchingKey": "",
    "config2": "conf two",
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
};


exports.test_defaultsProvider_addMissingObjectToConfig = () => {
  setMockDefaultsReturn({
    default1: "def one",
    default2: {
      def3: "three",
      def4: "four"
    },
  });
  const result = lib.withDefaults({
    config1: "conf one",
    config2: "conf two",
  });

  test.assertEquals(`{
    "config1": "conf one",
    "config2": "conf two",
    "default1": "def one",
    "default2": {
        "def3": "three",
        "def4": "four"
    }
}`, JSON.stringify(result, null, 4));
};



exports.test_defaultsProvider_addMissingArrayToConfig = () => {
  setMockDefaultsReturn({
    default1: "def one",
    default2: ["three", "four"],
  });
  const result = lib.withDefaults({
    config1: "conf one",
    config2: "conf two",
  });

  test.assertEquals(`{
    "config1": "conf one",
    "config2": "conf two",
    "default1": "def one",
    "default2": [
        "three",
        "four"
    ]
}`, JSON.stringify(result, null, 4));
};



exports.test_defaultsProvider_addMissingSubentriesToConfigArray = () => {
  setMockDefaultsReturn({
    matchingKey: ["three", "four"],
    default2: "def two"
  });
  const result = lib.withDefaults({
    matchingKey: ["five", "four"],
    config2: "conf two",
  });

  test.assertEquals(`{
    "matchingKey": [
        "five",
        "four",
        "three"
    ],
    "config2": "conf two",
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
};



exports.test_defaultsProvider_addMissingSubentriesToConfigObject = () => {
  setMockDefaultsReturn({
    matchingKey: {
      first: "Ignore this since 'first' already has another value in config",
      third: 3
    },
    default2: "def two"
  });
  const result = lib.withDefaults({
    matchingKey: {
      first: 1,
      second: 2
    },
    config2: "conf two",
  });

  test.assertEquals(`{
    "matchingKey": {
        "first": 1,
        "second": 2,
        "third": 3
    },
    "config2": "conf two",
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
};



exports.test_defaultsProvider_overwriteEmptyConfig_null = () => {
  setMockDefaultsReturn({
    default1: {
      first: 1,
      second: 2
    },
    default2: "def two"
  });
  const result = lib.withDefaults(null);

  test.assertEquals(`{
    "default1": {
        "first": 1,
        "second": 2
    },
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
}


exports.test_defaultsProvider_overwriteEmptyConfig_undefined = () => {
  setMockDefaultsReturn({
    default1: {
      first: 1,
      second: 2
    },
    default2: "def two"
  });
  const result = lib.withDefaults(undefined);

  test.assertEquals(`{
    "default1": {
        "first": 1,
        "second": 2
    },
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
}


exports.test_defaultsProvider_overwriteEmptyConfig_empty = () => {
  setMockDefaultsReturn({
    default1: {
      first: 1,
      second: 2
    },
    default2: "def two"
  });
  const result = lib.withDefaults({});

  test.assertEquals(`{
    "default1": {
        "first": 1,
        "second": 2
    },
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
}



exports.test_defaultsProvider_overwriteEmptyConfig_wrong = () => {
  setMockDefaultsReturn({
    default1: {
      first: 1,
      second: 2
    },
    default2: "def two"
  });
  const result = lib.withDefaults("Config should have been an object");

  test.assertEquals(`{
    "default1": {
        "first": 1,
        "second": 2
    },
    "default2": "def two"
}`, JSON.stringify(result, null, 4));
}


exports.test_defaultsProvider_ignoreEmptyDefault_null = () => {
  setMockDefaultsReturn(null);
  const result = lib.withDefaults({
    config1: {
      first: 1,
      second: 2
    },
    config2: "conf two"
  });

  test.assertEquals(`{
    "config1": {
        "first": 1,
        "second": 2
    },
    "config2": "conf two"
}`, JSON.stringify(result, null, 4));
}


exports.test_defaultsProvider_ignoreEmptyDefault_undefined = () => {
  setMockDefaultsReturn(undefined);
  const result = lib.withDefaults({
    config1: {
      first: 1,
      second: 2
    },
    config2: "conf two"
  });

  test.assertEquals(`{
    "config1": {
        "first": 1,
        "second": 2
    },
    "config2": "conf two"
}`, JSON.stringify(result, null, 4));
}


exports.test_defaultsProvider_ignoreEmptyDefault_empty = () => {
  setMockDefaultsReturn({});
  const result = lib.withDefaults({
    config1: {
      first: 1,
      second: 2
    },
    config2: "conf two"
  });

  test.assertEquals(`{
    "config1": {
        "first": 1,
        "second": 2
    },
    "config2": "conf two"
}`, JSON.stringify(result, null, 4));
}


exports.test_defaultsProvider_ignoreEmptyDefault_wrong = () => {
  setMockDefaultsReturn("Defaults should have been an object");
  const result = lib.withDefaults({
    config1: {
      first: 1,
      second: 2
    },
    config2: "conf two"
  });

  test.assertEquals(`{
    "config1": {
        "first": 1,
        "second": 2
    },
    "config2": "conf two"
}`, JSON.stringify(result, null, 4));
}
