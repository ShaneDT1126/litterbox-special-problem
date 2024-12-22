// src/components/ascii/asciiDiagramGenerator.js

const logger = require('../../utils/logger');

class ASCIIDiagramGenerator {
    constructor() {
        // Basic components for computer architecture diagrams
        this.components = {
            BOX: {
                topLeft: '+',
                topRight: '+',
                bottomLeft: '+',
                bottomRight: '+',
                horizontal: '-',
                vertical: '|'
            },
            ARROW: {
                horizontal: '-->',
                vertical: '|',
                up: '^',
                down: 'v'
            }
        };

        // Standard sizes for components
        this.sizes = {
            small: {
                width: 15,
                height: 3
            },
            medium: {
                width: 25,
                height: 5
            },
            large: {
                width: 35,
                height: 7
            }
        };
    }

    generateDiagram(component, complexity = 'simple') {
        try {
            let diagram;
            switch (component.toUpperCase()) {
                case 'CPU':
                    diagram = this._generateCPUDiagram(complexity);
                    break;
                case 'MEMORY':
                    diagram = this._generateMemoryDiagram(complexity);
                    break;
                case 'CACHE':
                    diagram = this._generateCacheDiagram(complexity);
                    break;
                default:
                    throw new Error(`Unsupported component: ${component}`);
            }

            logger.loggers.ascii.info({
                type: 'diagram_generated',
                details: {
                    component,
                    complexity
                }
            });

            return this._formatDiagram(diagram);
        } catch (error) {
            logger.loggers.ascii.error({
                type: 'diagram_generation_error',
                details: {
                    component,
                    complexity,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _generateBox(width, height, label) {
        const lines = [];
        
        // Top border
        lines.push(
            this.components.BOX.topLeft +
            this.components.BOX.horizontal.repeat(width - 2) +
            this.components.BOX.topRight
        );

        // Calculate label position for center alignment
        const labelStart = Math.floor((width - label.length) / 2);
        
        // Middle lines
        for (let i = 0; i < height - 2; i++) {
            if (i === Math.floor((height - 2) / 2)) {
                // Line with label
                let line = this.components.BOX.vertical;
                line += ' '.repeat(labelStart - 1);
                line += label;
                line += ' '.repeat(width - labelStart - label.length - 1);
                line += this.components.BOX.vertical;
                lines.push(line);
            } else {
                // Empty line
                lines.push(
                    this.components.BOX.vertical +
                    ' '.repeat(width - 2) +
                    this.components.BOX.vertical
                );
            }
        }

        // Bottom border
        lines.push(
            this.components.BOX.bottomLeft +
            this.components.BOX.horizontal.repeat(width - 2) +
            this.components.BOX.bottomRight
        );

        return lines.join('\n');
    }

    _formatDiagram(diagram) {
        return diagram
            .split('\n')
            .map(line => line.trimRight())
            .filter(line => line.length > 0)
            .join('\n');
    }

    _generateCPUDiagram(complexity) {
        try {
            if (complexity === 'simple') {
                return this._generateSimpleCPUDiagram();
            } else {
                return this._generateDetailedCPUDiagram();
            }
        } catch (error) {
            logger.loggers.ascii.error({
                type: 'cpu_diagram_error',
                details: {
                    complexity,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _generateSimpleCPUDiagram() {
        const width = this.sizes.medium.width;
        const cpuBox = this._generateBox(width, 3, 'CPU');
        const cacheBox = this._generateBox(width, 3, 'Cache');
        const registersBox = this._generateBox(width, 3, 'Registers');

        return `
${cpuBox}
${this._generateArrow('down', width)}
${cacheBox}
${this._generateArrow('down', width)}
${registersBox}`;
    }

    _generateDetailedCPUDiagram() {
        const width = this.sizes.large.width;
        const cpuBox = this._generateBox(width, 3, 'CPU');
        const controlBox = this._generateBox(width - 4, 3, 'Control Unit');
        const aluBox = this._generateBox(width - 4, 3, 'ALU');
        const registersBox = this._generateBox(width - 4, 3, 'Registers');

        return `
${cpuBox}
${this._addIndentation(controlBox, 2)}
${this._generateArrow('down', width - 4, 2)}
${this._addIndentation(aluBox, 2)}
${this._generateArrow('down', width - 4, 2)}
${this._addIndentation(registersBox, 2)}`;
    }

    _generateMemoryDiagram(complexity) {
        try {
            if (complexity === 'simple') {
                return this._generateSimpleMemoryDiagram();
            } else {
                return this._generateDetailedMemoryDiagram();
            }
        } catch (error) {
            logger.loggers.ascii.error({
                type: 'memory_diagram_error',
                details: {
                    complexity,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _generateSimpleMemoryDiagram() {
        const width = this.sizes.medium.width;
        const memoryBox = this._generateBox(width, 3, 'Memory');
        const sections = ['Data', 'Code', 'Stack', 'Heap'].map(
            section => this._generateBox(width, 2, section)
        );

        return `
${memoryBox}
${sections.join('\n')}`;
    }

    _generateDetailedMemoryDiagram() {
        const width = this.sizes.large.width;
        const memoryBox = this._generateBox(width, 3, 'Memory');
        const sections = [
            { name: 'Stack', size: 5 },
            { name: 'Heap', size: 5 },
            { name: 'Data', size: 4 },
            { name: 'Code', size: 4 }
        ].map(section => 
            this._addIndentation(
                this._generateBox(width - 4, section.size, section.name),
                2
            )
        );

        return `
${memoryBox}
${sections.join('\n')}`;
    }

    _generateArrow(direction, width, indent = 0) {
        const indentation = ' '.repeat(indent);
        switch (direction) {
            case 'down':
                return `${indentation}${' '.repeat(width/2)}${this.components.ARROW.down}`;
            case 'up':
                return `${indentation}${' '.repeat(width/2)}${this.components.ARROW.up}`;
            case 'right':
                return `${indentation}${this.components.ARROW.horizontal}`;
            case 'left':
                return `${indentation}${this.components.ARROW.horizontal.split('').reverse().join('')}`;
            default:
                throw new Error(`Invalid arrow direction: ${direction}`);
        }
    }

    _addIndentation(text, spaces) {
        return text.split('\n')
            .map(line => ' '.repeat(spaces) + line)
            .join('\n');
    }

    _generateCacheDiagram(complexity) {
        try {
            if (complexity === 'simple') {
                return this._generateSimpleCacheDiagram();
            } else {
                return this._generateDetailedCacheDiagram();
            }
        } catch (error) {
            logger.loggers.ascii.error({
                type: 'cache_diagram_error',
                details: {
                    complexity,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _generateSimpleCacheDiagram() {
        const width = this.sizes.medium.width;
        const cacheBox = this._generateBox(width, 3, 'Cache');
        const cacheTypes = ['L1 Cache', 'L2 Cache', 'L3 Cache'].map(
            type => this._generateBox(width, 2, type)
        );

        return `
${cacheBox}
${cacheTypes.join('\n')}`;
    }

    _generateDetailedCacheDiagram() {
        const width = this.sizes.large.width;
        const mainBox = this._generateBox(width, 3, 'Cache Hierarchy');
        
        const caches = [
            { name: 'L1 Cache', desc: '(Fastest/Small)' },
            { name: 'L2 Cache', desc: '(Fast/Medium)' },
            { name: 'L3 Cache', desc: '(Slower/Large)' }
        ];

        const cacheBoxes = caches.map(cache => {
            const box = this._generateBox(width - 4, 4, `${cache.name}\n${cache.desc}`);
            return this._addIndentation(box, 2);
        });

        return `
${mainBox}
${cacheBoxes.join(this._generateArrow('down', width - 4, 2) + '\n')}`;
    }

    generateCustomDiagram(components, connections) {
        try {
            // Validate input
            if (!Array.isArray(components) || !Array.isArray(connections)) {
                throw new Error('Components and connections must be arrays');
            }

            // Create component boxes
            const componentBoxes = new Map();
            components.forEach(comp => {
                const box = this._generateBox(
                    this.sizes.medium.width,
                    3,
                    comp.name
                );
                componentBoxes.set(comp.name, {
                    box,
                    position: comp.position || { x: 0, y: 0 }
                });
            });

            // Generate connections
            const connectionLines = this._generateConnections(
                componentBoxes,
                connections
            );

            // Combine everything into final diagram
            const diagram = this._combineComponentsAndConnections(
                componentBoxes,
                connectionLines
            );

            logger.loggers.ascii.info({
                type: 'custom_diagram_generated',
                details: {
                    componentCount: components.length,
                    connectionCount: connections.length
                }
            });

            return diagram;
        } catch (error) {
            logger.loggers.ascii.error({
                type: 'custom_diagram_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _generateConnections(componentBoxes, connections) {
        const connectionLines = [];
        
        connections.forEach(conn => {
            const fromBox = componentBoxes.get(conn.from);
            const toBox = componentBoxes.get(conn.to);
            
            if (!fromBox || !toBox) {
                throw new Error(`Invalid connection: ${conn.from} -> ${conn.to}`);
            }

            // Calculate connection path
            const path = this._calculateConnectionPath(
                fromBox.position,
                toBox.position,
                conn.type || 'simple'
            );

            connectionLines.push(path);
        });

        return connectionLines;
    }

    _calculateConnectionPath(from, to, type) {
        // Calculate the path between components
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        if (type === 'simple') {
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal dominant path
                return this._generateArrow('right', Math.abs(dx));
            } else {
                // Vertical dominant path
                return this._generateArrow('down', Math.abs(dy));
            }
        } else {
            // More complex path calculations can be added here
            return this._generateArrow('right', Math.abs(dx));
        }
    }

    _combineComponentsAndConnections(componentBoxes, connectionLines) {
        // Create a grid to hold the entire diagram
        const grid = [];
        
        // Add components to grid
        componentBoxes.forEach((component, name) => {
            const { box, position } = component;
            this._addToGrid(grid, box, position);
        });

        // Add connections to grid
        connectionLines.forEach(line => {
            this._addToGrid(grid, line, { x: 0, y: 0 });
        });

        // Convert grid to string
        return grid.map(row => row.join('')).join('\n');
    }

    _addToGrid(grid, content, position) {
        const lines = content.split('\n');
        const { x, y } = position;

        lines.forEach((line, i) => {
            const rowIndex = y + i;
            if (!grid[rowIndex]) {
                grid[rowIndex] = [];
            }
            
            // Add the line to the grid at the specified position
            for (let j = 0; j < line.length; j++) {
                grid[rowIndex][x + j] = line[j];
            }
        });
    }

    _generatePipelineDiagram(complexity) {
        try {
            if (complexity === 'simple') {
                return this._generateSimplePipelineDiagram();
            } else {
                return this._generateDetailedPipelineDiagram();
            }
        } catch (error) {
            logger.loggers.ascii.error({
                type: 'pipeline_diagram_error',
                details: { complexity, message: error.message, stack: error.stack }
            });
            throw error;
        }
    }

    _generateSimplePipelineDiagram() {
        const width = this.sizes.medium.width;
        const stages = ['Fetch', 'Decode', 'Execute', 'Memory', 'Writeback'];
        const boxes = stages.map(stage => this._generateBox(width, 2, stage));
        
        return boxes.join(this._generateArrow('right', 3) + '\n');
    }

    _generateDetailedPipelineDiagram() {
        const width = this.sizes.large.width;
        const stages = [
            { name: 'Fetch', details: ['PC', 'Instruction Memory'] },
            { name: 'Decode', details: ['Register File', 'Control Unit'] },
            { name: 'Execute', details: ['ALU', 'Branch Logic'] },
            { name: 'Memory', details: ['Data Cache', 'Address Calc'] },
            { name: 'Writeback', details: ['Register Write', 'Result MUX'] }
        ];

        return stages.map(stage => {
            const mainBox = this._generateBox(width, 3, stage.name);
            const detailBoxes = stage.details.map(detail => 
                this._addIndentation(this._generateBox(width - 4, 2, detail), 2)
            ).join('\n');
            return `${mainBox}\n${detailBoxes}`;
        }).join(this._generateArrow('right', 3) + '\n');
    }

    _generateBusSystemDiagram(complexity) {
        try {
            if (complexity === 'simple') {
                return this._generateSimpleBusSystemDiagram();
            } else {
                return this._generateDetailedBusSystemDiagram();
            }
        } catch (error) {
            logger.loggers.ascii.error({
                type: 'bus_system_diagram_error',
                details: { complexity, message: error.message, stack: error.stack }
            });
            throw error;
        }
    }

    _generateSimpleBusSystemDiagram() {
        const width = this.sizes.medium.width;
        const cpuBox = this._generateBox(width, 3, 'CPU');
        const busBox = this._generateBox(width * 2, 2, 'System Bus');
        const memoryBox = this._generateBox(width, 3, 'Memory');
        const ioBox = this._generateBox(width, 3, 'I/O');

        return `
${cpuBox}
${this._generateArrow('down', width)}
${busBox}
${this._generateArrow('up', width)}   ${this._generateArrow('up', width)}
${memoryBox}     ${ioBox}`;
    }

    _generateDetailedBusSystemDiagram() {
        const width = this.sizes.large.width;
        const components = [
            { name: 'CPU', details: ['Cache', 'Bus Interface'] },
            { name: 'Memory Controller', details: ['Address Decoder', 'Data Buffer'] },
            { name: 'I/O Controller', details: ['DMA', 'Interrupt Handler'] }
        ];

        const buses = [
            'Address Bus ' + '-'.repeat(width * 2),
            'Data Bus ' + '-'.repeat(width * 2),
            'Control Bus ' + '-'.repeat(width * 2)
        ];

        const componentBoxes = components.map(comp => {
            const mainBox = this._generateBox(width, 3, comp.name);
            const details = comp.details.map(detail => 
                this._addIndentation(this._generateBox(width - 4, 2, detail), 2)
            ).join('\n');
            return `${mainBox}\n${details}`;
        });

        return `
${componentBoxes[0]}
${this._generateArrow('down', width)}
${buses.join('\n')}
${this._generateArrow('up', width)}     ${this._generateArrow('up', width)}
${componentBoxes[1]}     ${componentBoxes[2]}`;
    }

    _generateCacheCoherenceDiagram(complexity) {
        try {
            if (complexity === 'simple') {
                return this._generateSimpleCacheCoherenceDiagram();
            } else {
                return this._generateDetailedCacheCoherenceDiagram();
            }
        } catch (error) {
            logger.loggers.ascii.error({
                type: 'cache_coherence_diagram_error',
                details: { complexity, message: error.message, stack: error.stack }
            });
            throw error;
        }
    }

    _generateSimpleCacheCoherenceDiagram() {
        const width = this.sizes.medium.width;
        const cores = ['Core 0', 'Core 1'].map(core => {
            const coreBox = this._generateBox(width, 2, core);
            const cacheBox = this._generateBox(width, 2, 'Cache');
            return `${coreBox}\n${cacheBox}`;
        });

        const busBox = this._generateBox(width * 2 + 4, 2, 'Bus');
        const memoryBox = this._generateBox(width * 2 + 4, 2, 'Main Memory');

        return `
${cores[0]}     ${cores[1]}
${this._generateArrow('down', width)}     ${this._generateArrow('down', width)}
${busBox}
${this._generateArrow('down', width * 2 + 4)}
${memoryBox}`;
    }

    _generateDetailedCacheCoherenceDiagram() {
        const width = this.sizes.large.width;
        const cores = ['Core 0', 'Core 1'].map(core => {
            const coreBox = this._generateBox(width, 3, core);
            const l1Box = this._generateBox(width - 2, 2, 'L1 Cache');
            const l2Box = this._generateBox(width - 2, 2, 'L2 Cache');
            const stateBox = this._generateBox(width - 2, 2, 'MESI States');
            return `${coreBox}\n${this._addIndentation(l1Box, 1)}\n${this._addIndentation(l2Box, 1)}\n${this._addIndentation(stateBox, 1)}`;
        });

        const busBox = this._generateBox(width * 2 + 6, 3, 'Coherence Bus\n(Snooping/Directory)');
        const memoryBox = this._generateBox(width * 2 + 6, 3, 'Main Memory\n(Shared State)');

        return `
${cores[0]}     ${cores[1]}
${this._generateArrow('down', width)}     ${this._generateArrow('down', width)}
${busBox}
${this._generateArrow('down', width * 2 + 6)}
${memoryBox}`;
    }
}

module.exports = ASCIIDiagramGenerator;