# Local-first

This starter follows the [Ink & Switch local-first ideals](https://www.inkandswitch.com/local-first/). The ones that shape the code:

1. **No spinners** — every interaction hits IndexedDB on-device; nothing blocks on a network.
2. **Network optional** — the service worker precaches the app; it boots and works fully offline.
3. **The Long Now** — data written today must be readable by every future version of the app.
4. **Security & privacy by default** — data never leaves the device.
5. **Ownership & control** — the user can export everything, any time, as plain JSON.

## How the data layer implements this

### One public surface

All storage access goes through `src/db/index.ts`. Views, features, and composables import repositories from there — never Dexie directly. This is enforced by the ESLint boundary rules and the architecture tests, and it is what keeps the storage engine swappable (e.g. for a future sync engine).

### Schema changes are migrations plus converters — always both

`src/db/schema.ts` shows the worked example (v1 → v2 adds `pinned` and `updatedAt`):

- **The Dexie `upgrade()`** rewrites rows already in the database when the app updates.
- **The converter** (`src/db/converters.ts`) normalizes *any* stored row into a complete domain object at read time.

Why both? Because the migration only sees rows that were in the database at upgrade time. Old JSON backups imported later, or rows arriving from a future sync peer, bypass it. The stored type (`StoredDbNote`) keeps old-shape fields optional, so the compiler forces every read through the converter. The rule:

> Never trust the shape of stored data; trust the converter.

Both paths are tested: the upgrade in `src/__tests__/db/migration.spec.ts`, the converter in the unit tier, and the backup path in `src/__tests__/db/backup.spec.ts` (which imports a v1-era file).

### Persistent storage is requested at boot

`src/lib/persistentStorage.ts` calls `navigator.storage.persist()` from `src/main.ts`. Without it the origin's storage is *best effort*, and browsers treat that literally: Safari clears IndexedDB after seven days without a visit, Chrome and Firefox clear it when the disk gets tight. There is no server copy here, so eviction is not a cache miss — it is the user's data, gone.

The request can be denied, and browsers decide on their own engagement heuristics (installed to the home screen, bookmarked, used often). The outcome is logged, never surfaced: "the browser might delete your notes" is not something a user can act on. What they can act on is the export, which is why it exists.

The same quota is what the runtime caches in `vite.config.ts` draw from — see the note there on why the cache routes are restricted to same-origin requests.

### Export/import

`src/db/backup.ts` exports the whole database as versioned, human-readable JSON and validates imports with zod. The settings screen wires both up. When you add a table, add it to the backup payload in the same commit — a backup that silently misses a table is worse than none.

### What is deliberately out of scope

Multi-device sync and CRDTs. The seams for them exist (single db surface, converters, versioned export), but the starter stays honest: it ships what it tests.
