"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = require("firebase/firestore");
const timestamps_1 = require("../src/timestamps");
describe('timestamp normalization', () => {
    test('Timestamp -> ms', () => {
        const ts = firestore_1.Timestamp.fromMillis(1234);
        expect((0, timestamps_1.timestampToMs)(ts)).toBe(1234);
    });
    test('Date -> ms', () => {
        const d = new Date(2000);
        expect((0, timestamps_1.timestampToMs)(d)).toBe(2000);
    });
});
//# sourceMappingURL=timestamps.test.js.map