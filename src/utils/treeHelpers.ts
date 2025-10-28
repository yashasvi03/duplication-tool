import type {
  ChecklistConfig,
  Stage,
  Task,
  Parameter,
  TreeNode,
  SelectedEntity,
  EntityCounts,
} from '@/types';

/**
 * Build a tree structure from checklist configuration
 */
export function buildTreeFromConfig(config: ChecklistConfig[]): TreeNode[] {
  return config.map((checklist, checklistIndex) => {
    const checklistNode: TreeNode = {
      id: checklist.id,
      name: checklist.name,
      type: 'checklist',
      data: checklist,
      children: [],
      parent: null,
      level: 0,
      counts: countChecklistEntities(checklist),
    };

    // Add stages
    if (checklist.stageRequests) {
      checklistNode.children = checklist.stageRequests.map((stage, stageIndex) => {
        const stageNode: TreeNode = {
          id: stage.id,
          name: stage.name,
          type: 'stage',
          data: stage,
          children: [],
          parent: checklistNode,
          level: 1,
          orderTree: stage.orderTree,
          counts: countStageEntities(stage),
        };

        // Add tasks
        if (stage.taskRequests) {
          stageNode.children = stage.taskRequests.map((task, taskIndex) => {
            const taskNode: TreeNode = {
              id: task.id,
              name: task.name,
              type: 'task',
              data: task,
              children: [],
              parent: stageNode,
              level: 2,
              orderTree: task.orderTree,
              counts: countTaskEntities(task),
            };

            // Add parameters
            if (task.parameterRequests) {
              taskNode.children = task.parameterRequests.map((param) => {
                const paramNode: TreeNode = {
                  id: param.id,
                  name: param.label || `Parameter ${param.id}`,
                  type: 'parameter',
                  data: param,
                  children: [],
                  parent: taskNode,
                  level: 3,
                  orderTree: param.orderTree,
                };

                return paramNode;
              });
            }

            return taskNode;
          });
        }

        return stageNode;
      });
    }

    return checklistNode;
  });
}

/**
 * Count entities in a checklist
 */
function countChecklistEntities(checklist: ChecklistConfig): EntityCounts {
  const counts: EntityCounts = {
    stages: 0,
    tasks: 0,
    parameters: 0,
    automations: 0,
    rules: 0,
  };

  if (checklist.stageRequests) {
    counts.stages = checklist.stageRequests.length;

    checklist.stageRequests.forEach((stage) => {
      const stageCounts = countStageEntities(stage);
      counts.tasks += stageCounts.tasks;
      counts.parameters += stageCounts.parameters;
      counts.automations += stageCounts.automations;
      counts.rules += stageCounts.rules;
    });
  }

  return counts;
}

/**
 * Count entities in a stage
 */
function countStageEntities(stage: Stage): EntityCounts {
  const counts: EntityCounts = {
    stages: 0,
    tasks: 0,
    parameters: 0,
    automations: 0,
    rules: 0,
  };

  if (stage.taskRequests) {
    counts.tasks = stage.taskRequests.length;

    stage.taskRequests.forEach((task) => {
      const taskCounts = countTaskEntities(task);
      counts.parameters += taskCounts.parameters;
      counts.automations += taskCounts.automations;
      counts.rules += taskCounts.rules;
    });
  }

  return counts;
}

/**
 * Count entities in a task
 */
function countTaskEntities(task: Task): EntityCounts {
  const counts: EntityCounts = {
    stages: 0,
    tasks: 0,
    parameters: 0,
    automations: 0,
    rules: 0,
  };

  if (task.parameterRequests) {
    counts.parameters = task.parameterRequests.length;

    task.parameterRequests.forEach((param) => {
      if (param.rules) {
        counts.rules += param.rules.length;
      }
    });
  }

  if (task.automationRequests) {
    counts.automations = task.automationRequests.length;
  }

  return counts;
}

/**
 * Find a node in the tree by ID
 */
export function findNodeById(tree: TreeNode[], id: string): TreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node;

    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Convert TreeNode to SelectedEntity
 */
export function treeNodeToSelectedEntity(
  node: TreeNode,
  config: ChecklistConfig[]
): SelectedEntity | null {
  // Find indices by traversing up the tree
  let checklistIndex = -1;
  let stageIndex: number | undefined;
  let taskIndex: number | undefined;

  // Find checklist index
  let currentNode: TreeNode | null = node;
  while (currentNode && currentNode.type !== 'checklist') {
    currentNode = currentNode.parent;
  }

  if (currentNode) {
    checklistIndex = config.findIndex(c => c.id === currentNode!.id);
  }

  // Find stage index
  if (node.type === 'stage' || node.type === 'task' || node.type === 'parameter') {
    let stageNode: TreeNode | null = node;
    while (stageNode && stageNode.type !== 'stage') {
      stageNode = stageNode.parent;
    }
    if (stageNode && stageNode.parent) {
      const checklist = stageNode.parent.data as ChecklistConfig;
      stageIndex = checklist.stageRequests?.findIndex(s => s.id === stageNode!.id);
    }
  }

  // Find task index
  if (node.type === 'task' || node.type === 'parameter') {
    let taskNode: TreeNode | null = node;
    while (taskNode && taskNode.type !== 'task') {
      taskNode = taskNode.parent;
    }
    if (taskNode && taskNode.parent) {
      const stage = taskNode.parent.data as Stage;
      taskIndex = stage.taskRequests?.findIndex(t => t.id === taskNode!.id);
    }
  }

  // Determine parent
  let parent: ChecklistConfig | Stage | Task | null = null;
  if (node.parent) {
    parent = node.parent.data as any;
  }

  const entityType = node.type === 'checklist' ? 'stage' :
                     node.type === 'stage' ? 'task' :
                     node.type === 'task' ? 'parameter' : 'parameter';

  // Only stages, tasks, and parameters can be selected
  if (node.type === 'checklist') {
    return null;
  }

  return {
    type: entityType as 'stage' | 'task' | 'parameter',
    id: node.id,
    data: node.data,
    parent,
    path: buildPath(node),
    checklistIndex,
    stageIndex,
    taskIndex,
  };
}

/**
 * Build path from root to node
 */
function buildPath(node: TreeNode): string[] {
  const path: string[] = [];
  let current: TreeNode | null = node;

  while (current) {
    path.unshift(current.name);
    current = current.parent;
  }

  return path;
}

/**
 * Search tree nodes by name
 */
export function searchTree(tree: TreeNode[], query: string): TreeNode[] {
  const results: TreeNode[] = [];
  const lowerQuery = query.toLowerCase();

  function search(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.name.toLowerCase().includes(lowerQuery)) {
        results.push(node);
      }
      if (node.children.length > 0) {
        search(node.children);
      }
    }
  }

  search(tree);
  return results;
}

/**
 * Get entity type icon name (for lucide-react)
 */
export function getEntityIcon(type: TreeNode['type']): string {
  switch (type) {
    case 'checklist':
      return 'Clipboard';
    case 'stage':
      return 'Folder';
    case 'task':
      return 'CheckSquare';
    case 'parameter':
      return 'Settings';
    default:
      return 'Circle';
  }
}

/**
 * Get entity type color
 */
export function getEntityColor(type: TreeNode['type']): string {
  switch (type) {
    case 'checklist':
      return 'text-purple-600';
    case 'stage':
      return 'text-blue-600';
    case 'task':
      return 'text-green-600';
    case 'parameter':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
}
