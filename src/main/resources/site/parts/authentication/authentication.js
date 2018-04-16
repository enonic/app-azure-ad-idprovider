/**
 * Authentication part. A part which provides a login or logout link, depending upon whether a user is logged in or not.
 * @module site/parts/authentication
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
var lib = {
	adfsIdProvider: {
		object: require('/lib/adfs-id-provider/object')
	},
	xp: {
		auth:      require('/lib/xp/auth'),
		portal:    require('/lib/xp/portal'),
		thymeleaf: require('/lib/xp/thymeleaf')
	}
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
var toStr           = lib.adfsIdProvider.object.toStr;
var valueFromFormat = lib.adfsIdProvider.object.valueFromFormat;
var getComponent    = lib.xp.portal.getComponent;
var getUser         = lib.xp.auth.getUser;
var loginUrl        = lib.xp.portal.loginUrl;
var logoutUrl       = lib.xp.portal.logoutUrl;
var render          = lib.xp.thymeleaf.render;

//──────────────────────────────────────────────────────────────────────────────
// Initialize part
//──────────────────────────────────────────────────────────────────────────────
var partName   = 'authentication';
var loginView  = resolve('./login.html');
var logoutView = resolve('./logout.html');

//──────────────────────────────────────────────────────────────────────────────
// Handle requests
//──────────────────────────────────────────────────────────────────────────────
/**
 * Provide a login or logout link, depending upon whether a user is logged in or not.
 * @param {Object} request
 * @returns {Object} response
 */
exports.get = function(request) {
	log.debug('get(' + toStr(request) + ')');

	var config = getComponent().config;
	log.debug('config:' + toStr(config));

	var user = getUser({ includeProfile: true });
	log.debug('user:' + toStr(user));

	var model = {
		partName: partName
	};

	var response = {
		contentType: 'text/html'
	};

	if(user) { // Logged in
		var whitelist = { // Whitelist what data is available for formatting.
			user: {
				displayName: user.displayName,
				login:       user.login,
				profile: {
					adfs: {
						fullName: user.profile.adfs && user.profile.adfs.fullName || '',
						userName: user.profile.adfs && user.profile.adfs.userName || ''
					}
				}
			}
		};
		model.logoutPreText  = valueFromFormat({ format: config.logoutPreText  || '${user.displayName} (', data: whitelist });
		model.logoutText     = valueFromFormat({ format: config.logoutText     || 'logout'               , data: whitelist });
		model.logoutPostText = valueFromFormat({ format: config.logoutPostText || ')'                    , data: whitelist });
		model.logoutUrl      = logoutUrl({ redirect: config.logoutRedirectUrl || '/' });
		response.body        = render(logoutView, model);
	} else { // Logged out
		model.loginText = config.loginText || 'login';
		model.loginUrl  = loginUrl({ redirect: config.loginRedirectUrl || '/' });
		response.body   = render(loginView, model);
	}
	log.debug('model:' + toStr(model));
	return response;
};
