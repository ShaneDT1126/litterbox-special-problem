const logger = require('../../utils/logger');
const { MultiQueryRetriever } = require('../rag/multiQueryRetriever');

class ConversationManager {
    constructor(conversationMemory) {
        this.memory = conversationMemory;
        this.conversationStates = new Map(); // sessionId -> conversation state
        this.multiQueryRetriever = new MultiQueryRetriever(vectorStore);

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

             // Classify the message topic
             const topicClassification = await this.multiQueryRetriever._classifyTopic(message);

             // Update state with topic classification
             state.context.currentTopic = topicClassification.topic;
             if (!state.context.topics.includes(topicClassification.topic)) {
                 state.context.topics.push(topicClassification.topic);
             }

            // Add message to memory and get window
            const memoryWindow = await this.memory.addMessage(sessionId, message, role, {
                turnNumber: state.currentTurn,
                timestamp: state.lastActivity,
                topic: topicClassification.topic,
                topicConfidence: topicClassification.confidence
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
            timestamp: turn.messages[0].timestamp,
            topic: turn.messages[0].metadata.topic
        }));
    
        // Track conversation progress
        if (state.currentTurn >= 4) {
            state.context.hasFullHistory = true;
        }
    
        // Update topics
        const uniqueTopics = new Set(state.context.turnHistory.map(turn => turn.topic));
        state.context.topics = Array.from(uniqueTopics);
    }
    

    _getPublicState(state) {
        return {
            currentTurn: state.currentTurn,
            messageCount: state.messageCount,
            isActive: state.isActive,
            lastActivity: state.lastActivity,
            context: {
                topics: state.context.topics,
                currentTopic: state.context.currentTopic,
                hasFullHistory: state.context.hasFullHistory,
                turnCount: state.context.turnHistory.length
            }
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

    async getConversationSummary(sessionId) {
        try {
            const state = this.conversationStates.get(sessionId);
            if (!state) return null;
    
            const memoryWindow = await this.memory.getMemoryWindow(sessionId);
            const summary = await this.memory.summarizeConversation(sessionId);
    
            return {
                state: this._getPublicState(state),
                memoryWindow,
                summary
            };
        } catch (error) {
            logger.loggers.conversationManager.error({
                type: 'get_summary_error',
                details: {
                    sessionId,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    async provideFeedback(sessionId, feedback) {
        try {
            const state = this.conversationStates.get(sessionId);
            if (!state) throw new Error('Conversation not found');
    
            await this.memory.provideFeedbackOnTopics(sessionId, feedback);
    
            logger.loggers.conversationManager.info({
                type: 'feedback_provided',
                details: {
                    sessionId,
                    feedback
                }
            });
    
            return true;
        } catch (error) {
            logger.loggers.conversationManager.error({
                type: 'provide_feedback_error',
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
