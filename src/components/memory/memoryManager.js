const ConversationMemory = require('./conversationMemory');
const ConversationManager = require('./conversationManager');
const MemoryTools = require('./memoryTools');
const logger = require('../../utils/logger');

class MemoryManager {
    constructor() {
        this.conversationMemory = new ConversationMemory();
        this.conversationManager = new ConversationManager(this.conversationMemory);
    }

    async processMessage(message, sessionId) {
        try {
            // Process message through conversation manager
            const { state, memoryWindow } = await this.conversationManager.processMessage(
                sessionId,
                message,
                'user'
            );

            // Create memory context for response generation
            const memoryContext = this._createMemoryContext(state, memoryWindow);

            logger.loggers.memoryManager.info({
                type: 'memory_processing',
                details: {
                    sessionId,
                    currentTurn: state.currentTurn,
                    contextSize: Object.keys(memoryContext).length
                }
            });

            return memoryContext;
        } catch (error) {
            logger.loggers.memoryManager.error({
                type: 'memory_processing_error',
                details: {
                    sessionId,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    async storeResponse(sessionId, response) {
        try {
            // Process assistant's response
            const { state, memoryWindow } = await this.conversationManager.processMessage(
                sessionId,
                response,
                'assistant'
            );

            logger.loggers.memoryManager.info({
                type: 'response_stored',
                details: {
                    sessionId,
                    currentTurn: state.currentTurn
                }
            });

            return {
                state,
                memoryWindow
            };
        } catch (error) {
            logger.loggers.memoryManager.error({
                type: 'response_storage_error',
                details: {
                    sessionId,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _createMemoryContext(state, memoryWindow) {
        // Format conversation history
        const formattedHistory = MemoryTools.formatConversationHistory(
            memoryWindow.window.flatMap(turn => turn.messages)
        );

        // Create memory window
        const window = MemoryTools.createMemoryWindow(
            formattedHistory,
            state.currentTurn
        );

        return {
            currentTurn: state.currentTurn,
            messageCount: state.messageCount,
            history: formattedHistory,
            window,
            context: {
                ...state.context,
                scaffolding: {
                    supportLevel: this._determineSupportLevel(state),
                    previousTopics: state.context.topics || [],
                    currentTopic: state.context.currentTopic
                }
            }
        };
    }

    _determineSupportLevel(state) {
        const turnCount = state.currentTurn;
        if (turnCount <= 2) return 'high_support';
        if (turnCount <= 4) return 'medium_support';
        return 'low_support';
    }

    async getMemoryContext(sessionId) {
        try {
            const { state, memoryWindow } = await this.conversationManager.getConversationState(sessionId);
            if (!state) return null;

            return this._createMemoryContext(state, memoryWindow);
        } catch (error) {
            logger.loggers.memoryManager.error({
                type: 'get_context_error',
                details: {
                    sessionId,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    async clearMemory(sessionId) {
        try {
            await this.conversationManager.endConversation(sessionId);
            
            logger.loggers.memoryManager.info({
                type: 'memory_cleared',
                details: { sessionId }
            });

            return true;
        } catch (error) {
            logger.loggers.memoryManager.error({
                type: 'clear_memory_error',
                details: {
                    sessionId,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }
}

module.exports = MemoryManager;
