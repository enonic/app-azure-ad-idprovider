/**
 *
 * Because of possible nested substructures in read config or in defaults, simply object-assign'ing the read config
 * into a clone of the defaults won't do.
 * Adds values in the config (replaces them with values/structures from defaults), wherever values are undefined or null. Other falsy values are kept if set in the cfg file.
 */
import { getDefaults } from "./defaults";

const addValueIfMissing = (
  configObject: Record<string, unknown>,
  defaultObject: Record<string, unknown>,
  key: string,
) => {
  if (Array.isArray(configObject)) {
    // Missing value: value is not found in the config array
    if (defaultObject[key] != null && configObject.indexOf(defaultObject[key]) === -1) {
      configObject.push(defaultObject[key]);
    }
  } else {
    // Missing value: value at key is null or undefined, detected by == null (but other 'falsy' values such as 0, empty string, or false are counted as valid)
    if (configObject[key] == null) {
      // log.info(`Adding default: '${key}' = ${defaultObject[key]}`)
      configObject[key] = defaultObject[key];
    }
  }
};

const addKeyIfMissing = (
  configObject: Record<string, unknown>,
  defaultObject: Record<string, unknown>,
  key: string,
) => {
  if ("object" !== typeof configObject[key] || Array.isArray(configObject[key]) !== Array.isArray(defaultObject[key])) {
    if (Array.isArray(defaultObject[key])) {
      configObject[key] = [];
    } else {
      configObject[key] = {};
    }
  }
};

function addObject(configObject: Record<string, unknown>, defaultObject: Record<string, unknown>): void {
  Object.keys(defaultObject).forEach((key) => {
    if (defaultObject[key] && "object" === typeof defaultObject[key]) {
      addKeyIfMissing(configObject, defaultObject, key);
      addObject(configObject[key] as Record<string, unknown>, defaultObject[key] as Record<string, unknown>);
    } else {
      addValueIfMissing(configObject, defaultObject, key);
    }
  });
}

export function withDefaults(config: Record<string, unknown>) {
  const defaults = getDefaults();
  if (defaults && "object" === typeof defaults) {
    if (!config || "object" !== typeof config || Array.isArray(config)) {
      config = {};
    }
    addObject(config, defaults);
  }
  return config;
}
