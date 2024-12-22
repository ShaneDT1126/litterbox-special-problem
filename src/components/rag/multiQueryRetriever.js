const { OpenAIEmbeddings } = require("@langchain/openai");
const { OpenAI } = require("openai");
const PerformanceMonitor = require('../benchmarking/performanceMonitor');
const logger = require('../../utils/logger');


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

        // Query variation templates for Computer Architecture
        this.queryTemplates = {
            greeting: [
                "How to greet in computer architecture context",
                "Introduction to computer architecture topics"
            ],
            farewell: [
                "Concluding computer architecture discussion",
                "Summarizing key points in computer architecture"
            ],
            help: [
                "Common issues in understanding computer architecture",
                "Study tips for computer architecture"
            ],
            cpu: [
                "What is {query} in CPU architecture",
                "How does {query} relate to CPU performance",
                "Explain the role of {query} in modern CPUs"
            ],
            memory: [
                "What is {query} in computer memory systems",
                "How does {query} affect memory performance",
                "Explain the concept of {query} in memory hierarchy"
            ],
            instruction_set: [
                "What is {query} in instruction set architecture",
                "How does {query} impact CPU design",
                "Explain the importance of {query} in ISA"
            ],
            cache: [
                "What is {query} in cache memory systems",
                "How does {query} improve cache performance",
                "Explain the role of {query} in cache hierarchy"
            ],
            pipelining: [
                "What is {query} in CPU pipelining",
                "How does {query} affect pipeline performance",
                "Explain the concept of {query} in modern pipeline designs"
            ]
        };

        logger.loggers.multiQueryRetriever.info({
            type: 'initialization',
            details: {
                templatesLoaded: Object.keys(this.queryTemplates).length
            }
        });
    }

    async retrieveDocuments(query, routeResult, conversationContext) {
        const startTime = Date.now();
        try {
            logger.loggers.multiQueryRetriever.info({
                type: 'retrieval_start',
                details: { originalQuery: query, routeResult: routeResult.name }
            });

            // Generate query variations
            const queryVariations = await this._generateQueryVariations(query, routeResult.name, conversationContext);

            // Get results for each variation
            const allResults = await Promise.all(
                queryVariations.map(async (variation) => {
                    const results = await this.vectorStore.query(variation,{
                        topic: routeResult.name
                    });
                    return results;
                })
            );

            const combinedResults = this._combineResults(allResults);

            logger.loggers.multiQueryRetriever.info({
                type: 'retrieval_complete',
                details: {
                    originalQuery: query,
                    routeResult: routeResult.name,
                    variationsCount: queryVariations.length,
                    resultsCount: combinedResults.length,
                    processingTime: Date.now() - startTime
                }
            });

            return combinedResults;

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

    async _generateQueryVariations(originalQuery, routeName, conversationContext) {
        try {
            const templates = this.queryTemplates[routeName] || this.queryTemplates.help;

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

            const variations = response.choices[0].message.content.split('\n').filter(v => v.trim() !== '');

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

    _combineResults(allResults) {
        try {
            // Combine all results and remove duplicates
            const seenContents = new Set();
            const combinedResults = [];

            for (const results of allResults) {
                // Ensure results is an array
                if (!Array.isArray(results)) {
                    logger.loggers.multiQueryRetriever.error({
                        type: 'invalid_results_structure',
                        details: {
                            received: typeof results,
                            value: results
                        }
                    });
                    continue; // Skip invalid entries
                }

                for (const result of results) {
                    if (!result || typeof result !== 'object') {
                        logger.loggers.multiQueryRetriever.warn({
                            type: 'invalid_result_entry',
                            details: {
                                received: typeof result,
                                value: result
                            }
                        });
                        continue; 
                    } // Skip invalid results

                    const content = result.content;
                    if (!content) {
                        logger.loggers.multiQueryRetriever.warn({
                            type: 'missing_content',
                            details: {
                                result
                            }
                        });
                        continue; // Skip if content is missing
                    }
                    if (!seenContents.has(content)) {
                        seenContents.add(content);
                        combinedResults.push(result);
                    }
                }
            }

            // Sort by relevance score
            return combinedResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

        } catch (error) {
            logger.loggers.multiQueryRetriever.error({
                type: 'result_combination_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }
}

module.exports = { MultiQueryRetriever };
