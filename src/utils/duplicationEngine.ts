import type {
  ChecklistConfig,
  Stage,
  Task,
  Parameter,
  Automation,
  SelectedEntity,
  DuplicationConfig,
  IdMapping,
} from '@/types';
import { generateMultipleIds, isIdReference } from './idGeneration';
import { generateName, deepClone } from './helpers';

/**
 * Main duplication engine - orchestrates the entire duplication process
 */
export function duplicateEntity(
  config: ChecklistConfig[],
  selectedEntity: SelectedEntity,
  duplicationConfig: DuplicationConfig
): ChecklistConfig[] {
  const modifiedConfig = deepClone(config);

  // Generate all new IDs upfront
  const idMapping = generateIdMappings(selectedEntity, duplicationConfig.numberOfCopies);

  // Perform duplication based on entity type
  if (selectedEntity.type === 'stage') {
    duplicateStage(modifiedConfig, selectedEntity, duplicationConfig, idMapping);
  } else if (selectedEntity.type === 'task') {
    duplicateTask(modifiedConfig, selectedEntity, duplicationConfig, idMapping);
  } else if (selectedEntity.type === 'parameter') {
    duplicateParameter(modifiedConfig, selectedEntity, duplicationConfig, idMapping);
  }

  return modifiedConfig;
}

/**
 * Multi-entity duplication engine - handles multiple entities at once
 */
export function duplicateMultipleEntities(
  config: ChecklistConfig[],
  selectedEntities: SelectedEntity[],
  duplicationConfig: DuplicationConfig
): ChecklistConfig[] {
  // For single entity, use the original function
  if (selectedEntities.length === 1) {
    return duplicateEntity(config, selectedEntities[0], duplicationConfig);
  }

  const modifiedConfig = deepClone(config);

  // Sort entities by their order position for consistent processing
  const sortedEntities = [...selectedEntities].sort((a, b) => {
    const orderA = a.data.orderTree || 0;
    const orderB = b.data.orderTree || 0;
    return orderA - orderB;
  });

  // Generate ID mappings for all entities
  const allIdMappings: IdMapping[] = sortedEntities.map(entity =>
    generateIdMappings(entity, duplicationConfig.numberOfCopies)
  );

  // Apply strategy-specific duplication
  if (duplicationConfig.orderingStrategy === 'interleaved') {
    applyInterleavedGrouped(modifiedConfig, sortedEntities, duplicationConfig, allIdMappings);
  } else {
    // Sequential strategy
    if (duplicationConfig.groupingStrategy === 'relative') {
      applySequentialRelative(modifiedConfig, sortedEntities, duplicationConfig, allIdMappings);
    } else {
      applySequentialGrouped(modifiedConfig, sortedEntities, duplicationConfig, allIdMappings);
    }
  }

  return modifiedConfig;
}

/**
 * Generate ID mappings for all entities that will be duplicated
 */
function generateIdMappings(
  selectedEntity: SelectedEntity,
  numberOfCopies: number
): IdMapping {
  const mapping: IdMapping = {
    stages: {},
    tasks: {},
    parameters: {},
    automations: {},
  };

  const entity = selectedEntity.data;

  if (selectedEntity.type === 'stage') {
    const stage = entity as Stage;

    // Map stage IDs
    mapping.stages[stage.id] = generateMultipleIds(numberOfCopies);

    // Map all task IDs in the stage
    if (stage.taskRequests) {
      stage.taskRequests.forEach((task) => {
        mapping.tasks[task.id] = generateMultipleIds(numberOfCopies);

        // Map all parameter IDs in each task
        if (task.parameterRequests) {
          task.parameterRequests.forEach((param) => {
            mapping.parameters[param.id] = generateMultipleIds(numberOfCopies);
          });
        }

        // Map all automation IDs in each task
        if (task.automationRequests) {
          task.automationRequests.forEach((auto) => {
            mapping.automations[auto.id] = generateMultipleIds(numberOfCopies);
          });
        }
      });
    }
  } else if (selectedEntity.type === 'task') {
    const task = entity as Task;

    // Map task ID
    mapping.tasks[task.id] = generateMultipleIds(numberOfCopies);

    // Map all parameter IDs
    if (task.parameterRequests) {
      task.parameterRequests.forEach((param) => {
        mapping.parameters[param.id] = generateMultipleIds(numberOfCopies);
      });
    }

    // Map all automation IDs
    if (task.automationRequests) {
      task.automationRequests.forEach((auto) => {
        mapping.automations[auto.id] = generateMultipleIds(numberOfCopies);
      });
    }
  } else if (selectedEntity.type === 'parameter') {
    const parameter = entity as Parameter;
    mapping.parameters[parameter.id] = generateMultipleIds(numberOfCopies);
  }

  return mapping;
}

