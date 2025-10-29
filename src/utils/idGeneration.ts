/**
 * Generate a new unique ID in the format matching original MES IDs
 * Format: 18-19 digit numeric string (timestamp + random)
 */
export function generateNewId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return timestamp + random;
}

/**
 * Generate multiple unique IDs
 */
export function generateMultipleIds(count: number): string[] {
  const ids: string[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    let id = generateNewId();

    // Ensure uniqueness (extremely unlikely collision, but safety check)
    while (usedIds.has(id)) {
      // Wait a tiny bit and regenerate
      id = generateNewId();
    }

    usedIds.add(id);
    ids.push(id);
  }

  return ids;
}

/**
 * Check if a value looks like an ID (18-19 digit numeric string)
 */
export function looksLikeId(value: any): value is string {
  return typeof value === 'string' && /^\d{18,19}$/.test(value);
}

/**
 * Check if a key name suggests it contains an ID reference
 */
export function isIdKey(key: string): boolean {
  const idKeys = [
    'id',
    'parameterId',
    'taskId',
    'stageId',
    'checklistId',
    'referencedParameterId',
    'autoInitialize',
    'actionId',
    'effectId',
    'triggerEntityId',
  ];

  return idKeys.some(k => key.toLowerCase().includes(k.toLowerCase()));
}

/**
 * Check if a key-value pair represents an ID reference
 */
export function isIdReference(key: string, value: any): boolean {
  return isIdKey(key) && looksLikeId(value);
}
