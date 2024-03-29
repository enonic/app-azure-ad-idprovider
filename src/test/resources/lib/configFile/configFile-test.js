const test = require('/lib/xp/testing');
const testUtils = require('/testUtils');


const updateGetConfigMock = testUtils.mockAndGetUpdaterFunc(
  "/lib/configFile/services/getConfig.js",
  {
    getConfigOrEmpty: null
  }
);
const setMockConfigReturn = (configToReturn) => updateGetConfigMock({
  getConfigOrEmpty: () => configToReturn
});


testUtils.mockAndGetUpdaterFunc(
  "/lib/configFile/defaults.js",
  {
    getDefaults: () => ({
      defaults: "Mock added",
    })
  }
);




// Require the lib under test after mocking what it uses:
const lib = require('./configFile');




/////////////////////////

exports.test_configFile_shouldAutoInit_trueBool = () => {
    setMockConfigReturn({
        autoinit: true,
        somethingElse: "1"
    });
    test.assertTrue(lib.shouldAutoInit());
}

exports.test_configFile_shouldAutoInit_trueString = () => {
    setMockConfigReturn({
        autoinit: "true",
        somethingElse: "2"
    });
    test.assertTrue(lib.shouldAutoInit());
}

exports.test_configFile_shouldAutoInit_falseBool = () => {
    setMockConfigReturn({
        autoinit: false,
        somethingElse: "3"
    });
    test.assertFalse(lib.shouldAutoInit());
}

exports.test_configFile_shouldAutoInit_falseString = () => {
    setMockConfigReturn({
        autoinit: "false",
        somethingElse: "4"
    });
    test.assertFalse(lib.shouldAutoInit());
}

exports.test_configFile_shouldAutoInit_falseMissing = () => {
    setMockConfigReturn({
        somethingElse: "5"
    });
    test.assertFalse(lib.shouldAutoInit());
}

exports.test_configFile_shouldAutoInit_falseEmpty = () => {
    setMockConfigReturn({});
    test.assertFalse(lib.shouldAutoInit());
}



///////////////////////////////////

exports.test_configFile_getAllIdProviderNames_some = () => {

    setMockConfigReturn({
        // myidp1 will be ignored b/c wrong 'idprovider' namespace
        'irrelevant.myidp1.field': 'someValue',

        'idprovider.myidp2.firstField': 'firstValue',
        'idprovider.myidp2.second.field': 'secondValue',

        'idprovider.myidp3.firstField': 'thirdValue',
    });

    const result = lib.getAllIdProviderNames();

    test.assertTrue(Array.isArray(result));
    test.assertEquals(2, result.length);
    test.assertTrue(result.indexOf('myidp2') > -1);
    test.assertTrue(result.indexOf('myidp3') > -1);
}



exports.test_configFile_getAllIdProviderNames_none = () => {

    setMockConfigReturn({
        // All keys are outside of idprovider namespace, so they are ignored
        autoinit: true,
        'irrelevant.myidp1': 'someValue',
        'idprovidermyidp2.firstField': 'firstValue',
        'idprov.ider.myidp2.second.field': 'secondValue',
        'idprovidr.myidp3.firstField': 'thirdValue',
    });

    const result = lib.getAllIdProviderNames();

    test.assertTrue(Array.isArray(result));
    test.assertEquals(0, result.length);
}



///////////////////////////////////

exports.test_configFile_getFileConfigSubTree_actualKey = () => {

    setMockConfigReturn({
        autoinit: true,

        'something.target.subkey': 'targetValue',  // <-- Target this value

        'another.firstField': 'firstValue',
        'another.sub.myidp2.second.field': 'secondValue',
        'yetanother.myidp3.firstField': 'thirdValue',
    });

    const allConfigKeys = [
        'autoinit',
        'something.target.subkey',
        'another.firstField',
        'another.sub.myidp2.second.field',
        'yetanother.myidp3.firstField'
    ];
    const currentKey = 'something.target.subkey';
    const currentFieldIndex = 2;
    const parsingCallbacks = {};

    const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);
    test.assertEquals('targetValue', result);
}

