const logger = require('../../utils/logger');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            totalQueries: 0,
            successfulQueries: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            apiCalls: 0,
            cacheHits: 0,
            errorCount: 0,
            feedbackStats: {
                positive: 0,
                negative: 0
            },
            topicDistribution: {},
            totalTokens: 0,
            averageTokensPerQuery: 0
        };
    }

    recordQuery(queryData) {
        this.metrics.totalQueries++;
        this.metrics.totalResponseTime += queryData.responseTime;
        this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalQueries;

        if (queryData.successful) {
            this.metrics.successfulQueries++;
        } else {
            this.metrics.errorCount++;
        }

        if (queryData.cacheHit) {
            this.metrics.cacheHits++;
        } else {
            this.metrics.apiCalls++;
        }

        this.metrics.topicDistribution[queryData.topic] = (this.metrics.topicDistribution[queryData.topic] || 0) + 1;

        if (queryData.tokenCount) {
            this.metrics.totalTokens += queryData.tokenCount;
            this.metrics.averageTokensPerQuery = this.metrics.totalTokens / this.metrics.totalQueries;
        }

        logger.loggers.performanceMonitor.info({
            type: 'query_recorded',
            details: {
                queryData,
                currentMetrics: this.getMetricsSummary()
            }
        });
    }

    recordFeedback(isPositive) {
        if (isPositive) {
            this.metrics.feedbackStats.positive++;
        } else {
            this.metrics.feedbackStats.negative++;
        }

        logger.loggers.performanceMonitor.info({
            type: 'feedback_recorded',
            details: {
                isPositive,
                currentFeedbackStats: this.metrics.feedbackStats
            }
        });
    }

    getMetricsSummary() {
        const totalFeedback = this.metrics.feedbackStats.positive + this.metrics.feedbackStats.negative;
        const satisfactionRate = totalFeedback > 0 
            ? (this.metrics.feedbackStats.positive / totalFeedback) * 100 
            : 0;

        return {
            totalQueries: this.metrics.totalQueries,
            successRate: (this.metrics.successfulQueries / this.metrics.totalQueries) * 100,
            averageResponseTime: this.metrics.averageResponseTime,
            cacheHitRate: (this.metrics.cacheHits / this.metrics.totalQueries) * 100,
            errorRate: (this.metrics.errorCount / this.metrics.totalQueries) * 100,
            satisfactionRate: satisfactionRate,
            topTopics: this.getTopTopics(5),
            averageTokensPerQuery: this.metrics.averageTokensPerQuery,
            totalTokens: this.metrics.totalTokens
        };
    }

    getTopTopics(n) {
        return Object.entries(this.metrics.topicDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([topic, count]) => ({ topic, count }));
    }

    resetMetrics() {
        this.metrics = {
            totalQueries: 0,
            successfulQueries: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            apiCalls: 0,
            cacheHits: 0,
            errorCount: 0,
            feedbackStats: {
                positive: 0,
                negative: 0
            },
            topicDistribution: {}
        };

        logger.loggers.performanceMonitor.info({
            type: 'metrics_reset',
            details: 'All performance metrics have been reset to initial values.'
        });
    }
}

module.exports = PerformanceMonitor;
