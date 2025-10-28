import { useState, useMemo } from 'react';
import { Search, ChevronRight, Clipboard, Folder, CheckSquare, Settings, Info, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  buildTreeFromConfig,
  treeNodeToSelectedEntity,
  searchTree,
  getEntityColor,
} from '@/utils/treeHelpers';
import { ENTITY_TYPE_LABELS } from '@/utils/constants';
import type { ChecklistConfig, SelectedEntity, TreeNode } from '@/types';

interface Step2SelectProps {
  config: ChecklistConfig[];
  selectedEntities: SelectedEntity[];
  onToggleEntity: (entity: SelectedEntity) => void;
  onClearSelection: () => void;
}

export default function Step2Select({
  config,
  selectedEntities,
  onToggleEntity,
  onClearSelection
}: Step2SelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure
  const tree = useMemo(() => buildTreeFromConfig(config), [config]);

  // Filter tree based on search
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTree(tree, searchQuery);
  }, [tree, searchQuery]);

  // Track selected IDs for quick lookup
  const selectedIds = useMemo(() => {
    return new Set(selectedEntities.map(e => e.id));
  }, [selectedEntities]);

  // Determine the selected entity type (for same-type validation)
  const selectedType = selectedEntities.length > 0 ? selectedEntities[0].type : null;

  const canSelectNode = (node: TreeNode): boolean => {
    // Checklists cannot be selected
    if (node.type === 'checklist') return false;

    // If nothing selected yet, can select any non-checklist node
    if (!selectedType) return true;

    // If something is selected, can only select same type
    return node.type === selectedType;
  };

  const handleCheckboxChange = (node: TreeNode, _checked: boolean) => {
    if (!canSelectNode(node)) return;

    const selectedEntity = treeNodeToSelectedEntity(node, config);
    if (selectedEntity) {
      onToggleEntity(selectedEntity);
    }
  };

  const handleNodeClick = (node: TreeNode) => {
    // Checklists just toggle expand
    if (node.type === 'checklist') {
      toggleExpand(node.id);
      return;
    }

    // For selectable nodes, expand if they have children
    if (node.children.length > 0) {
      toggleExpand(node.id);
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderIcon = (type: TreeNode['type']) => {
    const iconClass = `h-4 w-4 ${getEntityColor(type)}`;
    switch (type) {
      case 'checklist':
        return <Clipboard className={iconClass} />;
      case 'stage':
        return <Folder className={iconClass} />;
      case 'task':
        return <CheckSquare className={iconClass} />;
      case 'parameter':
        return <Settings className={iconClass} />;
    }
  };

  const renderTreeNode = (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelectable = canSelectNode(node);
    const isDisabled = !isSelectable && node.type !== 'checklist';

    return (
      <div key={node.id} className="select-none">
        <div
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            isSelected
              ? 'bg-accent'
              : 'hover:bg-accent/50'
          } ${isDisabled ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${node.level * 16 + 12}px` }}
        >
          {/* Expand/Collapse Arrow */}
          {hasChildren && (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-0 hover:bg-transparent"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          {/* Checkbox for selectable nodes */}
          {node.type !== 'checklist' && (
            <Checkbox
              checked={isSelected}
              disabled={isDisabled}
              onCheckedChange={(checked) => handleCheckboxChange(node, checked as boolean)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {node.type === 'checklist' && <div className="w-4" />}

          {/* Icon */}
          <button
            onClick={() => handleNodeClick(node)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            {renderIcon(node.type)}

            <span className="flex-1 truncate font-medium text-sm">{node.name}</span>

            {node.orderTree !== undefined && (
              <span className="text-xs text-muted-foreground">#{node.orderTree}</span>
            )}

            {node.counts && (
              <Badge variant="secondary" className="text-xs">
                {node.type === 'checklist' && `${node.counts.stages} stages`}
                {node.type === 'stage' && `${node.counts.tasks} tasks`}
                {node.type === 'task' && `${node.counts.parameters} params`}
              </Badge>
            )}
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderTreeNode(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Tree View */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workflow Structure</CardTitle>
                <CardDescription>
                  Select entities to duplicate (same type only)
                </CardDescription>
              </div>
              {selectedEntities.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-sm">
                    {selectedEntities.length} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearSelection}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
            {selectedType && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Selecting <strong>{ENTITY_TYPE_LABELS[selectedType]}</strong> entities.
                  Only {ENTITY_TYPE_LABELS[selectedType].toLowerCase()} can be selected together.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search Results */}
            {searchQuery && filteredResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Found {filteredResults.length} result(s)
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1">
                    {filteredResults.map((node) => {
                      const isSelected = selectedIds.has(node.id);
                      const isSelectable = canSelectNode(node);
                      const isDisabled = !isSelectable;

                      return (
                        <div
                          key={node.id}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                            isSelected
                              ? 'bg-accent'
                              : 'hover:bg-accent/50'
                          } ${isDisabled ? 'opacity-50' : ''}`}
                        >
                          {node.type !== 'checklist' && (
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => handleCheckboxChange(node, checked as boolean)}
                            />
                          )}
                          {renderIcon(node.type)}
                          <span className="flex-1 truncate text-sm">{node.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {ENTITY_TYPE_LABELS[node.type]}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {searchQuery && filteredResults.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No entities found matching "{searchQuery}"
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Tree View */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {tree.map((node) => renderTreeNode(node))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Selected Entities */}
      <div className="lg:col-span-1">
        {selectedEntities.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Selected Entities ({selectedEntities.length})
              </CardTitle>
              <CardDescription>
                {selectedType && `${ENTITY_TYPE_LABELS[selectedType]} entities`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {selectedEntities.map((entity, index) => (
                    <div
                      key={entity.id}
                      className="p-3 border rounded-md space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {renderIcon(entity.type)}
                          <span className="font-medium text-sm">
                            {entity.data.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleEntity(entity)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Position:</span>
                          <code className="bg-muted px-1.5 py-0.5 rounded">
                            #{entity.data.orderTree || index + 1}
                          </code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">ID:</span>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            {entity.id.substring(0, 8)}...
                          </code>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        {entity.path.join(' > ')}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Selected:</span>
                  <Badge>{selectedEntities.length}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onClearSelection}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selection</CardTitle>
              <CardDescription>
                Select entities to duplicate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm mb-4">
                  Select one or more entities from the tree
                </p>
                <ul className="text-xs text-left space-y-1 max-w-xs mx-auto">
                  <li>• Use checkboxes to select multiple entities</li>
                  <li>• Only same-type entities can be selected together</li>
                  <li>• Checklists cannot be duplicated</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
