import { beforeEach, describe, expect, it } from 'vitest'
import { createNote, exportData, importData, listNotes, resetDatabase } from '@/db'

describe('backup export/import', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('round-trips notes through export and import', async () => {
    await createNote({ title: 'Keep me', body: 'important' })
    const payload = await exportData()

    await resetDatabase()
    expect(await listNotes()).toHaveLength(0)

    const count = await importData(payload)

    expect(count).toBe(1)
    expect(await listNotes()).toMatchObject([{ title: 'Keep me', body: 'important' }])
  })

  it('imports a v1-era backup (rows without pinned/updatedAt)', async () => {
    const legacyPayload = {
      app: 'vue-pwa-starter',
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      notes: [{ id: 'legacy', title: 'From the past', body: '', createdAt: 42 }],
    }

    await importData(legacyPayload)

    expect(await listNotes()).toEqual([
      {
        id: 'legacy',
        title: 'From the past',
        body: '',
        pinned: false,
        createdAt: 42,
        updatedAt: 42,
      },
    ])
  })

  it('rejects payloads that are not backups', async () => {
    await expect(importData({ hello: 'world' })).rejects.toThrow()
    expect(await listNotes()).toHaveLength(0)
  })
})
