# Azure AD Id Provider

Authenticate your users using Azure Active Directory
This ID Provider uses the OAuth2 v2 endpoint of your Azure AD to authenticate users.

## Acknowledgement
- Based on [ADFS Id Provider](https://github.com/enonic/app-adfs-idprovider)

## Compatibility

| Version       | XP Version            | Download  |
| ------------- |:-------------:| -----:|
| 0.1.0         | >= 7.0.0      | [Download](https://dl.bintray.com/gravitondigital/public/com/gravitondigital/app/azureadidprovider/0.1.0/azureadidprovider-0.1.0.jar)     |
| 1.0.0         | >= 7.0.0      | [Download](https://dl.bintray.com/gravitondigital/public/com/gravitondigital/app/azureadidprovider/1.0.0/azureadidprovider-1.0.0.jar)     |
| 1.1.0         | >= 7.0.0      | [Download](https://repo1.maven.org/maven2/com/gravitondigital/app/azureadidprovider/1.1.0/azureadidprovider-1.1.0.jar)     |
| 1.2.0         | >= 7.0.0      | [Download](https://repo1.maven.org/maven2/com/gravitondigital/app/azureadidprovider/1.2.0/azureadidprovider-1.2.0.jar)     |

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


## Build

To build this project, execute the following:

```bash
./gradlew clean build
```