import type {
  ChecklistConfig,
  SelectedEntity,
  DuplicationConfig,
  PreviewData,
  OrderTreeChange,
  Warning,
} from '@/types';
import { generateNames, countEntities } from './helpers';
import { duplicateEntity, duplicateMultipleEntities } from './duplicationEngine';

/**
 * Generate preview data for multiple entities
 */
export function generateMultiEntityPreview(
  config: ChecklistConfig[],
  selectedEntities: SelectedEntity[],
  duplicationConfig: DuplicationConfig
): { previewData: PreviewData; modifiedConfig: ChecklistConfig[] } {
  // Run multi-entity duplication engine
  const modifiedConfig = duplicateMultipleEntities(config, selectedEntities, duplicationConfig);

  // Calculate statistics
  const originalCounts = countEntities(config);
  const modifiedCounts = countEntities(modifiedConfig);

  const summary = {
    totalTasks: modifiedCounts.tasks - originalCounts.tasks,
    totalParameters: modifiedCounts.parameters - originalCounts.parameters,
    totalAutomations: modifiedCounts.automations - originalCounts.automations,
    totalRules: modifiedCounts.rules - originalCounts.rules,
    totalEntities: 0,
  };

  summary.totalEntities =
    summary.totalTasks +
    summary.totalParameters +
    summary.totalAutomations +
    summary.totalRules;

  // Generate name previews for all entities (show first entity as example)
  const firstEntity = selectedEntities[0];
  const entityName =
    firstEntity.type === 'stage'
      ? (firstEntity.data as any).name
      : firstEntity.type === 'task'
      ? (firstEntity.data as any).name
      : (firstEntity.data as any).label || 'Entity';

  const baseName = duplicationConfig.namingPattern.baseNameOverride || entityName;

  const namePreview = generateNames(
    duplicationConfig.namingPattern.template,
    baseName,
    Math.min(duplicationConfig.numberOfCopies, 3), // Show max 3 in preview
    duplicationConfig.namingPattern.zeroPadding,
    duplicationConfig.namingPattern.paddingLength,
    duplicationConfig.namingPattern.startingNumber
  );

  // Detect order tree changes (simplified for multi-entity)
  const orderTreeChanges = detectMultiEntityOrderTreeChanges(
    config,
    modifiedConfig,
    selectedEntities
  );

  // Generate warnings
  const warnings = generateMultiEntityWarnings(
    selectedEntities,
    duplicationConfig,
    orderTreeChanges
  );

  const previewData: PreviewData = {
    summary,
    namePreview,
    orderTreeChanges,
    warnings,
  };

  return { previewData, modifiedConfig };
}

/**
 * Generate preview data by running duplication and analyzing results
 */
export function generatePreview(
  config: ChecklistConfig[],
  selectedEntity: SelectedEntity,
  duplicationConfig: DuplicationConfig
): { previewData: PreviewData; modifiedConfig: ChecklistConfig[] } {
  // Run duplication engine to get modified config
  const modifiedConfig = duplicateEntity(config, selectedEntity, duplicationConfig);

  // Calculate statistics
  const originalCounts = countEntities(config);
  const modifiedCounts = countEntities(modifiedConfig);

  const summary = {
    totalTasks: modifiedCounts.tasks - originalCounts.tasks,
    totalParameters: modifiedCounts.parameters - originalCounts.parameters,
    totalAutomations: modifiedCounts.automations - originalCounts.automations,
    totalRules: modifiedCounts.rules - originalCounts.rules,
    totalEntities: 0,
  };

  summary.totalEntities =
    summary.totalTasks +
    summary.totalParameters +
    summary.totalAutomations +
    summary.totalRules;

  // Generate name preview
  const entityName =
    selectedEntity.type === 'stage'
      ? (selectedEntity.data as any).name
      : selectedEntity.type === 'task'
      ? (selectedEntity.data as any).name
      : (selectedEntity.data as any).label || 'Entity';

  const baseName = duplicationConfig.namingPattern.baseNameOverride || entityName;

  const namePreview = generateNames(
    duplicationConfig.namingPattern.template,
    baseName,
    duplicationConfig.numberOfCopies,
    duplicationConfig.namingPattern.zeroPadding,
    duplicationConfig.namingPattern.paddingLength,
    duplicationConfig.namingPattern.startingNumber
  );

  // Detect order tree changes
  const orderTreeChanges = detectOrderTreeChanges(
    config,
    modifiedConfig,
    selectedEntity
  );

  // Generate warnings
  const warnings = generateWarnings(
    selectedEntity,
    duplicationConfig,
    orderTreeChanges
  );

  const previewData: PreviewData = {
    summary,
    namePreview,
    orderTreeChanges,
    warnings,
  };

  return { previewData, modifiedConfig };
}

/**
 * Detect which entities had their order trees changed
 */