exports.test_configFile_getFileConfigSubTree_actualKeyEmpty = () => {

    setMockConfigReturn({
        autoinit: true,

        'something.target.subkey': '',  // <-- Target this value

        'another.firstField': 'firstValue',
        'another.sub.myidp2.second.field': 'secondValue',
        'yetanother.myidp3.firstField': 'thirdValue',
    });

    const allConfigKeys = [
        'autoinit',
        'something.target.subkey',
        'another.firstField',
        'another.sub.myidp2.second.field',
        'yetanother.myidp3.firstField'
    ];
    const currentKey = 'something.target.subkey';
    const currentFieldIndex = 2;
    const parsingCallbacks = {};

    const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);
    test.assertEquals('', result);
}


exports.test_configFile_getFileConfigSubTree_simpleSubkey = () => {
    setMockConfigReturn({
        autoinit: true,

        'something.target.subkey': 'targetValue',  // <-- Target something.target, expect an object: {subkey: targetValue}

        'another.firstField': 'firstValue',
        'another.sub.myidp2.second.field': 'secondValue',
        'yetanother.myidp3.firstField': 'thirdValue',
    });

    const allConfigKeys = [
        'autoinit',
        'something.target.subkey',
        'another.firstField',
        'another.sub.myidp2.second.field',
        'yetanother.myidp3.firstField'
    ];
    const currentKey = 'something.target';
    const currentFieldIndex = 1;
    const parsingCallbacks = {};

    const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);
    test.assertEquals(1, Object.keys(result).length);
    test.assertEquals('targetValue', result.subkey);
}

exports.test_configFile_getFileConfigSubTree_nestedSubkey = () => {

    setMockConfigReturn({
        autoinit: true,

        'something.target.subkey': 'targetValue',  // <-- Target 'something', expect an object: {target: {subkey: targetValue}}

        'another.firstField': 'firstValue',
        'another.sub.myidp2.second.field': 'secondValue',
        'yetanother.myidp3.firstField': 'thirdValue',
    });

    const allConfigKeys = [
        'autoinit',
        'something.target.subkey',
        'another.firstField',
        'another.sub.myidp2.second.field',
        'yetanother.myidp3.firstField'
    ];
    const currentKey = 'something';
    const currentFieldIndex = 0;
    const parsingCallbacks = {};

    const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);
    test.assertEquals(1, Object.keys(result).length);
    test.assertEquals(1, Object.keys(result.target).length);
    test.assertEquals('targetValue', result.target.subkey);
}

exports.test_configFile_getFileConfigSubTree_nestedSubTree = () => {

    setMockConfigReturn({
        autoinit: true,

        // Target 'something.target' and everything below it
        'something.target.firstkey': 'targetValue1',
        'something.target.secondkey.one': 'targetValue2.1',
        'something.target.secondkey.two.one': 'targetValue2.2.1',
        'something.target.secondkey.two.two': 'targetValue2.2.2',
        'something.target.secondkey.three': 'targetValue2.3',
        'something.target.thirdkey': 'targetValue3',

        'another.firstField': 'firstValue',
        'another.sub.myidp2.second.field': 'secondValue',
        'yetanother.myidp3.firstField': 'thirdValue',
    });

    const allConfigKeys = [
        'autoinit',
        'something.target.firstkey',
        'something.target.secondkey.one',
        'something.target.secondkey.two.one',
        'something.target.secondkey.two.two',
        'something.target.secondkey.three',
        'something.target.thirdkey',
        'another.firstField',
        'another.sub.myidp2.second.field',
        'yetanother.myidp3.firstField'
    ];
    const currentKey = 'something.target';
    const currentFieldIndex = 1;
    const parsingCallbacks = {};

    const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);

    // Expected: a tree object
    test.assertEquals(3, Object.keys(result).length);
    test.assertEquals(3, Object.keys(result.secondkey).length);
    test.assertEquals(2, Object.keys(result.secondkey.two).length);
    test.assertEquals('targetValue1', result.firstkey);
    test.assertEquals('targetValue2.1', result.secondkey.one);
    test.assertEquals('targetValue2.2.1', result.secondkey.two.one);
    test.assertEquals('targetValue2.2.2', result.secondkey.two.two);
    test.assertEquals('targetValue2.3', result.secondkey.three);
    test.assertEquals('targetValue3', result.thirdkey);
}

