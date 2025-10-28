import { useState, useMemo } from 'react';
import { Search, ChevronRight, Clipboard, Folder, CheckSquare, Settings, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  onEntitySelected: (entity: SelectedEntity) => void;
}

export default function Step2Select({ config, onEntitySelected }: Step2SelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure
  const tree = useMemo(() => buildTreeFromConfig(config), [config]);

  // Filter tree based on search
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTree(tree, searchQuery);
  }, [tree, searchQuery]);

  const handleNodeClick = (node: TreeNode) => {
    // Only stages, tasks, and parameters can be selected (not checklists)
    if (node.type === 'checklist') {
      // Just toggle expand
      toggleExpand(node.id);
      return;
    }

    setSelectedNode(node);
    const selectedEntity = treeNodeToSelectedEntity(node, config);
    if (selectedEntity) {
      onEntitySelected(selectedEntity);
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
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <button
          onClick={() => handleNodeClick(node)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          style={{ paddingLeft: `${node.level * 16 + 12}px` }}
        >
          {hasChildren && (
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
            />
          )}
          {!hasChildren && <div className="w-4" />}

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
            <CardTitle>Workflow Structure</CardTitle>
            <CardDescription>
              Select a stage, task, or parameter to duplicate
            </CardDescription>
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
                    {filteredResults.map((node) => (
                      <button
                        key={node.id}
                        onClick={() => handleNodeClick(node)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                          selectedNode?.id === node.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        {renderIcon(node.type)}
                        <span className="flex-1 truncate text-sm">{node.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {ENTITY_TYPE_LABELS[node.type]}
                        </Badge>
                      </button>
                    ))}
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

      {/* Right Panel - Entity Details */}
      <div className="lg:col-span-1">
        {selectedNode ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {renderIcon(selectedNode.type)}
                <CardTitle className="text-lg">Selected Entity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
                <div className="font-semibold">{selectedNode.name}</div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Type</div>
                <Badge variant="outline">
                  {ENTITY_TYPE_LABELS[selectedNode.type]}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">ID</div>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {selectedNode.id}
                </code>
              </div>

              {selectedNode.orderTree !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Order Position
                  </div>
                  <div className="text-sm">{selectedNode.orderTree}</div>
                </div>
              )}

              {selectedNode.counts && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Contains
                    </div>
                    <div className="space-y-2 text-sm">
                      {selectedNode.counts.stages > 0 && (
                        <div className="flex justify-between">
                          <span>Stages</span>
                          <Badge variant="secondary">{selectedNode.counts.stages}</Badge>
                        </div>
                      )}
                      {selectedNode.counts.tasks > 0 && (
                        <div className="flex justify-between">
                          <span>Tasks</span>
                          <Badge variant="secondary">{selectedNode.counts.tasks}</Badge>
                        </div>
                      )}
                      {selectedNode.counts.parameters > 0 && (
                        <div className="flex justify-between">
                          <span>Parameters</span>
                          <Badge variant="secondary">{selectedNode.counts.parameters}</Badge>
                        </div>
                      )}
                      {selectedNode.counts.automations > 0 && (
                        <div className="flex justify-between">
                          <span>Automations</span>
                          <Badge variant="secondary">{selectedNode.counts.automations}</Badge>
                        </div>
                      )}
                      {selectedNode.counts.rules > 0 && (
                        <div className="flex justify-between">
                          <span>Rules</span>
                          <Badge variant="secondary">{selectedNode.counts.rules}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Path</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {selectedNode.parent && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: selectedNode.level }).map((_, i) => (
                        <ChevronRight key={i} className="h-3 w-3" />
                      ))}
                      <span className="truncate">{selectedNode.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entity Details</CardTitle>
              <CardDescription>
                Select an entity from the tree to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Click on a stage, task, or parameter in the tree to select it for duplication
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
