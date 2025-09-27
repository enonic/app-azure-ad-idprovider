export function doubleAtsToDollar(value: string): string {
  return (value ?? "").replace(/@@\{/g, "${");
}

type ParsingCallback = Record<string, (value: string) => string>;

// Keys below are converted to regexpattern-ready strings for detecting all .cfg keys matching 'idprovider.<idprovidername>.<key>'.
// For example, "defaultGroups" below is converted to '^idprovider\.[a-zA-Z0-9_-]+\.defaultGroups$' which will match the keys
// 'idprovider.oidc.defaultGroups' and 'idprovider.other.defaultGroups' in the config file, but not 'idprovider.oidc.tokenUrl'.
const IDPROVIDER_PARSE_CALLBACKS: ParsingCallback = {
  "user.name": doubleAtsToDollar,
  "user.displayName": doubleAtsToDollar,
  "user.email": doubleAtsToDollar,
};

// Magic: make regex-pattern-ready keys for the final object and export it
const RX_SUBFIELD = "[a-zA-Z0-9_-]+";
export const PARSING_CALLBACKS = Object.keys(IDPROVIDER_PARSE_CALLBACKS).reduce<ParsingCallback>((res, key) => {
  const rxKey = key.replace(/\./g, "\.");
  res[`^idprovider\.${RX_SUBFIELD}\.${rxKey}$`] = IDPROVIDER_PARSE_CALLBACKS[key];
  return res;
}, {});
