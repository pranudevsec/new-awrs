/**
 * Utility functions for approved marks validation
 * Uses the same logic as the existing max validation in citation/appreciation pages
 */

/**
 * Calculates approved marks from approved count using the same logic as citation/appreciation
 * This is the core logic that should be used - marks are calculated, not entered directly
 * @param approvedCount - The approved count value
 * @param perUnitMark - The per unit mark value from the parameter
 * @param maxMarks - The maximum allowed marks for this parameter
 * @returns The calculated and capped approved marks
 */

/**
 * Validates approved marks against the original parameter max marks
 * Uses the same Math.min logic as the existing citation/appreciation validation
 * @param approvedMarks - The approved marks value (string or number)
 * @param originalMarks - The original marks from the citation (string or number)
 * @param maxMarks - The maximum allowed marks for this parameter (string or number)
 * @returns Object with validation result and details
 */
export const validateApprovedMarks = (
  approvedMarks: string | number,
  originalMarks: string | number,
  maxMarks: string | number
): { isValid: boolean; message?: string; maxAllowed?: number } => {

  const approved = Number(approvedMarks) || 0;
  const original = Number(originalMarks) || 0;
  const max = Number(maxMarks) || 0;


  if (isNaN(approved) || approved < 0) {
    return {
      isValid: false,
      message: 'Approved marks must be a valid non-negative number'
    };
  }


  const effectiveMax = Math.min(original, max);
  

  if (approved > effectiveMax) {
    return {
      isValid: false,
      message: `Approved marks (${approved}) cannot exceed the effective maximum (${effectiveMax})`,
      maxAllowed: effectiveMax
    };
  }

  return {
    isValid: true,
    message: `Approved marks: ${approved}/${effectiveMax}`
  };
};

/**
 * Gets the effective maximum allowed marks for a parameter
 * Uses the same Math.min logic as the existing system
 * @param originalMarks - The original marks from the citation
 * @param maxMarks - The maximum allowed marks for this parameter
 * @returns The effective maximum (minimum of original and max marks)
 */
export const getEffectiveMaxMarks = (
  originalMarks: string | number,
  maxMarks: string | number
): number => {
  const original = Number(originalMarks) || 0;
  const max = Number(maxMarks) || 0;
  return Math.min(original, max);
};

/**
 * Formats the max marks display text
 * Shows the same format as the existing citation/appreciation system
 * @param originalMarks - The original marks from the citation
 * @param maxMarks - The maximum allowed marks for this parameter
 * @returns Formatted display text
 */
export const getMaxMarksDisplayText = (
  originalMarks: string | number,
  maxMarks: string | number
): string => {
  const original = Number(originalMarks) || 0;
  const max = Number(maxMarks) || 0;
  const effectiveMax = Math.min(original, max);
  
  if (original === max) {
    return `Max: ${effectiveMax}`;
  } else {
    return `Max: ${effectiveMax} (Original: ${original}, Param Max: ${max})`;
  }
};

/**
 * Calculates approved marks using the same logic as citation/appreciation
 * This ensures consistency across the application
 * @param count - The count value
 * @param perUnitMark - The per unit mark value
 * @param maxMarks - The maximum marks allowed
 * @returns The calculated and capped marks
 */
export const calculateApprovedMarks = (
  count: number,
  perUnitMark: number,
  maxMarks: number
): number => {
  const calculatedMarks = count * perUnitMark;
  return Math.min(calculatedMarks, maxMarks);
};
