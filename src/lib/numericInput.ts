export interface NumericInputOptions {
  /** Smallest value that can be committed. Negative input is not supported. */
  readonly min?: number
  /** Largest value that can be entered or committed. */
  readonly max?: number
  /** Number of fractional digits accepted by the keypad. */
  readonly maximumFractionDigits?: number
  /** Distance between generated preset values. */
  readonly presetStep?: number
  /** Distance generated on either side of the current value. */
  readonly presetRange?: number
}

export interface ResolvedNumericInputOptions {
  readonly min: number
  readonly max: number
  readonly maximumFractionDigits: number
  readonly presetStep: number
  readonly presetRange: number
}

export interface NumericEditingState {
  readonly text: string
  readonly fresh: boolean
}

export type NumericInputAction =
  | { readonly type: 'digit'; readonly digit: string }
  | { readonly type: 'decimal' }
  | { readonly type: 'backspace' }
  | { readonly type: 'preset'; readonly value: number }

export type NumericInputKeyboardCommand = NumericInputAction | { readonly type: 'confirm' }

const DEFAULT_OPTIONS: ResolvedNumericInputOptions = {
  min: 0,
  max: 999,
  maximumFractionDigits: 0,
  presetStep: 1,
  presetRange: 10,
}

const MAXIMUM_FRACTION_DIGITS = 6
const MAXIMUM_PRESET_STEPS_EACH_SIDE = 20

function finiteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback
}

function roundTo(value: number, fractionDigits: number): number {
  const factor = 10 ** fractionDigits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function clamp(value: number, options: ResolvedNumericInputOptions): number {
  return Math.min(options.max, Math.max(options.min, value))
}

function normalizeValue(value: number, options: ResolvedNumericInputOptions): number {
  return clamp(roundTo(value, options.maximumFractionDigits), options)
}

function parseEditingText(text: string): number {
  const parsed = Number.parseFloat(text)
  return Number.isFinite(parsed) ? parsed : 0
}

function editableText(value: number, options: ResolvedNumericInputOptions): string {
  return String(normalizeValue(value, options))
}

function appendDigit(
  state: NumericEditingState,
  digit: string,
  options: ResolvedNumericInputOptions,
): NumericEditingState {
  if (!/^\d$/.test(digit)) return state

  const currentFractionDigits = state.text.includes('.')
    ? (state.text.split('.')[1]?.length ?? 0)
    : 0
  if (
    !state.fresh &&
    state.text.includes('.') &&
    currentFractionDigits >= options.maximumFractionDigits
  )
    return state

  const candidate = state.fresh || state.text === '0' ? digit : `${state.text}${digit}`
  if (parseEditingText(candidate) > options.max) return state

  return { text: candidate, fresh: false }
}

function appendDecimal(
  state: NumericEditingState,
  options: ResolvedNumericInputOptions,
): NumericEditingState {
  if (options.maximumFractionDigits === 0 || state.text.includes('.')) return state
  return { text: state.fresh ? '0.' : `${state.text}.`, fresh: false }
}

function removeLastCharacter(state: NumericEditingState): NumericEditingState {
  const shortened = state.text.slice(0, -1)
  return { text: shortened === '' ? '0' : shortened, fresh: false }
}

export function resolveNumericInputOptions(
  input: NumericInputOptions = {},
): ResolvedNumericInputOptions {
  const min = Math.max(0, finiteOr(input.min, DEFAULT_OPTIONS.min))
  const max = Math.max(min, finiteOr(input.max, DEFAULT_OPTIONS.max))
  const maximumFractionDigits = Math.min(
    MAXIMUM_FRACTION_DIGITS,
    Math.max(0, Math.trunc(finiteOr(input.maximumFractionDigits, 0))),
  )
  const presetStep = Math.max(Number.EPSILON, finiteOr(input.presetStep, 1))
  const requestedRange = Math.max(0, finiteOr(input.presetRange, presetStep * 10))
  const presetRange = Math.min(
    requestedRange,
    presetStep * MAXIMUM_PRESET_STEPS_EACH_SIDE,
    max - min,
  )

  return { min, max, maximumFractionDigits, presetStep, presetRange }
}

export function beginNumericEditing(
  value: number,
  input: NumericInputOptions | ResolvedNumericInputOptions = {},
): NumericEditingState {
  const options = resolveNumericInputOptions(input)
  return { text: editableText(value, options), fresh: true }
}

export function updateNumericEditing(
  state: NumericEditingState,
  action: NumericInputAction,
  input: NumericInputOptions | ResolvedNumericInputOptions = {},
): NumericEditingState {
  const options = resolveNumericInputOptions(input)

  switch (action.type) {
    case 'digit':
      return appendDigit(state, action.digit, options)
    case 'decimal':
      return appendDecimal(state, options)
    case 'backspace':
      return removeLastCharacter(state)
    case 'preset':
      return beginNumericEditing(action.value, options)
  }
}

export function commitNumericEditing(
  state: NumericEditingState,
  input: NumericInputOptions | ResolvedNumericInputOptions = {},
): number {
  const options = resolveNumericInputOptions(input)
  return normalizeValue(parseEditingText(state.text), options)
}

export function generateNumericPresets(
  currentValue: number,
  input: NumericInputOptions | ResolvedNumericInputOptions = {},
): ReadonlyArray<number> {
  const options = resolveNumericInputOptions(input)
  const current = commitNumericEditing(beginNumericEditing(currentValue, options), options)
  const start = Math.ceil(Math.max(options.min, current - options.presetRange) / options.presetStep)
  const end = Math.floor(Math.min(options.max, current + options.presetRange) / options.presetStep)
  const values = Array.from({ length: Math.max(0, end - start + 1) }, (_, index) =>
    normalizeValue((start + index) * options.presetStep, options),
  )

  return [...new Set([...values, current])].sort((left, right) => left - right)
}

export function normalizeNumericPresets(
  presets: ReadonlyArray<number>,
  input: NumericInputOptions | ResolvedNumericInputOptions = {},
): ReadonlyArray<number> {
  const options = resolveNumericInputOptions(input)
  return [
    ...new Set(
      presets
        .filter((value) => Number.isFinite(value) && value >= options.min && value <= options.max)
        .map((value) => normalizeValue(value, options)),
    ),
  ].sort((left, right) => left - right)
}

export function numericInputKeyboardCommand(key: string): NumericInputKeyboardCommand | undefined {
  if (/^\d$/.test(key)) return { type: 'digit', digit: key }
  if (key === '.' || key === ',') return { type: 'decimal' }
  if (key === 'Backspace' || key === 'Delete') return { type: 'backspace' }
  if (key === 'Enter') return { type: 'confirm' }
  return undefined
}

export function numericDecimalSeparator(locale: string): string {
  return (
    new Intl.NumberFormat(locale).formatToParts(1.1).find((part) => part.type === 'decimal')
      ?.value ?? '.'
  )
}

export function localizeNumericEditingText(text: string, locale: string): string {
  return text.replace('.', numericDecimalSeparator(locale))
}

export function formatNumericValue(
  value: number,
  locale: string,
  maximumFractionDigits: number,
): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    useGrouping: false,
  }).format(value)
}
