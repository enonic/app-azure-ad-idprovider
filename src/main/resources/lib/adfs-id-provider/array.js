/**
 * array module.
 * @module lib/adfs-id-provider/array
 */

/**
 * Returns an array with items that exists in the first array passed in, but not in the second array passed in.
 * @param {Array} a1
 * @param {Array} a2
 * @returns {Array}
 */
exports.inFirstButNotInSecond = function(a1, a2) {
	var a2obj = {};
	a2.forEach(function(v2) {
		a2obj[v2] = true;
	});
	return a1.filter(function(v1) {
		return !a2obj.hasOwnProperty(v1);
	});
};
