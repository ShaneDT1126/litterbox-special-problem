const SemanticRouter = require("../components/router/semanticRouter");
const { VectorStore } = require("../components/rag/vectorStore");
const DocumentProcessor = require("../components/rag/documentProcessor");

class MyDataSource {
    constructor(name) {
        this.name = name;
        this.vectorStore = null;
        this.semanticRouter = new SemanticRouter();
        this.responseCache = new Map(); // For optimizing repeated queries
    }

    async init() {
        try {
            // Remove the require statement here and use the imported VectorStore
            this.vectorStore = new VectorStore();
            await this.vectorStore.initialize();
            
            // Initialize response templates
            this.initializeResponseTemplates();
            
            console.log("MyDataSource initialized successfully");
        } catch (error) {
            console.error("Error initializing MyDataSource:", error);
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
        try {
            const query = memory.getValue('temp.input');
            if (!query) {
                return {
                    output: "",
                    length: 0,
                    tooLong: false
                };
            }

            // Route and validate query
            const routingResult = await this.semanticRouter.routeQuery(query);

            // Handle out-of-scope queries
            if (routingResult.type === 'out_of_scope') {
                return this.handleOutOfScopeQuery(routingResult, tokenizer);
            }

            // Handle queries needing clarification
            if (routingResult.clarificationNeeded) {
                return this.handleClarificationRequest(routingResult, tokenizer);
            }

            // Get relevant content from vector store
            const relevantContent = await this.getRelevantContent(query, routingResult);

            // Format content for response
            const formattedResponse = await this.formatResponse(
                relevantContent,
                routingResult,
                tokenizer,
                maxTokens
            );

            return formattedResponse;

        } catch (error) {
            console.error("Error in renderData:", error);
            return this.handleError(error, tokenizer);
        }
    }

    async getRelevantContent(query, routingResult) {
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(query, routingResult);
            if (this.responseCache.has(cacheKey)) {
                return this.responseCache.get(cacheKey);
            }

            // Get content from vector store with topic-specific focus
            const vectorResults = await this.vectorStore.query(query, {
                topic: routingResult.topic,
                subtopic: routingResult.subtopic,
                confidence: routingResult.confidence
            });

            // Enhance results with topic-specific context
            const enhancedResults = this.enhanceResults(vectorResults, routingResult);

            // Cache results
            this.responseCache.set(cacheKey, enhancedResults);
            
            return enhancedResults;

        } catch (error) {
            console.error("Error getting relevant content:", error);
            throw error;
        }
    }

    enhanceResults(vectorResults, routingResult) {
        // Add topic-specific context and relationships
        const enhanced = {
            mainContent: vectorResults,
            topic: routingResult.topic,
            relatedConcepts: routingResult.relevantConcepts,
            suggestedApproach: routingResult.suggestedApproach
        };

        // Add topic-specific learning objectives
        enhanced.learningObjectives = this.generateLearningObjectives(
            routingResult.topic,
            routingResult.type
        );

        return enhanced;
    }

    generateLearningObjectives(topic, queryType) {
        const objectives = {
            concept_explanation: [
                `Understand the fundamental principles of ${topic}`,
                `Identify key components and their roles`,
                `Explain the basic operation and function`
            ],
            problem_solving: [
                `Apply ${topic} concepts to solve practical problems`,
                `Analyze performance and efficiency considerations`,
                `Evaluate different implementation approaches`
            ],
            comparison: [
                `Compare different aspects of ${topic}`,
                `Analyze advantages and disadvantages`,
                `Evaluate trade-offs in different scenarios`
            ]
        };

        return objectives[queryType] || objectives.concept_explanation;
    }

    async formatResponse(content, routingResult, tokenizer, maxTokens) {
        const formattedContent = `
            Topic: ${content.topic}
            ${content.learningObjectives.map(obj => `• ${obj}`).join('\n')}
            
            Relevant concepts to explore:
            ${content.mainContent}
            
            Related topics to consider:
            ${content.relatedConcepts.map(concept => `• ${concept}`).join('\n')}
        `;

        const tokenCount = tokenizer.encode(formattedContent).length;
        
        return {
            output: formattedContent,
            length: tokenCount,
            tooLong: tokenCount > maxTokens
        };
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

    handleError(error, tokenizer) {
        const response = error.technical ?
            this.responseTemplates.error.technical :
            this.responseTemplates.error.default;

        return {
            output: response,
            length: tokenizer.encode(response).length,
            tooLong: false
        };
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
}

module.exports = { MyDataSource };
