const logger = require('../../utils/logger');

class ConversationManager {
    constructor(conversationMemory) {
        this.memory = conversationMemory;
        this.conversationStates = new Map(); // sessionId -> conversation state
    }

    async processMessage(sessionId, message, role) {
        try {
            // Initialize or get conversation state
            let state = this.conversationStates.get(sessionId);
            if (!state) {
                state = this._initializeState(sessionId);
            }

            // Update state with new message
            state.messageCount++;
            state.lastActivity = new Date().toISOString();

            // Add message to memory and get window
            const memoryWindow = await this.memory.addMessage(sessionId, message, role, {
                turnNumber: state.currentTurn,
                timestamp: state.lastActivity
            });

            // Update state based on memory window
            this._updateState(state, memoryWindow);

            logger.loggers.conversationManager.info({
                type: 'message_processed',
                details: {
                    sessionId,
                    currentTurn: state.currentTurn,
                    messageCount: state.messageCount
                }
            });

            return {
                state: this._getPublicState(state),
                memoryWindow
            };
        } catch (error) {
            logger.loggers.conversationManager.error({
                type: 'process_message_error',
                details: {
                    sessionId,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _initializeState(sessionId) {
        const state = {
            sessionId,
            currentTurn: 0,
            messageCount: 0,
            isActive: true,
            lastActivity: new Date().toISOString(),
            context: {
                topics: [],
                currentTopic: null,
                turnHistory: []
            }
        };
        this.conversationStates.set(sessionId, state);
        return state;
    }

    _updateState(state, memoryWindow) {
        state.currentTurn = memoryWindow.currentTurn;
        
        // Update turn history
        state.context.turnHistory = memoryWindow.window.map(turn => ({
            turnNumber: turn.turnNumber,
            timestamp: turn.messages[0].timestamp
        }));

        // Track conversation progress
        if (state.currentTurn >= 4) {
            state.context.hasFullHistory = true;
        }
    }

    _getPublicState(state) {
        return {
            currentTurn: state.currentTurn,
            messageCount: state.messageCount,
            isActive: state.isActive,
            lastActivity: state.lastActivity,
            context: state.context
        };
    }

    async getConversationState(sessionId) {
        try {
            const state = this.conversationStates.get(sessionId);
            if (!state) return null;

            const memoryWindow = await this.memory.getMemoryWindow(sessionId);
            return {
                state: this._getPublicState(state),
                memoryWindow
            };
        } catch (error) {
            logger.loggers.conversationManager.error({
                type: 'get_state_error',
                details: {
                    sessionId,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    async endConversation(sessionId) {
        try {
            const state = this.conversationStates.get(sessionId);
            if (state) {
                state.isActive = false;
                await this.memory.clearMemory(sessionId);
                this.conversationStates.delete(sessionId);
            }

            logger.loggers.conversationManager.info({
                type: 'conversation_ended',
                details: { sessionId }
            });

            return true;
        } catch (error) {
            logger.loggers.conversationManager.error({
                type: 'end_conversation_error',
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

module.exports = ConversationManager;