/**
 * Duplicate a stage
 */
function duplicateStage(
  config: ChecklistConfig[],
  selectedEntity: SelectedEntity,
  duplicationConfig: DuplicationConfig,
  idMapping: IdMapping
): void {
  const checklist = config[selectedEntity.checklistIndex];
  const stage = selectedEntity.data as Stage;
  const stageIndex = selectedEntity.stageIndex!;

  const copies: Stage[] = [];

  for (let i = 0; i < duplicationConfig.numberOfCopies; i++) {
    const copy = deepClone(stage);

    // Update name
    copy.name = generateName(
      duplicationConfig.namingPattern.template,
      duplicationConfig.namingPattern.baseNameOverride || stage.name,
      i + 1,
      duplicationConfig.namingPattern.zeroPadding,
      duplicationConfig.namingPattern.paddingLength
    );

    // Update ID
    copy.id = idMapping.stages[stage.id][i];

    // Update order tree
    const insertPosition = getInsertPosition(
      stage.orderTree,
      duplicationConfig.placement.position,
      i
    );
    copy.orderTree = insertPosition;

    // Remap all task IDs and their contents
    if (copy.taskRequests) {
      copy.taskRequests = copy.taskRequests.map((task) => {
        return remapTask(task, idMapping, i, duplicationConfig);
      });
    }

    copies.push(copy);
  }

  // Insert copies
  insertCopies(checklist.stageRequests, stageIndex, copies, duplicationConfig);

  // Adjust order trees if auto-shift is enabled
  if (duplicationConfig.placement.autoShift) {
    adjustOrderTrees(checklist.stageRequests, stageIndex, duplicationConfig.numberOfCopies);
  }
}

/**
 * Duplicate a task
 */
function duplicateTask(
  config: ChecklistConfig[],
  selectedEntity: SelectedEntity,
  duplicationConfig: DuplicationConfig,
  idMapping: IdMapping
): void {
  const checklist = config[selectedEntity.checklistIndex];
  const stage = checklist.stageRequests[selectedEntity.stageIndex!];
  const task = selectedEntity.data as Task;
  const taskIndex = selectedEntity.taskIndex!;

  const copies: Task[] = [];

  for (let i = 0; i < duplicationConfig.numberOfCopies; i++) {
    const copy = deepClone(task);

    // Update name
    copy.name = generateName(
      duplicationConfig.namingPattern.template,
      duplicationConfig.namingPattern.baseNameOverride || task.name,
      i + 1,
      duplicationConfig.namingPattern.zeroPadding,
      duplicationConfig.namingPattern.paddingLength
    );

    // Remap the entire task
    const remapped = remapTask(copy, idMapping, i, duplicationConfig);

    // Update order tree
    const insertPosition = getInsertPosition(
      task.orderTree,
      duplicationConfig.placement.position,
      i
    );
    remapped.orderTree = insertPosition;

    copies.push(remapped);
  }

  // Insert copies
  insertCopies(stage.taskRequests, taskIndex, copies, duplicationConfig);

  // Adjust order trees if auto-shift is enabled
  if (duplicationConfig.placement.autoShift) {
    adjustOrderTrees(stage.taskRequests, taskIndex, duplicationConfig.numberOfCopies);
  }
}

/**
 * Duplicate a parameter
 */
