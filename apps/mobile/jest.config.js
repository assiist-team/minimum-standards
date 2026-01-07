module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@react-native-firebase/firestore$':
      '<rootDir>/test/mocks/reactNativeFirebaseFirestore.js',
    '^@react-native-firebase/auth$':
      '<rootDir>/test/mocks/reactNativeFirebaseAuth.js',
    '^@react-native-firebase/app$':
      '<rootDir>/test/mocks/reactNativeFirebaseApp.js',
    '^@react-native-google-signin/google-signin$':
      '<rootDir>/test/mocks/reactNativeGoogleSignin.js',
  },
};
