const logger = require('../../utils/logger');
const FeedbackSystem = require('./feedbackSystem');
const ProgressiveReduction = require('./progressiveReduction');
const ResponseGenerator = require('../response/responseGenerator');
const PerformanceMonitor = require('../benchmarking/performanceMonitor');
const TokenCounter = require("../../utils/tokenCounter");
const EventEmitter = require('events');
class ScaffoldingSystem extends EventEmitter {
    constructor(multiQueryRetriever, conversationMemory) {
        super();
        this.multiQueryRetriever = multiQueryRetriever;
        this.conversationMemory = conversationMemory;
        this.responseGenerator = new ResponseGenerator();
        this.feedbackSystem = new FeedbackSystem();
        this.progressiveReduction = new ProgressiveReduction();
        this.performanceMonitor = new PerformanceMonitor();
        this.tokenCounter = new TokenCounter();

        this.scaffoldLevels = {
            HIGH: 'high_support',
            MEDIUM: 'medium_support',
            LOW: 'low_support'
        };

        this.scaffoldTypes = {
            CONCEPTUAL: 'conceptual',
            PROCEDURAL: 'procedural',
            STRATEGIC: 'strategic'
        };

        // Event listeners for ResponseGenerator
        this.responseGenerator.on('responseChunk', (chunk) => {
            this.emit('scaffoldChunk', chunk);
        });

        this.responseGenerator.on('responseComplete', (fullResponse) => {
            this.emit('scaffoldComplete', fullResponse);
        });

        this.responseGenerator.on('responseError', (errorMessage) => {
            this.emit('scaffoldError', errorMessage);
        });

        logger.loggers.scaffolding.info({
            type: 'initialization',
            details: {
                types: Object.keys(this.scaffoldTypes),
                levels: Object.keys(this.scaffoldLevels),
                components: ['MultiQueryRetriever', 'FeedbackSystem', 'ProgressiveReduction', 'PerformanceMonitor']
            }
        });
    }
    
    async processWithScaffolding(query, context) {
        const startTime = Date.now();
        try {
            logger.loggers.scaffolding.info({
                type: 'scaffold_process_start',
                details: { query, context }
            });

            if (!this._isComputerArchitectureRelated(query)) {
                return this._createRedirectResponse();
            }

            const scaffoldType = this._determineScaffoldType(context.routingResult.type);
            const supportLevel = await this._determineSupportLevel(context);

            const feedback = await this.feedbackSystem.getFeedback(context.sessionId);
            const reductionLevel = this.progressiveReduction.determineReductionLevel(
                context.sessionId,
                feedback
            );

            const conversationContext = this.conversationMemory.getConversationContext(context.sessionId);

            const relevantContent = await this.multiQueryRetriever.retrieveDocuments(query, context.routingResult, conversationContext);
            const reducedContent = this.progressiveReduction.applyReduction(relevantContent, reductionLevel);

            const scaffoldingContext = {
                topic: context.routingResult.topic,
                supportLevel: supportLevel,
                reductionLevel: reductionLevel,
                scaffoldType: scaffoldType
            };

            const response = await this.responseGenerator.generateResponse(
                query,
                reducedContent,
                scaffoldingContext,
                conversationContext
            );

            if (response) {
                this.conversationMemory.addTurn(context.sessionId, query, response);
            }

            const formattedResponse = this._formatResponse(response, scaffoldType, supportLevel, reductionLevel, context);

            const responseTokens = this.tokenCounter.countTokens(JSON.stringify(formattedResponse));
            logger.loggers.scaffolding.info({
                type: 'scaffold_process_complete',
                details: {
                    scaffoldType,
                    supportLevel,
                    reductionLevel,
                    processingTime: Date.now() - startTime,
                    responseTokens
                }
            });

            return formattedResponse;

        } catch (error) {
            logger.loggers.scaffolding.error({
                type: 'scaffold_process_error',
                details: {
                    query,
                    message: error.message,
                    stack: error.stack
                }
            });
            return this._createFallbackResponse(error, query, context);
        }
    }

    _isComputerArchitectureRelated(query) {
        const keywords = ['cpu', 'memory', 'cache', 'instruction', 'pipeline', 'architecture', 'processor', 'alu', 'register', 'bus'];
        return keywords.some(keyword => query.toLowerCase().includes(keyword));
    }

    _createRedirectResponse() {
        return {
            message: "I'm sorry, but I'm specifically designed to assist with computer architecture topics. Could you please ask a question related to computer hardware, processors, memory systems, or similar topics?",
            type: 'redirect',
            supportLevel: 'high',
            reductionLevel: 'none'
        };
    }

    _createFallbackResponse(error, query, context) {
        return {
            message: "I apologize, but I encountered an error while processing your request. Could you please rephrase your question or try asking about a different topic?",
            type: 'fallback',
            supportLevel: 'high',
            reductionLevel: 'none',
            metadata: {
                originalQuery: query,
                error: error.message
            }
        };
    }

    _determineScaffoldType(routeType) {
        const scaffoldTypes = {
            cpu: this.scaffoldTypes.CONCEPTUAL,
            memory: this.scaffoldTypes.CONCEPTUAL,
            instruction_set: this.scaffoldTypes.PROCEDURAL,
            cache: this.scaffoldTypes.CONCEPTUAL,
            pipelining: this.scaffoldTypes.STRATEGIC
        };

        return scaffoldTypes[routeType] || this.scaffoldTypes.CONCEPTUAL;
    }

    async _determineSupportLevel(context) {
        const { currentTurn, routingResult } = context;
        let supportLevel = this.scaffoldLevels.MEDIUM;

        const userPerformance = await this.feedbackSystem.getUserPerformance(context.sessionId);

        if (currentTurn <= 2 || userPerformance < 0.3) {
            supportLevel = this.scaffoldLevels.HIGH;
        } else if (currentTurn > 5 && userPerformance > 0.7) {
            supportLevel = this.scaffoldLevels.LOW;
        }

        const complexTopics = ['instruction_set', 'pipelining'];
        if (complexTopics.includes(routingResult.type)) {
            supportLevel = this._increaseSupport(supportLevel);
        }

        return supportLevel;
    }

    _increaseSupport(currentLevel) {
        const levels = Object.values(this.scaffoldLevels);
        const currentIndex = levels.indexOf(currentLevel);
        return levels[Math.max(0, currentIndex - 1)];
    }

    _formatResponse(response, scaffoldType, supportLevel, reductionLevel, context) {
        return {
            message: response,
            type: scaffoldType,
            supportLevel,
            reductionLevel,
            metadata: {
                topic: context.routingResult.topic,
                turn: context.currentTurn
            }
        };
    }
}

module.exports = ScaffoldingSystem;
