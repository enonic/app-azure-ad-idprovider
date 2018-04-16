/**
 * isAccessTokenExpired filter.
 * @module site/filters/isAccessTokenExpired
 */

//──────────────────────────────────────────────────────────────────────────────
// Require libs
//──────────────────────────────────────────────────────────────────────────────
var lib = {
	adfsIdProvider: {
		object: require('/lib/adfs-id-provider/object'),
	},
	xp: {
		auth: require('/lib/xp/auth')
	}
};

//──────────────────────────────────────────────────────────────────────────────
// Alias functions from libs
//──────────────────────────────────────────────────────────────────────────────
var isSet   = lib.adfsIdProvider.object.isSet;
var toStr   = lib.adfsIdProvider.object.toStr;
var getUser = lib.xp.auth.getUser;
var logout  = lib.xp.auth.logout;

//──────────────────────────────────────────────────────────────────────────────
// Filter
//──────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Request - http://xp.readthedocs.io/en/stable/developer/ssjs/http-request.html
 * @property {String} method -
 * @property {String} scheme -
 * @property {String} host -
 * @property {String} port -
 * @property {String} path -
 * @property {String} url -
 * @property {String} remoteAddress -
 * @property {String} mode -
 * @property {String} branch -
 * @property {Object} params -
 * @property {Object} headers -
 * @property {Object} cookies -
 */

 /**
  * @typedef {Object} Response - http://xp.readthedocs.io/en/stable/developer/ssjs/http-response.html
  * @property {String} body -
  * @property {String} status -
  * @property {String} contentType -
  * @property {Object} headers -
  * @property {Object} cookies -
  * @property {String} redirect -
  * @property {Object} pageContributions -
  * @property {Boolean} postProcess -
  * @property {Boolean} applyFilters -
  */

/**
 * If the accessToken is expired, logout and redirect to the same url. Otherwise just return the response without modifying it.
 * @param {Request} request
 * @param {Response} response
 * @returns {Response}
 */
exports.responseFilter = function (request, response) {
	var user = getUser({ includeProfile: true });
	if(!user) { return response; }
	var expiresAt = user.profile.accessToken && user.profile.accessToken.expiresAt ? user.profile.accessToken.expiresAt : null;
	if(!expiresAt) { return response; }
	//log.debug('request:' + toStr(request) + ' response:' + toStr(response));
	var now = new Date();
	var expiresAtDate = new Date(expiresAt);
	log.debug('now:' + toStr(now) + ' expiresAtDate:' + toStr(expiresAtDate));
	if(now > expiresAtDate) {
		log.debug('EXPIRED');
		var logoutResult = logout();
		//log.debug('logoutResult:' + toStr(logoutResult)); // Always undefined in Enonix XP 6.9.2
		var redirectResponse = { // Redirecting to same url after logout should in therory lead to 401 and thus SSO login.
			status: 307, // Temporary redirect // http://insanecoding.blogspot.no/2014/02/http-308-incompetence-expected.html
			headers: {
				'Location': request.url
			},
			postProcess: false,
			applyFilters: false
		};
		log.debug('redirectResponse:' + toStr(redirectResponse));
		return redirectResponse;
	}
	log.debug('NOT EXPIRED');
	return response;
};
