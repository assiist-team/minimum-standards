## Data evolution best practices (Firestore)

> Assumes Firestore + Firebase tooling defined in `profiles/react-firebase/standards/global/tech-stack.md`. Update that canonical stack first if we migrate to another data store.

- **Controlled rollout**: Treat every schema change (new field, collection, index) as a migration. Track them in code (e.g., `/migrations/YYYYMMDD-description.ts`) even though Firestore is schemaless.
- **Backfill scripts**: Use Cloud Functions admin scripts or one-off Node scripts that run against the Firebase Emulator first, then against production with safety checks.
- **Idempotent ops**: Write migrations so they can resume after failure (skip docs already updated, use batch/chunk processing).
- **Index lifecycle**: Add required composite indexes via `firestore.indexes.json` and deploy them before code that depends on them ships.
- **Feature flags**: Gate reads of new fields/collections behind Remote Config or code flags until the migration completes everywhere.
- **Backups**: Export collections (via `gcloud firestore export`) before destructive changes; document restore commands alongside the migration.
- **Rollbacks**: Prefer additive changes; when removal is unavoidable, keep the old data for at least one release cycle to enable rollback.
