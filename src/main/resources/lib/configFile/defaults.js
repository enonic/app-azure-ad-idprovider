/**
 * Default values for the config, wherever values are undefined or null. Other falsy values are kept if set in the cfg file.
 */
const CONFIG_DEFAULTS = {
  logoutUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A8080%2F",

  user: {
    name: '${oid}',
    displayName: '${given_name} ${family_name} &lt;${upn}&gt;',
    email: '${upn}'
  }
};



// True iff null or undefined, false on other 'falsy' values such as 0, empty string, or false
const isMissingValue = (value) => value == null;

const addIfMissing = (configObject, defaultObject, key) => {
                                                                                                                        log.info(`Adding default: '${key}' = ${defaultObject[key]}`)
  if (isMissingValue(configObject[key])) {
    configObject[key] = defaultObject[key];
  }
};



const withDefaults = (config) => {
  log.info("config (" +
    (Array.isArray(config) ?
        ("array[" + config.length + "]") :
        (typeof config + (config && typeof config === 'object' ? (" with keys: " + JSON.stringify(Object.keys(config))) : ""))
    ) + "): " + JSON.stringify(config, null, 2)
  );

  addIfMissing(config, CONFIG_DEFAULTS, 'logoutUrl');

  if ('object' !== typeof config.user || Array.isArray(config.user)) {
    config.user = {}
  }

  addIfMissing(config.user, CONFIG_DEFAULTS.user, 'name');
  addIfMissing(config.user, CONFIG_DEFAULTS.user, 'displayName');
  addIfMissing(config.user, CONFIG_DEFAULTS.user, 'email');

  return config;
};

exports.withDefaults = withDefaults;
