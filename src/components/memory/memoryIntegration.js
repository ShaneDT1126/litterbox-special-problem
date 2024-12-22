const MemoryManager = require('./memoryManager');
const logger = require('../../utils/logger');

class MemoryIntegration {
    constructor(ragSystem, scaffoldingSystem) {
        this.memoryManager = new MemoryManager();
        this.ragSystem = ragSystem;
        this.scaffoldingSystem = scaffoldingSystem;
    }

    async processQueryWithMemory(query, sessionId) {
        try {
            // Get memory context
            const memoryContext = await this.memoryManager.processMessage(query, sessionId);

            // Use memory context to enhance RAG query
            const enhancedQuery = this._enhanceQueryWithMemory(query, memoryContext);

            // Process through RAG system
            const ragResponse = await this.ragSystem.processQuery(enhancedQuery);

            // Create scaffolding context
            const scaffoldingContext = {
                sessionId,
                query: enhancedQuery,
                memoryContext,
                ragContent: ragResponse
            };

             // Process with scaffolding
             const scaffoldedResponse = await this.scaffoldingSystem.processWithScaffolding(
                query,
                scaffoldingContext
            );

            // Store response in memory
            await this.memoryManager.storeResponse(sessionId, scaffoldedResponse.message);

            logger.loggers.memoryIntegration.info({
                type: 'memory_integrated_query',
                details: {
                    sessionId,
                    historyLength: memoryContext.history.length,
                    currentTurn: memoryContext.currentTurn
                }
            });

            return {
                response: scaffoldedResponse,
                context: memoryContext
            };
        } catch (error) {
            logger.loggers.memoryIntegration.error({
                type: 'memory_integration_error',
                details: {
                    sessionId,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _enhanceQueryWithMemory(query, memoryContext) {
        // Extract relevant context from last 4 turns
        const relevantHistory = memoryContext.history.slice(-8); // 4 turns = 8 messages
        
        // Create context string from history
        const contextString = relevantHistory
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');

        // Combine query with context
        return {
            originalQuery: query,
            context: contextString,
            turn: memoryContext.currentTurn
        };
    }
}

module.exports = MemoryIntegration;