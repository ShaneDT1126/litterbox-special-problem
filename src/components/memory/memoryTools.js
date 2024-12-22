const logger = require('../../utils/logger');

class MemoryTools {
    static formatConversationHistory(messages) {
        try {
            return messages.map((message, index) => ({
                index,
                role: message.role,
                content: message.content,
                timestamp: message.timestamp,
                turnNumber: Math.floor(index / 2) + 1
            }));
        } catch (error) {
            logger.loggers.memoryTools.error({
                type: 'format_history_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    static createMemoryWindow(history, currentTurn) {
        try {
            // Create sliding window of conversation
            const window = {
                current: [], // Current turn
                previous: [], // Previous turn
                context: []  // Additional context if needed
            };

            // Get messages for current turn
            window.current = history.filter(msg => 
                msg.turnNumber === currentTurn
            );

            // Get messages from previous turn
            window.previous = history.filter(msg => 
                msg.turnNumber === currentTurn - 1
            );

            // Get additional context from earlier turns
            window.context = history.filter(msg => 
                msg.turnNumber < currentTurn - 1
            ).slice(-2); // Keep last 2 messages from earlier context

            return window;
        } catch (error) {
            logger.loggers.memoryTools.error({
                type: 'create_window_error',
                details: {
                    currentTurn,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    static extractRelevantContext(history, currentTopic) {
        try {
            // Filter messages related to current topic
            return history.filter(message => {
                // Add your topic relevance logic here
                return message.content.toLowerCase().includes(currentTopic.toLowerCase());
            });
        } catch (error) {
            logger.loggers.memoryTools.error({
                type: 'extract_context_error',
                details: {
                    currentTopic,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    static formatMessageForPrompt(message) {
        try {
            return `${message.role}: ${message.content}`;
        } catch (error) {
            logger.loggers.memoryTools.error({
                type: 'format_message_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    static createConversationSummary(window) {
        try {
            const summary = {
                currentTurn: {
                    messages: window.current.map(msg => this.formatMessageForPrompt(msg)),
                    count: window.current.length
                },
                previousTurn: {
                    messages: window.previous.map(msg => this.formatMessageForPrompt(msg)),
                    count: window.previous.length
                },
                context: {
                    messages: window.context.map(msg => this.formatMessageForPrompt(msg)),
                    count: window.context.length
                }
            };

            return summary;
        } catch (error) {
            logger.loggers.memoryTools.error({
                type: 'create_summary_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    static validateMemoryStructure(memory) {
        try {
            const requiredFields = ['role', 'content', 'timestamp'];
            
            if (!Array.isArray(memory)) {
                throw new Error('Memory must be an array');
            }

            memory.forEach((entry, index) => {
                requiredFields.forEach(field => {
                    if (!(field in entry)) {
                        throw new Error(`Missing required field '${field}' in memory entry ${index}`);
                    }
                });
            });

            return true;
        } catch (error) {
            logger.loggers.memoryTools.error({
                type: 'validation_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            return false;
        }
    }

    static createScaffoldingContext(window, currentTopic) {
        try {
            const relevantHistory = this.extractRelevantContext(
                window.context,
                currentTopic
            );

            return {
                currentInteraction: window.current,
                previousInteraction: window.previous,
                relevantHistory,
                topicContext: this._extractTopicContext(relevantHistory, currentTopic)
            };
        } catch (error) {
            logger.loggers.memoryTools.error({
                type: 'scaffolding_context_error',
                details: { error: error.message }
            });
            throw error;
        }
    }

    static _extractTopicContext(history, topic) {
        return history.reduce((context, message) => {
            if (message.content.toLowerCase().includes(topic.toLowerCase())) {
                context.mentions.push({
                    turnNumber: message.turnNumber,
                    content: message.content
                });
            }
            return context;
        }, { topic, mentions: [] });
    }
}

module.exports = MemoryTools;
