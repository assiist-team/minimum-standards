## Firestore query best practices

> These guidelines rely on Firestore per `profiles/react-firebase/standards/global/tech-stack.md`. Update that document first if the database changes so we don’t leave stale references here.

- **Security first**: Never rely on client-side filtering alone. Mirror every query constraint inside Firestore security rules (`request.resource`).
- **Narrow reads**: Always specify `where`, `orderBy`, and `limit` clauses to keep document counts reasonable; avoid unbounded collection scans.
- **Composite indexes**: For multiple `where` filters + `orderBy`, predefine the composite index and capture its definition in `firestore.indexes.json`.
- **Pagination**: Use cursor-based pagination with `startAfter` / `startAt` and a stable `orderBy` field (e.g., `createdAt`). Avoid offset-based pagination.
- **Array fields**: Use `array-contains` and `array-contains-any` sparingly; for high-cardinality tags, model them as join collections instead.
- **Transactions & batched writes**: Use Firestore transactions when multiple documents must stay consistent. Keep batches ≤500 writes and chain for larger jobs.
- **Caching**: Let Firestore SDK offline persistence + React Query caching handle most read caching. Invalidate cache keys after writes or remote config toggles.
- **Cost awareness**: Reads are billed per document, so design queries that fetch only what the UI needs; consider Cloud Functions or aggregations for expensive fan-out queries.
