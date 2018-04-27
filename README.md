# ADFS ID provider

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

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

1. In the admin tool "Applications", install the application "ADFS ID Provider" .
2. In the admin tool "Users", create a user store and configure it to use the ADFS application.
3. Configure the required settings & setup a client in ADFS with the same settings.
4. Configure the vhost file, so that your site or admin uses the user store you made.

### Callback URLs

IN ADFS, the callback URL to specify is "_/idprovider/<userstorename>" appended to your vhost target

    http://example.com:8080/_/idprovider/myuserstore
    http://example.com:8080/admin/portal/admin/draft/_/idprovider/myuserstore (used for access to admin)

### Vhost configuration

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
| 1.0.0         | 6.12.0     |

## Changelog

### 1.0.0

* Initial version
