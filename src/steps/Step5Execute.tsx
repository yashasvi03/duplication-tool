import { useState, useEffect } from 'react';
import { Download, CheckCircle2, FileJson, RefreshCw, Repeat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { downloadFile, formatFileSize, formatDateTime, countEntities } from '@/utils/helpers';
import type { ChecklistConfig, DuplicationConfig, SelectedEntity } from '@/types';

interface Step5ExecuteProps {
  originalConfig: ChecklistConfig[];
  modifiedConfig: ChecklistConfig[];
  selectedEntities: SelectedEntity[];
  duplicationConfig: DuplicationConfig;
  onStartOver: () => void;
  onDuplicateMore: () => void;
}

export default function Step5Execute({
  originalConfig,
  modifiedConfig,
  selectedEntities,
  duplicationConfig,
  onStartOver,
  onDuplicateMore,
}: Step5ExecuteProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);

  // Simulate execution progress (since actual duplication already happened in preview)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    const modifiedJson = JSON.stringify(modifiedConfig, null, 2);
    const originalFileName = 'configuration';
    const timestamp = Date.now();
    const fileName = `${originalFileName}_MODIFIED_${timestamp}.json`;

    downloadFile(modifiedJson, fileName, 'application/json');
    setDownloadedFileName(fileName);
  };

  const originalCounts = countEntities(originalConfig);
  const modifiedCounts = countEntities(modifiedConfig);

  const statistics = {
    totalTasks: modifiedCounts.tasks - originalCounts.tasks,
    totalParameters: modifiedCounts.parameters - originalCounts.parameters,
    totalAutomations: modifiedCounts.automations - originalCounts.automations,
    totalActions: modifiedCounts.actions - originalCounts.actions,
    totalRules: modifiedCounts.rules - originalCounts.rules,
  };

  const totalEntities =
    statistics.totalTasks +
    statistics.totalParameters +
    statistics.totalAutomations +
    statistics.totalActions +
    statistics.totalRules;

  const firstEntity = selectedEntities[0];
  const entityName =
    firstEntity.type === 'stage'
      ? (firstEntity.data as any).name
      : firstEntity.type === 'task'
      ? (firstEntity.data as any).name
      : (firstEntity.data as any).label || 'Entity';

  const modifiedJsonSize = new Blob([JSON.stringify(modifiedConfig)]).size;

  return (
    <div className="space-y-6">
      {/* Progress Card (shown during execution) */}
      {!isComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Executing Duplication...</CardTitle>
            <CardDescription>
              Creating {duplicationConfig.numberOfCopies} {duplicationConfig.numberOfCopies === 1 ? 'copy' : 'copies'} of "{entityName}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Card (shown after completion) */}
      {isComplete && (
        <>
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-green-900">Duplication Successful!</CardTitle>
                  <CardDescription className="text-green-700">
                    Created {duplicationConfig.numberOfCopies} {duplicationConfig.numberOfCopies === 1 ? 'copy' : 'copies'} in {(progress / 10 * 0.1).toFixed(1)} seconds
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator className="bg-green-200" />

                <div>
                <div className="text-sm font-medium text-green-900 mb-3">Summary:</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {statistics.totalTasks}
                    </div>
                    <div className="text-xs text-green-700">Tasks</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {statistics.totalParameters}
                    </div>
                    <div className="text-xs text-green-700">Parameters</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {statistics.totalAutomations}
                    </div>
                    <div className="text-xs text-green-700">Automations</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {statistics.totalActions}
                    </div>
                    <div className="text-xs text-green-700">Actions</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {statistics.totalRules}
                    </div>
                    <div className="text-xs text-green-700">Rules</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                <span className="text-sm font-medium text-green-900">Total New Entities:</span>
                <Badge className="bg-green-600 text-white text-base px-3 py-1">
                  {totalEntities}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Download Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Modified Configuration Ready
              </CardTitle>
              <CardDescription>
                Your modified configuration is ready to download
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!downloadedFileName ? (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      <FileJson className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="font-semibold">configuration_MODIFIED.json</div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(modifiedJsonSize)} • {formatDateTime(Date.now())}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleDownload} size="lg" className="w-full">
                    <Download className="mr-2 h-5 w-5" />
                    Download Modified JSON
                  </Button>
                </>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Downloaded Successfully</AlertTitle>
                  <AlertDescription className="text-green-800">
                    <div className="font-medium">{downloadedFileName}</div>
                    <div className="text-sm mt-1">
                      File saved to your downloads folder
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                Continue working or start a new duplication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={onDuplicateMore} variant="outline" size="lg" className="w-full">
                <Repeat className="mr-2 h-5 w-5" />
                Duplicate More Entities
              </Button>
              <Button onClick={onStartOver} variant="outline" size="lg" className="w-full">
                <RefreshCw className="mr-2 h-5 w-5" />
                Start Over with New Configuration
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
