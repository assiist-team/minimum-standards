import { z } from 'zod';
export declare const activityInputTypeSchema: z.ZodUnion<[z.ZodLiteral<"number">, z.ZodLiteral<"yes_no">]>;
export declare const standardCadenceSchema: z.ZodUnion<[z.ZodLiteral<"daily">, z.ZodLiteral<"weekly">, z.ZodLiteral<"monthly">]>;
export declare const standardStateSchema: z.ZodUnion<[z.ZodLiteral<"active">, z.ZodLiteral<"archived">]>;
export declare const activitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    unit: z.ZodEffects<z.ZodString, string, string>;
    inputType: z.ZodUnion<[z.ZodLiteral<"number">, z.ZodLiteral<"yes_no">]>;
    createdAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    updatedAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    deletedAtMs: z.ZodNullable<z.ZodEffects<z.ZodNumber, number, number>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    unit: string;
    inputType: "number" | "yes_no";
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
}, {
    id: string;
    name: string;
    unit: string;
    inputType: "number" | "yes_no";
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
}>;
export declare const standardSchema: z.ZodObject<{
    id: z.ZodString;
    activityId: z.ZodString;
    minimum: z.ZodNumber;
    unit: z.ZodString;
    cadence: z.ZodUnion<[z.ZodLiteral<"daily">, z.ZodLiteral<"weekly">, z.ZodLiteral<"monthly">]>;
    state: z.ZodUnion<[z.ZodLiteral<"active">, z.ZodLiteral<"archived">]>;
    createdAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    updatedAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    deletedAtMs: z.ZodNullable<z.ZodEffects<z.ZodNumber, number, number>>;
}, "strip", z.ZodTypeAny, {
    minimum: number;
    id: string;
    unit: string;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
    activityId: string;
    cadence: "daily" | "weekly" | "monthly";
    state: "active" | "archived";
}, {
    minimum: number;
    id: string;
    unit: string;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
    activityId: string;
    cadence: "daily" | "weekly" | "monthly";
    state: "active" | "archived";
}>;
export declare const activityLogSchema: z.ZodObject<{
    id: z.ZodString;
    standardId: z.ZodString;
    value: z.ZodNumber;
    occurredAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    note: z.ZodNullable<z.ZodString>;
    editedAtMs: z.ZodNullable<z.ZodEffects<z.ZodNumber, number, number>>;
    createdAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    updatedAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    deletedAtMs: z.ZodNullable<z.ZodEffects<z.ZodNumber, number, number>>;
}, "strip", z.ZodTypeAny, {
    value: number;
    id: string;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
    standardId: string;
    occurredAtMs: number;
    note: string | null;
    editedAtMs: number | null;
}, {
    value: number;
    id: string;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
    standardId: string;
    occurredAtMs: number;
    note: string | null;
    editedAtMs: number | null;
}>;
export type ActivitySchema = z.infer<typeof activitySchema>;
export type StandardSchema = z.infer<typeof standardSchema>;
export type ActivityLogSchema = z.infer<typeof activityLogSchema>;
