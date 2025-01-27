const { SemanticRouter } = require("../components/router/semanticRouter");
const DocumentManager = require('../components/rag/documentManager');
const { MultiQueryRetriever } = require('../components/rag/multiQueryRetriever');
const ScaffoldingSystem = require('../components/scaffolding/scaffoldingSystem');
const ResponseGenerator = require('../components/response/responseGenerator');
const ConversationMemory = require('../components/memory/conversationMemory');
const routes = require('../components/router/routeDefinitions');
const logger = require('../utils/logger');
const FeedbackSystem = require('../components/scaffolding/feedbackSystem');
const ProgressiveReduction = require('../components/scaffolding/progressiveReduction');
const PerformanceMonitor = require('../components/benchmarking/performanceMonitor');
const TokenCounter = require("../utils/tokenCounter");
const EventEmitter = require('events');

class MyDataSource extends EventEmitter {
    constructor(name) {
        super();
        this.name = name;
        console.log(`MyDataSource constructed with name: ${this.name}`);
        this.documentManager = null;
        this.semanticRouter = null;
        this.multiQueryRetriever = null;
        this.scaffoldingSystem = null;
        this.responseGenerator = null;
        this.conversationMemory = null;
        this.feedbackSystem = null;
        this.progressiveReduction = null;
        this.performanceMonitor = null;
        this.tokenCounter = null;
        this.responseCache = new Map();
    }   

