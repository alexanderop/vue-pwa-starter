/**
 * Public surface of the persistence layer. Everything outside src/db
 * imports from here — never from schema.ts or the repositories directly.
 * That keeps the storage engine swappable and is enforced by the
 * architecture tests (src/__tests__/architecture).
 *
 * The API is Effect-based: each operation is a program with its failures in
 * the type (`Effect<A, DatabaseError | …>`). Compose those programs with
 * `Effect.*` combinators all the way into the component, handle every
 * failure with `Effect.catchTag`/`Effect.catchTags`, and hand the result —
 * error channel `never` — to `runDb`, which is the only place a program
 * actually executes.
 */
export { exportData, importData } from './backup'
export type { Note, NoteDraft } from './converters'
export { isNoteDraft } from './converters'
export { BackupInvalidError, DatabaseError, NoteInvalidError } from './errors'
export {
  createNote,
  deleteNote,
  listNotes,
  toggleNotePinned,
  updateNote,
} from './repositories/notes'
export { runDb } from './runtime'
export { resetDatabase } from './schema'
