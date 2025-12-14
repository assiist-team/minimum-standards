/* global jest */
function auth() {
  return {
    currentUser: { uid: 'test-user-id' },
    onAuthStateChanged: () => () => undefined,
    signOut: jest.fn(() => Promise.resolve()),
  };
}

module.exports = {
  __esModule: true,
  default: auth,
};
