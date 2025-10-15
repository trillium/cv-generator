import { CVData as CVDataSchema } from "../src/types/cvdata.zod";
import type { CVData } from "../src/types";

/**
 * Validates a parsed data object against the CVData schema.
 * Throws an error if validation fails.
 * @param data - The parsed data object
 * @returns The validated CVData object
 */
export function validateCVData(data: unknown): CVData {
  const result = CVDataSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Input data does not match CVData schema: ${JSON.stringify(result.error.issues, null, 2)}`,
    );
  }
  return result.data as CVData;
}