function duplicateParameter(
  config: ChecklistConfig[],
  selectedEntity: SelectedEntity,
  duplicationConfig: DuplicationConfig,
  idMapping: IdMapping
): void {
  const checklist = config[selectedEntity.checklistIndex];
  const stage = checklist.stageRequests[selectedEntity.stageIndex!];
  const task = stage.taskRequests[selectedEntity.taskIndex!];
  const parameter = selectedEntity.data as Parameter;
  const paramIndex = task.parameterRequests.findIndex(p => p.id === parameter.id);

  const copies: Parameter[] = [];

  for (let i = 0; i < duplicationConfig.numberOfCopies; i++) {
    const copy = deepClone(parameter);

    // Update label/name
    const currentLabel = copy.label || `Parameter ${copy.id}`;
    copy.label = generateName(
      duplicationConfig.namingPattern.template,
      duplicationConfig.namingPattern.baseNameOverride || currentLabel,
      i + 1,
      duplicationConfig.namingPattern.zeroPadding,
      duplicationConfig.namingPattern.paddingLength
    );

    // Update ID
    copy.id = idMapping.parameters[parameter.id][i];

    // Update order tree
    const insertPosition = getInsertPosition(
      parameter.orderTree,
      duplicationConfig.placement.position,
      i
    );
    copy.orderTree = insertPosition;

    // Remap parameter references
    remapParameterReferences(copy, idMapping, i, duplicationConfig);

    copies.push(copy);
  }

  // Insert copies
  insertCopies(task.parameterRequests, paramIndex, copies, duplicationConfig);

  // Adjust order trees if auto-shift is enabled
  if (duplicationConfig.placement.autoShift) {
    adjustOrderTrees(task.parameterRequests, paramIndex, duplicationConfig.numberOfCopies);
  }
}

/**
 * Remap a task and all its contents
 */
function remapTask(
  task: Task,
  idMapping: IdMapping,
  copyIndex: number,
  duplicationConfig: DuplicationConfig
): Task {
  // Update task ID
  task.id = idMapping.tasks[task.id]?.[copyIndex] || task.id;

  // Remap parameters
  if (task.parameterRequests && duplicationConfig.components.linkedParameters) {
    task.parameterRequests = task.parameterRequests.map((param) => {
      const remapped = { ...param };
      remapped.id = idMapping.parameters[param.id]?.[copyIndex] || param.id;

      // Remap parameter-level references
      remapParameterReferences(remapped, idMapping, copyIndex, duplicationConfig);

      return remapped;
    });
  }

  // Remap automations
  if (task.automationRequests && duplicationConfig.components.automations) {
    task.automationRequests = task.automationRequests.map((auto) => {
      return remapAutomation(auto, idMapping, copyIndex, duplicationConfig);
    });
  }

  return task;
}

/**
 * Remap parameter references (rules, autoInitialize, etc.)
 */
