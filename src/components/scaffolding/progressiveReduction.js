const logger = require('../../utils/logger');

class ProgressiveReduction {
    constructor() {
        this.reductionLevels = ['none', 'low', 'medium', 'high'];
        this.sessionReductionLevels = new Map();
    }

    determineReductionLevel(sessionId) {
        if (!this.sessionReductionLevels.has(sessionId)) {
            this.sessionReductionLevels.set(sessionId, 'none');
        }
        return this.sessionReductionLevels.get(sessionId);
    }

    updateReductionLevel(sessionId, performance) {
        const currentLevel = this.determineReductionLevel(sessionId);
        const currentIndex = this.reductionLevels.indexOf(currentLevel);

        let newIndex;
        if (performance > 0.7) {
            newIndex = Math.min(currentIndex + 1, this.reductionLevels.length - 1);
        } else if (performance < 0.3) {
            newIndex = Math.max(currentIndex - 1, 0);
        } else {
            newIndex = currentIndex;
        }

        const newLevel = this.reductionLevels[newIndex];
        this.sessionReductionLevels.set(sessionId, newLevel);

        logger.loggers.progressiveReduction.info({
            type: 'reduction_level_updated',
            details: { sessionId, oldLevel: currentLevel, newLevel, performance }
        });

        return newLevel;
    }

    reduceContent(content, reductionLevel) {
        switch (reductionLevel) {
            case 'high':
                return this._highReduction(content);
            case 'medium':
                return this._mediumReduction(content);
            case 'low':
                return this._lowReduction(content);
            default:
                return content;
        }
    }

    _highReduction(content) {
        if (typeof content === 'string') {
            // For strings, keep the first 20% of characters
            return content.slice(0, Math.ceil(content.length * 0.2));
        } else if (Array.isArray(content)) {
            // For arrays, keep the first and last elements, plus 20% of the middle
            if (content.length <= 2) return content;
            const middleCount = Math.ceil((content.length - 2) * 0.2);
            const middleStart = Math.floor((content.length - middleCount) / 2);
            return [
                content[0],
                ...content.slice(middleStart, middleStart + middleCount),
                content[content.length - 1]
            ];
        }
        // For other types, return as is
        return content;
    }

    _mediumReduction(content) {
        if (typeof content === 'string') {
            // For strings, keep the first 50% of characters
            return content.slice(0, Math.ceil(content.length * 0.5));
        } else if (Array.isArray(content)) {
            // For arrays, keep every other element
            return content.filter((_, index) => index % 2 === 0);
        }
        // For other types, return as is
        return content;
    }

    _lowReduction(content) {
        if (typeof content === 'string') {
            // For strings, keep the first 80% of characters
            return content.slice(0, Math.ceil(content.length * 0.8));
        } else if (Array.isArray(content)) {
            // For arrays, remove every 5th element
            return content.filter((_, index) => (index + 1) % 5 !== 0);
        }
        // For other types, return as is
        return content;
    }

    reduceContent(content, reductionLevel) {
        switch (reductionLevel) {
            case 'high':
                return this._highReduction(content);
            case 'medium':
                return this._mediumReduction(content);
            case 'low':
                return this._lowReduction(content);
            default:
                return content;
        }
    }
}

module.exports = ProgressiveReduction;
