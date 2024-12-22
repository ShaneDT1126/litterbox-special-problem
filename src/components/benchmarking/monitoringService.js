// components/benchmarking/monitoringService.js
const logger = require('../../utils/logger');

class MonitoringService {
    constructor() {
        this.metrics = {};
    }

    async monitorOperation(operationType, component, operation) {
        const startTime = Date.now();
        try {
            const result = await operation();
            
            // Log success using the logger
            logger.loggers[component]?.info({
                type: operationType,
                details: {
                    duration: Date.now() - startTime,
                    status: 'success'
                }
            });

            return result;
        } catch (error) {
            // Log error using the logger
            logger.loggers[component]?.error({
                type: operationType,
                details: {
                    duration: Date.now() - startTime,
                    status: 'error',
                    error: {
                        message: error.message,
                        stack: error.stack
                    }
                }
            });
            
            throw error;
        }
    }
}

module.exports = MonitoringService;
