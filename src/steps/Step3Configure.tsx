import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
} from '@/utils/constants';
import type { DuplicationConfig, SelectedEntity } from '@/types';

interface Step3ConfigureProps {
  selectedEntity: SelectedEntity;
  onConfigUpdated: (config: DuplicationConfig) => void;
}

export default function Step3Configure({ selectedEntity, onConfigUpdated }: Step3ConfigureProps) {
  const [config, setConfig] = useState<DuplicationConfig>(DEFAULT_DUPLICATION_CONFIG);
  const [copyCountError, setCopyCountError] = useState<string | null>(null);
  const [namingError, setNamingError] = useState<string | null>(null);

  const entityName =
    selectedEntity.type === 'stage' ? (selectedEntity.data as any).name :
    selectedEntity.type === 'task' ? (selectedEntity.data as any).name :
    (selectedEntity.data as any).label || 'Entity';

  const baseName = config.namingPattern.baseNameOverride || entityName;

  // Generate name previews
  const namePreview = useMemo(() => {
    try {
      return generateNames(
        config.namingPattern.template,
        baseName,
        Math.min(config.numberOfCopies, 3), // Show max 3 in preview
        config.namingPattern.zeroPadding,
        config.namingPattern.paddingLength
      );
    } catch {
      return [];
    }
  }, [config, baseName]);

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

  return (
    <div className="space-y-6">
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

      {/* Placement Options */}
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
    </div>
  );
}
