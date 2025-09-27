// Based on app-simple-idprovider
import { createIdProvider, getIdProviders, type IdProvider } from "/lib/configFile/services/bean";
import {
  CONFIG_NAMESPACE,
  getAllIdProviderNames,
  shouldAutoInit,
  getConfigForIdProvider,
} from "/lib/configFile/configFile";

/**
 * Check all idproviders by name
 *
 * @param {Array} providers
 * @returns {Boolean} true if exists, false if not
 */
function exists(providers: IdProvider[], name: string): boolean {
  for (const provider of providers) {
    if (provider && provider.key === name) {
      log.info(`Userstore '${name}' already exists - no autoinit.`);
      return true;
    }
  }
  log.info(`Userstore '${name}' doesn't exist yet. Will try autoinit.`);
  return false;
}

export function initUserStores() {
  const systemIdProviders = getIdProviders();
  const configedIdProviderNames = getAllIdProviderNames();

  configedIdProviderNames.forEach((idProviderName) => {
    if (shouldAutoInit() && !exists(systemIdProviders, idProviderName)) {
      log.info(`Autoinit: creating userstore '${idProviderName}'...`);

      const config = getConfigForIdProvider(idProviderName);
      const displayName = (config?.displayName as string) ?? idProviderName;
      const description =
        (config?.description as string) ?? `${CONFIG_NAMESPACE}.${idProviderName} in ${app.config["config.filename"]}`;

      const result = createIdProvider({
        name: idProviderName,
        displayName: displayName,
        description,
        idProviderConfig: {
          description,
          applicationKey: app.name,
          config: [], // Skipping the node-level config entirely; we're going to use the .cfg anyway (although this causes invalid config fields when viewing it in the user manager)
        },
        permissions: [],
      });

      if (result) {
        log.info(
          `Autoinit: success, created userstore: ${JSON.stringify({
            name: idProviderName,
            displayName,
            description,
          })}`,
        );
      } else {
        log.warning(`Autoinit: something went wrong trying to create userstore '${idProviderName}'.`);
        log.debug("createIdProvider result:");
        log.debug(result);
      }
    }
  });
}
