/**
 *
 * Because of possible nested substructures in read config or in defaults, simply object-assign'ing the read config
 * into a clone of the defaults won't do.
 * Adds values in the config (replaces them with values/structures from defaults), wherever values are undefined or null. Other falsy values are kept if set in the cfg file.
 */
const defaultsLib = require('./defaults.js');





const addValueIfMissing = (configObject, defaultObject, key) => {
  // print('------ Conf: ' + JSON.stringify(configObject));
  // print('       Def: ' + JSON.stringify(defaultObject));
  // print('       Key: ' + JSON.stringify(key));

  if (Array.isArray(configObject)) {
    //print('Array');
    // Missing value: value is not found in the config array
    if (defaultObject[key] != null && configObject.indexOf(defaultObject[key]) === -1) {
      print("Add: " + defaultObject[key])
      configObject.push(defaultObject[key]);
    }
  } else {
    //print('Non-array');
    // Missing value: value at key is null or undefined, detected by == null (but other 'falsy' values such as 0, empty string, or false are counted as valid)
    if (configObject[key] == null) {
      //print("Add " + defaultObject[key])
      // log.info(`Adding default: '${key}' = ${defaultObject[key]}`)
      configObject[key] = defaultObject[key];
    }
  }
};

const addKeyIfMissing = (configObject, defaultObject, key) => {
  if (
    'object' !== typeof configObject[key] ||
    Array.isArray(configObject[key]) !== Array.isArray(defaultObject[key])
  ) {
    if (Array.isArray(defaultObject[key])) {
      configObject[key] = []
    } else {
      configObject[key] = {}
    }
  }
}

const addObject = (configObject, defaultObject) => {
  Object.keys(defaultObject).forEach(key => {
    if (defaultObject[key] && 'object' === typeof defaultObject[key]) {
      addKeyIfMissing(configObject, defaultObject, key);
      addObject(configObject[key], defaultObject[key]);
    } else {
      addValueIfMissing(configObject, defaultObject, key);
    }
  })
}


exports.withDefaults = (config) => {
  const defaults = defaultsLib.getDefaults();
  if (defaults && 'object' === typeof defaults) {
    if (!config || 'object' !== typeof config || Array.isArray(config)) {
      config = {};
    }
    addObject(config, defaults);
  }
  return config;
};
