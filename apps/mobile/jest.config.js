module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@react-native-firebase/firestore$':
      '<rootDir>/test/mocks/reactNativeFirebaseFirestore.js',
    '^@react-native-firebase/auth$':
      '<rootDir>/test/mocks/reactNativeFirebaseAuth.js',
  },
};
