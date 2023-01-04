var lib = require('./parsingCallbacks');
var test = require('/lib/xp/testing');



/////////////////////////////////////////


exports.test_parsingCallbacks_recognizesGenericKey_Name = () => {
    const relevantField = 'user.name';

    const testIdProviderNames = [
        'idp1',
        'idp2',
        'my_test_provider',
        'my-test-provider'
    ]

    const relevantFieldPicker = new RegExp(`.${relevantField}\\\$\$`, 'g');

    const patterns = Object.keys(lib.PARSING_CALLBACKS).filter( key => key.search(relevantFieldPicker) > -1 );
    test.assertEquals(patterns.length, 1, "Expected only one parsing callback pattern for *." + relevantField);
    const patternRx = new RegExp(patterns[0]);

    testIdProviderNames.forEach( name => {
        const cfgField = `idprovider.${name}.${relevantField}`;
        test.assertTrue(patternRx.test(cfgField), `The pattern (${patternRx}) should have recognized '${cfgField}'`);
    });
}
exports.test_parsingCallbacks_recognizesGenericKey_DisplayName = () => {
    const relevantField = 'user.displayName';

    const testIdProviderNames = [
        'idp1',
        'idp2',
        'my_test_provider',
        'my-test-provider'
    ]

    const relevantFieldPicker = new RegExp(`.${relevantField}\\\$\$`, 'g');

    const patterns = Object.keys(lib.PARSING_CALLBACKS).filter( key => key.search(relevantFieldPicker) > -1 );
    test.assertEquals(patterns.length, 1, "Expected only one parsing callback pattern for *." + relevantField);
    const patternRx = new RegExp(patterns[0]);

    testIdProviderNames.forEach( name => {
        const cfgField = `idprovider.${name}.${relevantField}`;
        test.assertTrue(patternRx.test(cfgField), `The pattern (${patternRx}) should have recognized '${cfgField}'`);
    });
}
exports.test_parsingCallbacks_recognizesGenericKey_Email = () => {
    const relevantField = 'user.email';

    const testIdProviderNames = [
        'idp1',
        'idp2',
        'my_test_provider',
        'my-test-provider'
    ]

    const relevantFieldPicker = new RegExp(`.${relevantField}\\\$\$`, 'g');

    const patterns = Object.keys(lib.PARSING_CALLBACKS).filter( key => key.search(relevantFieldPicker) > -1 );
    test.assertEquals(patterns.length, 1, "Expected only one parsing callback pattern for *." + relevantField);
    const patternRx = new RegExp(patterns[0]);

    testIdProviderNames.forEach( name => {
        const cfgField = `idprovider.${name}.${relevantField}`;
        test.assertTrue(patternRx.test(cfgField), `The pattern (${patternRx}) should have recognized '${cfgField}'`);
    });
}


exports.test_parsingCallbacks_ignoresOtherKeys = () => {
    const _includedNamespace = 'idprovider';
    const ignoredNamespace = 'autoinit';

    const _acceptableProviderName = 'idp1'
    const unacceptableProviderName = 'id.p1'

    const _includedField = 'defaultGroups';
    const ignoredField = 'somethingElse';

    const assertNotRecognized = (nameSpace, providerName, field, patternRx) => {
        const fullKey = `${nameSpace}.${providerName}.${field}`;
        test.assertFalse(patternRx.test(fullKey), `The pattern (${patternRx}) should not have recognized '${fullKey}'`);
    }

    const patternKeys = Object.keys(lib.PARSING_CALLBACKS);
    patternKeys.forEach( patternKey => {
        const patternRx = new RegExp(patternKey);

        assertNotRecognized(_includedNamespace, _acceptableProviderName, ignoredField, patternRx);
        assertNotRecognized(_includedNamespace, unacceptableProviderName, _includedField, patternRx);
        assertNotRecognized(ignoredNamespace, _acceptableProviderName, _includedField, patternRx);
    })
}



///////////////////////////////

exports.test_parsingCallbacks_doubleAtsToDollar_replacesFirstTwoAtsWithDollar = () => {
  test.assertEquals(lib.doubleAtsToDollar("@@{hey}"), "${hey}")
}

exports.test_parsingCallbacks_doubleAtsToDollar_replacesAllAtsWithDollar = () => {
  test.assertEquals(lib.doubleAtsToDollar("@@{hey} ho @@{lets} go"), "${hey} ho ${lets} go")
}

exports.test_parsingCallbacks_doubleAtsToDollar_leavesNoAtStringsAlone = () => {
    test.assertEquals(lib.doubleAtsToDollar("hey"), "hey")
    test.assertEquals(lib.doubleAtsToDollar(""), "")
    test.assertEquals(lib.doubleAtsToDollar("${hey}"), "${hey}")
}

exports.test_parsingCallbacks_doubleAtsToDollar_leavesSingleAtStringsAlone = () => {
    test.assertEquals(lib.doubleAtsToDollar("@{hey}"), "@{hey}")
    test.assertEquals(lib.doubleAtsToDollar("email@domain.com"), "email@domain.com")
}

exports.test_parsingCallbacks_doubleAtsToDollar_changesOnlyAtsBeforeCurlybrace = () => {
    test.assertEquals(lib.doubleAtsToDollar("@@hey"), "@@hey")
    test.assertEquals(lib.doubleAtsToDollar("email@@domain.com"), "email@@domain.com")
}

