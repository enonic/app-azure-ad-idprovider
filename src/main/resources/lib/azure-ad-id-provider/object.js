/**
 * object module.
 * @module lib/azure-ad-id-provider/object
 */


/**
 * Syntactic sugar for JSON.stringify
 * @param {*} value
 * @param {Function} replacer - default: null
 * @param {String|Number} space - default: 4
 * @returns {String} A JSON string representing the given value.
 */
function toStr(value) {
	var replacer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
	var space = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 4;
	return JSON.stringify(value, replacer, space);
};
exports.toStr = toStr;


/**
 * Checks whether something is null or undefined.
 * @param {*} value
 * @returns {Boolean} true or false
 */
function isNotSet(v) {
	return v === null || typeof v === 'undefined';
};


/**
 * "Parses" pseudocode, fetches values from the data, and returns the formatted result.
 * @param {Object} params
 * @param {string} params.format
 * @param {Object} params.data
 * @returns {string|Array} value
 */
exports.valueFromFormat = function(params) {
	log.debug('valueFromFormat(' + toStr(params) + ')');
	var value = '';
	var formatParts = params.format.split(/\$\{/);
	log.debug('formatParts:' + toStr(formatParts));
	if(formatParts.length == 1) { // No variables in format
		return params.format;
	}
	formatParts.forEach(function(formatPart) {
		if (formatPart) {
			if(formatPart.indexOf('}') === -1) { // Not a variable, just characters
				value += formatPart;
			} else {
				var formatPartParts = formatPart.split('}');
				var path = formatPartParts[0];
				var rest = formatPartParts[1];
				log.debug('path:' + toStr(path));
				log.debug('rest:' + toStr(rest));
				var evalString = 'params.data.' + path;
				log.debug('evalString:' + toStr(evalString));
				var partOfValue;
				try {
					partOfValue = eval(evalString);
				} catch (e) {
					log.error('valueFromFormat(' + toStr(params) + '): ' + e.message);
					throw new Error('valueFromFormat: Something wrong in format:"' + params.format + '" : ' + e.message);
				}
				log.debug('partOfValue:' + toStr(partOfValue));
				if(isNotSet(partOfValue)) {
					log.warning('valueFromFormat(' + toStr(params) + ') variable:' + evalString + ' not found!');
					// TODO: Could throw error or not depending upon parameter
				} else if(Array.isArray(partOfValue)) {
					value = partOfValue; // NOTE: Enonic 6.9.2 stores Array with single value as string https://github.com/enonic/xp/issues/4686
				} else {
					value += partOfValue + rest; // TODO: Handle if path does not exist
				}
			}
		}
	}); //forEach.formatPart
	log.debug('valueFromFormat(' + toStr(params) + ') --> ' + toStr(value));
	return value;
};