exports.test_configFile_getFileConfigSubTree_unmatching = () => {

    setMockConfigReturn({
        autoinit: true,

        'something.target.subkey': 'targetValue',  // <-- NOT targeted. Nothing is matched.

        'another.firstField': 'firstValue',
        'another.sub.myidp2.second.field': 'secondValue',
        'yetanother.myidp3.firstField': 'thirdValue',
    });

    const allConfigKeys = [
        'autoinit',
        'something.target.subkey',
        'another.firstField',
        'another.sub.myidp2.second.field',
        'yetanother.myidp3.firstField'
    ];
    const currentKey = 'something.else';
    const currentFieldIndex = 1;
    const parsingCallbacks = {};

    const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);

    // Expect empty object
    test.assertEquals(0, Object.keys(result).length);
}

exports.test_configFile_getFileConfigSubTree_emptyConfig = () => {
    setMockConfigReturn({});

    const allConfigKeys = [];
    const currentKey = '';
    const currentFieldIndex = 1;
    const parsingCallbacks = {};

    const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);

    // Expect empty object
    test.assertEquals(0, Object.keys(result).length);
}


exports.test_configFile_getFileConfigSubTree_errAmbiguous1 = () => {

    setMockConfigReturn({
        irrelevant1: "yes",

        'something.target.subkey': 'eclipsedValue',
        'something.target': 'overlaps with .subkey',

        irrelevant2: "yes",
    });

    const allConfigKeys = [
        'irrelevant1',
        'irrelevant2',
        'something.target.subkey',
        'something.target'
    ];
    const currentKey = 'something.target';
    const currentFieldIndex = 1;
    const parsingCallbacks = {};

    let failed = false;

    try {
        const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);
        log.error("Unexpected result: " + JSON.stringify(result));
    } catch (e) {
        failed = true;
    }

    // Expect an error since something.target has both a direct value and a subkey
    test.assertTrue(failed);
}

exports.test_configFile_getFileConfigSubTree_errAmbiguous2 = () => {

    setMockConfigReturn({
        irrelevant1: "yes",

        'something.target': 'overlaps with .subkey',
        'something.target.subkey': 'eclipsedValue',

        irrelevant2: "yes",
    });

    const allConfigKeys = [
        'irrelevant1',
        'irrelevant2',
        'something.target',
        'something.target.subkey'
    ];
    const currentKey = 'something.target';
    const currentFieldIndex = 1;
    const parsingCallbacks = {};

    let failed = false;

    try {
        const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);
        log.error("Unexpected result: " + JSON.stringify(result));
    } catch (e) {
        failed = true;
    }

    // Expect an error since something.target has both a direct value and a subkey
    test.assertTrue(failed);
}


exports.test_configFile_getFileConfigSubTree_errBadKey = () => {

    setMockConfigReturn({
        irrelevant1: "yes",

        'something.target.': 'targetValue',  // Key ends with dot

        irrelevant2: "yes",
    });

    const allConfigKeys = [
        'irrelevant1',
        'irrelevant2',
        'something.target.'
    ];
    const currentKey = 'something.target';
    const currentFieldIndex = 1;
    const parsingCallbacks = {};

    let failed = false;

    try {
        const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);
        log.error("Unexpected result: " + JSON.stringify(result));
    } catch (e) {
        failed = true;
    }

    // Expect an error since something.target has both a direct value and a subkey
    test.assertTrue(failed);
}


exports.test_configFile_getFileConfigSubTree_parsingCallback = () => {

    setMockConfigReturn({
        irrelephant: "yes",
        'something.target.subkey': 'targetValue',  // <-- Target and parse/change this value
    });

    const allConfigKeys = [
        'irrelephant',
        'something.target.subkey'
    ];
    const currentKey = 'something.target';
    const currentFieldIndex = 1;
    const parsingCallbacks = {
        '^something\.[a-zA-Z]+\.subkey$': (value) => `${value} is ${value}.`
    };

    const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);
    test.assertEquals(1, Object.keys(result).length);
    test.assertEquals('targetValue is targetValue.', result.subkey);
}