function remapParameterReferences(
  parameter: Parameter,
  idMapping: IdMapping,
  copyIndex: number,
  duplicationConfig: DuplicationConfig
): void {
  // Remap autoInitialize if present
  if (parameter.autoInitialize && parameter.autoInitialize.parameterId) {
    const oldId = parameter.autoInitialize.parameterId;
    const newId = idMapping.parameters[oldId]?.[copyIndex];

    if (newId) {
      // Internal reference - remap
      parameter.autoInitialize.parameterId = newId;
    } else if (duplicationConfig.referenceStrategy === 'remove') {
      // External reference and user wants to remove
      delete parameter.autoInitialize;
    }
    // Otherwise keep original (external reference, keep strategy)
  }

  // Remap rules if present
  if (parameter.rules && duplicationConfig.components.parameterRules) {
    parameter.rules = parameter.rules.map((rule) => {
      const remappedRule = { ...rule };

      // Remap show.parameters array
      if (remappedRule.show?.parameters) {
        remappedRule.show.parameters = remappedRule.show.parameters
          .map((paramId: string) => {
            const newId = idMapping.parameters[paramId]?.[copyIndex];
            if (newId) return newId; // Internal reference
            if (duplicationConfig.referenceStrategy === 'remove') return null; // Remove external
            return paramId; // Keep external
          })
          .filter((id: string | null) => id !== null) as string[];
      }

      // Remap show.tasks array
      if (remappedRule.show?.tasks) {
        remappedRule.show.tasks = remappedRule.show.tasks
          .map((taskId: string) => {
            const newId = idMapping.tasks[taskId]?.[copyIndex];
            if (newId) return newId; // Internal reference
            if (duplicationConfig.referenceStrategy === 'remove') return null; // Remove external
            return taskId; // Keep external
          })
          .filter((id: string | null) => id !== null) as string[];
      }

      return remappedRule;
    });
  }

  // Remap validations array if present
  if (parameter.validations && duplicationConfig.components.parameterValidations) {
    parameter.validations = remapJsonField(
      parameter.validations,
      idMapping,
      copyIndex,
      duplicationConfig
    );
  }

  // Remap data.propertyFilters if present
  if (parameter.data?.propertyFilters && duplicationConfig.components.parameterValidations) {
    parameter.data.propertyFilters = remapJsonField(
      parameter.data.propertyFilters,
      idMapping,
      copyIndex,
      duplicationConfig
    );
  }

  // Remap data.propertyValidations if present
  if (parameter.data?.propertyValidations && duplicationConfig.components.parameterValidations) {
    parameter.data.propertyValidations = remapJsonField(
      parameter.data.propertyValidations,
      idMapping,
      copyIndex,
      duplicationConfig
    );
  }
}

/**
 * Remap an automation
 */
function remapAutomation(
  automation: Automation,
  idMapping: IdMapping,
  copyIndex: number,
  duplicationConfig: DuplicationConfig
): Automation {
  const remapped = { ...automation };

  // Update automation ID
  remapped.id = idMapping.automations[automation.id]?.[copyIndex] || automation.id;

  // Remap actionDetails
  if (remapped.actionDetails) {
    remapped.actionDetails = remapJsonField(
      remapped.actionDetails,
      idMapping,
      copyIndex,
      duplicationConfig
    );
  }

  // Remap triggerDetails
  if (remapped.triggerDetails) {
    remapped.triggerDetails = remapJsonField(
      remapped.triggerDetails,
      idMapping,
      copyIndex,
      duplicationConfig
    );
  }

  return remapped;
}

/**
 * Remap IDs within a JSON field (string or object)
 */
function remapJsonField(
  field: string | Record<string, any>,
  idMapping: IdMapping,
  copyIndex: number,
  duplicationConfig: DuplicationConfig
): any {
  // Parse if string
  let obj = typeof field === 'string' ? JSON.parse(field) : field;

  // Recursively remap IDs
  function recurse(item: any): any {
    if (Array.isArray(item)) {
      return item.map(recurse);
    } else if (typeof item === 'object' && item !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(item)) {
        if (isIdReference(key, value)) {
          // This looks like an ID reference
          const newId =
            idMapping.parameters[value as string]?.[copyIndex] ||
            idMapping.tasks[value as string]?.[copyIndex] ||
            idMapping.stages[value as string]?.[copyIndex];

          if (newId) {
            // Internal reference - remap
            result[key] = newId;
          } else if (duplicationConfig.referenceStrategy === 'remove') {
            // External reference - don't include this field
            continue;
          } else {
            // External reference - keep original
            result[key] = value;
          }
        } else {
          result[key] = recurse(value);
        }
      }
      return result;
    }
    return item;
  }

  const remapped = recurse(obj);

  // Return in same format as input
  return typeof field === 'string' ? JSON.stringify(remapped) : remapped;
}

/**
 * Calculate insertion position based on placement strategy
 */
function getInsertPosition(
  originalOrder: number,
  position: 'after' | 'before' | 'start' | 'end',
  copyIndex: number
): number {
  switch (position) {
    case 'after':
      return originalOrder + copyIndex + 1;
    case 'before':
      return originalOrder + copyIndex;
    case 'start':
      return copyIndex + 1;
    case 'end':
      return 999999 + copyIndex; // Large number, will be adjusted
    default:
      return originalOrder + copyIndex + 1;
  }
}

