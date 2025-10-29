import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { generateNames } from '@/utils/helpers';
import { validateCopyCount, validateNamingPattern } from '@/utils/validation';
import {
  DEFAULT_DUPLICATION_CONFIG,
  NAMING_PATTERNS,
  COMPONENT_LABELS,
  COMPONENT_DESCRIPTIONS,
  REFERENCE_STRATEGY_LABELS,
  REFERENCE_STRATEGY_DESCRIPTIONS,
  PLACEMENT_LABELS,
  ORDERING_STRATEGY_LABELS,
  ORDERING_STRATEGY_DESCRIPTIONS,
  GROUPING_STRATEGY_LABELS,
  GROUPING_STRATEGY_DESCRIPTIONS,
  ENTITY_TYPE_LABELS,
} from '@/utils/constants';
import type { DuplicationConfig, SelectedEntity } from '@/types';

interface Step3ConfigureProps {
  selectedEntities: SelectedEntity[];
  onConfigUpdated: (config: DuplicationConfig) => void;
}

export default function Step3Configure({ selectedEntities, onConfigUpdated }: Step3ConfigureProps) {
  const [config, setConfig] = useState<DuplicationConfig>(DEFAULT_DUPLICATION_CONFIG);
  const [copyCountError, setCopyCountError] = useState<string | null>(null);
  const [namingError, setNamingError] = useState<string | null>(null);

  // Use first entity for naming preview (all will follow same pattern)
  const firstEntity = selectedEntities[0];
  const entityName =
    firstEntity.type === 'stage' ? (firstEntity.data as any).name :
    firstEntity.type === 'task' ? (firstEntity.data as any).name :
    (firstEntity.data as any).label || 'Entity';

  const baseName = config.namingPattern.baseNameOverride || entityName;
  const lastEntity = selectedEntities[selectedEntities.length - 1];

  // Generate name previews
  const namePreview = useMemo(() => {
    try {
      return generateNames(
        config.namingPattern.template,
        baseName,
        Math.min(config.numberOfCopies, 3), // Show max 3 in preview
        config.namingPattern.zeroPadding,
        config.namingPattern.paddingLength,
        config.namingPattern.startingNumber
      );
    } catch {
      return [];
    }
  }, [config, baseName]);

  // Get example child entity name for preview
  const getChildEntityName = (entityType: 'task' | 'parameter'): string => {
    if (entityType === 'task' && firstEntity.type === 'stage') {
      const stageData = firstEntity.data as any;
      if (stageData.taskRequests && stageData.taskRequests.length > 0) {
        return stageData.taskRequests[0].name || 'Task';
      }
    } else if (entityType === 'parameter') {
      if (firstEntity.type === 'stage') {
        const stageData = firstEntity.data as any;
        if (stageData.taskRequests && stageData.taskRequests.length > 0) {
          const firstTask = stageData.taskRequests[0];
          if (firstTask.parameterRequests && firstTask.parameterRequests.length > 0) {
            return firstTask.parameterRequests[0].label || 'Parameter';
          }
        }
      } else if (firstEntity.type === 'task') {
        const taskData = firstEntity.data as any;
        if (taskData.parameterRequests && taskData.parameterRequests.length > 0) {
          return taskData.parameterRequests[0].label || 'Parameter';
        }
      }
    }
    return entityType === 'task' ? 'Task' : 'Parameter';
  };

  const updateConfig = (updates: Partial<DuplicationConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigUpdated(newConfig);
  };

  const handleCopyCountChange = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num) || value === '') {
      setCopyCountError('Please enter a valid number');
      return;
    }

    const validation = validateCopyCount(num);
    if (!validation.valid) {
      setCopyCountError(validation.error!);
      return;
    }

    setCopyCountError(null);
    updateConfig({ numberOfCopies: num });
  };

  const handleTemplateChange = (template: string) => {
    const validation = validateNamingPattern(template, baseName);
    if (!validation.valid) {
      setNamingError(validation.error!);
      return;
    }

    setNamingError(null);
    updateConfig({
      namingPattern: { ...config.namingPattern, template },
    });
  };

  const handleBaseNameChange = (baseNameOverride: string) => {
    updateConfig({
      namingPattern: { ...config.namingPattern, baseNameOverride },
    });
  };

  const handleZeroPaddingChange = (checked: boolean) => {
    updateConfig({
      namingPattern: { ...config.namingPattern, zeroPadding: checked },
    });
  };

  const handlePaddingLengthChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      updateConfig({
        namingPattern: { ...config.namingPattern, paddingLength: num },
      });
    }
  };

  const handleStartingNumberChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0) {
      updateConfig({
        namingPattern: { ...config.namingPattern, startingNumber: num },
      });
    }
  };

  const handleComponentToggle = (component: keyof DuplicationConfig['components'], checked: boolean) => {
    updateConfig({
      components: { ...config.components, [component]: checked },
    });
  };

  const handleReferenceStrategyChange = (strategy: 'keep' | 'remove') => {
    updateConfig({ referenceStrategy: strategy });
  };

  const handlePlacementChange = (position: 'after' | 'before' | 'start' | 'end') => {
    updateConfig({
      placement: { ...config.placement, position },
    });
  };

  const handleAutoShiftChange = (checked: boolean) => {
    updateConfig({
      placement: { ...config.placement, autoShift: checked },
    });
  };

  const handleOrderingStrategyChange = (strategy: 'interleaved' | 'sequential') => {
    updateConfig({ orderingStrategy: strategy });
  };

  const handleGroupingStrategyChange = (strategy: 'relative' | 'grouped') => {
    updateConfig({ groupingStrategy: strategy });
  };

  const handleChildNamingToggle = (entity: 'tasks' | 'parameters', checked: boolean) => {
    updateConfig({
      childNaming: {
        ...config.childNaming,
        [entity]: {
          ...config.childNaming[entity],
          applyInheritedSuffix: checked,
        },
      },
    });
  };

  const handleChildNamingPrefixChange = (entity: 'tasks' | 'parameters', prefix: string) => {
    updateConfig({
      childNaming: {
        ...config.childNaming,
        [entity]: {
          ...config.childNaming[entity],
          suffixPrefix: prefix,
        },
      },
    });
  };

  // Count child entities in selection
  const childEntityCounts = useMemo(() => {
    let tasks = 0;
    let parameters = 0;

    selectedEntities.forEach((entity) => {
      if (entity.type === 'stage') {
        const stageData = entity.data as any;
        if (stageData.taskRequests) {
          tasks += stageData.taskRequests.length;
          stageData.taskRequests.forEach((task: any) => {
            if (task.parameterRequests) {
              parameters += task.parameterRequests.length;
            }
          });
        }
      } else if (entity.type === 'task') {
        const taskData = entity.data as any;
        if (taskData.parameterRequests) {
          parameters += taskData.parameterRequests.length;
        }
      }
    });

    return { tasks, parameters };
  }, [selectedEntities]);

  // Conditionally show placement and grouping based on ordering strategy
  const showGroupingStrategy = config.orderingStrategy === 'sequential';
  const showPlacement = config.orderingStrategy === 'sequential';
  const showMultiSelectInfo = selectedEntities.length > 1;
  const showChildNaming = firstEntity.type === 'stage' || firstEntity.type === 'task';

  return (
    <div className="space-y-6">
      {/* Multi-Select Info */}
      {showMultiSelectInfo && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Duplicating <strong>{selectedEntities.length}</strong> {ENTITY_TYPE_LABELS[firstEntity.type].toLowerCase()} entities.
            All will use the same configuration.
          </AlertDescription>
        </Alert>
      )}
      {/* Number of Copies */}
      <Card>
        <CardHeader>
          <CardTitle>Number of Copies</CardTitle>
          <CardDescription>
            How many duplicates do you want to create?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                max="100"
                value={config.numberOfCopies}
                onChange={(e) => handleCopyCountChange(e.target.value)}
                className={copyCountError ? 'border-destructive' : ''}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              copies (1-100 allowed)
            </div>
          </div>
          {copyCountError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{copyCountError}</AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Valid: Will create {config.numberOfCopies} {config.numberOfCopies === 1 ? 'copy' : 'copies'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Naming Pattern */}
      <Card>
        <CardHeader>
          <CardTitle>Naming Pattern</CardTitle>
          <CardDescription>
            Define how copies will be named
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Base Name (optional override)</Label>
            <Input
              placeholder={entityName}
              value={config.namingPattern.baseNameOverride || ''}
              onChange={(e) => handleBaseNameChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use original name: "{entityName}"
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Pattern Template</Label>
            <RadioGroup
              value={config.namingPattern.template}
              onValueChange={handleTemplateChange}
            >
              {NAMING_PATTERNS.map((pattern) => (
                <div key={pattern.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={pattern.value} id={pattern.value} />
                  <Label htmlFor={pattern.value} className="font-normal cursor-pointer">
                    {pattern.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="startingNumber">Starting Number</Label>
            <Input
              id="startingNumber"
              type="number"
              min="0"
              value={config.namingPattern.startingNumber}
              onChange={(e) => handleStartingNumberChange(e.target.value)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              First copy will be numbered as {config.namingPattern.startingNumber}
            </p>
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="zeroPadding"
              checked={config.namingPattern.zeroPadding}
              onCheckedChange={handleZeroPaddingChange}
            />
            <Label htmlFor="zeroPadding" className="cursor-pointer">
              Zero-padding
            </Label>
            {config.namingPattern.zeroPadding && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pad to</span>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={config.namingPattern.paddingLength}
                  onChange={(e) => handlePaddingLengthChange(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">digits</span>
              </div>
            )}
          </div>

          {namingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{namingError}</AlertDescription>
            </Alert>
          )}

          <Separator />

          <div>
            <Label className="mb-2 block">Preview (first 3)</Label>
            <ScrollArea className="h-24 rounded-md border p-3">
              <div className="space-y-1">
                {namePreview.map((name, idx) => (
                  <div key={idx} className="text-sm">
                    {idx + 1}. {name}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Child Entity Naming */}
      {showChildNaming && (
        <Card>
          <CardHeader>
            <CardTitle>Child Entity Naming (Advanced)</CardTitle>
            <CardDescription>
              Optionally cascade parent suffix to child entities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tasks naming (only for stages) */}
            {firstEntity.type === 'stage' && childEntityCounts.tasks > 0 && (
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="applyToTasks"
                    checked={config.childNaming.tasks.applyInheritedSuffix}
                    onCheckedChange={(checked) => handleChildNamingToggle('tasks', checked as boolean)}
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="applyToTasks" className="cursor-pointer">
                      Apply suffix to child tasks <Badge variant="secondary">{childEntityCounts.tasks} found</Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Child tasks will inherit the parent stage's suffix number
                    </p>

                    {config.childNaming.tasks.applyInheritedSuffix && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="taskPrefix" className="text-sm">
                          Prefix text (optional)
                        </Label>
                        <Input
                          id="taskPrefix"
                          placeholder="e.g., Lot, Batch, Run"
                          value={config.childNaming.tasks.suffixPrefix}
                          onChange={(e) => handleChildNamingPrefixChange('tasks', e.target.value)}
                          className="max-w-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional text before the number
                        </p>

                        {/* Preview */}
                        {namePreview.length > 0 && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <p className="text-xs font-medium mb-1">Preview:</p>
                            <p className="text-xs text-muted-foreground">
                              "{getChildEntityName('task')}" → "{getChildEntityName('task')}{config.childNaming.tasks.suffixPrefix ? ' ' + config.childNaming.tasks.suffixPrefix.trim() : ''}{namePreview[0].replace(baseName, '').trim()}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Parameters naming */}
            {(firstEntity.type === 'stage' || firstEntity.type === 'task') && childEntityCounts.parameters > 0 && (
              <>
                {firstEntity.type === 'stage' && childEntityCounts.tasks > 0 && <Separator />}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="applyToParameters"
                      checked={config.childNaming.parameters.applyInheritedSuffix}
                      onCheckedChange={(checked) => handleChildNamingToggle('parameters', checked as boolean)}
                    />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="applyToParameters" className="cursor-pointer">
                        Apply suffix to child parameters <Badge variant="secondary">{childEntityCounts.parameters} found</Badge>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Child parameters will inherit the parent {firstEntity.type}'s suffix number
                      </p>

                      {config.childNaming.parameters.applyInheritedSuffix && (
                        <div className="space-y-2 pt-2">
                          <Label htmlFor="parameterPrefix" className="text-sm">
                            Prefix text (optional)
                          </Label>
                          <Input
                            id="parameterPrefix"
                            placeholder="e.g., Lot, Batch, Run"
                            value={config.childNaming.parameters.suffixPrefix}
                            onChange={(e) => handleChildNamingPrefixChange('parameters', e.target.value)}
                            className="max-w-xs"
                          />
                          <p className="text-xs text-muted-foreground">
                            Optional text before the number
                          </p>

                          {/* Preview */}
                          {namePreview.length > 0 && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-xs font-medium mb-1">Preview:</p>
                              <p className="text-xs text-muted-foreground">
                                "{getChildEntityName('parameter')}" → "{getChildEntityName('parameter')}{config.childNaming.parameters.suffixPrefix ? ' ' + config.childNaming.parameters.suffixPrefix.trim() : ''}{namePreview[0].replace(baseName, '').trim()}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Components to Include */}
      <Card>
        <CardHeader>
          <CardTitle>Components to Include</CardTitle>
          <CardDescription>
            Select which components should be copied
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(config.components) as Array<keyof typeof config.components>).map((key) => (
            <div key={key} className="flex items-start space-x-3">
              <Checkbox
                id={key}
                checked={config.components[key]}
                onCheckedChange={(checked) => handleComponentToggle(key, checked as boolean)}
              />
              <div className="flex-1 space-y-1">
                <Label htmlFor={key} className="cursor-pointer">
                  {COMPONENT_LABELS[key]}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {COMPONENT_DESCRIPTIONS[key]}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reference Handling */}
      <Card>
        <CardHeader>
          <CardTitle>External Reference Handling</CardTitle>
          <CardDescription>
            How should external dependencies be handled?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={config.referenceStrategy}
            onValueChange={handleReferenceStrategyChange}
          >
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="keep" id="keep" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="keep" className="cursor-pointer font-semibold">
                  {REFERENCE_STRATEGY_LABELS.keep}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {REFERENCE_STRATEGY_DESCRIPTIONS.keep}
                </p>
                <Badge variant="secondary">Recommended</Badge>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="remove" id="remove" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="remove" className="cursor-pointer font-semibold">
                  {REFERENCE_STRATEGY_LABELS.remove}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {REFERENCE_STRATEGY_DESCRIPTIONS.remove}
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Ordering Strategy (Multi-Select) */}
      {showMultiSelectInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Ordering Strategy</CardTitle>
            <CardDescription>
              How should copies be ordered when duplicating multiple entities?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={config.orderingStrategy}
              onValueChange={handleOrderingStrategyChange}
            >
              <div className="flex items-start space-x-3 rounded-lg border p-4 border-primary bg-primary/5">
                <RadioGroupItem value="interleaved" id="interleaved" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="interleaved" className="cursor-pointer font-semibold">
                    {ORDERING_STRATEGY_LABELS.interleaved}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {ORDERING_STRATEGY_DESCRIPTIONS.interleaved}
                  </p>
                  <Badge variant="default">Recommended</Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="sequential" id="sequential" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="sequential" className="cursor-pointer font-semibold">
                    {ORDERING_STRATEGY_LABELS.sequential}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {ORDERING_STRATEGY_DESCRIPTIONS.sequential}
                  </p>
                </div>
              </div>
            </RadioGroup>

            {config.orderingStrategy === 'interleaved' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All copies will be inserted as a group after <strong>{lastEntity.data.name}</strong>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grouping Strategy (Sequential only) */}
      {showMultiSelectInfo && showGroupingStrategy && (
        <Card>
          <CardHeader>
            <CardTitle>Grouping Strategy</CardTitle>
            <CardDescription>
              Where should copies be placed relative to originals?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={config.groupingStrategy}
              onValueChange={handleGroupingStrategyChange}
            >
              <div className="flex items-start space-x-3 rounded-lg border p-4 border-primary bg-primary/5">
                <RadioGroupItem value="relative" id="relative" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="relative" className="cursor-pointer font-semibold">
                    {GROUPING_STRATEGY_LABELS.relative}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {GROUPING_STRATEGY_DESCRIPTIONS.relative}
                  </p>
                  <Badge variant="default">Recommended</Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="grouped" id="grouped" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="grouped" className="cursor-pointer font-semibold">
                    {GROUPING_STRATEGY_LABELS.grouped}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {GROUPING_STRATEGY_DESCRIPTIONS.grouped}
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Placement Options (Sequential only or single-select) */}
      {(!showMultiSelectInfo || showPlacement) && (
        <Card>
        <CardHeader>
          <CardTitle>Placement</CardTitle>
          <CardDescription>
            Where should the copies be inserted?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Insert Position</Label>
            <RadioGroup
              value={config.placement.position}
              onValueChange={(value) => handlePlacementChange(value as any)}
            >
              {(Object.keys(PLACEMENT_LABELS) as Array<keyof typeof PLACEMENT_LABELS>).map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={`placement-${key}`} />
                  <Label htmlFor={`placement-${key}`} className="font-normal cursor-pointer">
                    {PLACEMENT_LABELS[key]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <Checkbox
              id="autoShift"
              checked={config.placement.autoShift}
              onCheckedChange={handleAutoShiftChange}
            />
            <div className="flex-1 space-y-1">
              <Label htmlFor="autoShift" className="cursor-pointer">
                Auto-increment subsequent entities
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically adjust order numbers of entities that come after the duplicates
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
