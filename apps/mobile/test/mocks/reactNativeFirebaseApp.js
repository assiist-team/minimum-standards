const mockApp = { name: 'test-app' };

function getApp() {
  return mockApp;
}

module.exports = {
  __esModule: true,
  getApp,
  __mockApp: mockApp,
};
