import type { CVData } from '@/types'
import type { ValidationError } from '@/types/multiFileManager.types'

export function validateCVData(
  data: CVData,
  sources: Record<string, string | string[]>,
): ValidationError[] {
  const errors: ValidationError[] = []

  if (data.workExperience) {
    errors.push(...validateWorkExperience(data.workExperience, sources.workExperience))
  }

  return errors
}

function validateWorkExperience(
  workExperience: unknown,
  sourceFile: string | string[],
): ValidationError[] {
  const errors: ValidationError[] = []

  if (!Array.isArray(workExperience)) {
    errors.push({
      field: 'workExperience',
      message: 'workExperience must be an array',
      sourceFile,
      expected: 'array',
      actual: typeof workExperience,
      severity: 'error',
    })
    return errors
  }

  workExperience.forEach((item: unknown, index: number) => {
    const itemErrors = validateWorkExperienceItem(item, index, sourceFile)
    errors.push(...itemErrors)
  })

  return errors
}

function validateWorkExperienceItem(
  item: unknown,
  index: number,
  sourceFile: string | string[],
): ValidationError[] {
  const errors: ValidationError[] = []

  if (typeof item !== 'object' || item === null) {
    errors.push({
      field: `workExperience[${index}]`,
      message: 'Work experience item must be an object',
      sourceFile,
      expected: 'object',
      actual: typeof item,
      severity: 'error',
    })
    return errors
  }

  const workItem = item as Record<string, unknown>
  const requiredFields = ['location', 'icon', 'details']

  requiredFields.forEach((field) => {
    if (!(field in workItem)) {
      errors.push({
        field: `workExperience[${index}].${field}`,
        message: `Missing required field: ${field}`,
        sourceFile,
        expected: field === 'details' ? 'array of details' : 'string',
        actual: 'undefined',
        severity: 'error',
      })
    }
  })

  if ('details' in workItem) {
    const details = workItem.details
    if (!Array.isArray(details)) {
      errors.push({
        field: `workExperience[${index}].details`,
        message: 'details must be an array, not an object or other type',
        sourceFile,
        expected: "array (e.g., [{subhead: '...', lines: [...]}])",
        actual: Array.isArray(details)
          ? 'array'
          : typeof details === 'object'
            ? `object with keys: ${Object.keys(details as object).join(', ')}`
            : typeof details,
        severity: 'error',
      })
    } else {
      details.forEach((detail: unknown, detailIndex: number) => {
        const detailErrors = validateWorkExperienceDetail(detail, index, detailIndex, sourceFile)
        errors.push(...detailErrors)
      })
    }
  }

  return errors
}

function validateWorkExperienceDetail(
  detail: unknown,
  itemIndex: number,
  detailIndex: number,
  sourceFile: string | string[],
): ValidationError[] {
  const errors: ValidationError[] = []

  if (typeof detail !== 'object' || detail === null) {
    errors.push({
      field: `workExperience[${itemIndex}].details[${detailIndex}]`,
      message: 'Work experience detail must be an object',
      sourceFile,
      expected: 'object with subhead and lines',
      actual: typeof detail,
      severity: 'error',
    })
    return errors
  }

  const detailObj = detail as Record<string, unknown>

  if (!('lines' in detailObj)) {
    errors.push({
      field: `workExperience[${itemIndex}].details[${detailIndex}].lines`,
      message: 'Missing required field: lines',
      sourceFile,
      expected: 'array',
      actual: 'undefined',
      severity: 'error',
    })
  } else if (!Array.isArray(detailObj.lines)) {
    errors.push({
      field: `workExperience[${itemIndex}].details[${detailIndex}].lines`,
      message: 'lines must be an array',
      sourceFile,
      expected: 'array',
      actual: typeof detailObj.lines,
      severity: 'error',
    })
  }

  return errors
}
