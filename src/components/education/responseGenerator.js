const logger = require('../../utils/logger');
class ResponseGenerator {
    constructor() {
        this.responseTemplates = {
            // Core response templates
            initial: {
                acknowledgment: "I understand you're interested in learning about {concept}.",
                priorKnowledge: "Could you share what you already know about {concept}?",
                guidance: "Let's explore this step by step."
            },
            persistence: {
                gentle: "I understand your eagerness to get the answer, but let's work through this together.",
                firm: "Remember, true understanding comes from discovering the answer yourself.",
                explanation: "Instead of giving you the answer, let me help you break this down."
            },
            scaffolding: {
                breakdown: "Let's break this into smaller parts. First, let's consider {part}.",
                connection: "How do you think this relates to {related_concept}?",
                verification: "What makes you think that might be the case?",
                encouragement: "You're on the right track. What might be the next step?"
            }
        };

        this.prohibitedPatterns = [
            "the answer is",
            "the solution is",
            "here's the answer",
            "correct answer",
            "solution would be",
            "you should use",
            "you need to use",
            "the result is"
        ];

        logger.loggers.responseGenerator.info({  
            type: 'initialization',
            config: {
                templatesLoaded: Object.keys(this.responseTemplates).length,
                prohibitedPatternsCount: this.prohibitedPatterns.length
            }
        });
    }

