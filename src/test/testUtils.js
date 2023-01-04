//-------------------------
// Test.mock only works the first time, the following workaround allows mutability:

const test = require('/lib/xp/testing');

const mocks = {};

const replaceMocks = (targetMocks, newMocks) => {
  Object.keys(targetMocks).forEach( key => {
    delete targetMocks[key];
  });
  Object.keys(newMocks).forEach( key => {
    targetMocks[key] = newMocks[key];
  })
}


// This replaces the test.mock function, and returns a function that updates the relevant mocks, hence allowing mutation/replacment mocking:
exports.mockAndGetUpdaterFunc = (libPath, mockObj) => {
  test.mock(libPath, mockObj || {});
  mocks[libPath] = {};

  return newMocks => replaceMocks(mocks[libPath], newMocks);
  // TODO: Add support for restoring actual lib functions when running the replacer func with fewer keys than before
};

// ----------------------------------------------
