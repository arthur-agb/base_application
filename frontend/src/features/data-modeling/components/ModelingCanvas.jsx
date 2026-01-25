import React, { useCallback, useMemo, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    applyEdgeChanges,
    applyNodeChanges,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Typography, Stack } from '@mui/material';
import { MdSchema } from 'react-icons/md';
import TableNode from './TableNode';

// Define custom node types
const nodeTypes = {
    tableNode: TableNode,
};

const ModelingCanvas = forwardRef(({ model, colors, onEdgeClick, onNodeAdd, onNodeClick, isModalOpen }, ref) => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    // Derived state: Map of tableId -> Set of connected column names
    const connectedColumnsMap = useMemo(() => {
        const map = {};
        edges.forEach(edge => {
            if (!map[edge.source]) map[edge.source] = new Set();
            if (!map[edge.target]) map[edge.target] = new Set();

            if (edge.data?.conditions && edge.data.conditions.length > 0) {
                // Multi-column join support
                edge.data.conditions.forEach(c => {
                    if (c.fromColumn) map[edge.source].add(c.fromColumn);
                    if (c.toColumn) map[edge.target].add(c.toColumn);
                });
            } else {
                // Single column join fallback
                if (edge.data?.fromColumn) map[edge.source].add(edge.data.fromColumn);
                if (edge.data?.toColumn) map[edge.target].add(edge.data.toColumn);
            }
        });
        return map;
    }, [edges]);

    // Inject connectedColumns into node data
    const nodesWithData = useMemo(() => {
        return nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                connectedColumns: connectedColumnsMap[node.id] || new Set(),
                isModalOpen: isModalOpen
            }
        }));
    }, [nodes, connectedColumnsMap, isModalOpen]);

    // Expose state to parent
    useImperativeHandle(ref, () => ({
        getNodes: () => nodes,
        getEdges: () => edges,
        setNodes: (nds) => setNodes((prev) => typeof nds === 'function' ? nds(prev) : nds),
        setEdges: (eds) => setEdges((prev) => typeof eds === 'function' ? eds(prev) : eds),
        addEdge: (edge) => setEdges((eds) => addEdge(edge, eds)),
        fitView: () => reactFlowInstance?.fitView({ padding: 0.2 })
    }));

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (params) => {
            // Instead of immediate add, we'll let the parent handle it via a modal
            // But for the POC, if we don't have a modal yet, we'll auto-add a default
            const newEdge = {
                ...params,
                id: `e_${params.source}_${params.target}`,
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: '#0052CC' },
                style: { stroke: '#0052CC', strokeWidth: 2 },
                data: { cardinality: 'ONE_TO_MANY', joinType: 'LEFT' }
            };
            setEdges((eds) => addEdge(newEdge, eds));
            if (onEdgeClick) onEdgeClick(newEdge);
        },
        [onEdgeClick]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const rawData = event.dataTransfer.getData('application/reactflow');
            if (!rawData) return;

            const data = JSON.parse(rawData);
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: `node_${Date.now()}`,
                type: 'tableNode',
                position,
                data: { ...data, colors },
            };

            setNodes((nds) => nds.concat(newNode));
            if (onNodeAdd) onNodeAdd(newNode);
        },
        [reactFlowInstance, colors, onNodeAdd]
    );

    // Inject validation styles into edges
    const edgesWithValidation = useMemo(() => {
        return edges.map(edge => {
            const isM2M = edge.data?.cardinality === 'MANY_TO_MANY';
            if (isM2M) {
                return {
                    ...edge,
                    animated: false,
                    style: { ...edge.style, stroke: '#FF4D4D', strokeWidth: 3 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#FF4D4D' }
                };
            }
            return edge;
        });
    }, [edges]);

    return (
        <Box
            ref={reactFlowWrapper}
            sx={{
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '12px',
                border: `1px dashed ${colors.borderColor}`,
                overflow: 'hidden',
                pointerEvents: isModalOpen ? 'none' : 'auto'
            }}
        >
            <ReactFlow
                nodes={nodesWithData}
                edges={edgesWithValidation}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onEdgeClick={(evt, edge) => onEdgeClick && onEdgeClick(edge)}
                onNodeClick={(evt, node) => onNodeClick && onNodeClick(node)}
                nodeTypes={nodeTypes}
                proOptions={{ hideAttribution: true }}
                nodesFocusable={!isModalOpen}
                edgesFocusable={!isModalOpen}
                elementsSelectable={!isModalOpen}
                nodesDraggable={!isModalOpen}
                nodesConnectable={!isModalOpen}
                zoomOnScroll={!isModalOpen}
                zoomOnPinch={!isModalOpen}
                panOnDrag={!isModalOpen}
            >
                <Background color={colors.borderColor} gap={20} />
                <Controls />

                {nodes.length === 0 && !isModalOpen && (
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        zIndex: 5,
                        pointerEvents: 'none',
                        opacity: 0.5
                    }}>
                        <Box sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            border: `2px dashed ${colors.borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <MdSchema size={30} color={colors.borderColor} />
                        </Box>
                        <Stack spacing={1}>
                            <Typography variant="body1" fontWeight="600" color="text.secondary">
                                Empty Canvas
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Drag and drop tables from the catalog on the right<br />
                                to start building your data model.
                            </Typography>
                        </Stack>
                    </Box>
                )}
            </ReactFlow>
        </Box>
    );
});

export default ModelingCanvas;