exports.test_configFile_getFileConfigSubTree_onlySpecificCallback = () => {

    setMockConfigReturn({
        irrelephant: "yes",
        'something.target.subkey': 'targetValue',  // <-- Target and parse/change this value
    });

    const allConfigKeys = [
        'irrelephant',
        'something.target.subkey'
    ];
    const currentKey = 'something.target';
    const currentFieldIndex = 1;
    const parsingCallbacks = {
        // Shouldn't kick here in since it applies only to something.target, not a subkey:
        '^something\.[a-zA-Z]+$': (value) => `${value} is ${value}.`
    };

    const result = lib.getFileConfigSubTree(allConfigKeys, currentKey, currentFieldIndex, parsingCallbacks);
    test.assertEquals(1, Object.keys(result).length);
    test.assertEquals('targetValue', result.subkey);
}




////////////////////////////////////

exports.test_configFile_getConfigForIdProvider_getMatchingConfigObject = () => {

  setMockConfigReturn({
      autoinit: true,

      // Target 'idprovider.target' and everything below it
      'idprovider.target.firstkey': 'targetValue1',
      'idprovider.target.secondkey.one': 'targetValue2.1',
      'idprovider.target.secondkey.two.one': 'targetValue2.2.1',
      'idprovider.target.secondkey.two.two': 'targetValue2.2.2',
      'idprovider.target.secondkey.three': 'targetValue2.3',
      'idprovider.target.thirdkey': 'targetValue3',

      // Ignore 'idprovider.another' and everything below it
      'idprovider.another.firstkey': 'ANOTHER1',
      'idprovider.another.secondkey.one': 'ANOTHER2.1',
      'idprovider.another.secondkey.two.one': 'ANOTHER2.2.1',
      'idprovider.another.secondkey.two.two': 'ANOTHER2.2.2',
      'idprovider.another.secondkey.three': 'ANOTHER2.3',
      'idprovider.another.thirdkey': 'ANOTHER3',

      // Ignore *.target outside of the 'idprovider' namespace
      'no.target.firstkey': 'NOTARGET1',
      'no.target.secondkey.one': 'NOTARGET2.1',
      'no.target.secondkey.two.one': 'NOTARGET2.2.1',
      'no.target.secondkey.two.two': 'NOTARGET2.2.2',
      'no.target.secondkey.three': 'NOTARGET2.3',
      'no.target.thirdkey': 'NOTARGET3',
  });

    const result = lib.getConfigForIdProvider('target');
    																														print("result (" +
    																															(Array.isArray(result) ?
    																																("array[" + result.length + "]") :
    																																(typeof result + (result && typeof result === 'object' ? (" with keys: " + JSON.stringify(Object.keys(result))) : ""))
    																															) + "): " + JSON.stringify(result, null, 2)
    																														);

    // Expected: a tree object
    test.assertEquals(4, Object.keys(result).length);  // 4 keys since a default key/value should have been added to the 3 keys in 'target': firstkey, secondkey and thirdkey.
    test.assertEquals(3, Object.keys(result.secondkey).length);
    test.assertEquals(2, Object.keys(result.secondkey.two).length);
    test.assertEquals('targetValue1', result.firstkey);
    test.assertEquals('targetValue2.1', result.secondkey.one);
    test.assertEquals('targetValue2.2.1', result.secondkey.two.one);
    test.assertEquals('targetValue2.2.2', result.secondkey.two.two);
    test.assertEquals('targetValue2.3', result.secondkey.three);
    test.assertEquals('targetValue3', result.thirdkey);

    // Default values should have been added during configFile fetching, at the step:
    // config = defaultsProvider.withDefaults(config);
    test.assertEquals('Mock added', result.defaults);
}

