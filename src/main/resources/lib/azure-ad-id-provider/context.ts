/**
 * context module.
 * @module lib/azure-ad-id-provider/context
 */
import { run } from "/lib/xp/context";

/**
 * Runs a function within admin context.
 * @param {Function} callback
 * @returns {Object}
 */
export function runAsAdmin<T>(callback: () => T): T {
  return run<T>(
    {
      user: {
        login: "su",
        idProvider: "system",
      },
      principals: ["role:system.admin"],
    },
    callback,
  );
}
