const logger = require('../../utils/logger');
const FeedbackSystem = require('./feedbackSystem');
const ProgressiveReduction = require('./progressiveReduction');
const ResponseGenerator = require('../response/responseGenerator');
const PerformanceMonitor = require('../benchmarking/performanceMonitor');

class ScaffoldingSystem {
    constructor(multiQueryRetriever, conversationMemory) {
        this.multiQueryRetriever = multiQueryRetriever;
        this.conversationMemory = conversationMemory;
        this.responseGenerator = new ResponseGenerator();
        this.feedbackSystem = new FeedbackSystem();
        this.progressiveReduction = new ProgressiveReduction();
        this.performanceMonitor = new PerformanceMonitor();
        

        this.scaffoldLevels = {
            HIGH: 'high_support',
            MEDIUM: 'medium_support',
            LOW: 'low_support'
        };

        this.scaffoldTypes = {
            CONCEPTUAL: 'conceptual',
            PROCEDURAL: 'procedural',
            STRATEGIC: 'strategic'
        };

        this.routeSpecificScaffolds = {
            greeting: this._createGreetingScaffold,
            farewell: this._createFarewellScaffold,
            help: this._createHelpScaffold,
            cpu: this._createConceptScaffold,
            memory: this._createConceptScaffold,
            instruction_set: this._createConceptScaffold,
            cache: this._createConceptScaffold,
            pipelining: this._createConceptScaffold
        };

        logger.loggers.scaffolding.info({
            type: 'initialization',
            details: {
                types: Object.keys(this.scaffoldTypes),
                levels: Object.keys(this.scaffoldLevels),
                components: ['MultiQueryRetriever', 'FeedbackSystem', 'ProgressiveReduction', 'PerformanceMonitor']
            }
        });
    
    }
    
    async processWithScaffolding(query, context) {
        const startTime = Date.now();
        try {
            logger.loggers.scaffolding.info({
                type: 'scaffold_process_start',
                details: { query, context }
            });

            const routeName = context.routingResult.type;
            const scaffoldType = this._determineScaffoldType(routeName);
            const supportLevel = this._determineSupportLevel(context);

            console.log('Received query:', query);
            console.log('Routing result:', JSON.stringify(context.routingResult, null, 2));
            
            const feedback = await this.feedbackSystem.getFeedback(context.sessionId);
            const reductionLevel = this.progressiveReduction.determineReductionLevel(
                context.sessionId,
                feedback
            );

            const conversationContext = this.conversationMemory.getConversationContext(context.sessionId);

            const relevantContent = await this.multiQueryRetriever.retrieveDocuments(query, context.routingResult, conversationContext);
            const reducedContent = this.progressiveReduction.applyReduction(relevantContent, reductionLevel);

            const scaffoldingContext = {
                topic: context.routingResult.topic,
                supportLevel: supportLevel,
                reductionLevel: reductionLevel
            };

            const response = await this.responseGenerator.generateResponse(
                query,
                reducedContent,
                scaffoldingContext,
                conversationContext
            );

            if (response) {
                this.conversationMemory.addTurn(context.sessionId, query, response);
            }

            const formattedResponse = {
                message: response,
                type: scaffoldType,
                supportLevel,
                reductionLevel,
                metadata: {
                    topic: context.routingResult.topic,
                    concepts: reducedContent.map(doc => doc.metadata.concept).filter((v, i, a) => a.indexOf(v) === i)
                }
            };

            logger.loggers.scaffolding.info({
                type: 'scaffold_process_complete',
                details: {
                    routeName,
                    scaffoldType,
                    supportLevel,
                    reductionLevel,
                    processingTime: Date.now() - startTime
                }
            });

            return formattedResponse;

        } catch (error) {
            logger.loggers.scaffolding.error({
                type: 'scaffold_process_error',
                details: {
                    query,
                    message: error.message,
                    stack: error.stack
                }
            });
            return this._createFallbackResponse(error, query, context);
        }
    }

    _createFallbackResponse(error, query, context) {
        return {
            message: "I apologize, but I encountered an error while processing your request. Could you please rephrase your question or try asking about a different topic?",
            type: 'fallback',
            supportLevel: 'high',
            reductionLevel: 'none',
            metadata: {
                originalQuery: query,
                error: error.message
            }
        };
    }

    _createGreetingScaffold(query, scaffoldType, supportLevel, reductionLevel, relevantContent, context) {
        return {
            greeting: "Hello! Welcome to the Computer Architecture tutor.",
            introduction: "I'm here to help you learn about computer organization and architecture concepts.",
            prompt: "What specific topic would you like to explore today?"
        };
    }

    _createFarewellScaffold(query, scaffoldType, supportLevel, reductionLevel, relevantContent, context) {
        return {
            farewell: "Thank you for using the Computer Architecture tutor.",
            summary: "We've covered some interesting topics today.",
            encouragement: "Keep exploring and learning about computer architecture!",
            prompt: "Is there anything else you'd like to know before you go?"
        };
    }