function detectOrderTreeChanges(
  original: ChecklistConfig[],
  modified: ChecklistConfig[],
  selectedEntity: SelectedEntity
): OrderTreeChange[] {
  const changes: OrderTreeChange[] = [];

  // Find entities whose order tree changed
  const checklistIndex = selectedEntity.checklistIndex;
  const originalChecklist = original[checklistIndex];
  const modifiedChecklist = modified[checklistIndex];

  if (selectedEntity.type === 'stage') {
    // Compare stages
    const stageIndex = selectedEntity.stageIndex!;
    const originalStages = originalChecklist.stageRequests;
    const modifiedStages = modifiedChecklist.stageRequests;

    // Find stages that were shifted
    originalStages.forEach((originalStage, idx) => {
      if (idx <= stageIndex) return; // Skip original and inserted copies

      const modifiedStage = modifiedStages.find(s => s.id === originalStage.id);
      if (modifiedStage && modifiedStage.orderTree !== originalStage.orderTree) {
        changes.push({
          entityType: 'stage',
          entityId: originalStage.id,
          entityName: originalStage.name,
          oldOrder: originalStage.orderTree,
          newOrder: modifiedStage.orderTree,
        });
      }
    });
  } else if (selectedEntity.type === 'task') {
    // Compare tasks
    const stageIndex = selectedEntity.stageIndex!;
    const taskIndex = selectedEntity.taskIndex!;
    const originalTasks = originalChecklist.stageRequests[stageIndex].taskRequests;
    const modifiedTasks = modifiedChecklist.stageRequests[stageIndex].taskRequests;

    originalTasks.forEach((originalTask, idx) => {
      if (idx <= taskIndex) return;

      const modifiedTask = modifiedTasks.find(t => t.id === originalTask.id);
      if (modifiedTask && modifiedTask.orderTree !== originalTask.orderTree) {
        changes.push({
          entityType: 'task',
          entityId: originalTask.id,
          entityName: originalTask.name,
          oldOrder: originalTask.orderTree,
          newOrder: modifiedTask.orderTree,
        });
      }
    });
  } else if (selectedEntity.type === 'parameter') {
    // Compare parameters
    const stageIndex = selectedEntity.stageIndex!;
    const taskIndex = selectedEntity.taskIndex!;
    const originalParams =
      originalChecklist.stageRequests[stageIndex].taskRequests[taskIndex]
        .parameterRequests;
    const modifiedParams =
      modifiedChecklist.stageRequests[stageIndex].taskRequests[taskIndex]
        .parameterRequests;

    const selectedParamId = selectedEntity.id;
    const selectedParamIndex = originalParams.findIndex(p => p.id === selectedParamId);

    originalParams.forEach((originalParam, idx) => {
      if (idx <= selectedParamIndex) return;

      const modifiedParam = modifiedParams.find(p => p.id === originalParam.id);
      if (modifiedParam && modifiedParam.orderTree !== originalParam.orderTree) {
        changes.push({
          entityType: 'parameter',
          entityId: originalParam.id,
          entityName: originalParam.label || `Parameter ${originalParam.id}`,
          oldOrder: originalParam.orderTree,
          newOrder: modifiedParam.orderTree,
        });
      }
    });
  }

  return changes;
}

/**
 * Generate warnings based on configuration and detected issues
 */
function generateWarnings(
  _selectedEntity: SelectedEntity,
  duplicationConfig: DuplicationConfig,
  orderTreeChanges: OrderTreeChange[]
): Warning[] {
  const warnings: Warning[] = [];

  // Warning about order tree shifts
  if (orderTreeChanges.length > 0 && duplicationConfig.placement.autoShift) {
    warnings.push({
      type: 'order_shift',
      severity: 'info',
      title: 'Order Tree Adjustment',
      message: `${orderTreeChanges.length} subsequent ${
        orderTreeChanges[0].entityType
      }(s) will have their order numbers increased by ${
        duplicationConfig.numberOfCopies
      }`,
      affectedEntities: orderTreeChanges.map(c => c.entityId),
    });
  }

  // Warning about external references (if strategy is keep)
  if (duplicationConfig.referenceStrategy === 'keep') {
    warnings.push({
      type: 'external_reference',
      severity: 'info',
      title: 'External References Preserved',
      message:
        'All copies will reference the same external parameters. This is the recommended approach for maintaining workflow integrity.',
    });
  }

  // Warning about removed references
  if (duplicationConfig.referenceStrategy === 'remove') {
    warnings.push({
      type: 'external_reference',
      severity: 'warning',
      title: 'External References Removed',
      message:
        'Any automations or rules that reference entities outside the selected scope will be removed from the copies. This may affect functionality.',
    });
  }

  // Info about components not included
  const excludedComponents = Object.entries(duplicationConfig.components)
    .filter(([_, included]) => !included)
    .map(([key]) => key);

  if (excludedComponents.length > 0) {
    warnings.push({
      type: 'other',
      severity: 'info',
      title: 'Components Excluded',
      message: `The following components will not be copied: ${excludedComponents.join(
        ', '
      )}`,
    });
  }

  return warnings;
}

