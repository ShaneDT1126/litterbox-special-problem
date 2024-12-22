const logger = require('../../utils/logger');
const PerformanceMonitor = require('./performanceMonitor');

const monitor = new PerformanceMonitor();

// Method decorator for performance monitoring
function monitorPerformance(category) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args) {
            try {
                const { result, metrics } = await monitor.measurePerformance(
                    propertyKey,
                    category,
                    async () => await originalMethod.apply(this, args)
                );

                return result;
            } catch (error) {
                logger.loggers.performance.error({
                    type: 'decorator_error',
                    details: {
                        category,
                        method: propertyKey,
                        message: error.message,
                        stack: error.stack
                    }
                });
                throw error;
            }
        };

        return descriptor;
    };
}

module.exports = { monitorPerformance };
