const { OpenAIEmbeddings } = require("@langchain/openai");
const { OpenAI } = require("openai");
const PerformanceMonitor = require('../benchmarking/performanceMonitor');
const logger = require('../../utils/logger');
const TokenCounter = require('../../utils/tokenCounter');
const queryTemplates = require('./queryTemplates');

class MultiQueryRetriever {
    constructor(vectorStore) {
        this.vectorStore = vectorStore;
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.SECRET_OPENAI_API_KEY,
        });

        // Initialize OpenAI client
        this.openai = new OpenAI({
            apiKey: process.env.SECRET_OPENAI_API_KEY,
        });

        this.performanceMonitor = new PerformanceMonitor();
        this.tokenCounter = new TokenCounter();
        this.MAX_TOKENS = 1000; // Adjust as needed

        // Query variation templates for Computer Architecture
        this.queryTemplates = queryTemplates;

        logger.loggers.multiQueryRetriever.info({
            type: 'initialization',
            details: {
                templatesLoaded: Object.keys(this.queryTemplates).length
            }
        });
    }

    async retrieveDocuments(query, routeResult, conversationContext, topics) {
        const startTime = Date.now();
        try {
            logger.loggers.multiQueryRetriever.info({
                type: 'retrieval_start',
                details: { originalQuery: query, routeResult: routeResult.name }
            });

            // Generate query variations
            const queryVariations = await this._generateQueryVariations(query, routeResult.name, conversationContext, topics);

            const allResults = await this._executeQueries(queryVariations, routeResult);
            const mergedResults = this._mergeAndDeduplicate(allResults);
            const truncatedResults = this._truncateResults(mergedResults);

            logger.loggers.multiQueryRetriever.info({
                type: 'retrieval_complete',
                details: {
                    originalQuery: query,
                    routeResult: routeResult.name,
                    variationsCount: queryVariations.length,
                    resultsCount: truncatedResults.length,
                    processingTime: Date.now() - startTime
                }
            });

            return truncatedResults;

        } catch (error) {
            logger.loggers.multiQueryRetriever.error({
                type: 'retrieval_error',
                details: {
                    query: query,
                    routeResult: routeResult.name,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    async _generateQueryVariations(originalQuery, routeName, conversationContext, topics) {
        try {
            const templates = this.queryTemplates[routeName] || this.queryTemplates.help;
            const variations = this.queryTemplates[routeName] || this.queryTemplates.help;

            if (!variations || !variations.length) {
                return ["Please clarify your computer architecture query."];
            }

            console.log('Generating query variations for:', originalQuery, routeName, conversationContext, topics);
            console.log('Templates:', templates);
            console.log('Variations:', variations);

             // Use GPT to generate context-aware query variations
            const prompt = `Given the original query "${originalQuery}" and the conversation context:
            ${conversationContext}
            Generate 3 variations of the query that are relevant to the topic "${routeName}" in computer architecture.`;

            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant that generates query variations." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 100,
                n: 1,
                temperature: 0.7,
            });

            

            const gptVariations = response.choices[0].message.content.split('\n').filter(v => v.trim() !== '');
            variations.push(...gptVariations);

            console.log('GPT Variations:', gptVariations);
            console.log('Combined Variations:', variations);

            // Add variations based on extracted topics
            topics.forEach(topic => {
                variations.push(`How does ${topic} relate to ${originalQuery}?`);
            });

            // Combine GPT-generated variations with template-based variations
            const templateVariations = templates.map(template => 
                template.replace('{query}', originalQuery)
            );

            return [...variations, ...templateVariations];

        } catch (error) {
            logger.loggers.multiQueryRetriever.error({
                type: 'query_variation_error',
                details: {
                    originalQuery,
                    routeName,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    async _classifyTopic(query) {
        try {
            const prompt = `Given the query "${query}", classify it into one of the following computer architecture topics:
            - CPU
            - Memory
            - Cache
            - Pipelining
            - Instruction Set
            - I/O
            - Bus Architecture
            Return only the topic name, nothing else.`;
    
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a computer architecture topic classifier." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 10,
                temperature: 0.3,
            });
    
            const topic = response.choices[0].message.content.trim().toLowerCase();
            return topic;
    
        } catch (error) {
            logger.loggers.multiQueryRetriever.error({
                type: 'topic_classification_error',
                details: {
                    query,
                    message: error.message,
                    stack: error.stack
                }
            });
            return 'general'; // Default topic if classification fails
        }
    }

    async _executeQueries(queryVariations, routeResult) {
        const queryPromises = queryVariations.map(variation => 
            this.vectorStore.query(variation, 
                { 
                    topic: routeResult.name.toLowerCase() 
                })
        );

        return Promise.all(queryPromises);
    }

    _mergeAndDeduplicate(allResults) {
        const mergedResults = allResults.flat();
        const uniqueResults = Array.from(new Set(mergedResults.map(JSON.stringify))).map(JSON.parse);
        return uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    _truncateResults(results) {
        let tokenCount = 0;
        return results.filter(result => {
            const resultTokens = this.tokenCounter.countTokens(JSON.stringify(result));
            if (tokenCount + resultTokens <= this.MAX_TOKENS) {
                tokenCount += resultTokens;
                return true;
            }
            return false;
        });
    }
}

module.exports = { MultiQueryRetriever };