/**
 * Detect order tree changes for multiple entities
 */
function detectMultiEntityOrderTreeChanges(
  original: ChecklistConfig[],
  modified: ChecklistConfig[],
  selectedEntities: SelectedEntity[]
): OrderTreeChange[] {
  const changes: OrderTreeChange[] = [];

  // For multi-entity, we compare all entities in the modified config
  // This is a simplified version that just reports major shifts
  const firstEntity = selectedEntities[0];

  const checklistIndex = firstEntity.checklistIndex;
  const originalChecklist = original[checklistIndex];
  const modifiedChecklist = modified[checklistIndex];

  if (firstEntity.type === 'stage') {
    const originalStages = originalChecklist.stageRequests;
    const modifiedStages = modifiedChecklist.stageRequests;

    originalStages.forEach((originalStage) => {
      const modifiedStage = modifiedStages.find(s => s.id === originalStage.id);
      if (modifiedStage && modifiedStage.orderTree !== originalStage.orderTree) {
        changes.push({
          entityType: 'stage',
          entityId: originalStage.id,
          entityName: originalStage.name,
          oldOrder: originalStage.orderTree,
          newOrder: modifiedStage.orderTree,
        });
      }
    });
  } else if (firstEntity.type === 'task') {
    const stageIndex = firstEntity.stageIndex!;
    const originalTasks = originalChecklist.stageRequests[stageIndex].taskRequests;
    const modifiedTasks = modifiedChecklist.stageRequests[stageIndex].taskRequests;

    originalTasks.forEach((originalTask) => {
      const modifiedTask = modifiedTasks.find(t => t.id === originalTask.id);
      if (modifiedTask && modifiedTask.orderTree !== originalTask.orderTree) {
        changes.push({
          entityType: 'task',
          entityId: originalTask.id,
          entityName: originalTask.name,
          oldOrder: originalTask.orderTree,
          newOrder: modifiedTask.orderTree,
        });
      }
    });
  } else if (firstEntity.type === 'parameter') {
    const stageIndex = firstEntity.stageIndex!;
    const taskIndex = firstEntity.taskIndex!;
    const originalParams = originalChecklist.stageRequests[stageIndex].taskRequests[taskIndex].parameterRequests;
    const modifiedParams = modifiedChecklist.stageRequests[stageIndex].taskRequests[taskIndex].parameterRequests;

    originalParams.forEach((originalParam) => {
      const modifiedParam = modifiedParams.find(p => p.id === originalParam.id);
      if (modifiedParam && modifiedParam.orderTree !== originalParam.orderTree) {
        changes.push({
          entityType: 'parameter',
          entityId: originalParam.id,
          entityName: originalParam.label || `Parameter ${originalParam.id}`,
          oldOrder: originalParam.orderTree,
          newOrder: modifiedParam.orderTree,
        });
      }
    });
  }

  return changes;
}

/**
 * Generate warnings for multi-entity duplication
 */
function generateMultiEntityWarnings(
  selectedEntities: SelectedEntity[],
  duplicationConfig: DuplicationConfig,
  orderTreeChanges: OrderTreeChange[]
): Warning[] {
  const warnings: Warning[] = [];

  // Multi-select specific warning
  warnings.push({
    type: 'other',
    severity: 'info',
    title: `Multi-Entity Duplication (${duplicationConfig.orderingStrategy})`,
    message: `Duplicating ${selectedEntities.length} entities with ${duplicationConfig.orderingStrategy} ordering. Each entity will be copied ${duplicationConfig.numberOfCopies} time(s).`,
  });

  // Warning about order tree shifts
  if (orderTreeChanges.length > 0 && duplicationConfig.placement.autoShift) {
    warnings.push({
      type: 'order_shift',
      severity: 'info',
      title: 'Order Tree Adjustment',
      message: `${orderTreeChanges.length} entity order numbers will be automatically adjusted.`,
      affectedEntities: orderTreeChanges.map(c => c.entityId),
    });
  }

  // Warning about external references
  if (duplicationConfig.referenceStrategy === 'keep') {
    warnings.push({
      type: 'external_reference',
      severity: 'info',
      title: 'External References Preserved',
      message: 'All copies will reference the same external parameters.',
    });
  }

  if (duplicationConfig.referenceStrategy === 'remove') {
    warnings.push({
      type: 'external_reference',
      severity: 'warning',
      title: 'External References Removed',
      message: 'External references will be removed from copies.',
    });
  }

  return warnings;
}
