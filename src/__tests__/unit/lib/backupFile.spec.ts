import { describe, expect, it } from 'vitest'
import { backupFilename } from '@/lib/backupFile'

describe('backupFilename', () => {
  it('stamps the file with the export date', () => {
    expect(backupFilename('2026-08-07T12:34:56.789Z')).toBe(
      'vue-pwa-starter-backup-2026-08-07.json',
    )
  })

  it('keeps only the date, never the time', () => {
    expect(backupFilename('2024-01-01T23:59:59.999Z')).not.toContain(':')
  })

  it('drops a timestamp that is not an ISO date rather than putting it in the name', () => {
    expect(backupFilename('yesterday')).toBe('vue-pwa-starter-backup.json')
    expect(backupFilename('')).toBe('vue-pwa-starter-backup.json')
  })

  it('never lets a hand-edited payload write a path into the filename', () => {
    expect(backupFilename('../../../etc/passwd')).toBe('vue-pwa-starter-backup.json')
  })
})
