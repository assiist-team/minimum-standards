"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogSchema = exports.standardSchema = exports.activitySchema = exports.standardStateSchema = exports.standardCadenceSchema = exports.activityInputTypeSchema = void 0;
const zod_1 = require("zod");
const unit_normalization_1 = require("./unit-normalization");
const timestampMsSchema = zod_1.z
    .number()
    .int()
    .nonnegative()
    .refine((v) => Number.isFinite(v), 'timestampMs must be finite');
exports.activityInputTypeSchema = zod_1.z.union([zod_1.z.literal('number'), zod_1.z.literal('yes_no')]);
exports.standardCadenceSchema = zod_1.z.union([
    zod_1.z.literal('daily'),
    zod_1.z.literal('weekly'),
    zod_1.z.literal('monthly')
]);
exports.standardStateSchema = zod_1.z.union([zod_1.z.literal('active'), zod_1.z.literal('archived')]);
exports.activitySchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).max(120),
    unit: zod_1.z
        .string()
        .min(1)
        .max(40)
        .transform((val) => {
        try {
            return (0, unit_normalization_1.normalizeUnitToPlural)(val);
        }
        catch (error) {
            // If normalization fails, throw a Zod error
            throw new zod_1.z.ZodError([
                {
                    code: zod_1.z.ZodIssueCode.custom,
                    path: ['unit'],
                    message: error instanceof Error ? error.message : 'Invalid unit'
                }
            ]);
        }
    }),
    inputType: exports.activityInputTypeSchema,
    createdAtMs: timestampMsSchema,
    updatedAtMs: timestampMsSchema,
    deletedAtMs: timestampMsSchema.nullable()
});
exports.standardSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    activityId: zod_1.z.string().min(1),
    minimum: zod_1.z.number().min(0),
    unit: zod_1.z.string().min(1).max(40),
    cadence: exports.standardCadenceSchema,
    state: exports.standardStateSchema,
    createdAtMs: timestampMsSchema,
    updatedAtMs: timestampMsSchema,
    deletedAtMs: timestampMsSchema.nullable()
});
exports.activityLogSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    standardId: zod_1.z.string().min(1),
    value: zod_1.z.number().min(0),
    occurredAtMs: timestampMsSchema,
    note: zod_1.z.string().max(500).nullable(),
    editedAtMs: timestampMsSchema.nullable(),
    createdAtMs: timestampMsSchema,
    updatedAtMs: timestampMsSchema,
    deletedAtMs: timestampMsSchema.nullable()
});
//# sourceMappingURL=schemas.js.map