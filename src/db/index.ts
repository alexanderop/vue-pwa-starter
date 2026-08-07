/**
 * Public surface of the persistence layer. Everything outside src/db
 * imports from here — never from schema.ts or the repositories directly.
 * That keeps the storage engine swappable and is enforced by the
 * architecture tests (src/__tests__/architecture).
 */
export { exportData, importData } from './backup'
export type { Note } from './converters'
export type { NoteDraft } from './repositories/notes'
export { createNote, deleteNote, listNotes, updateNote } from './repositories/notes'
export { resetDatabase } from './schema'
