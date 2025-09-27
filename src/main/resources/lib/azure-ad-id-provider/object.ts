/**
 * object module.
 * @module lib/azure-ad-id-provider/object
 */
import type { JwtPayload } from "/lib/azure-ad-id-provider/jwt";

/**
 * Syntactic sugar for JSON.stringify
 * @param {*} value
 * @param {Function} replacer - default: null
 * @param {String|Number} space - default: 4
 * @returns {String} A JSON string representing the given value.
 */
export function toStr(
  value: unknown,
  replacer?: (this: unknown, key: string, value: unknown) => unknown,
  space: string | number = 4,
): string {
  return JSON.stringify(value, replacer, space);
}

/**
 * Checks whether something is null or undefined.
 * @param {*} value
 * @returns {Boolean} true or false
 */
function isNotSet(v: unknown): v is null | undefined {
  return v === null || typeof v === "undefined";
}

type ValueFromFormatParams = {
  format: string;
  data: JwtPayload;
};

/**
 * "Parses" pseudocode, fetches values from the data, and returns the formatted result.
 * @param {Object} params
 * @param {string} params.format
 * @param {Object} params.data
 * @returns {string|Array} value
 */
export function valueFromFormat(params: ValueFromFormatParams): string {
  log.debug("valueFromFormat(" + toStr(params) + ")");
  let value: string = "";
  const formatParts = params.format.split(/\$\{/);
  log.debug("formatParts:" + toStr(formatParts));
  if (formatParts.length == 1) {
    // No variables in format
    return params.format;
  }

  formatParts.forEach((formatPart) => {
    if (formatPart) {
      if (formatPart.indexOf("}") === -1) {
        // Not a variable, just characters
        value += formatPart;
      } else {
        const formatPartParts = formatPart.split("}");
        const path = formatPartParts[0];
        const rest = formatPartParts[1];
        log.debug("path:" + toStr(path));
        log.debug("rest:" + toStr(rest));
        const evalString = "params.data." + path;
        log.debug("evalString:" + toStr(evalString));
        let partOfValue;
        try {
          partOfValue = eval(evalString) as string;
        } catch (e) {
          log.error("valueFromFormat(" + toStr(params) + "): " + (e as { message: string }).message);
          throw new Error(
            'valueFromFormat: Something wrong in format:"' +
              params.format +
              '" : ' +
              (e as { message: string }).message,
          );
        }
        log.debug("partOfValue:" + toStr(partOfValue));
        if (isNotSet(partOfValue)) {
          log.warning("valueFromFormat(" + toStr(params) + ") variable:" + evalString + " not found!");
          // TODO: Could throw error or not depending upon parameter
        } else if (Array.isArray(partOfValue)) {
          value = partOfValue; // NOTE: Enonic 6.9.2 stores Array with single value as string https://github.com/enonic/xp/issues/4686
        } else {
          value += partOfValue + rest; // TODO: Handle if path does not exist
        }
      }
    }
  }); //forEach.formatPart
  log.debug("valueFromFormat(" + toStr(params) + ") --> " + toStr(value));
  return value;
}
