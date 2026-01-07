/* global jest */

const mockGoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn(() => Promise.resolve(true)),
  signIn: jest.fn(() =>
    Promise.resolve({
      type: 'success',
      data: {
        idToken: 'mock-id-token',
        accessToken: 'mock-access-token',
        user: {
          email: 'mock@example.com',
          name: 'Mock User',
        },
      },
    })
  ),
  signInSilently: jest.fn(() =>
    Promise.reject({
      code: 'SIGN_IN_REQUIRED',
      message: 'No previous session',
    })
  ),
  getTokens: jest.fn(() =>
    Promise.resolve({
      idToken: 'mock-id-token',
      accessToken: 'mock-access-token',
    })
  ),
  isSignedIn: jest.fn(() => Promise.resolve(true)),
  signOut: jest.fn(() => Promise.resolve()),
};

const statusCodes = {
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

module.exports = {
  GoogleSignin: mockGoogleSignin,
  statusCodes,
};
