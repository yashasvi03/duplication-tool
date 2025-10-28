import type {
  ChecklistConfig,
  JsonValidationError,
  ConfigValidationError,
  DuplicationConfig,
} from '@/types';

/**
 * Validate JSON string format
 */
export function validateJsonFormat(input: string): {
  valid: boolean;
  error?: JsonValidationError;
  parsed?: any;
} {
  if (!input || input.trim() === '') {
    return {
      valid: false,
      error: {
        type: 'syntax',
        message: 'Input is empty',
      },
    };
  }

  try {
    const parsed = JSON.parse(input);
    return { valid: true, parsed };
  } catch (e) {
    const error = e as Error;
    const lineMatch = error.message.match(/position (\d+)/);
    const position = lineMatch ? parseInt(lineMatch[1]) : undefined;

    return {
      valid: false,
      error: {
        type: 'syntax',
        message: error.message,
        line: position,
      },
    };
  }
}

/**
 * Validate required fields in checklist configuration
 */
export function validateRequiredFields(config: any): {
  valid: boolean;
  errors: JsonValidationError[];
} {
  const errors: JsonValidationError[] = [];

  // Must be an array
  if (!Array.isArray(config)) {
    errors.push({
      type: 'schema',
      message: 'Configuration must be an array of checklist objects',
    });
    return { valid: false, errors };
  }

  // Check each checklist
  config.forEach((checklist, idx) => {
    if (!checklist.id) {
      errors.push({
        type: 'schema',
        message: `Checklist at index ${idx} is missing required field: id`,
        field: `[${idx}].id`,
      });
    }
    if (!checklist.name) {
      errors.push({
        type: 'schema',
        message: `Checklist at index ${idx} is missing required field: name`,
        field: `[${idx}].name`,
      });
    }
    if (!checklist.stageRequests) {
      errors.push({
        type: 'schema',
        message: `Checklist at index ${idx} is missing required field: stageRequests`,
        field: `[${idx}].stageRequests`,
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validate structure of the configuration
 */
export function validateStructure(config: ChecklistConfig[]): {
  valid: boolean;
  errors: JsonValidationError[];
} {
  const errors: JsonValidationError[] = [];

  config.forEach((checklist, cIdx) => {
    // Validate stages
    if (!Array.isArray(checklist.stageRequests)) {
      errors.push({
        type: 'structure',
        message: `Checklist "${checklist.name}": stageRequests must be an array`,
        field: `[${cIdx}].stageRequests`,
      });
      return;
    }

    checklist.stageRequests.forEach((stage, sIdx) => {
      if (!stage.id || !stage.name || stage.orderTree === undefined) {
        errors.push({
          type: 'structure',
          message: `Stage at index ${sIdx} in "${checklist.name}" is missing required fields`,
          field: `[${cIdx}].stageRequests[${sIdx}]`,
        });
      }

      // Validate tasks
      if (!Array.isArray(stage.taskRequests)) {
        errors.push({
          type: 'structure',
          message: `Stage "${stage.name}": taskRequests must be an array`,
          field: `[${cIdx}].stageRequests[${sIdx}].taskRequests`,
        });
        return;
      }

      stage.taskRequests.forEach((task, tIdx) => {
        if (!task.id || !task.name || task.orderTree === undefined) {
          errors.push({
            type: 'structure',
            message: `Task at index ${tIdx} in stage "${stage.name}" is missing required fields`,
            field: `[${cIdx}].stageRequests[${sIdx}].taskRequests[${tIdx}]`,
          });
        }

        // Validate parameters
        if (!Array.isArray(task.parameterRequests)) {
          errors.push({
            type: 'structure',
            message: `Task "${task.name}": parameterRequests must be an array`,
            field: `[${cIdx}].stageRequests[${sIdx}].taskRequests[${tIdx}].parameterRequests`,
          });
        }
      });
    });
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validate number of copies
 */
export function validateCopyCount(count: number): {
  valid: boolean;
  error?: string;
} {
  if (!Number.isInteger(count)) {
    return { valid: false, error: 'Must be a whole number' };
  }
  if (count < 1) {
    return { valid: false, error: 'Must be at least 1' };
  }
  if (count > 100) {
    return { valid: false, error: 'Maximum 100 copies allowed' };
  }
  return { valid: true };
}

/**
 * Validate naming pattern
 */
export function validateNamingPattern(
  pattern: string,
  baseName: string
): {
  valid: boolean;
  error?: string;
} {
  if (!pattern.includes('{n}')) {
    return { valid: false, error: 'Pattern must include {n} placeholder' };
  }

  // Generate a sample name to check length
  const sample = pattern
    .replace('{base_name}', baseName)
    .replace('{n}', '001');

  if (sample.length > 512) {
    return {
      valid: false,
      error: 'Generated names would be too long (>512 characters)',
    };
  }

  return { valid: true };
}

/**
 * Validate duplication configuration
 */
export function validateDuplicationConfig(
  config: DuplicationConfig,
  entityName: string
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  // Validate copy count
  const copyCountValidation = validateCopyCount(config.numberOfCopies);
  if (!copyCountValidation.valid) {
    errors.push({
      field: 'numberOfCopies',
      message: copyCountValidation.error!,
    });
  }

  // Validate naming pattern
  const baseName = config.namingPattern.baseNameOverride || entityName;
  const namingValidation = validateNamingPattern(
    config.namingPattern.template,
    baseName
  );
  if (!namingValidation.valid) {
    errors.push({
      field: 'namingPattern.template',
      message: namingValidation.error!,
    });
  }

  return errors;
}

/**
 * Check for name conflicts
 */
export function detectNameConflicts(
  proposedNames: string[],
  existingNames: string[]
): string[] {
  const existingSet = new Set(existingNames);
  return proposedNames.filter(name => existingSet.has(name));
}

/**
 * Check for duplicate order trees
 */
export function detectOrderTreeDuplicates(orders: number[]): number[] {
  const seen = new Set<number>();
  const duplicates: number[] = [];

  orders.forEach(order => {
    if (seen.has(order)) {
      duplicates.push(order);
    }
    seen.add(order);
  });

  return duplicates;
}