    async init() {
        try {
            console.log(`Initializing MyDataSource with name: ${this.name}`);
            // Initialize components
            this.documentManager = new DocumentManager();
            await this.documentManager.initialize();
            
            const vectorStore = this.documentManager.getVectorStore();
            
            this.semanticRouter = new SemanticRouter(routes);
            this.multiQueryRetriever = new MultiQueryRetriever(vectorStore);
            this.conversationMemory = new ConversationMemory();
            this.scaffoldingSystem = new ScaffoldingSystem(this.multiQueryRetriever, this.conversationMemory);
            this.responseGenerator = new ResponseGenerator();
            this.feedbackSystem = new FeedbackSystem();
            this.progressiveReduction = new ProgressiveReduction();
            this.performanceMonitor = new PerformanceMonitor();
            this.tokenCounter = new TokenCounter();
            
            // Initialize response templates
            this.initializeResponseTemplates();

            // Event listeners for ScaffoldingSystem
            this.scaffoldingSystem.on('scaffoldChunk', (chunk) => {
                this.emit('responseChunk', chunk);
            });

            this.scaffoldingSystem.on('scaffoldComplete', (fullResponse) => {
                this.emit('responseComplete', fullResponse);
            });

            this.scaffoldingSystem.on('scaffoldError', (errorMessage) => {
                this.emit('responseError', errorMessage);
            });
            
            logger.loggers.app.info({
                type: 'datasource_initialization',
                details: {
                    name: this.name,
                    status: 'success'
                }
            });
        } catch (error) {
            console.error(`Error initializing MyDataSource ${this.name}:`, error);
            logger.loggers.app.error({
                type: 'datasource_initialization_error',
                details: {
                    name: this.name,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    initializeResponseTemplates() {
        this.responseTemplates = {
            outOfScope: {
                gentle: "I specialize in Computer Architecture topics. {reason}",
                suggestion: "Would you like to know about any of these topics instead?\n{suggestions}",
                redirect: "Let me help you with Computer Architecture concepts instead."
            },
            clarification: {
                topic: "Could you clarify if you're asking about {topic} in the context of computer architecture?",
                general: "To better assist you, could you rephrase your question specifically about computer hardware or architecture?"
            },
            error: {
                default: "I apologize, but I'm having trouble processing your question. Could you rephrase it?",
                technical: "I encountered an issue while processing your query. Let's try a different approach."
            }
        };
    }

    async renderData(context, memory, tokenizer, maxTokens) {
        const query = memory.getValue('temp.input');
        if (!query) {
            return { output: "", length: 0, tooLong: false };
        }

        const response = await this.processQuery(query, context.activity.conversation.id);
        const output = JSON.stringify(response);
        const length = tokenizer.encode(output).length;

        return {
            output,
            length,
            tooLong: length > maxTokens
        };
    }

    async processQuery(query, sessionId) {
        const startTime = Date.now();
        try {
            // 1. Semantic Routing
            const routeResult = await this.semanticRouter.route(query);

            // 2. Scaffolding System that includes multi-query retrieval, progressive reduction, and response generation
            const scaffoldingContext = {
                sessionId: sessionId,
                routingResult: routeResult,
                currentSupportLevel: this.feedbackSystem.getFeedbackRatio(sessionId) > 0.5 ? 'low' : 'high',
                topics: []
            };
            
            const scaffoldedResponse = await this.scaffoldingSystem.processWithScaffolding(query, scaffoldingContext);

            const scaffoldedResponseTokens = this.tokenCounter.countTokens(JSON.stringify(scaffoldedResponse));
            logger.loggers.app.info({
                type: 'scaffolded_response_tokens',
                details: { 
                    sessionId, 
                    scaffoldedResponseTokens 
                }
            });

            // 3. Format and return the response
            const formattedResponse = this.formatResponse(scaffoldedResponse, routeResult);

            // Record performance metrics
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            this.performanceMonitor.recordQuery({
                responseTime,
                successful: true,
                cacheHit: false,
                topic: routeResult.topic,
                tokenCount: scaffoldedResponseTokens
            });

            return formattedResponse;

        } catch (error) {
            logger.loggers.app.error({
                type: 'query_processing_error',
                details: {
                    query,
                    message: error.message,
                    stack: error.stack
                }
            });

            // Record error in performance metrics
            this.performanceMonitor.recordQuery({
                responseTime: Date.now() - startTime,
                successful: false,
                error: error.message,
            });

            return this.handleError(error);
        }
    }

    formatResponse(scaffoldedResponse, routingResult) {
        const content = scaffoldedResponse.message || '';
    
        const learningObjectives = this.generateLearningObjectives(routingResult.topic, routingResult.type);
        const relatedConcepts = this.getRelatedConcepts(routingResult.topic);
    
        return {
            topic: routingResult.topic,
            content: content,
            learningObjectives: learningObjectives,
            relatedConcepts: relatedConcepts,
            suggestedTopics: this.getTopicSuggestions(),
            summary: this.generateSummary(content),
            nextSteps: this.suggestNextSteps(routingResult.topic, routingResult.type),
            scaffoldingContext: scaffoldedResponse.scaffoldingContext,
            conversationSummary: scaffoldedResponse.conversationSummary,
            topicClassification: scaffoldedResponse.topicClassification
        };
    }
    
    generateLearningObjectives(topic, queryType) {
        const objectives = {
            concept_explanation: [
                `Understand the fundamental principles of ${topic}`,
                `Identify key components and their roles in ${topic}`,
                `Explain the basic operation and function of ${topic}`
            ],
            problem_solving: [
                `Apply ${topic} concepts to solve practical problems`,
                `Analyze performance and efficiency considerations in ${topic}`,
                `Evaluate different implementation approaches for ${topic}`
            ],
            comparison: [
                `Compare different aspects of ${topic}`,
                `Analyze advantages and disadvantages of various ${topic} implementations`,
                `Evaluate trade-offs in different ${topic} scenarios`
            ]
        };
    
        return objectives[queryType] || objectives.concept_explanation;
    }

    getRelatedConcepts(topic) {
        const conceptMap = {
            'CPU': ['Instruction Set Architecture', 'Pipelining', 'Cache'],
            'Memory': ['Cache', 'Virtual Memory', 'RAM'],
            'Cache': ['CPU', 'Memory Hierarchy', 'Locality of Reference'],
            'Pipelining': ['CPU', 'Instruction Level Parallelism', 'Hazards'],
            'Instruction Set Architecture': ['CPU', 'RISC vs CISC', 'Assembly Language']
        };
    
        return conceptMap[topic] || [];
    }

    suggestNextSteps(topic, queryType) {
        const nextSteps = {
            concept_explanation: [
                `Explore practical applications of ${topic}`,
                `Investigate advanced features of ${topic}`,
                `Compare ${topic} with related concepts`
            ],
            problem_solving: [
                `Analyze more complex ${topic} scenarios`,
                `Optimize ${topic} implementations`,
                `Explore real-world case studies involving ${topic}`
            ],
            comparison: [
                `Dive deeper into specific aspects of ${topic}`,
                `Investigate emerging trends in ${topic}`,
                `Apply ${topic} concepts to solve practical problems`
            ]
        };
    
        return nextSteps[queryType] || nextSteps.concept_explanation;
    }

    generateSummary(content) {
        if (typeof content !== 'string') {
            return '';
        }
    
        // Split the content into sentences
        const sentences = content.split(/[.!?]+/);
    
        // Take the first sentence as a summary
        const summary = sentences[0] ? sentences[0].trim() + '.' : '';
    
        return summary;
    }

    handleOutOfScopeQuery(routingResult, tokenizer) {
        const response = [
            this.responseTemplates.outOfScope.gentle.replace('{reason}', routingResult.reason),
            this.responseTemplates.outOfScope.suggestion.replace(
                '{suggestions}',
                this.getTopicSuggestions()
            )
        ].join('\n\n');

        return {
            output: response,
            length: tokenizer.encode(response).length,
            tooLong: false
        };
    }

    handleClarificationRequest(routingResult, tokenizer) {
        const response = routingResult.topic ?
            this.responseTemplates.clarification.topic.replace('{topic}', routingResult.topic) :
            this.responseTemplates.clarification.general;

        return {
            output: response,
            length: tokenizer.encode(response).length,
            tooLong: false
        };
    }

    handleError(error) {
        return this.responseGenerator.generateGuidingResponse(
            "Error handling query",
            [],
            { supportLevel: 'high', reductionLevel: 'none' },
            []
        ).then(response => ({
            output: response,
            length: this.tokenCounter.countTokens(response),
            tooLong: false
        })).catch(() => ({
            output: this.responseTemplates.error.default,
            length: this.tokenCounter.countTokens(this.responseTemplates.error.default),
            tooLong: false
        }));
    }

    getTopicSuggestions() {
        return [
            "CPU architecture and organization",
            "Memory hierarchy and cache systems",
            "Instruction set architecture (ISA)",
            "Pipelining and performance optimization",
            "Computer system organization"
        ].map(topic => `• ${topic}`).join('\n');
    }

    generateCacheKey(query, routingResult) {
        return `${query}_${routingResult.topic}_${routingResult.type}`.toLowerCase();
    }

    async processFeedback(sessionId, isPositive) {
        await this.feedbackSystem.addFeedback(sessionId, isPositive);
        this.performanceMonitor.recordFeedback(isPositive);
        
        // Update scaffolding based on feedback
        const performance = isPositive ? 0.8 : 0.2; // Simple mapping of feedback to performance
        const updatedScaffolding = this.scaffoldingSystem.updateUserProgress(sessionId, performance);
        
        logger.loggers.app.info({
            type: 'user_feedback_processed',
            details: { sessionId, isPositive, updatedScaffolding }
        });
    }

    getPerformanceMetrics() {
        return this.performanceMonitor.getMetricsSummary();
    }
}

module.exports = { MyDataSource };
