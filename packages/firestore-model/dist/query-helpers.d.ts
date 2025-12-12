import { QueryConstraint } from 'firebase/firestore';
export declare function whereNotDeleted(): QueryConstraint;
export declare function orderByUpdatedAtDesc(): QueryConstraint;
export declare function orderByOccurredAtDesc(): QueryConstraint;
export declare function whereStandardIdEquals(standardId: string): QueryConstraint;
export declare function whereStandardStateEquals(state: 'active' | 'archived'): QueryConstraint;
