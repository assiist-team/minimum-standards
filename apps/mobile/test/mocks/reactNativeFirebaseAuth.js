function auth() {
  return {
    currentUser: { uid: 'test-user-id' },
    onAuthStateChanged: () => () => undefined,
  };
}

module.exports = {
  __esModule: true,
  default: auth,
};
