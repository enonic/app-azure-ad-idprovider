// Java-interface methods, service-ified for mocking

function required<Params, Name extends keyof Params>(params: Params, name: Name): NonNullable<Params[Name]> {
  const value = params[name];
  if (value === undefined || value === null) {
    throw Error("Parameter '" + String(name) + "' is required");
  }
  return value;
}

function nullOrValue<T>(value: T): NonNullable<T> | null {
  return value ?? null;
}

export type IdProvider = {
  key: string;
  displayName: string;
  description: string;
  idProviderConfig: {
    applicationKey: string;
    config: {
      name: string;
      type: string;
      values: unknown[];
    }[];
  };
};

export type CreateIdProviderParams = {
  name: string;
  displayName?: string;
  description?: string;
  idProviderConfig?: object;
  permissions?: object;
};

type CreateIdProviderHandlerBean = {
  name: string;
  displayName: string | null;
  description: string | null;
  idProviderConfig: unknown;
  permissions: unknown;
  createIdProvider(): IdProvider;
};

/**
 * Creates an id provider.
 *
 * @param {string} name Id provider name.
 * @param {string} [params.displayName] Id provider display name.
 * @param {string} [params.description] Id provider  description.
 * @param {object} [params.idProviderConfig] ID Provider configuration.
 * @param {object} [params.permissions] Id provider permissions.
 */
export function createIdProvider(params: CreateIdProviderParams): IdProvider {
  const bean = __.newBean<CreateIdProviderHandlerBean>(
    "com.enonic.app.azureadidprovider.lib.configFile.CreateIdProviderHandler",
  );

  bean.name = required(params, "name");
  bean.displayName = nullOrValue(params.displayName);
  bean.description = nullOrValue(params.description);
  bean.idProviderConfig = __.toScriptValue(params.idProviderConfig);
  bean.permissions = __.toScriptValue(params.permissions);

  return __.toNativeObject(bean.createIdProvider());
}

type GetIdProvidersHandlerBean = {
  getIdProviders(): IdProvider[];
};

/**
 * Returns the list of all the id providers in the system repo.
 *
 * @returns {object[]} Array of id providers in system repo.
 */
export function getIdProviders(): IdProvider[] {
  const bean = __.newBean<GetIdProvidersHandlerBean>(
    "com.enonic.app.azureadidprovider.lib.configFile.GetIdProvidersHandler",
  );
  return __.toNativeObject(bean.getIdProviders());
}
