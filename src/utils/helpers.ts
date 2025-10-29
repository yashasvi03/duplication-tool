import type { RecentFile, EntityCounts } from '@/types';

/**
 * Format JSON string with proper indentation
 */
export function formatJson(json: string): string {
  try {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return json;
  }
}

/**
 * Generate a name based on pattern
 */
export function generateName(
  pattern: string,
  baseName: string,
  index: number,
  zeroPadding: boolean = false,
  paddingLength: number = 3
): string {
  const paddedIndex = zeroPadding
    ? index.toString().padStart(paddingLength, '0')
    : index.toString();

  return pattern
    .replace('{base_name}', baseName)
    .replace('{n}', paddedIndex);
}

/**
 * Generate multiple names
 */
export function generateNames(
  pattern: string,
  baseName: string,
  count: number,
  zeroPadding: boolean = false,
  paddingLength: number = 3,
  startingNumber: number = 1
): string[] {
  const names: string[] = [];
  for (let i = startingNumber; i < startingNumber + count; i++) {
    names.push(generateName(pattern, baseName, i, zeroPadding, paddingLength));
  }
  return names;
}

/**
 * Extract the numeric suffix from a generated name
 * Handles both padded (001) and non-padded (1) numbers
 */
export function extractSuffixFromName(
  generatedName: string,
  pattern: string,
  baseName: string
): string | null {
  try {
    // Replace {base_name} with actual base name to get the pattern structure
    const patternWithBase = pattern.replace('{base_name}', baseName);

    // Find where {n} would be in the pattern
    const nIndex = pattern.indexOf('{n}');
    if (nIndex === -1) return null;

    // Get the prefix and suffix around {n}
    const beforeN = patternWithBase.substring(0, nIndex);
    const afterN = patternWithBase.substring(nIndex + 3); // 3 is length of '{n}'

    // Find the number in the generated name
    if (!generatedName.startsWith(beforeN)) return null;

    let numberPart = generatedName.substring(beforeN.length);
    if (afterN && numberPart.endsWith(afterN)) {
      numberPart = numberPart.substring(0, numberPart.length - afterN.length);
    }

    // Validate it's a number
    if (!/^\d+$/.test(numberPart)) return null;

    return numberPart;
  } catch {
    return null;
  }
}

/**
 * Generate a child entity name with inherited suffix and optional prefix
 */
export function generateChildName(
  originalName: string,
  parentSuffix: string,
  prefix: string,
  applyInheritance: boolean
): string {
  if (!applyInheritance) {
    return originalName;
  }

  // Construct: originalName + prefix + suffix
  // Handle spacing intelligently
  const trimmedPrefix = prefix.trim();
  const spacing = trimmedPrefix ? ' ' : '';

  return `${originalName}${spacing}${prefix}${parentSuffix}`;
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get time ago string
 */
export function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1 min ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 7200) return '1 hour ago';
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return '1 day ago';
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Storage helpers for recent files
 */
export const recentFilesStorage = {
  key: 'mes-duplication-tool-recent-files',
  maxFiles: 3,

  get(): RecentFile[] {
    try {
      const data = sessionStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save(files: RecentFile[]): void {
    try {
      const limited = files.slice(0, this.maxFiles);
      sessionStorage.setItem(this.key, JSON.stringify(limited));
    } catch (e) {
      console.error('Failed to save recent files:', e);
    }
  },

  add(file: RecentFile): void {
    const files = this.get();
    // Remove if already exists
    const filtered = files.filter(f => f.name !== file.name);
    // Add to beginning
    filtered.unshift(file);
    this.save(filtered);
  },

  clear(): void {
    try {
      sessionStorage.removeItem(this.key);
    } catch (e) {
      console.error('Failed to clear recent files:', e);
    }
  },
};

/**
 * Download a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Count entities in a configuration
 */
export function countEntities(data: any): EntityCounts {
  const counts: EntityCounts = {
    stages: 0,
    tasks: 0,
    parameters: 0,
    automations: 0,
    rules: 0,
  };

  if (!Array.isArray(data)) return counts;

  data.forEach(checklist => {
    if (checklist.stageRequests) {
      counts.stages += checklist.stageRequests.length;

      checklist.stageRequests.forEach((stage: any) => {
        if (stage.taskRequests) {
          counts.tasks += stage.taskRequests.length;

          stage.taskRequests.forEach((task: any) => {
            if (task.parameterRequests) {
              counts.parameters += task.parameterRequests.length;

              task.parameterRequests.forEach((param: any) => {
                if (param.rules) {
                  counts.rules += param.rules.length;
                }
              });
            }

            if (task.automationRequests) {
              counts.automations += task.automationRequests.length;
            }
          });
        }
      });
    }
  });

  return counts;
}

/**
 * Extract all entity IDs from configuration
 */
export function extractAllIds(config: any): Set<string> {
  const ids = new Set<string>();

  function traverse(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    if (obj.id && typeof obj.id === 'string') {
      ids.add(obj.id);
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => traverse(item));
    } else {
      Object.values(obj).forEach(value => traverse(value));
    }
  }

  traverse(config);
  return ids;
}

/**
 * Format date and time
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