    _createHelpScaffold(query, scaffoldType, supportLevel, reductionLevel, relevantContent, context) {
        return {
            introduction: "I'm here to assist you with computer architecture topics.",
            availableTopics: [
                "CPU architecture",
                "Memory systems",
                "Instruction set architecture",
                "Cache systems",
                "Pipelining"
            ],
            prompt: "Which area would you like help with?",
            tip: "You can ask specific questions about any of these topics, and I'll guide you through the concepts."
        };
    }

    _createConceptScaffold(query, scaffoldType, supportLevel, reductionLevel, relevantContent, context) {
        const concept = context.routingResult.topic;
        const conceptIntro = this._getConceptIntroduction(concept);
        const relevantPoints = this._extractRelevantPoints(relevantContent, supportLevel);

        return {
            concept: concept,
            introduction: conceptIntro,
            relevantPoints: relevantPoints,
            prompt: `What specific aspect of ${concept} would you like to explore further?`,
            supportLevel: supportLevel,
            reductionLevel: reductionLevel
        };
    }

    _createDefaultScaffold(query, scaffoldType, supportLevel, reductionLevel, relevantContent, context) {
        return {
            message: "I'm not sure how to respond to that in the context of computer architecture.",
            prompt: "Could you please rephrase or ask about a specific computer architecture topic?",
            availableTopics: [
                "CPU architecture",
                "Memory systems",
                "Instruction set architecture",
                "Cache systems",
                "Pipelining"
            ]
        };
    }

    _getConceptIntroduction(concept) {
        const introductions = {
            cpu: "The CPU (Central Processing Unit) is the brain of a computer, responsible for executing instructions and performing calculations.",
            memory: "Memory systems in computer architecture deal with storing and retrieving data, including various levels of the memory hierarchy.",
            instruction_set: "The Instruction Set Architecture (ISA) defines the set of instructions that a CPU can execute, forming the interface between hardware and software.",
            cache: "Cache memory is a small, fast memory located close to the CPU that stores frequently accessed data to improve performance.",
            pipelining: "Pipelining is a technique used in CPU design to increase instruction throughput by overlapping the execution of multiple instructions."
        };
        return introductions[concept] || "This is an important concept in computer architecture.";
    }
    
    _extractRelevantPoints(relevantContent, supportLevel) {
        // Extract key points from relevant content
        const allPoints = relevantContent.flatMap(doc => {
            const sentences = doc.pageContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
            return sentences.map(s => s.trim());
        });

        // Sort points by relevance (you might want to implement a more sophisticated relevance scoring)
        const sortedPoints = allPoints.sort((a, b) => b.length - a.length);

        // Select points based on support level
        const numPoints = Math.min(supportLevel * 2, sortedPoints.length);
        const selectedPoints = sortedPoints.slice(0, numPoints);

        // Format points
        return selectedPoints.map(point => {
            if (point.length > 100) {
                return point.substring(0, 97) + '...';
            }
            return point;
        });
    }

    _determineScaffoldType(routeType) {
        const scaffoldTypes = {
            greeting: 'welcome',
            farewell: 'summary',
            help: 'guidance',
            cpu: 'concept',
            memory: 'concept',
            instruction_set: 'concept',
            cache: 'concept',
            pipelining: 'concept'
        };

        return scaffoldTypes[routeType] || 'default';
    }

    _determineSupportLevel(context) {
        const { currentTurn, routingResult } = context;
        let supportLevel = 2; // Default medium support

        // Adjust based on the number of turns in the conversation
        if (currentTurn <= 2) {
            supportLevel += 1; // Higher support for new conversations
        } else if (currentTurn > 5) {
            supportLevel -= 1; // Lower support for longer conversations
        }

        // Adjust based on the complexity of the topic
        const complexTopics = ['instruction_set', 'pipelining'];
        if (complexTopics.includes(routingResult.type)) {
            supportLevel += 1; // Higher support for complex topics
        }

        // Ensure support level is within bounds
        return Math.max(1, Math.min(supportLevel, 3));
    }

    _formatTeamsResponse(response) {
        // Create an Adaptive Card
        const card = new AdaptiveCard();

        // Add a title
        card.addItem({
            type: 'TextBlock',
            text: response.concept || 'Computer Architecture',
            size: 'Large',
            weight: 'Bolder'
        });

        // Add introduction
        if (response.introduction) {
            card.addItem({
                type: 'TextBlock',
                text: response.introduction,
                wrap: true
            });
        }

        // Add relevant points
        if (response.relevantPoints && response.relevantPoints.length > 0) {
            card.addItem({
                type: 'TextBlock',
                text: 'Key Points:',
                weight: 'Bolder'
            });

            response.relevantPoints.forEach(point => {
                card.addItem({
                    type: 'TextBlock',
                    text: `• ${point}`,
                    wrap: true
                });
            });
        }

        // Add prompt
        if (response.prompt) {
            card.addItem({
                type: 'TextBlock',
                text: response.prompt,
                wrap: true,
                color: 'Accent'
            });
        }

        // Convert the card to JSON
        const cardJson = card.toJSON();

        // Create a Teams activity with the Adaptive Card
        return {
            type: 'message',
            attachments: [{
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: cardJson
            }]
        };
    }

}

module.exports = ScaffoldingSystem;
