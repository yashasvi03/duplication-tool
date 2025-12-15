# Changes - Fix JSON Duplication Reference Issue

## Summary
Fixed a bug where references between simultaneously duplicated entities (e.g., multiple parameters) were not being updated correctly. The issue was caused by each entity being duplicated with an isolated ID mapping, preventing them from resolving the new IDs of other simultaneously duplicated entities.

## Modified Files

### `src/utils/duplicationEngine.ts`

#### `duplicateMultipleEntities`
- **Change**: Updated to generate ID mappings for *all* selected entities first and then merge them into a single global `IdMapping` object.
- **Reason**: This ensures that when an entity is being duplicated, it has access to the new IDs of all other entities being duplicated in the same batch.

#### `applyInterleavedGrouped`, `applySequentialRelative`, `applySequentialGrouped`
- **Change**: Updated function signatures to accept a single merged `idMapping: IdMapping` instead of an array of mappings (`allIdMappings: IdMapping[]`).
- **Reason**: To support the merged mapping approach.

## Verification
- Created a reproduction script `reproduce_issue_multi.ts` that simulates duplicating two parameters where one refers to the other via a validation rule.
- Verified that with the fix, the validation rule correctly points to the new ID of the referenced parameter.
