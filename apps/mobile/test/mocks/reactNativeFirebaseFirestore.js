const noop = () => undefined;

function createSnapshot() {
  return {
    forEach: () => undefined,
  };
}

function createWhereResult() {
  return {
    onSnapshot: (callback) => {
      if (typeof callback === 'function') {
        callback(createSnapshot());
      }
      return noop;
    },
  };
}

function createDocRef() {
  return {
    collection: () => createCollectionRef(),
    doc: () => createDocRef(),
    set: async () => undefined,
    update: async () => undefined,
    get: async () => ({
      exists: true,
      data: () => ({}),
    }),
  };
}

function createCollectionRef() {
  return {
    doc: () => createDocRef(),
    where: () => createWhereResult(),
  };
}

const firestoreInstance = {
  collection: () => createCollectionRef(),
  batch: () => ({
    update: () => undefined,
    commit: async () => undefined,
  }),
};

firestoreInstance.FieldValue = {
  serverTimestamp: () => ({ _methodName: 'serverTimestamp' }),
};

firestoreInstance.Timestamp = {
  now: () => ({
    toMillis: () => Date.now(),
  }),
  fromMillis: (ms) => ({
    toMillis: () => ms,
  }),
};

function getFirestore() {
  return firestoreInstance;
}

module.exports = {
  __esModule: true,
  default: getFirestore,
  getFirestore,
  FieldValue: firestoreInstance.FieldValue,
  Timestamp: firestoreInstance.Timestamp,
  __mockFirestore: firestoreInstance,
};