exports.test_configFile_getConfigForIdProvider_getNullOnNomatch = () => {

    setMockConfigReturn({
        autoinit: true,

        // Ingore all keys since they don't match 'nonexistingtarget':
        'idprovider.target.firstkey': 'targetValue1',
        'idprovider.target.secondkey.one': 'targetValue2.1',
        'idprovider.target.secondkey.two.one': 'targetValue2.2.1',
        'idprovider.target.secondkey.two.two': 'targetValue2.2.2',
        'idprovider.target.secondkey.three': 'targetValue2.3',
        'idprovider.target.thirdkey': 'targetValue3',

        'idprovider.another.firstkey': 'ANOTHER1',
        'idprovider.another.secondkey.one': 'ANOTHER2.1',
        'idprovider.another.secondkey.two.one': 'ANOTHER2.2.1',
        'idprovider.another.secondkey.two.two': 'ANOTHER2.2.2',
        'idprovider.another.secondkey.three': 'ANOTHER2.3',
        'idprovider.another.thirdkey': 'ANOTHER3',

        'no.target.firstkey': 'NOTARGET1',
        'no.target.secondkey.one': 'NOTARGET2.1',
        'no.target.secondkey.two.one': 'NOTARGET2.2.1',
        'no.target.secondkey.two.two': 'NOTARGET2.2.2',
        'no.target.secondkey.three': 'NOTARGET2.3',
        'no.target.thirdkey': 'NOTARGET3',
    });

    const result = lib.getConfigForIdProvider('nonexistingtarget');

    // Expected: null when target idprovider was not found
    test.assertEquals(null, result);
}



///////////////////////////


exports.test_arrayOrObject_arr_arrayAsObject = () => {
  const arrayAsObject = {
    0: "a",
    1: "b",
    2: "c"
  }
  const nowAnArray = lib.arrayOrObject(arrayAsObject);

  test.assertEquals("object", typeof nowAnArray);
  test.assertTrue(Array.isArray(nowAnArray));
}

exports.test_arrayOrObject_obj_simpleObject = () => {
  const simpleObject = {
    a: "a",
    b: "b",
    c: "c"
  }
  const stillAnObject = lib.arrayOrObject(simpleObject);

  test.assertEquals("object", typeof stillAnObject);
  test.assertFalse(Array.isArray(stillAnObject));
}

exports.test_arrayOrObject_obj_mixedObject = () => {
  const mixedObject = {
    1: "a",
    b: "b",
    3: "c"
  }
  const stillAnObject = lib.arrayOrObject(mixedObject);

  test.assertEquals("object", typeof stillAnObject);
  test.assertFalse(Array.isArray(stillAnObject));
}

exports.test_arrayOrObject_obj_nonSequentialIndices = () => {
  const brokenArray = {
    0: "a",
    1: "b",
    3: "c"
  }
  const stillAnObject = lib.arrayOrObject(brokenArray);

  test.assertEquals("object", typeof stillAnObject);
  test.assertFalse(Array.isArray(stillAnObject));
}

exports.test_arrayOrObject_obj_nonZeroIndices = () => {
  const brokenArray = {
    1: "a",
    2: "b",
    3: "c"
  }
  const stillAnObject = lib.arrayOrObject(brokenArray);

  test.assertEquals("object", typeof stillAnObject);
  test.assertFalse(Array.isArray(stillAnObject));
}


exports.test_arrayOrObject_obj_subZeroIndices = () => {
  const brokenArray = {
    1: "a",
    2: "b",
    "-1": "c"
  }
  const stillAnObject = lib.arrayOrObject(brokenArray);

  test.assertEquals("object", typeof stillAnObject);
  test.assertFalse(Array.isArray(stillAnObject));
}


exports.test_arrayOrObject_obj_repeatIndices = () => {
  const brokenArray = {
    "1": "a",
    "2 ": "b",
    " 2": "c"
  }
  const stillAnObject = lib.arrayOrObject(brokenArray);

  test.assertEquals("object", typeof stillAnObject);
  test.assertFalse(Array.isArray(stillAnObject));
}




