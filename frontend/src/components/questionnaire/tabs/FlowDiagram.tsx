import React, { useRef, useEffect, useState } from 'react';
import { MongoForm } from '../../../types/questionnaire';

interface FlowDiagramProps {
  form: MongoForm;
  onQuestionClick?: (questionId: string) => void;
  selectedQuestionId?: string | null;
}

interface Position {
  x: number;
  y: number;
}

interface QuestionNode {
  id: string;
  position: Position;
  text: string;
  isConditional: boolean;
  isRequired: boolean;
  level: number;
  index: number;
}

const FlowDiagram: React.FC<FlowDiagramProps> = ({
  form,
  onQuestionClick,
  selectedQuestionId,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const getQuestionText = (questionId: string) => {
    return `Question ${questionId.slice(-4)}`;
  };

  // Improved positioning algorithm
  const getQuestionNodes = (): QuestionNode[] => {
    const nodes: QuestionNode[] = [];
    const independentQuestions = form.questions.filter(q => !q.visible_if || Object.keys(q.visible_if).length === 0);
    const conditionalQuestions = form.questions.filter(q => q.visible_if && Object.keys(q.visible_if).length > 0);

    // Create a map of question dependencies
    const dependencyMap = new Map<string, string[]>();
    const reverseDependencyMap = new Map<string, string[]>();

    conditionalQuestions.forEach(question => {
      if (question.visible_if?.conditions) {
        question.visible_if.conditions.forEach((condition: any) => {
          const sourceId = condition.question_id;
          const targetId = question.question_id;
          
          if (!dependencyMap.has(sourceId)) dependencyMap.set(sourceId, []);
          if (!reverseDependencyMap.has(targetId)) reverseDependencyMap.set(targetId, []);
          
          dependencyMap.get(sourceId)!.push(targetId);
          reverseDependencyMap.get(targetId)!.push(sourceId);
        });
      }
    });

    // Position independent questions in the first level
    independentQuestions.forEach((question, index) => {
      nodes.push({
        id: question.question_id,
        position: { x: 50 + index * 180, y: 50 },
        text: getQuestionText(question.question_id),
        isConditional: false,
        isRequired: question.required,
        level: 0,
        index,
      });
    });

    // Position conditional questions in subsequent levels
    const processedNodes = new Set<string>();
    independentQuestions.forEach(q => processedNodes.add(q.question_id));

    let currentLevel = 1;
    let nodesInCurrentLevel = [...conditionalQuestions];

    while (nodesInCurrentLevel.length > 0) {
      const nextLevelNodes: typeof nodesInCurrentLevel = [];
      const levelNodes: QuestionNode[] = [];

      nodesInCurrentLevel.forEach((question) => {
        const dependencies = reverseDependencyMap.get(question.question_id) || [];
        const allDependenciesProcessed = dependencies.every(dep => processedNodes.has(dep));

        if (allDependenciesProcessed) {
          levelNodes.push({
            id: question.question_id,
            position: { x: 0, y: 50 + currentLevel * 120 }, // Will be positioned later
            text: getQuestionText(question.question_id),
            isConditional: true,
            isRequired: question.required,
            level: currentLevel,
            index: 0, // Will be set during positioning
          });
          processedNodes.add(question.question_id);
        } else {
          nextLevelNodes.push(question);
        }
      });

      // Position nodes in current level with proper spacing
      levelNodes.forEach((node, index) => {
        const centerX = dimensions.width / 2;
        const spacing = 180;
        const totalWidth = (levelNodes.length - 1) * spacing;
        const startX = centerX - totalWidth / 2;
        
        node.position.x = startX + index * spacing;
        node.index = index;
        nodes.push(node);
      });

      nodesInCurrentLevel = nextLevelNodes;
      currentLevel++;
    }

    return nodes;
  };

  const getConnections = () => {
    const connections: Array<{ from: string; to: string; condition?: string; fromIndex: number; toIndex: number }> = [];
    
    form.questions.forEach(question => {
      if (question.visible_if?.conditions) {
        question.visible_if.conditions.forEach((condition: any) => {
          connections.push({
            from: condition.question_id,
            to: question.question_id,
            condition: `${condition.operator} "${condition.value}"`,
            fromIndex: 0,
            toIndex: 0,
          });
        });
      }
    });

    return connections;
  };

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Pan and zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(2, zoom * delta));
    setZoom(newZoom);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const nodes = getQuestionNodes();
  const connections = getConnections();

  const getNodeColor = (node: QuestionNode) => {
    if (node.id === selectedQuestionId) return 'bg-yellow-100 border-yellow-400 shadow-lg';
    if (node.isConditional) return 'bg-blue-100 border-blue-400';
    return 'bg-green-100 border-green-400';
  };

  const getNodeIcon = (node: QuestionNode) => {
    if (node.isConditional) {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  // Calculate connection positions with better spacing
  const getConnectionPath = (fromNode: QuestionNode, toNode: QuestionNode) => {
    const startX = fromNode.position.x + 100; // Center of source node
    const startY = fromNode.position.y + 40;  // Bottom of source node
    const endX = toNode.position.x + 100;     // Center of target node
    const endY = toNode.position.y;           // Top of target node

    // Create a smoother curve with better control points
    const midY = (startY + endY) / 2;
    const controlPoint1X = startX;
    const controlPoint1Y = startY + (midY - startY) * 0.8;
    const controlPoint2X = endX;
    const controlPoint2Y = endY + (midY - endY) * 0.8;

    return {
      pathData: `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${endX} ${endY}`,
      labelX: (startX + endX) / 2,
      labelY: midY - 15,
    };
  };

  return (
    <div className="relative w-full h-96 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
          title="Zoom In"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
          title="Zoom Out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
          title="Reset View"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md px-3 py-2 border border-gray-200">
        <span className="text-sm text-gray-600">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* SVG for connections */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {connections.map((connection, index) => {
            const fromNode = nodes.find(n => n.id === connection.from);
            const toNode = nodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) return null;

            const { pathData, labelX, labelY } = getConnectionPath(fromNode, toNode);

            return (
              <g key={index}>
                <path
                  d={pathData}
                  stroke="#3B82F6"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                />
                {/* Arrow head */}
                <polygon
                  points={`${toNode.position.x + 95},${toNode.position.y + 5} ${toNode.position.x + 105},${toNode.position.y + 5} ${toNode.position.x + 100},${toNode.position.y - 5}`}
                  fill="#3B82F6"
                />
                {/* Condition label with background */}
                {connection.condition && (
                  <g>
                    <rect
                      x={labelX - 40}
                      y={labelY - 8}
                      width={80}
                      height={16}
                      rx={8}
                      fill="white"
                      stroke="#3B82F6"
                      strokeWidth="1"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      className="text-xs fill-blue-600 font-medium"
                      style={{ fontSize: '10px' }}
                    >
                      {connection.condition}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Question nodes */}
      <div 
        ref={canvasRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        style={{ zIndex: 2 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute w-48 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${getNodeColor(node)}`}
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onQuestionClick?.(node.id);
              }}
            >
              <div className="flex items-center space-x-2 mb-2">
                {getNodeIcon(node)}
                <span className="text-sm font-medium text-gray-900 truncate">
                  {node.text}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {node.isConditional && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Conditional
                    </span>
                  )}
                  {node.isRequired && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Required
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  L{node.level}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 border border-gray-200">
        <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Always Shown</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Conditional</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Selected</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions to display</h3>
            <p className="text-sm text-gray-600">
              Add questions in the Questions tab to see the flow diagram
            </p>
          </div>
        </div>
      )}

      {/* Navigation hint */}
      {nodes.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-2 border border-gray-200">
          <div className="text-xs text-gray-500">
            <div>🖱️ Drag to pan</div>
            <div>🔍 Scroll to zoom</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowDiagram; 