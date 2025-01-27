const logger = require('../../utils/logger');

class FeedbackSystem {
    constructor() {
        this.feedbackStore = new Map();
    }

    getFeedback(sessionId) {
        if (!this.feedbackStore.has(sessionId)) {
            this.feedbackStore.set(sessionId, { positiveCount: 0, negativeCount: 0 });
        }
        return this.feedbackStore.get(sessionId);
    }

    addFeedback(sessionId, isPositive) {
        const feedback = this.getFeedback(sessionId);
        if (isPositive) {
            feedback.positiveCount++;
        } else {
            feedback.negativeCount++;
        }
        this.feedbackStore.set(sessionId, feedback);

        logger.loggers.feedbackSystem.info({
            type: 'feedback_added',
            details: { sessionId, isPositive, currentFeedback: feedback }
        });
    }

    resetFeedback(sessionId) {
        this.feedbackStore.set(sessionId, { positiveCount: 0, negativeCount: 0 });
        
        logger.loggers.feedbackSystem.info({
            type: 'feedback_reset',
            details: { sessionId }
        });
    }

    getFeedbackRatio(sessionId) {
        const feedback = this.getFeedback(sessionId);
        const total = feedback.positiveCount + feedback.negativeCount;
        if (total === 0) return 0.5; // Default to neutral if no feedback
        return feedback.positiveCount / total;
    }
}

module.exports = FeedbackSystem;
