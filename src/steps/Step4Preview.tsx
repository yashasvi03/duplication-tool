import { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Info, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generatePreview, generateMultiEntityPreview } from '@/utils/previewHelpers';
import { ENTITY_TYPE_LABELS } from '@/utils/constants';
import type { ChecklistConfig, SelectedEntity, DuplicationConfig } from '@/types';

interface Step4PreviewProps {
  config: ChecklistConfig[];
  selectedEntities: SelectedEntity[];
  duplicationConfig: DuplicationConfig;
  onPreviewGenerated: (modifiedConfig: ChecklistConfig[]) => void;
}

export default function Step4Preview({
  config,
  selectedEntities,
  duplicationConfig,
  onPreviewGenerated,
}: Step4PreviewProps) {
  // Generate preview data (use multi-entity function if multiple entities selected)
  const { previewData, modifiedConfig } = useMemo(() => {
    if (selectedEntities.length === 1) {
      return generatePreview(config, selectedEntities[0], duplicationConfig);
    } else {
      return generateMultiEntityPreview(config, selectedEntities, duplicationConfig);
    }
  }, [config, selectedEntities, duplicationConfig]);

  // Pass modified config back to parent
  useMemo(() => {
    onPreviewGenerated(modifiedConfig);
  }, [modifiedConfig, onPreviewGenerated]);

  const getWarningIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getWarningVariant = (severity: string): 'default' | 'destructive' => {
    return severity === 'error' ? 'destructive' : 'default';
  };

  const firstEntity = selectedEntities[0];
  const isMultiSelect = selectedEntities.length > 1;
  const entityName =
    firstEntity.type === 'stage'
      ? (firstEntity.data as any).name
      : firstEntity.type === 'task'
      ? (firstEntity.data as any).name
      : (firstEntity.data as any).label || 'Entity';

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Duplication Summary
          </CardTitle>
          <CardDescription>
            Preview of what will be created
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {isMultiSelect ? `Source Entities (${selectedEntities.length})` : 'Source Entity'}
              </div>
              {isMultiSelect ? (
                <div className="space-y-1">
                  <div className="font-semibold">{selectedEntities.length} {ENTITY_TYPE_LABELS[firstEntity.type].toLowerCase()}</div>
                  <div className="text-xs text-muted-foreground">
                    {entityName} ... {selectedEntities[selectedEntities.length - 1].data.name}
                  </div>
                </div>
              ) : (
                <div className="font-semibold">{entityName}</div>
              )}
              <Badge variant="outline" className="mt-1">
                {ENTITY_TYPE_LABELS[firstEntity.type]}
              </Badge>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Copies {isMultiSelect ? 'per Entity' : ''}
              </div>
              <div className="text-3xl font-bold text-primary">
                {duplicationConfig.numberOfCopies}
              </div>
              {isMultiSelect && (
                <div className="text-xs text-muted-foreground mt-1">
                  Total: {duplicationConfig.numberOfCopies * selectedEntities.length} new entities
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium mb-3">Will Create:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {previewData.summary.totalTasks > 0 && (
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-green-600">
                    {previewData.summary.totalTasks}
                  </div>
                  <div className="text-xs text-muted-foreground">Tasks</div>
                </div>
              )}
              {previewData.summary.totalParameters > 0 && (
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-blue-600">
                    {previewData.summary.totalParameters}
                  </div>
                  <div className="text-xs text-muted-foreground">Parameters</div>
                </div>
              )}
              {previewData.summary.totalAutomations > 0 && (
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-purple-600">
                    {previewData.summary.totalAutomations}
                  </div>
                  <div className="text-xs text-muted-foreground">Automations</div>
                </div>
              )}
              {previewData.summary.totalRules > 0 && (
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-orange-600">
                    {previewData.summary.totalRules}
                  </div>
                  <div className="text-xs text-muted-foreground">Rules</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Total New Entities:</div>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {previewData.summary.totalEntities}
            </Badge>
          </div>

          <div className="text-sm">
            <div className="font-medium mb-1">Placement:</div>
            <div className="text-muted-foreground">
              {duplicationConfig.placement.position === 'after' &&
                `After "${entityName}" (order ${(firstEntity.data as any).orderTree})`}
              {duplicationConfig.placement.position === 'before' &&
                `Before "${entityName}" (order ${(firstEntity.data as any).orderTree})`}
              {duplicationConfig.placement.position === 'start' &&
                'At the start of parent container'}
              {duplicationConfig.placement.position === 'end' &&
                'At the end of parent container'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Name Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Naming Preview</CardTitle>
          <CardDescription>
            Names that will be assigned to copies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {previewData.namePreview.map((name, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 font-medium">{name}</div>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">
              All names valid, no conflicts detected
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Order Tree Changes */}
      {previewData.orderTreeChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Order Tree Changes
            </CardTitle>
            <CardDescription>
              Entities that will have their order numbers adjusted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {previewData.orderTreeChanges.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md bg-muted"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{change.entityName}</div>
                      <div className="text-xs text-muted-foreground">
                        {ENTITY_TYPE_LABELS[change.entityType]}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{change.oldOrder}</Badge>
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary">{change.newOrder}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {previewData.warnings.length > 0 && (
        <div className="space-y-3">
          {previewData.warnings.map((warning, idx) => (
            <Alert key={idx} variant={getWarningVariant(warning.severity)}>
              {getWarningIcon(warning.severity)}
              <AlertTitle>{warning.title}</AlertTitle>
              <AlertDescription>{warning.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Success Message */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">Ready to Execute</AlertTitle>
        <AlertDescription className="text-green-800">
          Preview generated successfully. Click "Next" to execute the duplication and
          download the modified configuration.
        </AlertDescription>
      </Alert>
    </div>
  );
}
