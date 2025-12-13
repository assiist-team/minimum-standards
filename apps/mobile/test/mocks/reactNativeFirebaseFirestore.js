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

function firestore() {
  return {
    collection: () => createCollectionRef(),
  };
}

firestore.FieldValue = {
  serverTimestamp: () => ({ _methodName: 'serverTimestamp' }),
};

firestore.Timestamp = {
  now: () => ({
    toMillis: () => Date.now(),
  }),
  fromMillis: (ms) => ({
    toMillis: () => ms,
  }),
};

module.exports = {
  __esModule: true,
  default: firestore,
  FieldValue: firestore.FieldValue,
  Timestamp: firestore.Timestamp,
};
