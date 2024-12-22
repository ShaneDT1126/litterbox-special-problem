const logger = require('../../utils/logger');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            rag: new Map(),      // RAG system metrics
            memory: new Map(),   // Memory system metrics
            scaffold: new Map(), // Scaffolding system metrics
            overall: new Map()   // Overall system metrics
        };

        this.thresholds = {
            queryTime: 2000,     // Maximum query time (ms)
            memoryUsage: 512,    // Maximum memory usage (MB)
            responseTime: 3000   // Maximum response time (ms)
        };
    }

    async measurePerformance(operation, category, callback) {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();

        try {
            // Execute the operation
            const result = await callback();

            // Calculate metrics
            const metrics = this._calculateMetrics(
                startTime,
                startMemory,
                category,
                operation
            );

            // Store metrics
            this._storeMetrics(metrics, category, operation);

            logger.loggers.performance.info({
                type: 'performance_measured',
                details: {
                    category,
                    operation,
                    metrics
                }
            });

            return {
                result,
                metrics
            };
        } catch (error) {
            logger.loggers.performance.error({
                type: 'performance_measurement_error',
                details: {
                    category,
                    operation,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _calculateMetrics(startTime, startMemory, category, operation) {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();

        return {
            executionTime: Number(endTime - startTime) / 1_000_000, // Convert to ms
            memoryUsage: {
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                external: endMemory.external - startMemory.external,
                rss: endMemory.rss - startMemory.rss
            },
            timestamp: new Date().toISOString(),
            category,
            operation
        };
    }

    _storeMetrics(metrics, category, operation) {
        const key = `${category}:${operation}`;
        
        // Store in specific category
        if (!this.metrics[category].has(operation)) {
            this.metrics[category].set(operation, []);
        }
        this.metrics[category].get(operation).push(metrics);

        // Store in overall metrics
        if (!this.metrics.overall.has(key)) {
            this.metrics.overall.set(key, []);
        }
        this.metrics.overall.get(key).push(metrics);

        // Maintain only last 100 metrics
        if (this.metrics[category].get(operation).length > 100) {
            this.metrics[category].get(operation).shift();
        }
        if (this.metrics.overall.get(key).length > 100) {
            this.metrics.overall.get(key).shift();
        }
    }

    getMetrics(category, operation = null) {
        try {
            if (operation) {
                return this.metrics[category].get(operation) || [];
            }
            return Array.from(this.metrics[category].values()).flat();
        } catch (error) {
            logger.loggers.performance.error({
                type: 'get_metrics_error',
                details: {
                    category,
                    operation,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    analyzePerformance(category, operation = null) {
        try {
            const metrics = this.getMetrics(category, operation);
            
            if (metrics.length === 0) {
                return null;
            }

            const analysis = {
                averageExecutionTime: this._calculateAverage(metrics, 'executionTime'),
                averageMemoryUsage: this._calculateAverageMemoryUsage(metrics),
                percentiles: this._calculatePercentiles(metrics),
                thresholdViolations: this._checkThresholdViolations(metrics),
                recommendations: []
            };

            // Generate recommendations
            analysis.recommendations = this._generateRecommendations(analysis);

            logger.loggers.performance.info({
                type: 'performance_analyzed',
                details: {
                    category,
                    operation,
                    analysis
                }
            });

            return analysis;
        } catch (error) {
            logger.loggers.performance.error({
                type: 'performance_analysis_error',
                details: {
                    category,
                    operation,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _calculateAverage(metrics, field) {
        const sum = metrics.reduce((acc, metric) => acc + metric[field], 0);
        return sum / metrics.length;
    }

    _calculateAverageMemoryUsage(metrics) {
        return {
            heapUsed: this._calculateAverage(metrics, 'memoryUsage.heapUsed'),
            heapTotal: this._calculateAverage(metrics, 'memoryUsage.heapTotal'),
            external: this._calculateAverage(metrics, 'memoryUsage.external'),
            rss: this._calculateAverage(metrics, 'memoryUsage.rss')
        };
    }

    _calculatePercentiles(metrics) {
        const sortedTimes = metrics
            .map(m => m.executionTime)
            .sort((a, b) => a - b);

        return {
            p50: this._getPercentile(sortedTimes, 50),
            p75: this._getPercentile(sortedTimes, 75),
            p90: this._getPercentile(sortedTimes, 90),
            p95: this._getPercentile(sortedTimes, 95)
        };
    }

    _getPercentile(sortedValues, percentile) {
        const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
        return sortedValues[index];
    }

    _checkThresholdViolations(metrics) {
        return {
            queryTime: metrics.filter(m => m.executionTime > this.thresholds.queryTime).length,
            memoryUsage: metrics.filter(m => m.memoryUsage.heapUsed > this.thresholds.memoryUsage * 1024 * 1024).length,
            responseTime: metrics.filter(m => m.executionTime > this.thresholds.responseTime).length
        };
    }

    _generateRecommendations(analysis) {
        const recommendations = [];

        // Check execution time
        if (analysis.averageExecutionTime > this.thresholds.queryTime * 0.8) {
            recommendations.push('Consider optimizing query execution time');
        }

        // Check memory usage
        if (analysis.averageMemoryUsage.heapUsed > this.thresholds.memoryUsage * 1024 * 1024 * 0.8) {
            recommendations.push('Memory usage is approaching threshold, consider optimization');
        }

        // Check percentiles
        if (analysis.percentiles.p95 > this.thresholds.responseTime) {
            recommendations.push('95th percentile response time exceeds threshold');
        }

        return recommendations;
    }
}

module.exports = PerformanceMonitor;
