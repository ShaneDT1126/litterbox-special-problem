// src/utils/logger.js
const winston = require('winston');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.loggers = {};
        
        this.createLogDirectories();
        this.initializeLoggers();
    }

    createLogDirectories() {
        const components = [
            'app',
            'vector_store', 
            'document_processor', 
            'semantic_router',
            'multi_query_retriever',
            'scaffolding',
            'token_usage',
            'documentManager',
            'responseGenerator',
            'conversationMemory',
            'conversationManager',
            'memoryIntegration',
            'memoryManager',
            'memoryTools'
        ];
        const fs = require('fs');
        
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }

        components.forEach(component => {
            const componentDir = path.join(this.logDir, component);
            if (!fs.existsSync(componentDir)) {
                fs.mkdirSync(componentDir);
            }
        });
    }

    initializeLoggers() {
        // Initialize loggers for all components
        this.loggers = {
            app: this.createComponentLogger('app'),
            vectorStore: this.createComponentLogger('vector_store'),
            documentProcessor: this.createComponentLogger('document_processor'),
            semanticRouter: this.createComponentLogger('semantic_router'),
            multiQueryRetriever: this.createComponentLogger('multi_query_retriever'),
            scaffolding: this.createComponentLogger('scaffolding'),
            tokenUsage: this.createComponentLogger('token_usage'),
            documentManager: this.createComponentLogger('document_manager'),
            responseGenerator: this.createComponentLogger('response_generator'),
            conversationMemory: this.createComponentLogger('conversationMemory'),
            conversationManager: this.createComponentLogger('conversationManager'),
            memoryIntegration: this.createComponentLogger('memoryIntegration'),
            memoryManager: this.createComponentLogger('memoryManager'),
            memoryTools: this.createComponentLogger('memoryTools')
        };
    }

    createComponentLogger(component) {
        const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
            const componentName = component.toUpperCase().replace('_', ' ');
            let output = `${timestamp} [${componentName}] ${level}: `;

            if (typeof message === 'object') {
                const { type, operation, details, stats } = message;
                if (operation) {
                    output += `${operation} - ${JSON.stringify(details || {}, null, 2)}`;
                } else if (type) {
                    output += `${type} - ${JSON.stringify(stats || details || {}, null, 2)}`;
                } else {
                    output += JSON.stringify(message, null, 2);
                }
            } else {
                output += message;
            }

            return output;
        });

        const fileFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.json({ space: 2 })
        );

        const consoleFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            customFormat
        );

        return winston.createLogger({
            transports: [
                new winston.transports.File({
                    filename: path.join(this.logDir, component, 'operations.log'),
                    format: fileFormat,
                    level: 'info'
                }),
                new winston.transports.File({
                    filename: path.join(this.logDir, component, 'errors.log'),
                    format: fileFormat,
                    level: 'error'
                }),
                new winston.transports.Console({
                    format: consoleFormat
                })
            ]
        });
    }

    // Helper methods for specific logging operations
    logOperation(component, operation, details) {
        const logger = this.loggers[component];
        if (logger) {
            logger.info({
                type: 'operation',
                operation,
                details
            });
        }
    }

    logError(component, error) {
        const logger = this.loggers[component];
        if (logger) {
            logger.error({
                type: 'error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                }
            });
        }
    }

    // Specific component logging methods
    logVectorOperation(operation) {
        this.logOperation('vectorStore', operation.type, {
            queryId: operation.queryId,
            documentCount: operation.documentCount,
            processingTime: operation.processingTime,
            similarityScores: operation.scores,
            ...(operation.tokenUsage && { tokenUsage: operation.tokenUsage })
        });
    }

    logTokenUsage(usage) {
        this.logOperation('tokenUsage', 'token_usage', {
            component: usage.component,
            conversationId: usage.conversationId,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
            cost: usage.estimatedCost
        });
    }
}

// Export a singleton instance
const logger = new Logger();
module.exports = logger;
