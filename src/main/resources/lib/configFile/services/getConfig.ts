// Internally used getter function, for mocking

export function getConfigOrEmpty() {
  return app.config ?? {};
}
