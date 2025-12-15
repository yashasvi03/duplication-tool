import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { Upload, FileJson, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  validateJsonFormat,
  validateRequiredFields,
  validateStructure,
} from '@/utils/validation';
import { formatJson, recentFilesStorage, formatFileSize, getTimeAgo } from '@/utils/helpers';
import { MAX_FILE_SIZE_BYTES } from '@/utils/constants';
import type { ChecklistConfig, RecentFile } from '@/types';
import { useAppActions } from '@/contexts/AppContext';

interface Step1UploadProps {
  onJsonLoaded: (json: string, parsed: ChecklistConfig[]) => void;
}

export default function Step1Upload({ onJsonLoaded }: Step1UploadProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(recentFilesStorage.get());
  const { setMediaFiles, setIsZipFile } = useAppActions();

  const validateAndLoad = useCallback((content: string) => {
    setError(null);
    setSuccess(false);

    // Validate JSON format
    const formatValidation = validateJsonFormat(content);
    if (!formatValidation.valid) {
      setError(formatValidation.error!.message);
      return;
    }

    const parsed = formatValidation.parsed;

    // Validate required fields
    const fieldsValidation = validateRequiredFields(parsed);
    if (!fieldsValidation.valid) {
      setError(fieldsValidation.errors.map(e => e.message).join(', '));
      return;
    }

    // Validate structure
    const structureValidation = validateStructure(parsed);
    if (!structureValidation.valid) {
      setError(structureValidation.errors.map(e => e.message).join(', '));
      return;
    }

    // Success!
    setSuccess(true);
    onJsonLoaded(content, parsed);
  }, [onJsonLoaded]);

  const handleFileUpload = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
      return;
    }

    if (!file.name.endsWith('.json') && !file.name.endsWith('.zip')) {
      setError('Please upload a .json or .zip file');
      return;
    }

    if (file.name.endsWith('.zip')) {
      handleZipUpload(file);
      setIsZipFile(true);
      return;
    }

    setIsZipFile(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      validateAndLoad(content);

      // Save to recent files
      const recentFile: RecentFile = {
        name: file.name,
        content: content,
        timestamp: Date.now(),
        size: file.size,
      };
      recentFilesStorage.add(recentFile);
      setRecentFiles(recentFilesStorage.get());
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, [validateAndLoad, setRecentFiles, setIsZipFile]);

  const handleZipUpload = useCallback(async (file: File) => {
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);

      // Find the JSON file (assuming there's one main config file)
      const jsonFiles = Object.keys(content.files).filter(name =>
        name.endsWith('.json') && !name.startsWith('__MACOSX') && !name.startsWith('.')
      );

      if (jsonFiles.length === 0) {
        setError('No JSON configuration file found in the ZIP archive');
        return;
      }

      // If multiple, try to find one that looks like a config, or just take the first one
      // For now, let's take the first one or prioritize 'configuration.json' if it exists
      const mainJsonPath = jsonFiles.find(name => name.includes('configuration')) || jsonFiles[0];

      const jsonContent = await content.files[mainJsonPath].async('string');

      // Extract other files as blobs
      const mediaFiles: Record<string, Blob> = {};
      const processingPromises = Object.keys(content.files).map(async (fileName) => {
        if (!content.files[fileName].dir && fileName !== mainJsonPath && !fileName.startsWith('__MACOSX') && !fileName.startsWith('.')) {
          const blob = await content.files[fileName].async('blob');
          mediaFiles[fileName] = blob;
        }
      });

      await Promise.all(processingPromises);

      // Set media files in context
      setMediaFiles(mediaFiles);

      // Process JSON
      setJsonInput(jsonContent);
      validateAndLoad(jsonContent);

      // Add to recent files (as a "virtual" json file for now, or we need to update RecentFile to support zip)
      // Since RecentFile stores content, we can store the JSON content. 
      // Re-uploading from recent won't restore the zip media, which is a limitation but acceptable for now.
      const recentFile: RecentFile = {
        name: file.name + ' (extracted JSON)',
        content: jsonContent,
        timestamp: Date.now(),
        size: file.size,
      };
      recentFilesStorage.add(recentFile);
      setRecentFiles(recentFilesStorage.get());

    } catch (err) {
      console.error(err);
      setError('Failed to process ZIP file');
    }
  }, [validateAndLoad, setMediaFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const handleFormat = useCallback(() => {
    const formatted = formatJson(jsonInput);
    setJsonInput(formatted);
  }, [jsonInput]);

  const handleLoadRecent = useCallback((file: RecentFile) => {
    setJsonInput(file.content);
    // Recent files are only JSON content for now, so treat as not ZIP unless we store metadata
    setIsZipFile(false);
    validateAndLoad(file.content);
  }, [validateAndLoad, setIsZipFile]);

  const handlePasteValidate = useCallback(() => {
    if (jsonInput.trim()) {
      setIsZipFile(false);
      validateAndLoad(jsonInput);
    }
  }, [jsonInput, validateAndLoad, setIsZipFile]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="paste">Paste JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload JSON Configuration</CardTitle>
              <CardDescription>
                Drop your MES configuration file (.json or .zip) here or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
              >
                <input
                  type="file"
                  accept=".json,.zip"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Click to upload</span> or drag
                    and drop
                  </div>
                  <div className="text-xs text-muted-foreground">
                    JSON or ZIP files up to 50MB
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paste" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paste JSON Configuration</CardTitle>
              <CardDescription>
                Paste your MES configuration JSON directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your JSON here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleFormat} variant="outline" size="sm">
                  Format JSON
                </Button>
                <Button onClick={handlePasteValidate} size="sm">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Validate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Configuration Loaded Successfully</AlertTitle>
          <AlertDescription>
            Your JSON has been validated and is ready for processing. Click "Next" to continue.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Files
            </CardTitle>
            <CardDescription>Quickly reload recently uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {recentFiles.map((file, idx) => (
                  <div key={idx}>
                    <button
                      onClick={() => handleLoadRecent(file)}
                      className="w-full flex items-start gap-3 p-3 rounded-md hover:bg-accent text-left transition-colors"
                    >
                      <FileJson className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {getTimeAgo(file.timestamp)}
                        </div>
                      </div>
                    </button>
                    {idx < recentFiles.length - 1 && <Separator className="mt-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
