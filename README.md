# Azure ID Provider

**Authenticate your users using Azure Active Directory.**
This ID Provider uses the OAuth2 v2 endpoint of your Azure AD to authenticate users.


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
| 2.0.0   |     >= 7.7.4      |                         [Download](https://repo.enonic.com/public/com/enonic/app/azureadidprovider/2.0.0/azureadidprovider-2.0.0.jar) |
| 2.0.1   |     >= 7.7.4      |                         [Download](https://repo.enonic.com/public/com/enonic/app/azureadidprovider/2.0.1/azureadidprovider-2.0.1.jar) |
| 2.0.2   |     >= 7.7.4      |                         [Download](https://repo.enonic.com/public/com/enonic/app/azureadidprovider/2.0.2/azureadidprovider-2.0.2.jar) |
| 2.0.3   |     >= 7.7.4      |                         [Download](https://repo.enonic.com/public/com/enonic/app/azureadidprovider/2.0.3/azureadidprovider-2.0.3.jar) |

## Setup

### Azure Application
Go to Portal Azure, and either create an app or use an existing one.
Can be found in Azure `Active Directory` -> `App registrations` -> `New registration`

You'll then need to add the redirect URI for your enonic XP instance to your Azure application. This can be found in the `Authentication` section of your app. Add a new Web platform and then add your url there, the url will most likely look something like `https://${domain}/admin/tool/_/idprovider/${nameOfIdProvider}`. You can add multiple redirect URIs if necessary.

<a id="api-permissions"></a>

If you want to auto import the users AD groups in Enonic you have to add some API permissions as well:
* Directory.Read.All
* Directory.ReadWrite.All
* Directory.AccessAsUser.All

[Graph API Docs](https://docs.microsoft.com/en-us/graph/api/user-list-memberof?view=graph-rest-1.0&tabs=http)

<br />

### App installation in Enonic XP
Install the _Azure ID Provider_ app if you haven't already. Note that these docs don't apply to older versions of the app. Versions 1.x are deprecated, and are named _Azure **AD** ID provider_. Most likely you'll want the more **recent version**, without "AD" in the name, and this updated logo:

<img id="azure-id-provider-logo" src="src/main/resources/application.svg" height="70" width="70" />

Open up the User manage interface, add a new ID provider and [give it a name](#users-app). Verify that the path name of the Id Provider is the same as the last part of the redirect URI added to your application in Azure.

Connect the ID provider to this app, by choosing `Azure ID provider` in the Application. Also remember to configure the app.

<br />

### Configuration

As of v2.0.0, the [config form in the users app](#users-app) (_idprovider.xml_) has been removed. The settings to configure the id provider must instead be entered in a [.CFG file](https://developer.enonic.com/docs/xp/stable/deployment/config): _**com.enonic.app.azureadidprovider.cfg**_.

In this .cfg file, all ID providers that use this app are configured. Each ID provider gets a `idprovider.<idprovidername>` namespace, which prefixes the config fields. The [ID provider name](#users-app) is set in the Users app in XP. For example, setting the `pageSize` config field with a value of 10 for an ID provider named `azure`, will look like this:  `idprovider.azure.pageSize=10`.


#### Overview

The following settings are available for using in **com.enonic.app.azureadidprovider.cfg**. [More details](#fields-in-the-config) follow below.

```ini
autoinit=  (true or false, optional)

idprovider.<idprovidername>.tenantId=  (string, required)
idprovider.<idprovidername>.clientId=  (string, required)
idprovider.<idprovidername>.logoutUrl=  (string, optional)
idprovider.<idprovidername>.clientSecret=  (string, required)

idprovider.<idprovidername>.createAndUpdateGroupsOnLoginFromGraphApi=  (true or false, optional)
idprovider.<idprovidername>.forceHttpsOnRedirectUri=  (true or false, optional)
idprovider.<idprovidername>.pageSize=  (number, optional)

# Optional deeper namespaces: 'user', 'proxy' and 'groupFilter'.
# If used, they have more fields/array items below them, which be required or optional.
# The array under `groupFilter` may of course have more items (`1`, `2`, etc).

idprovider.<idprovidername>.user.name=  (string, optional)
idprovider.<idprovidername>.user.displayName=  (string, optional)
idprovider.<idprovidername>.user.email=  (string, optional)

idprovider.<idprovidername>.proxy.host=  (string, required)
idprovider.<idprovidername>.proxy.port=  (number between 0 and 65535, optional)
idprovider.<idprovidername>.proxy.user=  (string, optional)
idprovider.<idprovidername>.proxy.password=  (string, optional)

idprovider.<idprovidername>.groupFilter.0.groupProperty=  (string, required)
idprovider.<idprovidername>.groupFilter.0.regexp=  (string, required)
idprovider.<idprovidername>.groupFilter.0.and=  (true or false, optional)
```


#### Fields in the config

- `autoinit`: Automatic initialization. If _com.enonic.app.azureadidprovider.cfg_ contains `autoinit=true`, then during startup this app will look all idprovider names declared in the file and create them (if the app names don't already exist) with those settings. For example, `idprovider.myfirstidp.someKey=someValue` and `idprovider.anotheridp.anotherKey=anotherValue` will declare two idproviders named `myfirstidp` and `anotheridp`.

<br />

- `...tenantId`: Tenant ID, the directory (tenant) ID found in Portal Azure - in the overview page on your app in Azure as `Directory (tenant) ID`.
- `...clientId`: Client ID, the application (client) ID for your application in Portal Azure - in the overview page on your app in Azure as `Application (client) ID`.
- `...logoutUrl`: Logout URL. This is where you want to send the user if they press the logout button in XP - default is the azure AD logout url: `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A8080%2F`. Remember to url encode the redirect url. See also the [oauth2 docs](https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A8080%2F) or the [OIDC protocol docs](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request) for more info. You can also omit the post_logout_redirect_uri, and the app will try to make an educated guess - but this is not recommended.
- `...clientSecret`: Client Secret found/made in Portal Azure - in the _Certificates & secrets_ section under your application in Azure.

<br />

- `...createAndUpdateGroupsOnLoginFromGraphApi`: Create and update groups from graph api. Create and update groups when a user is logged in based on groups returned from Azure's graph api. Remember to add the [API permissions](#api-permissions) if you want to create and update groups in Enonic XP based on the groups in Azure AD.
- `...forceHttpsOnRedirectUri`: Force the redirect uri to use https. If your enonic instance is running behind a SSL reverse proxy / hosted on https, this might be necessary if you're not forwarding all http requests to https, since XP itself doesn't know that it is using https if it's behind a reverse proxy of some sort.
- `...pageSize`: The page return size from graph api. If the result contains more than the page size, graph api will return an _@odata.nextLink_ property similar to the following along with the first page of users.

<br id="user-mapping-syntax" />

- `...user` (`idprovider.<idprovidername>.user...` namespace): User mappings, Azure AD -> Enonic XP. These fields provide placeholders and patterns for how Azure's user objects will be used to populate user data in XP. Note: **The placeholders use a `@@` syntax in the .cfg file**: in the config form in previous versions of the app, placeholders looked like `${placeholder}`. But the syntax`${}` can cause unwanted behavior in .cfg files, so the `$` is changed to `@@`.
  - `...name`: Unique user name. Default: `@@{oid}`
  - `...displayName`: Display name. Default: `@@{given_name} @@{family_name} <@@{upn}>`
  - `...email`: Email. Default: `@@{upn}`

<br />

- `...proxy` (`idprovider.<idprovidername>.proxy...` namespace): Proxy. Used to configure a proxy to use when talking to Azure AD:
  - `...host`: Host. Proxy host name to use.
  - `...port`: Port Number. Proxy port to use.
  - `...user`: Username for proxy authentication.
  - `...password`: Password for proxy authentication.

<br />

- `...groupFilter` (`idprovider.<idprovidername>.groupFilter...` namespace): Group Filter. If you don't want to import all the users groups from Azure AD, it's possible to use group filters to accomplish this. This groupFilter namespace _requires an array_ immediately below it, with two required fields and one optional (`and`) below each item in the array. Each item in the array adds a rule for filtering groups. Array starts counting on 0, so for example, `idprovider.<idprovidername>.groupFilter.0.groupProperty` sets the `groupProperty` for the first item, while `idprovider.<idprovidername>.groupFilter.1.regexp` sets `regexp` for the second one, etc.
  - `...groupProperty`: Property on the group returned from the graph API you want to test against; a property that comes from the `MemberOf` graphApi for each group. [List of properties](https://docs.microsoft.com/en-us/graph/api/resources/group?view=graph-rest-1.0#properties), eg. `description`, `displayName`, `id`, `visibility` etc.
  - `...regexp`: Regexp: Regular Expression to run on the property.
  - `...and`: AND combination rule with the previous filter in the array.

##### Group filter example

The following filtering will include groups with descriptions marked with `$XP$`, _or_ groups with a display name starting with `XP`, _or_ the group with id `12345-12345-12345-12345` where visibility is `Public` - in sum divided into 3 checks: items 0 OR 1 OR (2 AND 3):

```ini
idprovider.myidp.groupFilter.0.groupProperty=description
idprovider.myidp.groupFilter.0.regexp=\\\$XP\\\$
idprovider.myidp.groupFilter.0.and=false

idprovider.myidp.groupFilter.1.groupProperty=displayName
idprovider.myidp.groupFilter.1.regexp=^XP
idprovider.myidp.groupFilter.1.and=false

idprovider.myidp.groupFilter.2.groupProperty=id
idprovider.myidp.groupFilter.2.regexp=12345-12345-12345-12345
idprovider.myidp.groupFilter.2.and=false

idprovider.myidp.groupFilter.3.groupProperty=visibility
idprovider.myidp.groupFilter.3.regexp=Public
idprovider.myidp.groupFilter.3.and=true
```

<br />
<br />

## Upgrading from version 1.x

Version 2.x of this app introduces two breaking changes:
- As detailed above, [all configuration now happens in com.enonic.app.azureadidprovider.cfg](#configuration) instead of editing a form in the Users app. So no configuration will be stored in / read from the data layer anymore.
- The app name and key has changed. After Enonic formally took over this project, the app key is now `com.enonic.app.azureadidprovider` (previously _com.gravitondigital.app.azureadidprovider_), and for clarity, the displayName of the app has shortened to _Azure ID provider_ (removing "AD" from the previous _Azure AD ID provider_).

The following upgrade descriptions use information you can find by editing your 1.x ID provider app in XP:

<img id="users-app" src="media/user-app.png" alt="When editing an ID provider in the Users app, the ID provider name is found (or edited) directly below the displayName field, and in previous versions of this app the configuration form was opened by clicking the pencil icon on the ID provider application." title="When editing an ID provider in the Users app, the ID provider name is found (or edited) directly below the displayName field, and in previous versions of this app the configuration form was opened by clicking the pencil icon on the ID provider application." width="300" height="140" />

### 1. Migrate the configuration

Create _com.enonic.app.azureadidprovider.cfg_ in your /config folder. Then in XP, enter the Users app and edit the ID provider. Note the ID provider name (without the leading slash), and click the edit-form icon to view the configuration entered in the old app. Transfer the values into the .cfg file, [the way it's specified above](#configuration) (the order may vary).

For user mapping config (`idprovider.<idprovidername>.user.*`), remember the `@@` [syntax for the placeholders](#user-mapping-syntax). **Replace any `${` in the values with `@@{`**!

### 2. Change the app

_After_ migrating the configuration as above, a few more steps are needed:
- Open the Application manager in XP. The app cannot simply be version-upgraded here (because of the app key change). First, install the new version of the app: _Azure ID provider_. Don't uninstall the old one yet.
- Existing ID provider(s) must be re-pointed to the new app instead of the old. Edit it (/them) in the Users app: under Applications, select the new _Azure IP provider_ and remove the old _Azure AD ID provider_. Save and close.
- If there are any added customizations (hardcoded references etc) in your apps/environments that refer to the old app key `com.gravitondigital.app.azureadidprovider`, they must be updated to `com.enonic.app.azureadidprovider`.
- Finally, back in the Application manager in XP, the old app _Azure **AD** ID provider_ can be uninstalled.


<br />
<br />

## Events

The following events can be listed after using event library:

| Event type                |      Description       |
|---------------------------|:----------------------:|
| `custom.azure.user.login` |      User logs in      |
| `custom.azure.user.modify`| Local user is modified |
| `custom.azure.user.create`| Local user is created  |

### Login

The `...login` event passes an object as parameter describing the user with these fields:

 - `type`
 - `key`
 - `displayName`
 - `disabled`
 - `email`
 - `login`
 - `idProvider`

**Example:**

```javascript
const eventLib = require("/lib/xp/event")

eventLib.listener({
  type: "custom.azure.user.login",
  callback: function(event) {
    log.info(event.data.email);
  }
})
```

### Create

The `...create` event passes an object as parameter with the following fields:

 - `idProvider`
 - `name`
 - `displayName`
 - `email`


<br />
<br />

## Development

### Build

To build this project, execute the following:

```bash
./gradlew clean build
```


## Acknowledgements
- Based on [ADFS Id Provider](https://github.com/enonic/app-adfs-idprovider), versions 1.x have been developed by [Øyvind Nordli](https://github.com/Garlov) until version 2.0 when Enonic took over the project again.
