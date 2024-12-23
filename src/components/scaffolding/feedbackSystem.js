const logger = require('../../utils/logger');

class FeedbackSystem {
    constructor() {
        this.userFeedback = new Map();
        this.performanceThresholds = {
            low: 0.3,
            medium: 0.7
        };
    }

    async processFeedback(sessionId, isPositive) {
        if (!this.userFeedback.has(sessionId)) {
            this.userFeedback.set(sessionId, { positiveCount: 0, negativeCount: 0, totalInteractions: 0 });
        }

        const feedback = this.userFeedback.get(sessionId);
        feedback.totalInteractions++;

        if (isPositive) {
            feedback.positiveCount++;
        } else {
            feedback.negativeCount++;
        }

        logger.loggers.feedbackSystem.info({
            type: 'feedback_processed',
            details: { sessionId, isPositive, currentFeedback: feedback }
        });

        return feedback;
    }

    async getFeedback(sessionId) {
        return this.userFeedback.get(sessionId) || { positiveCount: 0, negativeCount: 0, totalInteractions: 0 };
    }

    async getUserPerformance(sessionId) {
        const feedback = await this.getFeedback(sessionId);
        if (feedback.totalInteractions === 0) {
            return 0.5; // Default to medium performance if no interactions
        }
        return feedback.positiveCount / feedback.totalInteractions;
    }

    async getSupportLevel(sessionId) {
        const performance = await this.getUserPerformance(sessionId);
        if (performance < this.performanceThresholds.low) {
            return 'high_support';
        } else if (performance < this.performanceThresholds.medium) {
            return 'medium_support';
        } else {
            return 'low_support';
        }
    }

    async recordInteraction(sessionId, interactionType) {
        if (!this.userFeedback.has(sessionId)) {
            this.userFeedback.set(sessionId, { positiveCount: 0, negativeCount: 0, totalInteractions: 0 });
        }

        const feedback = this.userFeedback.get(sessionId);
        feedback.totalInteractions++;

        logger.loggers.feedbackSystem.info({
            type: 'interaction_recorded',
            details: { sessionId, interactionType, currentFeedback: feedback }
        });
    }

    async resetFeedback(sessionId) {
        this.userFeedback.delete(sessionId);
        logger.loggers.feedbackSystem.info({
            type: 'feedback_reset',
            details: { sessionId }
        });
    }
}

module.exports = FeedbackSystem;