exports.test_arrayOrObject_obj_trueTree = () => {
  const trueTree = {
    a: "a",
    b: ["b", "c", "d"],
    e: {f: "g", h: "i", j:"k"}
  }
  const stillAnObject = lib.arrayOrObject(trueTree);

  test.assertEquals("object", typeof stillAnObject);
  test.assertFalse(Array.isArray(stillAnObject));

  test.assertEquals("a", stillAnObject.a)

  test.assertEquals("object", typeof stillAnObject.b);
  test.assertTrue(Array.isArray(stillAnObject.b));
  test.assertEquals("c", stillAnObject.b[1])

  test.assertEquals("object", typeof stillAnObject.e);
  test.assertFalse(Array.isArray(stillAnObject.e));
  test.assertEquals("i", stillAnObject.e.h);
}


exports.test_arrayOrObject_obj_arrayTree = () => {
  const arrayTree = {
    0: "a",
    1: ["b", "c", "d"],
    2: {f: "g", h: "i", j:"k"}
  }
  const nestedArray = lib.arrayOrObject(arrayTree);


  test.assertEquals("object", typeof nestedArray);
  test.assertTrue(Array.isArray(nestedArray));

  test.assertEquals("a", nestedArray[0])

  test.assertEquals("object", typeof nestedArray[1]);
  test.assertTrue(Array.isArray(nestedArray[1]));
  test.assertEquals("c", nestedArray[1][1])

  test.assertEquals("object", typeof nestedArray[2]);
  test.assertFalse(Array.isArray(nestedArray[2]));
  test.assertEquals("i", nestedArray[2].h);
}






///////////////////////////  Test default-value insertion:



///////////////////////////  Test all at once:


exports.test_configFile_testEverythingComplex = () => {

  setMockConfigReturn({
    autoinit: true,

    'idprovider.complex.firstkey':            'targetValue1',
    'idprovider.complex.secondkey.0.one':     'targetValue2.0.1',
    'idprovider.complex.secondkey.1.one.one': 'targetValue2.1.1.1',
    'idprovider.complex.secondkey.1.one.two': 'targetValue2.1.1.2',
    'idprovider.complex.secondkey.1.two':     'targetValue2.1.2',
    'idprovider.complex.secondkey.2.three.0': 'targetValue2.2.3.0',
    'idprovider.complex.secondkey.2.three.1': 'targetValue2.2.3.1',
    'idprovider.complex.thirdkey.0.1':        'targetValue3.0.1',
    'idprovider.complex.thirdkey.one.0.1':    'targetValue3.1.0.1',
    'idprovider.complex.thirdkey.one.0.2':    'targetValue3.1.0.2',
    'idprovider.complex.thirdkey.one.2':      'targetValue3.1.2',
    'idprovider.complex.thirdkey.2.0':        'targetValue3.2.0',
    'idprovider.complex.thirdkey.2.1':        'targetValue3.2.1',
  });

  const result = lib.getConfigForIdProvider('complex');

  test.assertEquals(`{
  "firstkey": "targetValue1",
  "secondkey": [` +                                        //<-- Array, since secondkey only has subkeys 0, 1 and 2 (consecutive numbers starting with 0).
`
    {
      "one": "targetValue2.0.1"
    },
    {
      "one": {
        "one": "targetValue2.1.1.1",
        "two": "targetValue2.1.1.2"
      },
      "two": "targetValue2.1.2"
    },
    {
      "three": [` +                                        // <-- Array, since secondkey.2.three only has subkeys 0 and 1.
`
        "targetValue2.2.3.0",
        "targetValue2.2.3.1"
      ]
    }
  ],
  "thirdkey": {
    "0": {
      "1": "targetValue3.0.1"
    },
    "2": [` +                                              // <-- Array, since thirdkey.2 only has subkeys 0 and 1.
`
      "targetValue3.2.0",
      "targetValue3.2.1"
    ],
    "one": {
      "0": {
        "1": "targetValue3.1.0.1",
        "2": "targetValue3.1.0.2"
      },
      "2": "targetValue3.1.2"
    }
  },` +                                                   // Below: missing default values should have been added
`
  "defaults": "Mock added"
}`, JSON.stringify(result, null, 2));}
