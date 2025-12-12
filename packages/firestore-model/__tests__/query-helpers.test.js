"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_helpers_1 = require("../src/query-helpers");
function describeConstraint(c) {
    // Firebase QueryConstraint objects expose a `type` discriminator.
    // We keep these tests narrow: assert the intended constraint type.
    return c.type;
}
describe('query helpers', () => {
    test('whereNotDeleted uses where constraint', () => {
        expect(describeConstraint((0, query_helpers_1.whereNotDeleted)())).toBe('where');
    });
    test('orderByUpdatedAtDesc uses orderBy constraint', () => {
        expect(describeConstraint((0, query_helpers_1.orderByUpdatedAtDesc)())).toBe('orderBy');
    });
    test('orderByOccurredAtDesc uses orderBy constraint', () => {
        expect(describeConstraint((0, query_helpers_1.orderByOccurredAtDesc)())).toBe('orderBy');
    });
    test('whereStandardIdEquals uses where constraint', () => {
        expect(describeConstraint((0, query_helpers_1.whereStandardIdEquals)('s1'))).toBe('where');
    });
    test('whereStandardStateEquals uses where constraint', () => {
        expect(describeConstraint((0, query_helpers_1.whereStandardStateEquals)('active'))).toBe('where');
    });
});
//# sourceMappingURL=query-helpers.test.js.map