const logger = require('../../utils/logger');

class ConversationMemory {
    constructor(maxTurns = 5) {
        this.conversations = new Map();
        this.maxTurns = maxTurns;
    }

    addTurn(sessionId, userQuery, botResponse) {
        if (!this.conversations.has(sessionId)) {
            this.conversations.set(sessionId, []);
        }

        const conversation = this.conversations.get(sessionId);
        conversation.push({ userQuery, botResponse });

        // Keep only the last maxTurns
        if (conversation.length > this.maxTurns) {
            conversation.shift();
        }

        logger.loggers.conversationMemory.info({
            type: 'turn_added',
            details: { sessionId, turnCount: conversation.length }
        });
    }

    getConversationContext(sessionId) {
        const conversation = this.conversations.get(sessionId) || [];
        return conversation.map(turn => `User: ${turn.userQuery}\nBot: ${turn.botResponse}`).join('\n\n');
    }

    clearConversation(sessionId) {
        this.conversations.delete(sessionId);
        logger.loggers.conversationMemory.info({
            type: 'conversation_cleared',
            details: { sessionId }
        });
    }

    getLastUserQuery(sessionId) {
        const conversation = this.conversations.get(sessionId) || [];
        const lastTurn = conversation[conversation.length - 1];
        return lastTurn ? lastTurn.userQuery : null;
    }

    getLastBotResponse(sessionId) {
        const conversation = this.conversations.get(sessionId) || [];
        const lastTurn = conversation[conversation.length - 1];
        return lastTurn ? lastTurn.botResponse : null;
    }

    getTurnCount(sessionId) {
        const conversation = this.conversations.get(sessionId) || [];
        return conversation.length;
    }
}

module.exports = ConversationMemory;
