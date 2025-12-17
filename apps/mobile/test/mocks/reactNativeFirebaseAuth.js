/* global jest */

const mockAuthInstance = {
  currentUser: { uid: 'test-user-id' },
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signOut: jest.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  signInWithCredential: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
};

const GoogleAuthProvider = {
  credential: jest.fn((_idToken, _accessToken) => ({
    providerId: 'google.com',
  })),
};

function getAuth() {
  return mockAuthInstance;
}

function auth() {
  return mockAuthInstance;
}

module.exports = {
  __esModule: true,
  default: auth,
  getAuth,
  GoogleAuthProvider,
  __mockAuthInstance: mockAuthInstance,
};
