# ADFS ID provider

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [How to use](#how-to-use)
  - [Example idproviderUrls](#example-idproviderurls)
- [How to make a site use a specific userstore](#how-to-make-a-site-use-a-specific-userstore)
- [How to test the id provider on your site](#how-to-test-the-id-provider-on-your-site)
- [How to test the id provider on localhost](#how-to-test-the-id-provider-on-localhost)
- [How to enable debug logging](#how-to-enable-debug-logging)
- [How to build the application](#how-to-build-the-application)
- [Terms](#terms)
- [Compatibility](#compatibility)
- [Changelog](#changelog)
  - [1.0.0](#100)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## How to use

1. Install the app so it is listed on the Enonic XP Applications page.
2. Create a userStore on Enonic XP Users page and configure it to use the app.
 * The userStore name is important, and is part of the idproviderUrls, which must be allowed as redirectUris in AD.
3. While you are there configure the required settings. Setup a client in ADFS with the same settings.
4. Configure the vhost file, so that your site uses the userstore you made.
5. If you want automatic logout when an access token expires, add the app to all the sites that uses a userstore with the idprovider. This enables a filter to run on every response from Enonic XP.

### Example idproviderUrls

    http://example.com:8080/_/idprovider/adfs
    http://example.com:8080/admin/portal/admin/draft/_/idprovider/adfs (used for access to admin)

## How to make a site use a specific userstore

Example of configuration in $XP_HOME/config/com.enonic.xp.web.vhost.cfg

    # The site itself
    mapping.mysite.host = example.com
    mapping.mysite.source = /
    mapping.mysite.target = /portal/master/mysite
    mapping.mysite.userStore = myuserstore

    # Make admin available on the same host
    mapping.mysiteadmin.host = example.com
    mapping.mysiteadmin.source = /admin
    mapping.mysiteadmin.target = /admin
    mapping.mysiteadmin.userStore = myuserstore

## How to test the id provider on your site

    You can either use the authentication part which provides a login/logout link,
    or you can remove the Everyone role from the Permissions on some content under you site.

## How to test the id provider on localhost

Example configuration in /etc/hosts

    127.0.0.1 example.com

## How to enable debug logging

Add the following to $XP_HOME/config/logback.xml

    <logger name="com.enonic.app.adfsidprovider" additivity="false">
    <level value="DEBUG" />
    <appender-ref ref="STDOUT"/>
    <appender-ref ref="FILE"/>
    </logger>

## How to build the application

    ./gradlew build

## Terms

| AD FS | Enonic XP                     |
| ------| ----------------------------- |
| claim | A property in the jwt.payload |

## Compatibility

| Version       | XP version |
| ------------- | ---------- |
| 1.0.0         | 6.9.2      |

## Changelog

### 1.0.0

* Initial version
