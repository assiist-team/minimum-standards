import { z } from 'zod';

const timestampMsSchema = z
  .number()
  .int()
  .nonnegative()
  .refine((v) => Number.isFinite(v), 'timestampMs must be finite');

export const activityInputTypeSchema = z.union([z.literal('number'), z.literal('yes_no')]);
export const standardCadenceSchema = z.union([
  z.literal('daily'),
  z.literal('weekly'),
  z.literal('monthly')
]);
export const standardStateSchema = z.union([z.literal('active'), z.literal('archived')]);

export const activitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  unit: z.string().min(1).max(40),
  inputType: activityInputTypeSchema,
  createdAtMs: timestampMsSchema,
  updatedAtMs: timestampMsSchema,
  deletedAtMs: timestampMsSchema.nullable()
});

export const standardSchema = z.object({
  id: z.string().min(1),
  activityId: z.string().min(1),
  minimum: z.number().min(0),
  unit: z.string().min(1).max(40),
  cadence: standardCadenceSchema,
  state: standardStateSchema,
  createdAtMs: timestampMsSchema,
  updatedAtMs: timestampMsSchema,
  deletedAtMs: timestampMsSchema.nullable()
});

export const activityLogSchema = z.object({
  id: z.string().min(1),
  standardId: z.string().min(1),
  value: z.number().min(0),
  occurredAtMs: timestampMsSchema,
  note: z.string().max(500).nullable(),
  editedAtMs: timestampMsSchema.nullable(),
  createdAtMs: timestampMsSchema,
  updatedAtMs: timestampMsSchema,
  deletedAtMs: timestampMsSchema.nullable()
});

export type ActivitySchema = z.infer<typeof activitySchema>;
export type StandardSchema = z.infer<typeof standardSchema>;
export type ActivityLogSchema = z.infer<typeof activityLogSchema>;