/**
 * Insert copies into an array at the specified position
 */
function insertCopies<T extends { orderTree: number }>(
  array: T[],
  index: number,
  copies: T[],
  duplicationConfig: DuplicationConfig
): void {
  const position = duplicationConfig.placement.position;

  if (position === 'after') {
    array.splice(index + 1, 0, ...copies);
  } else if (position === 'before') {
    array.splice(index, 0, ...copies);
  } else if (position === 'start') {
    array.splice(0, 0, ...copies);
  } else if (position === 'end') {
    array.push(...copies);
  }
}

/**
 * Adjust order trees of subsequent entities after insertion
 */
function adjustOrderTrees<T extends { orderTree: number }>(
  array: T[],
  _insertIndex: number,
  _numberOfCopies: number
): void {
  // Recalculate all order trees to be sequential
  array.forEach((item, index) => {
    item.orderTree = index + 1;
  });
}

/**
 * Algorithm 1: Interleaved Grouped
 * All copies are inserted as one group after the last selected entity
 * Pattern: A1 → B1 → C1 → A2 → B2 → C2
 */
function applyInterleavedGrouped(
  config: ChecklistConfig[],
  sortedEntities: SelectedEntity[],
  duplicationConfig: DuplicationConfig,
  allIdMappings: IdMapping[]
): void {
  const lastEntity = sortedEntities[sortedEntities.length - 1];
  const entityType = lastEntity.type;

  // Find the parent container
  const checklist = config[lastEntity.checklistIndex];
  let targetArray: any[];
  let lastIndex: number;

  if (entityType === 'stage') {
    targetArray = checklist.stageRequests;
    lastIndex = lastEntity.stageIndex!;
  } else if (entityType === 'task') {
    const stage = checklist.stageRequests[lastEntity.stageIndex!];
    targetArray = stage.taskRequests;
    lastIndex = lastEntity.taskIndex!;
  } else { // parameter
    const stage = checklist.stageRequests[lastEntity.stageIndex!];
    const task = stage.taskRequests[lastEntity.taskIndex!];
    targetArray = task.parameterRequests;
    lastIndex = task.parameterRequests.findIndex(p => p.id === lastEntity.id);
  }

  // Collect all copies in interleaved order
  const allCopies: any[] = [];

  for (let copyIndex = 0; copyIndex < duplicationConfig.numberOfCopies; copyIndex++) {
    for (let entityIndex = 0; entityIndex < sortedEntities.length; entityIndex++) {
      const entity = sortedEntities[entityIndex];
      const idMapping = allIdMappings[entityIndex];

      const copy = createSingleCopy(entity, duplicationConfig, idMapping, copyIndex);
      allCopies.push(copy);
    }
  }

  // Insert all copies after the last entity
  targetArray.splice(lastIndex + 1, 0, ...allCopies);

  // Adjust order trees if needed
  if (duplicationConfig.placement.autoShift) {
    targetArray.forEach((item, index) => {
      item.orderTree = index + 1;
    });
  }
}

/**
 * Algorithm 2: Sequential Relative
 * Each entity's copies are inserted near its original position
 * Pattern: A1 → A2 (near A), then B1 → B2 (near B), then C1 → C2 (near C)
 */
function applySequentialRelative(
  config: ChecklistConfig[],
  sortedEntities: SelectedEntity[],
  duplicationConfig: DuplicationConfig,
  allIdMappings: IdMapping[]
): void {
  // Process entities in reverse order to maintain correct indices
  for (let entityIndex = sortedEntities.length - 1; entityIndex >= 0; entityIndex--) {
    const entity = sortedEntities[entityIndex];
    const idMapping = allIdMappings[entityIndex];

    // Use the existing single-entity duplication logic
    if (entity.type === 'stage') {
      duplicateStage(config, entity, duplicationConfig, idMapping);
    } else if (entity.type === 'task') {
      duplicateTask(config, entity, duplicationConfig, idMapping);
    } else if (entity.type === 'parameter') {
      duplicateParameter(config, entity, duplicationConfig, idMapping);
    }
  }
}

