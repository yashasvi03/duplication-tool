/**
 * JSON Sanitizer Utility
 * 
 * Handles JavaScript number precision loss for large integer IDs (18-19 digits)
 * by converting them to strings before JSON.parse() is called.
 * 
 * Problem: JavaScript cannot safely represent integers > 2^53-1 (16 digits)
 * Solution: Pre-process JSON string to wrap large numeric IDs in quotes
 */

/**
 * Pre-process JSON string to wrap large numbers (18-19 digits) in quotes
 * This prevents JavaScript from losing precision when parsing
 * 
 * @param jsonString - Raw JSON string before parsing
 * @returns Preprocessed JSON string with large IDs as strings
 * 
 * @example
 * Input:  '{"id": 684743578985398272, "name": "test"}'
 * Output: '{"id": "684743578985398272", "name": "test"}'
 */
export function preprocessJSONString(jsonString: string): string {
  // Regex pattern to find all ID fields with 18-19 digit numbers
  // and wrap them in quotes to convert them to strings
  // 
  // Pattern breakdown:
  // - ("(?:id|...)"\s*:\s*) - Captures ID field name and colon
  // - (\d{18,19})\b - Captures 18-19 digit numbers (not followed by more digits)
  // - Replacement: $1"$2" - Wraps the number in quotes
  return jsonString.replace(
    /("(?:id|triggerEntityId|parameterId|taskId|stageId|checklistId|actionId|effectId|referencedParameterId)"\s*:\s*)(\d{18,19})\b/g,
    '$1"$2"'
  );
}

/**
 * Safe JSON parse that preserves large integer IDs
 * Use this instead of JSON.parse() for MES config files
 * 
 * @param jsonString - Raw JSON string to parse
 * @returns Parsed JavaScript object with IDs as strings
 * 
 * @example
 * const config = safeJSONParse(fileContent);
 * // All ID fields will be strings, not numbers
 */
export function safeJSONParse(jsonString: string): any {
  const preprocessed = preprocessJSONString(jsonString);
  return JSON.parse(preprocessed);
}

/**
 * Validate that all IDs in config are strings
 * Returns list of paths where numeric IDs were found
 * 
 * Useful for debugging and validation in development
 * 
 * @param config - Parsed configuration object
 * @param path - Starting path for recursion (default: 'root')
 * @returns Array of paths where numeric IDs were detected
 * 
 * @example
 * const issues = validateIDTypes(config);
 * if (issues.length > 0) {
 *   console.warn('Numeric IDs found:', issues);
 * }
 */
export function validateIDTypes(config: any, path: string = 'root'): string[] {
  const issues: string[] = [];

  function check(value: any, currentPath: string): void {
    if (value === null || value === undefined) return;

    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, val] of Object.entries(value)) {
        const newPath = `${currentPath}.${key}`;
        
        // Check if this is an ID field with numeric value
        if (key.toLowerCase().includes('id') && typeof val === 'number') {
          issues.push(`${newPath} = ${val} (number, should be string)`);
        }
        
        check(val, newPath);
      }
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        check(item, `${currentPath}[${index}]`);
      });
    }
  }

  check(config, path);
  return issues;
}
