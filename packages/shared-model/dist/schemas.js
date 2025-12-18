"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardPinsSchema = exports.activityLogSchema = exports.standardSchema = exports.activitySchema = exports.standardSessionConfigSchema = exports.standardStateSchema = exports.legacyStandardCadenceSchema = exports.standardCadenceSchema = exports.cadenceUnitSchema = void 0;
const zod_1 = require("zod");
const unit_normalization_1 = require("./unit-normalization");
const timestampMsSchema = zod_1.z
    .number()
    .int()
    .nonnegative()
    .refine((v) => Number.isFinite(v), 'timestampMs must be finite');
// Cadence unit types - supports day, week, month, and future extensions
exports.cadenceUnitSchema = zod_1.z.enum(['day', 'week', 'month']);
// Cadence structure: {interval: number, unit: 'day' | 'week' | 'month'}
exports.standardCadenceSchema = zod_1.z.object({
    interval: zod_1.z.number().int().positive(),
    unit: exports.cadenceUnitSchema,
});
// Legacy cadence schema for backward compatibility (deprecated)
exports.legacyStandardCadenceSchema = zod_1.z.union([
    zod_1.z.literal('daily'),
    zod_1.z.literal('weekly'),
    zod_1.z.literal('monthly')
]);
exports.standardStateSchema = zod_1.z.union([zod_1.z.literal('active'), zod_1.z.literal('archived')]);
exports.standardSessionConfigSchema = zod_1.z.object({
    sessionLabel: zod_1.z.string().min(1).max(40),
    sessionsPerCadence: zod_1.z.number().int().positive(),
    volumePerSession: zod_1.z.number().positive(),
});
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
    notes: zod_1.z.string().max(1000).nullable().default(null),
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
    summary: zod_1.z.string().min(1).max(200), // Normalized summary string like "1000 calls / week" or "5 sessions × 15 minutes = 75 minutes / week"
    archivedAtMs: timestampMsSchema.nullable(), // Timestamp when archived, null if active
    quickAddValues: zod_1.z.array(zod_1.z.number().positive()).max(5).optional(),
    sessionConfig: exports.standardSessionConfigSchema, // Required: session-based configuration
    createdAtMs: timestampMsSchema,
    updatedAtMs: timestampMsSchema,
    deletedAtMs: timestampMsSchema.nullable()
}).refine((data) => data.minimum === data.sessionConfig.sessionsPerCadence * data.sessionConfig.volumePerSession, {
    message: 'minimum must equal sessionsPerCadence × volumePerSession',
    path: ['minimum'],
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
exports.dashboardPinsSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    pinnedStandardIds: zod_1.z.array(zod_1.z.string().min(1)),
    updatedAtMs: timestampMsSchema
});
//# sourceMappingURL=schemas.js.map