/**
 * Algorithm 3: Sequential Grouped
 * All originals stay together, then all copies are added as a block
 * Pattern: A → B → C → A1 → B1 → C1 → A2 → B2 → C2
 */
function applySequentialGrouped(
  config: ChecklistConfig[],
  sortedEntities: SelectedEntity[],
  duplicationConfig: DuplicationConfig,
  allIdMappings: IdMapping[]
): void {
  const lastEntity = sortedEntities[sortedEntities.length - 1];
  const entityType = lastEntity.type;

  // Find the parent container
  const checklist = config[lastEntity.checklistIndex];
  let targetArray: any[];
  let lastIndex: number;

  if (entityType === 'stage') {
    targetArray = checklist.stageRequests;
    lastIndex = lastEntity.stageIndex!;
  } else if (entityType === 'task') {
    const stage = checklist.stageRequests[lastEntity.stageIndex!];
    targetArray = stage.taskRequests;
    lastIndex = lastEntity.taskIndex!;
  } else { // parameter
    const stage = checklist.stageRequests[lastEntity.stageIndex!];
    const task = stage.taskRequests[lastEntity.taskIndex!];
    targetArray = task.parameterRequests;
    lastIndex = task.parameterRequests.findIndex(p => p.id === lastEntity.id);
  }

  // Collect all copies in sequential grouped order
  const allCopies: any[] = [];

  for (let entityIndex = 0; entityIndex < sortedEntities.length; entityIndex++) {
    const entity = sortedEntities[entityIndex];
    const idMapping = allIdMappings[entityIndex];

    for (let copyIndex = 0; copyIndex < duplicationConfig.numberOfCopies; copyIndex++) {
      const copy = createSingleCopy(entity, duplicationConfig, idMapping, copyIndex);
      allCopies.push(copy);
    }
  }

  // Insert all copies after the last entity
  targetArray.splice(lastIndex + 1, 0, ...allCopies);

  // Adjust order trees if needed
  if (duplicationConfig.placement.autoShift) {
    targetArray.forEach((item, index) => {
      item.orderTree = index + 1;
    });
  }
}

/**
 * Create a single copy of an entity
 */
function createSingleCopy(
  entity: SelectedEntity,
  duplicationConfig: DuplicationConfig,
  idMapping: IdMapping,
  copyIndex: number
): any {
  const copy = deepClone(entity.data);

  // Update name
  let entityName: string;
  if (entity.type === 'stage') {
    entityName = (entity.data as Stage).name;
  } else if (entity.type === 'task') {
    entityName = (entity.data as Task).name;
  } else {
    entityName = (entity.data as Parameter).label || `Parameter ${entity.data.id}`;
  }

  const newName = generateName(
    duplicationConfig.namingPattern.template,
    duplicationConfig.namingPattern.baseNameOverride || entityName,
    copyIndex + 1,
    duplicationConfig.namingPattern.zeroPadding,
    duplicationConfig.namingPattern.paddingLength
  );

  if (entity.type === 'parameter') {
    (copy as Parameter).label = newName;
  } else {
    (copy as Stage | Task).name = newName;
  }

  // Update ID
  if (entity.type === 'stage') {
    copy.id = idMapping.stages[entity.id]?.[copyIndex] || copy.id;
  } else if (entity.type === 'task') {
    copy.id = idMapping.tasks[entity.id]?.[copyIndex] || copy.id;
  } else {
    copy.id = idMapping.parameters[entity.id]?.[copyIndex] || copy.id;
  }

  // Remap nested content based on entity type
  if (entity.type === 'stage') {
    const stageCopy = copy as Stage;
    if (stageCopy.taskRequests) {
      stageCopy.taskRequests = stageCopy.taskRequests.map((task) => {
        return remapTask(task, idMapping, copyIndex, duplicationConfig);
      });
    }
  } else if (entity.type === 'task') {
    const taskCopy = remapTask(copy as Task, idMapping, copyIndex, duplicationConfig);
    return taskCopy;
  } else {
    remapParameterReferences(copy as Parameter, idMapping, copyIndex, duplicationConfig);
  }

  return copy;
}
