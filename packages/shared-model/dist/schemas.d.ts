import { z } from 'zod';
export declare const cadenceUnitSchema: z.ZodEnum<["day", "week", "month"]>;
export declare const standardCadenceSchema: z.ZodObject<{
    interval: z.ZodNumber;
    unit: z.ZodEnum<["day", "week", "month"]>;
}, "strip", z.ZodTypeAny, {
    interval: number;
    unit: "day" | "week" | "month";
}, {
    interval: number;
    unit: "day" | "week" | "month";
}>;
export declare const legacyStandardCadenceSchema: z.ZodUnion<[z.ZodLiteral<"daily">, z.ZodLiteral<"weekly">, z.ZodLiteral<"monthly">]>;
export declare const standardStateSchema: z.ZodUnion<[z.ZodLiteral<"active">, z.ZodLiteral<"archived">]>;
export declare const standardSessionConfigSchema: z.ZodObject<{
    sessionLabel: z.ZodString;
    sessionsPerCadence: z.ZodNumber;
    volumePerSession: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sessionLabel: string;
    sessionsPerCadence: number;
    volumePerSession: number;
}, {
    sessionLabel: string;
    sessionsPerCadence: number;
    volumePerSession: number;
}>;
export declare const activitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    unit: z.ZodEffects<z.ZodString, string, string>;
    notes: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    createdAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    updatedAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    deletedAtMs: z.ZodNullable<z.ZodEffects<z.ZodNumber, number, number>>;
}, "strip", z.ZodTypeAny, {
    unit: string;
    id: string;
    name: string;
    notes: string | null;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
}, {
    unit: string;
    id: string;
    name: string;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
    notes?: string | null | undefined;
}>;
export declare const standardSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    activityId: z.ZodString;
    minimum: z.ZodNumber;
    unit: z.ZodString;
    cadence: z.ZodObject<{
        interval: z.ZodNumber;
        unit: z.ZodEnum<["day", "week", "month"]>;
    }, "strip", z.ZodTypeAny, {
        interval: number;
        unit: "day" | "week" | "month";
    }, {
        interval: number;
        unit: "day" | "week" | "month";
    }>;
    state: z.ZodUnion<[z.ZodLiteral<"active">, z.ZodLiteral<"archived">]>;
    summary: z.ZodString;
    archivedAtMs: z.ZodNullable<z.ZodEffects<z.ZodNumber, number, number>>;
    quickAddValues: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    sessionConfig: z.ZodObject<{
        sessionLabel: z.ZodString;
        sessionsPerCadence: z.ZodNumber;
        volumePerSession: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sessionLabel: string;
        sessionsPerCadence: number;
        volumePerSession: number;
    }, {
        sessionLabel: string;
        sessionsPerCadence: number;
        volumePerSession: number;
    }>;
    createdAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    updatedAtMs: z.ZodEffects<z.ZodNumber, number, number>;
    deletedAtMs: z.ZodNullable<z.ZodEffects<z.ZodNumber, number, number>>;
}, "strip", z.ZodTypeAny, {
    unit: string;
    minimum: number;
    id: string;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
    activityId: string;
    cadence: {
        interval: number;
        unit: "day" | "week" | "month";
    };
    state: "active" | "archived";
    summary: string;
    archivedAtMs: number | null;
    sessionConfig: {
        sessionLabel: string;
        sessionsPerCadence: number;
        volumePerSession: number;
    };
    quickAddValues?: number[] | undefined;
}, {
    unit: string;
    minimum: number;
    id: string;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
    activityId: string;
    cadence: {
        interval: number;
        unit: "day" | "week" | "month";
    };
    state: "active" | "archived";
    summary: string;
    archivedAtMs: number | null;
    sessionConfig: {
        sessionLabel: string;
        sessionsPerCadence: number;
        volumePerSession: number;
    };
    quickAddValues?: number[] | undefined;
}>, {
    unit: string;
    minimum: number;
    id: string;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
    activityId: string;
    cadence: {
        interval: number;
        unit: "day" | "week" | "month";
    };
    state: "active" | "archived";
    summary: string;
    archivedAtMs: number | null;
    sessionConfig: {
        sessionLabel: string;
        sessionsPerCadence: number;
        volumePerSession: number;
    };
    quickAddValues?: number[] | undefined;
}, {
    unit: string;
    minimum: number;
    id: string;
    createdAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
    activityId: string;
    cadence: {
        interval: number;
        unit: "day" | "week" | "month";
    };
    state: "active" | "archived";
    summary: string;
    archivedAtMs: number | null;
    sessionConfig: {
        sessionLabel: string;
        sessionsPerCadence: number;
        volumePerSession: number;
    };
    quickAddValues?: number[] | undefined;
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
export type DashboardPinsSchema = z.infer<typeof dashboardPinsSchema>;
export declare const dashboardPinsSchema: z.ZodObject<{
    id: z.ZodString;
    pinnedStandardIds: z.ZodArray<z.ZodString, "many">;
    updatedAtMs: z.ZodEffects<z.ZodNumber, number, number>;
}, "strip", z.ZodTypeAny, {
    id: string;
    updatedAtMs: number;
    pinnedStandardIds: string[];
}, {
    id: string;
    updatedAtMs: number;
    pinnedStandardIds: string[];
}>;
