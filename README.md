# Azure AD Id Provider

Authenticate your users using Azure Active Directory
This ID Provider uses the OAuth2 v2 endpoint of your Azure AD to authenticate users.

[![](https://jitpack.io/v/no.item/app-azure-ad-idprovider.svg)](https://jitpack.io/#no.item/app-azure-ad-idprovider)

## Acknowledgement
- Based on [ADFS Id Provider](https://github.com/enonic/app-adfs-idprovider)
- Developed by [Øyvind Nordli](https://github.com/Garlov)

## Compatibility

| Version |    XP Version     |                                                                                                                              Download |
|---------|:-----------------:|--------------------------------------------------------------------------------------------------------------------------------------:|
| 0.1.0   |     >= 7.0.0      | [Download](https://dl.bintray.com/gravitondigital/public/com/gravitondigital/app/azureadidprovider/0.1.0/azureadidprovider-0.1.0.jar) |
| 1.0.0   |     >= 7.0.0      | [Download](https://dl.bintray.com/gravitondigital/public/com/gravitondigital/app/azureadidprovider/1.0.0/azureadidprovider-1.0.0.jar) |
| 1.1.0   |     >= 7.0.0      |                [Download](https://repo1.maven.org/maven2/com/gravitondigital/app/azureadidprovider/1.1.0/azureadidprovider-1.1.0.jar) |
| 1.2.0   |     >= 7.0.0      |                [Download](https://repo1.maven.org/maven2/com/gravitondigital/app/azureadidprovider/1.2.0/azureadidprovider-1.2.0.jar) |
| 1.2.1   |     >= 7.7.4      |                                [Download](https://jitpack.io/no/item/app-azure-ad-idprovider/1.2.1/app-azure-ad-idprovider-1.2.1.jar) |
| 1.2.2   |     >= 7.7.4      |                                [Download](https://jitpack.io/no/item/app-azure-ad-idprovider/1.2.2/app-azure-ad-idprovider-1.2.2.jar) |
| 1.2.3   |     >= 7.7.4      |                                [Download](https://jitpack.io/no/item/app-azure-ad-idprovider/1.2.3/app-azure-ad-idprovider-1.2.3.jar) |
| 1.2.4   |     >= 7.7.4      |                                [Download](https://jitpack.io/no/item/app-azure-ad-idprovider/1.2.4/app-azure-ad-idprovider-1.2.4.jar) |
| 1.3.0   |     >= 7.7.4      |                                [Download](https://jitpack.io/no/item/app-azure-ad-idprovider/1.3.0/app-azure-ad-idprovider-1.3.0.jar) |

## App Setup

### Azure Application
Go to Portal Azure, and either create an app or use an existing one.
Can be found in Azure `Active Directory` -> `App registrations` -> `New registration`

You'll then need to add the redirect URI for your enonic XP instance to your Azure application. This can be found in the `Authentication` section of your app. Add a new Web platform and then add your url there, the url will most likely look something like `https://${domain}/admin/tool/_/idprovider/${nameOfIdProvider}`. You can add multiple redirect URIs if necessary.

If you want to auto import the users AD groups in Enonic you have to add some API permissions as well:
* Directory.Read.All
* Directory.ReadWrite.All
* Directory.AccessAsUser.All

[Graph API Docs](https://docs.microsoft.com/en-us/graph/api/user-list-memberof?view=graph-rest-1.0&tabs=http)

### Enonic XP
Install the Azure AD ID Provider app if you haven't already

Open up the User manage interface and add a new Id Provider. Give this Id Provider a name, and check that the path name of the Id Provider is the same as the last part of the redirect URI added to your application in Azure.

Add the Azure AD ID Provider to the `Application` field and press the small pencil to open up the settings.
* Tentant ID can be found in the overview page on your app in Azure as `Directory (tenant) ID`.
* Client ID can be found in the overview page on your app in Azure as `Application (client) ID`.
* Logout url is where you want to send the user if they press the logout button in XP. For Azure AD you'd most likely send them to the azure ad logout url, with your redirect url as a param. Remember to url encode the redirect url https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A8080%2F or see https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request for more info. You can also omit the post_logout_redirect_uri, and the app will try to make an educated guess, but this in not recommended.
* Client Secret has to be made in the `Certificates & secrets` section under your application in Azure.
* If you want to change the Azure AD -> Enonic XP user mapping, do so in the User Mappings (most likely not necessary).
* Remember to add the API permissions listed above if you want to create and update groups in Enonic XP based on the groups in Azure AD.
* If your Enonic XP server instance is hosted on https, you'll most likely need to check the `Force the redirect uri to use https`, since XP itself doesn't know that it is using https if it's behind a reverse proxy of some sort.

### Group Filtering
If you don't want to import all the users groups from Azure AD, it's possible to use group filters to accomplish this.

You can add multiple filters. Each filter takes 3 parameters:
`property`: This is the property that comes from the MemberOf graphApi for each group. [List of properties](https://docs.microsoft.com/en-us/graph/api/resources/group?view=graph-rest-1.0#properties)
`regexp`: Which Regular Expression to run on the property
`and`: If you want to AND this with the previous filter.

Example:
`property`: description
`regexp`: \\\$XP\\\$
`and`: false

`property`: displayName
`regexp`: ^XP
`and`: false

`property`: id
`regexp`: 12345-12345-12345-12345
`and`: false

`property`: visibility
`regexp`: Public
`and`: true

This will then include groups with descriptions marked with `$XP$`, or groups with a display name starting with `XP`, or the group with id `12345-12345-12345-12345  ` where visibility is `Public`. So it's divided into 3 checks: 1 OR 2 OR (3 AND 4)


### Migration from 1.x, and configuration from .cfg file

As of v2.0.0, the form in the users app (_idprovider.xml_) has been removed. The settings to configure the id provider must instead be entered entered in a [.CFG file](https://developer.enonic.com/docs/xp/stable/deployment/config): _com.enonic.app.azureadidprovider.cfg_.

#### Config key names

The config keys in the .cfg file are the same as they were in the form, but uses dot-separation to place them below `idprovider.<idprovidername>.*`. The `*` corresponds to the input names (`<input name="*" ...>` previously found in the form.

The structure from the form/data layer should be mirrored exactly like this, when setting up the .cfg file.

For example: previously, the `tenantId` config value for an ID provider named `myidp` would be set by editing `myidp` in the Users manager in XP, and editing the textLine with the name `tenantId` in the form (eg. giving it the value `12345`). Now, this is set in the .cfg like this: `idprovider.myidp.tenantId=12345`.

See the [full list of keys](#full-config-overview) below.

#### Nested keys and arrays

Nested data structures are defined with the same dot-separated syntax after the IDP name in the keys.

For example, the input `port` under the item-set `proxy` would be defined as `idprovider.myidp.proxy.port=7000`.

Arrays of items are also supported, defined by adding index numbers to the path below the parent (must be consecutive numbers, starting from 0).

For example, the item-set `groupFilter` has `occurrences minimum="0" maximum="0"`, so many sub-items can be added below that. Each sub-item must have the fields `groupProperty` and `regexp`. Define an array of groupFilter subitems in the .cfg like this:

```
idprovider.myidp.groupFilter.0.groupProperty=foo
idprovider.myidp.groupFilter.0.regexp=^foo$
idprovider.myidp.groupFilter.1.groupProperty=bar
idprovider.myidp.groupFilter.1.regexp=^bar$
```
...etc

#### Placeholders in values

Previously, values with placeholders could be entered in the form, which would be the basis for actual values later. For example the `displayName` textline under the `users` item-set could be given the value `${given_name} ${family_name} &lt;${upn}&gt;`, to define a pattern for prettily naming users in XP based on values from the Azure user objects.

Now, since values containing placeholders on the syntax`${}` can cause unwanted behavior in .cfg files, replace the `$` in the values with a double `@`.

For example: `idprovider.myidp.user.displayName=@@{given_name} @@{family_name} &lt;@@{upn}&gt;`

#### Automatic initialization

If _com.enonic.app.azureadidprovider.cfg_ contains `autoinit=true`, during startup this app will look all idprovider names declared in the file and create them if they don't already exist, with those settings.

For example, `idprovider.myfirstidp.someKey=someValue` and `idprovider.anotheridp.anotherKey=anotherValue` will declare two idproviders named `myfirstidp` and `anotheridp`.

#### Full config overview

In addition to `autoinit`, which can be true, false or omitted, the following settings are available for using in the .cfg, below the `idprovider.<idprovidername>.` prefix (displayed label in the old form, and type, in parenthesis):

```
idprovider.<idprovidername>...
    .tenantId             ("tenantId": text, required)
    .clientId             ("clientId": text, required)
    .logoutUrl            ("logoutUrl": text, required)
    .clientSecret         ("clientSecret": text, required)

    .user...              ("User mappings": optional, with nested keys below)
        .name             ("Name": text, required)
        .displayName      ("Name": text, required)
        .email            ("Email": text, required)

    .pageSize             ("The page return size from graph api": number, optional)

    .groupFilter...       ("Group Filter": optional, with ARRAY counting items from 0 and up, and nested keys below each item)
        .0.groupProperty  ("Property": text, required)
        .0.regexp         ("Regexp": text, required)
        .0.and            ("AND": true or false, optional)

    .proxy...             ("Proxy": optional, with nested keys below)
        .host             ("Host": text, required)
        .port             ("Port Number": number, optional)
        .user             ("Username": text, optional)
        .password         ("Password": text, optional)

    .createAndUpdateGroupsOnLoginFromGraphApi
                          ("Create and update groups from graph api", true or false, optional)
    .forceHttpsOnRedirectUri
                          ("Force the redirect uri to use https", true or false, optional)
```

## Events

The following events can be listed after using event library:

| Event type                |      Description       |
|---------------------------|:----------------------:|
| `custom.azure.user.login` |      User logs in      |
| `custom.azure.user.modify`| Local user is modified |
| `custom.azure.user.create`| Local user is created  |

The *Login* event passes an object as parameter describing the user with these fields:

 - `type`
 - `key`
 - `displayName`
 - `disabled`
 - `email`
 - `login`
 - `idProvider`

The **Create** event passes an object as parameter with the following fields:

 - `idProvider`
 - `name`
 - `displayName`
 - `email`

_Example:_

```javascript
const eventLib = require("/lib/xp/event")

eventLib.listener({
  type: "custom.azure.user.login",
  callback: function(event) {
    log.info(event.data.email);
  }
})
```

## Build

To build this project, execute the following:

```bash
./gradlew clean build
```

## Deploy to Jitpack

Go to the [Jitpack page for app-azure-ad-idprovider](https://jitpack.io/#no.item/app-azure-ad-idprovider) to deploy from
Github (after [creating a new versioned release](https://github.com/ItemConsulting/app-azure-ad-idprovider/releases)).
