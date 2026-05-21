export type SpacingValue = number | number[]

export function resolveSpacingValue(
  value: SpacingValue | undefined,
  index: number,
  fallback: number,
): number {
  if (value === undefined) return fallback
  if (typeof value === 'number') return value
  if (index < value.length) return value[index]
  return value[value.length - 1]
}
