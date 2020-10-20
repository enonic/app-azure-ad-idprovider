/**
 * context module.
 * @module lib/azure-ad-id-provider/context
 */

var contextLib = require('/lib/xp/context');

/**
 * Runs a function within admin context.
 * @param {Function} callback
 * @returns {Object}
 */
exports.runAsAdmin = function(callback) {
    return contextLib.run({
        user: {
            login: 'su',
            idProvider: 'system'
        },
        principals: ["role:system.admin"]
    }, callback);
};
