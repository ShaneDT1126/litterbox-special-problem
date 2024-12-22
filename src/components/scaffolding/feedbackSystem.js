// src/components/scaffolding/feedbackSystem.js

const logger = require('../../utils/logger');

class FeedbackSystem {
    constructor() {
        this.feedbackStore = new Map();
    }

    async storeFeedback(sessionId, feedback) {
        this.feedbackStore.set(sessionId, feedback);
        logger.loggers.scaffolding.info({
            type: 'feedback_stored',
            details: { sessionId, feedback }
        });
    }

    async getFeedback(sessionId) {
        return this.feedbackStore.get(sessionId) || { positiveCount: 0, negativeCount: 0 };
    }

    async processFeedback(sessionId, isPositive) {
        const currentFeedback = await this.getFeedback(sessionId);
        if (isPositive) {
            currentFeedback.positiveCount++;
        } else {
            currentFeedback.negativeCount++;
        }
        await this.storeFeedback(sessionId, currentFeedback);
        return currentFeedback;
    }
}

module.exports = FeedbackSystem;
