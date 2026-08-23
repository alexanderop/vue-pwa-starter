import { describe, expect, it } from 'vitest'
import {
  beginNumericEditing,
  commitNumericEditing,
  generateNumericPresets,
  localizeNumericEditingText,
  normalizeNumericPresets,
  numericInputKeyboardCommand,
  resolveNumericInputOptions,
  updateNumericEditing,
} from '@/lib/numericInput'

const WEIGHT_OPTIONS = {
  min: 0,
  max: 500,
  maximumFractionDigits: 2,
  presetStep: 2.5,
  presetRange: 10,
} as const

describe('numeric input editing', () => {
  it('replaces the initial value with the first digit and appends later digits', () => {
    const initial = beginNumericEditing(70, WEIGHT_OPTIONS)
    const replaced = updateNumericEditing(initial, { type: 'digit', digit: '8' }, WEIGHT_OPTIONS)
    const appended = updateNumericEditing(replaced, { type: 'digit', digit: '5' }, WEIGHT_OPTIONS)

    expect(replaced).toEqual({ text: '8', fresh: false })
    expect(commitNumericEditing(appended, WEIGHT_OPTIONS)).toBe(85)
  })

  it('appends multiple digits with the default integer precision', () => {
    const entered = ['1', '2', '3'].reduce(
      (state, digit) => updateNumericEditing(state, { type: 'digit', digit }),
      beginNumericEditing(0),
    )

    expect(entered.text).toBe('123')
    expect(commitNumericEditing(entered)).toBe(123)
  })

  it('preserves an unfinished decimal while editing', () => {
    const initial = beginNumericEditing(70, WEIGHT_OPTIONS)
    const decimal = updateNumericEditing(initial, { type: 'decimal' }, WEIGHT_OPTIONS)
    const fraction = updateNumericEditing(decimal, { type: 'digit', digit: '5' }, WEIGHT_OPTIONS)

    expect(decimal.text).toBe('0.')
    expect(fraction.text).toBe('0.5')
    expect(commitNumericEditing(fraction, WEIGHT_OPTIONS)).toBe(0.5)
  })

  it('limits fractional digits and rejects values above the maximum', () => {
    const initial = beginNumericEditing(0, { ...WEIGHT_OPTIONS, max: 12.25 })
    const entered = ['1', '2', '.', '2', '5', '9'].reduce(
      (state, character) =>
        updateNumericEditing(
          state,
          character === '.' ? { type: 'decimal' } : { type: 'digit', digit: character },
          { ...WEIGHT_OPTIONS, max: 12.25 },
        ),
      initial,
    )

    expect(entered.text).toBe('12.25')
  })

  it('allows editing below the minimum but clamps only when committed', () => {
    const options = { ...WEIGHT_OPTIONS, min: 5 }
    const edited = updateNumericEditing(
      beginNumericEditing(20, options),
      { type: 'digit', digit: '1' },
      options,
    )

    expect(edited.text).toBe('1')
    expect(commitNumericEditing(edited, options)).toBe(5)
  })

  it('clamps after rounding so unaligned bounds are never crossed', () => {
    const maximumOptions = { max: 1.236, maximumFractionDigits: 2 }
    const minimumOptions = { min: 1.234, max: 2, maximumFractionDigits: 2 }

    expect(commitNumericEditing({ text: '1.235', fresh: false }, maximumOptions)).toBe(1.236)
    expect(commitNumericEditing({ text: '1.234', fresh: false }, minimumOptions)).toBe(1.234)
    expect(beginNumericEditing(1.235, maximumOptions).text).toBe('1.236')
  })

  it('backspace edits the existing value instead of replacing it', () => {
    const edited = updateNumericEditing(
      beginNumericEditing(75, WEIGHT_OPTIONS),
      { type: 'backspace' },
      WEIGHT_OPTIONS,
    )

    expect(edited).toEqual({ text: '7', fresh: false })
  })
})

describe('numeric input presets', () => {
  it('centres step-aligned presets around the current value and keeps an off-grid value', () => {
    expect(generateNumericPresets(71, WEIGHT_OPTIONS)).toEqual([
      62.5, 65, 67.5, 70, 71, 72.5, 75, 77.5, 80,
    ])
  })

  it('filters custom presets to the configured range, precision, and order', () => {
    expect(normalizeNumericPresets([12.256, -1, 10, 12.254, 600, 10], WEIGHT_OPTIONS)).toEqual([
      10, 12.25, 12.26,
    ])
  })

  it('keeps normalized presets within unaligned bounds', () => {
    expect(
      normalizeNumericPresets([1.234, 1.235], { max: 1.236, maximumFractionDigits: 2 }),
    ).toEqual([1.23, 1.236])
  })

  it('caps a pathological preset range to a bounded set', () => {
    const presets = generateNumericPresets(250, {
      ...WEIGHT_OPTIONS,
      presetStep: 0.01,
      presetRange: 10_000,
    })

    expect(presets.length).toBeLessThanOrEqual(42)
  })
})

describe('numeric input configuration and keyboards', () => {
  it('normalizes invalid constraints without producing negative input', () => {
    expect(
      resolveNumericInputOptions({
        min: -10,
        max: -20,
        maximumFractionDigits: 99,
        presetStep: 0,
      }),
    ).toMatchObject({ min: 0, max: 0, maximumFractionDigits: 6 })
  })

  it('maps physical digits, decimal separators, editing keys, and Enter', () => {
    expect(numericInputKeyboardCommand('5')).toEqual({ type: 'digit', digit: '5' })
    expect(numericInputKeyboardCommand(',')).toEqual({ type: 'decimal' })
    expect(numericInputKeyboardCommand('Backspace')).toEqual({ type: 'backspace' })
    expect(numericInputKeyboardCommand('Enter')).toEqual({ type: 'confirm' })
    expect(numericInputKeyboardCommand('ArrowUp')).toBeUndefined()
  })

  it('renders the editing decimal with the active locale', () => {
    expect(localizeNumericEditingText('70.', 'en')).toBe('70.')
    expect(localizeNumericEditingText('70.', 'de')).toBe('70,')
  })
})