    async generateResponse(context, queryType, socraticSteps) {
        const startTime = Date.now();
        try {
           logger.loggers.responseGenerator.info
({
                type: 'response_generation_start',
                context: {
                    queryType: queryType,
                    concept: socraticSteps.concept
                },
                timestamp: new Date().toISOString()
            });

            let response = [];
            const concept = socraticSteps.concept;

            // Initial response structure
            response.push(this._formatInitialResponse(concept));

            // Process Socratic steps
            response.push(...this._processSocraticSteps(socraticSteps));

            // Add educational scaffolding
            response.push(this._addScaffolding(queryType.type));

            // Verify response doesn't contain direct answers
            const finalResponse = response.join('\n\n');
            
            if (this._containsDirectAnswer(finalResponse)) {
                logger.loggers.documentProcessor.warn({
                    type: 'direct_answer_detected',
                    concept: concept,
                    queryType: queryType,
                    timestamp: new Date().toISOString()
                });

                return this._generateAlternativeResponse(concept, queryType);
            }

           logger.loggers.responseGenerator.info
({
                type: 'response_generation_complete',
                stats: {
                    responseLength: finalResponse.length,
                    stepCount: socraticSteps.steps.length,
                    processingTime: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });

            return finalResponse;
        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'response_generation_error',
                error: {
                    message: error.message,
                    stack: error.stack
                },
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }


    _formatInitialResponse(concept) {
        const startTime = Date.now();
        try {
            const response = this.responseTemplates.initial.acknowledgment.replace('{concept}', concept) + '\n' +
                           this.responseTemplates.initial.priorKnowledge.replace('{concept}', concept) + '\n' +
                           this.responseTemplates.initial.guidance;

           logger.loggers.responseGenerator.info
({
                type: 'initial_response_formatting',
                stats: {
                    concept: concept,
                    responseLength: response.length,
                    processingTime: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });

            return response;
        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'initial_response_formatting_error',
                concept: concept,
                error: {
                    message: error.message,
                    stack: error.stack
                },
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    _processSocraticSteps(socraticSteps) {
        const startTime = Date.now();
        try {
            const processedSteps = socraticSteps.steps.map(step => {
                return this._formatStepResponse(step);
            });

           logger.loggers.responseGenerator.info
({
                type: 'socratic_steps_processing',
                stats: {
                    stepCount: socraticSteps.steps.length,
                    processedStepCount: processedSteps.length,
                    processingTime: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });

            return processedSteps;
        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'socratic_steps_processing_error',
                error: {
                    message: error.message,
                    stack: error.stack
                },
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }


    _formatStepResponse(step) {
        const startTime = Date.now();
        try {
            let formattedResponse;
            switch (step.type) {
                case 'understand':
                    formattedResponse = `🤔 ${step.content}`;
                    break;
                case 'break_down':
                    formattedResponse = `📝 ${step.content}`;
                    break;
                case 'guide':
                    formattedResponse = `💡 ${step.content}`;
                    break;
                case 'verify':
                    formattedResponse = `✅ ${step.content}`;
                    break;
                case 'elaborate':
                    formattedResponse = `🔍 ${step.content}`;
                    break;
                default:
                    formattedResponse = step.content;
            }

           logger.loggers.responseGenerator.info
({
                type: 'step_response_formatting',
                stats: {
                    stepType: step.type,
                    responseLength: formattedResponse.length,
                    processingTime: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });

            return formattedResponse;
        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'step_response_formatting_error',
                stepType: step.type,
                error: {
                    message: error.message,
                    stack: error.stack
                },
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    _addScaffolding(queryType) {
        const scaffolding = {
            concept_explanation: "What aspects of this concept would you like to explore further?",
            problem_solving: "Which part of this problem seems most challenging to you?",
            comparison: "How would you compare these different aspects we've discussed?",
            application: "Can you think of a practical situation where this might apply?",
            verification: "How would you verify your understanding of this concept?"
        };

        return scaffolding[queryType] || scaffolding.concept_explanation;
    }

    _containsDirectAnswer(response) {
        const startTime = Date.now();
        try {
            const containsProhibited = this.prohibitedPatterns.some(pattern => 
                response.toLowerCase().includes(pattern.toLowerCase())
            );

           logger.loggers.responseGenerator.info
({
                type: 'direct_answer_check',
                result: {
                    containsDirectAnswer: containsProhibited,
                    responseLength: response.length,
                    patternsChecked: this.prohibitedPatterns.length
                },
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            });

            return containsProhibited;
        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'direct_answer_check_error',
                error: {
                    message: error.message,
                    stack: error.stack
                },
                timestamp: new Date().toISOString()
            });
            return true; // Safer to assume it contains direct answers if there's an error
        }
    }

    _generateAlternativeResponse(concept, queryType) {
        const startTime = Date.now();
        try {
            const alternativeResponse = [
                this.responseTemplates.persistence.gentle,
                this.responseTemplates.scaffolding.breakdown.replace('{part}', concept),
                "Let's approach this step by step:",
                "1. What do you already understand about this topic?",
                "2. Which specific part is unclear to you?",
                "3. How might this relate to concepts you're familiar with?",
                this._addScaffolding(queryType)
            ].join('\n\n');

           logger.loggers.responseGenerator.info
({
                type: 'alternative_response_generation',
                stats: {
                    concept: concept,
                    queryType: queryType,
                    responseLength: alternativeResponse.length,
                    processingTime: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });

            return alternativeResponse;
        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'alternative_response_generation_error',
                concept: concept,
                error: {
                    message: error.message,
                    stack: error.stack
                },
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    _addScaffolding(queryType) {
        const startTime = Date.now();
        try {
            const scaffolding = {
                concept_explanation: "What aspects of this concept would you like to explore further?",
                problem_solving: "Which part of this problem seems most challenging to you?",
                comparison: "How would you compare these different aspects we've discussed?",
                application: "Can you think of a practical situation where this might apply?",
                verification: "How would you verify your understanding of this concept?"
            };

            const scaffoldingResponse = scaffolding[queryType] || scaffolding.concept_explanation;

           logger.loggers.responseGenerator.info
({
                type: 'scaffolding_addition',
                stats: {
                    queryType: queryType,
                    scaffoldingType: queryType in scaffolding ? queryType : 'concept_explanation',
                    responseLength: scaffoldingResponse.length,
                    processingTime: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });

            return scaffoldingResponse;
        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'scaffolding_addition_error',
                queryType: queryType,
                error: {
                    message: error.message,
                    stack: error.stack
                },
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }


    formatForTeams(response) {
        const startTime = Date.now();
        try {
            const formattedResponse = {
                type: 'message',
                text: response,
                importance: 'normal'
            };

           logger.loggers.responseGenerator.info
({
                type: 'teams_formatting',
                stats: {
                    originalLength: response.length,
                    formattedLength: JSON.stringify(formattedResponse).length,
                    processingTime: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });

            return formattedResponse;
        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'teams_formatting_error',
                error: {
                    message: error.message,
                    stack: error.stack
                },
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    handlePersistentRequests(concept, attemptCount) {
        const startTime = Date.now();
        try {
            const responses = [
                this.responseTemplates.persistence.gentle,
                this.responseTemplates.persistence.firm,
                this.responseTemplates.persistence.explanation
            ];

            const index = Math.min(attemptCount - 1, responses.length - 1);
            const response = responses[index] + '\n\n' + 
                           this.responseTemplates.scaffolding.breakdown.replace('{part}', concept);

           logger.loggers.responseGenerator.info
({
                type: 'persistent_request_handling',
                stats: {
                    concept: concept,
                    attemptCount: attemptCount,
                    responseIndex: index,
                    responseLength: response.length,
                    processingTime: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });

            return response;
        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'persistent_request_handling_error',
                concept: concept,
                attemptCount: attemptCount,
                error: {
                    message: error.message,
                    stack: error.stack
                },
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
}

module.exports = { ResponseGenerator };
