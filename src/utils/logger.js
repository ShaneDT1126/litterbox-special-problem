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
            'vector_store', 
            'document_processor', 
            'semantic_router', 
            'token_usage',
            'response_generator'
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
        this.loggers.vectorStore = this.createComponentLogger('vector_store');
        this.loggers.documentProcessor = this.createComponentLogger('document_processor');
        this.loggers.semanticRouter = this.createComponentLogger('semantic_router');
        this.loggers.tokenUsage = this.createComponentLogger('token_usage');
        this.loggers.responseGenerator = this.createComponentLogger('response_generator'); 
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

    logVectorOperation(operation) {
        this.loggers.vectorStore.info({
            type: 'operation',
            operation: operation.type,
            details: {
                queryId: operation.queryId,
                documentCount: operation.documentCount,
                processingTime: operation.processingTime,
                similarityScores: operation.scores,
                ...(operation.tokenUsage && { tokenUsage: operation.tokenUsage })
            }
        });
    }

    logVectorError(error) {
        this.loggers.vectorStore.error({
            type: 'error',
            operation: error.operation,
            details: {
                message: error.message,
                stack: error.stack,
                code: error.code
            }
        });
    }

    logTokenUsage(usage) {
        this.loggers.tokenUsage.info({
            type: 'token_usage',
            details: {
                component: usage.component,
                conversationId: usage.conversationId,
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens,
                cost: usage.estimatedCost
            }
        });
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
}

module.exports = new Logger();
