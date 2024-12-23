const logger = require('../../utils/logger');

class ProgressiveReduction {
    constructor() {
        this.reductionLevels = {
            NONE: 'none',
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high'
        };

        this.performanceThresholds = {
            low: 0.3,
            medium: 0.6,
            high: 0.8
        };
    }

    determineReductionLevel(sessionId, feedback) {
        const performance = this._calculatePerformance(feedback);
        const interactionCount = feedback.totalInteractions;

        let reductionLevel = this.reductionLevels.NONE;

        if (interactionCount > 5) {
            if (performance >= this.performanceThresholds.high) {
                reductionLevel = this.reductionLevels.HIGH;
            } else if (performance >= this.performanceThresholds.medium) {
                reductionLevel = this.reductionLevels.MEDIUM;
            } else if (performance >= this.performanceThresholds.low) {
                reductionLevel = this.reductionLevels.LOW;
            }
        }

        logger.loggers.progressiveReduction.info({
            type: 'reduction_level_determined',
            details: { sessionId, performance, interactionCount, reductionLevel }
        });

        return reductionLevel;
    }

    applyReduction(content, reductionLevel) {
        switch (reductionLevel) {
            case this.reductionLevels.HIGH:
                return this._highReduction(content);
            case this.reductionLevels.MEDIUM:
                return this._mediumReduction(content);
            case this.reductionLevels.LOW:
                return this._lowReduction(content);
            default:
                return content;
        }
    }

    _calculatePerformance(feedback) {
        if (feedback.totalInteractions === 0) {
            return 0;
        }
        return feedback.positiveCount / feedback.totalInteractions;
    }

    _highReduction(content) {
        if (typeof content === 'string') {
            // For strings, keep only the first quarter
            return content.slice(0, Math.max(1, Math.floor(content.length / 4)));
        } else if (Array.isArray(content)) {
            // For arrays (e.g., of sentences or paragraphs), keep only the first and last items
            return content.length <= 2 ? content : [content[0], content[content.length - 1]];
        }
        return content; // If it's neither string nor array, return as is
    }

    _mediumReduction(content) {
        if (typeof content === 'string') {
            // For strings, keep the first half
            return content.slice(0, Math.max(1, Math.floor(content.length / 2)));
        } else if (Array.isArray(content)) {
            // For arrays, keep every other item
            return content.filter((_, index) => index % 2 === 0);
        }
        return content;
    }

    _lowReduction(content) {
        if (typeof content === 'string') {
            // For strings, keep three quarters
            return content.slice(0, Math.max(1, Math.floor(content.length * 3 / 4)));
        } else if (Array.isArray(content)) {
            // For arrays, remove only the last quarter of items
            const cutoff = Math.floor(content.length * 3 / 4);
            return content.slice(0, Math.max(1, cutoff));
        }
        return content;
    }

    applyReduction(content, reductionLevel) {
        let reducedContent;
        switch (reductionLevel) {
            case this.reductionLevels.HIGH:
                reducedContent = this._highReduction(content);
                break;
            case this.reductionLevels.MEDIUM:
                reducedContent = this._mediumReduction(content);
                break;
            case this.reductionLevels.LOW:
                reducedContent = this._lowReduction(content);
                break;
            default:
                reducedContent = content;
        }

        logger.loggers.progressiveReduction.info({
            type: 'content_reduced',
            details: { 
                reductionLevel, 
                originalLength: this._getContentLength(content),
                reducedLength: this._getContentLength(reducedContent)
            }
        });

        return reducedContent;
    }

    _getContentLength(content) {
        if (typeof content === 'string') {
            return content.length;
        } else if (Array.isArray(content)) {
            return content.length;
        }
        return 0; // If it's neither string nor array, return 0
    }

    adjustReductionBasedOnFeedback(currentReductionLevel, isPositiveFeedback) {
        const levels = Object.values(this.reductionLevels);
        const currentIndex = levels.indexOf(currentReductionLevel);

        if (isPositiveFeedback && currentIndex < levels.length - 1) {
            return levels[currentIndex + 1];
        } else if (!isPositiveFeedback && currentIndex > 0) {
            return levels[currentIndex - 1];
        }

        return currentReductionLevel;
    }
}

module.exports = ProgressiveReduction;
