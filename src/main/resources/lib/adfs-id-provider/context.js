/**
 * context module.
 * @module lib/adfs-id-provider/context
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
            userStore: 'system'
        },
        principals: ["role:system.admin"]
    }, callback);
};
