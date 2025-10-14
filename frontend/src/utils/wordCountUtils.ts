/**
 * Utility functions for word counting and validation
 */

/**
 * Counts the number of words in a text string
 * @param text - The text to count words in
 * @returns The number of words
 */
export const countWords = (text: string): number => {
  if (!text || typeof text !== 'string') return 0;
  

  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Validates if text meets word count requirements
 * @param text - The text to validate
 * @param maxWords - Maximum allowed words (default: 200)
 * @param minWords - Minimum required words (default: 1)
 * @returns Object with validation result and details
 */
export const validateWordCount = (
  text: string, 
  maxWords: number = 200, 
  minWords: number = 1
): { isValid: boolean; wordCount: number; message?: string } => {
  const wordCount = countWords(text);
  
  if (wordCount < minWords) {
    return {
      isValid: false,
      wordCount,
      message: `Text must contain at least ${minWords} word${minWords > 1 ? 's' : ''}. Current word count: ${wordCount}`
    };
  }
  
  if (wordCount > maxWords) {
    return {
      isValid: false,
      wordCount,
      message: `Text must not exceed ${maxWords} words. Current word count: ${wordCount}`
    };
  }
  
  return {
    isValid: true,
    wordCount,
    message: `Word count: ${wordCount}/${maxWords}`
  };
};

/**
 * Validates clarification text with specific requirements
 * @param text - The clarification text to validate
 * @returns Object with validation result and details
 */
export const validateClarificationText = (text: string): { isValid: boolean; wordCount: number; message?: string } => {

  if (!text || !text.trim()) {
    return {
      isValid: false,
      wordCount: 0,
      message: 'Please enter clarification text'
    };
  }
  

  if (text.trim().length < 10) {
    return {
      isValid: false,
      wordCount: countWords(text),
      message: 'Clarification must be at least 10 characters long'
    };
  }
  

  return validateWordCount(text, 200, 1);
};

/**
 * Validates reviewer comment with specific requirements
 * @param text - The reviewer comment to validate
 * @returns Object with validation result and details
 */
export const validateReviewerComment = (text: string): { isValid: boolean; wordCount: number; message?: string } => {

  if (!text || !text.trim()) {
    return {
      isValid: false,
      wordCount: 0,
      message: 'Please enter reviewer comment'
    };
  }
  

  if (text.trim().length < 10) {
    return {
      isValid: false,
      wordCount: countWords(text),
      message: 'Reviewer comment must be at least 10 characters long'
    };
  }
  

  return validateWordCount(text, 200, 1);
};
