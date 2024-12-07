const { OpenAIEmbeddings } = require("@langchain/openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const logger = require('../../utils/logger');

class VectorStore {
    constructor() {
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.SECRET_OPENAI_API_KEY,
        });
        this.vectorStore = null;
        this.collectionName = "computer_architecture";
        this.relevanceThreshold = 0.75; // Minimum similarity score
        
        // Metadata filters for computer architecture topics
        this.topicFilters = {
            core: ["cpu", "memory", "cache", "pipeline", "instruction_set"],
            advanced: ["virtual_memory", "cache_coherence", "branch_prediction"],
            performance: ["optimization", "throughput", "latency"]
        };

        logger.loggers.vectorStore.info({
            type: 'initialization',
            details: {
                collectionName: this.collectionName,
                relevanceThreshold: this.relevanceThreshold,
                topicFiltersCount: Object.keys(this.topicFilters).length
            }
        });
    }

    async initialize() {
        const startTime = Date.now();
        try {
            logger.loggers.vectorStore.info({
                type: 'initialize_start',
                details: {
                    collectionName: this.collectionName
                }
            });
            
            this.vectorStore = await Chroma.fromExistingCollection(
                this.embeddings,
                { 
                    collectionName: this.collectionName,
                    url: "http://localhost:8000",
                    collectionMetadata: {
                        "hnsw:space": "cosine"
                    }
                }
            );

            logger.loggers.vectorStore.info({
                type: 'initialize_complete',
                details: {
                    processingTime: Date.now() - startTime,
                    status: 'success'
                }
            });
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'initialize_error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });

            try {
                const createStartTime = Date.now();
                logger.loggers.vectorStore.info({
                    type: 'create_collection_start',
                    details: {
                        collectionName: this.collectionName
                    }
                });

                this.vectorStore = await Chroma.fromDocuments(
                    [],
                    this.embeddings,
                    {
                        collectionName: this.collectionName,
                        url: "http://localhost:8000",
                        collectionMetadata: {
                            "hnsw:space": "cosine"
                        }
                    }
                );

                logger.loggers.vectorStore.info({
                    type: 'create_collection_complete',
                    details: {
                        processingTime: Date.now() - createStartTime,
                        status: 'success'
                    }
                });
            } catch (createError) {
                logger.loggers.vectorStore.error({
                    type: 'create_collection_error',
                    details: {
                        message: createError.message,
                        stack: createError.stack,
                        processingTime: Date.now() - createStartTime
                    }
                });
                throw createError;
            }
        }
    }


    async addDocuments(documents) {
        const startTime = Date.now();
        try {
            logger.loggers.vectorStore.info({
                type: 'add_documents_start',
                details: {
                    documentCount: documents.length
                }
            });
            
            const batchSize = 50;
            for (let i = 0; i < documents.length; i += batchSize) {
                const batchStartTime = Date.now();
                const batch = documents.slice(i, i + batchSize);
                await this.processBatch(batch);

                logger.loggers.vectorStore.info({
                    type: 'batch_process',
                    details: {
                        batchSize: batch.length,
                        batchNumber: Math.floor(i / batchSize) + 1,
                        totalBatches: Math.ceil(documents.length / batchSize),
                        processingTime: Date.now() - batchStartTime
                    }
                });
            }

            logger.loggers.vectorStore.info({
                type: 'add_documents_complete',
                details: {
                    documentCount: documents.length,
                    processingTime: Date.now() - startTime
                }
            });
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'add_documents_error',
                details: {
                    documentCount: documents.length,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    async processBatch(documents) {
        const startTime = Date.now();
        try {
            const enhancedDocs = documents.map(doc => ({
                ...doc,
                metadata: {
                    ...doc.metadata,
                    timestamp: new Date().toISOString(),
                    source: "computer_architecture_textbook"
                }
            }));

            await this.vectorStore.addDocuments(enhancedDocs);

            logger.loggers.vectorStore.info({
                type: 'process_batch',
                details: {
                    documentCount: documents.length,
                    processingTime: Date.now() - startTime
                }
            });
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'process_batch_error',
                details: {
                    documentCount: documents.length,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    async query(query, options = {}) {
        const startTime = Date.now();
        try {
            logger.loggers.vectorStore.info({
                type: 'query_start',
                details: {
                    query: query,
                    options: options
                }
            });

            const filter = this.buildMetadataFilter(options);
            const results = await this.vectorStore.similaritySearchWithScore(
                query,
                5,
                filter
            );

            const processedResults = await this.processQueryResults(results, options);
            const formattedResults = this.formatResults(processedResults);

            logger.loggers.vectorStore.info({
                type: 'query_complete',
                details: {
                    query: query,
                    resultCount: processedResults.length,
                    processingTime: Date.now() - startTime,
                    averageRelevance: this.calculateAverageRelevance(processedResults)
                }
            });

            return formattedResults;
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'query_error',
                details: {
                    query: query,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    buildMetadataFilter(options) {
        const filter = {};

        // Add topic-specific filters
        if (options.topic) {
            filter.concepts = options.topic;
        }

        // Add complexity level filter
        if (options.complexity) {
            filter.complexity = options.complexity;
        }

        return filter;
    }

    async processQueryResults(results, options) {
        const startTime = Date.now();
        try {
            const filteredResults = results.filter(([doc, score]) => 
                score >= this.relevanceThreshold
            );

            const processedResults = filteredResults.map(([doc, score]) => ({
                content: doc.pageContent,
                metadata: doc.metadata,
                relevanceScore: score,
                concepts: doc.metadata.concepts || []
            }));

            logger.loggers.vectorStore.info({
                type: 'process_results',
                details: {
                    resultCounts: {
                        initial: results.length,
                        filtered: filteredResults.length,
                        final: processedResults.length
                    },
                    threshold: this.relevanceThreshold,
                    processingTime: Date.now() - startTime
                }
            });

            return processedResults;
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'process_results_error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    formatResults(results) {
        // Group results by concept
        const groupedResults = this.groupByConceptAndRelevance(results);

        // Format for response
        return {
            mainConcepts: Object.keys(groupedResults),
            details: groupedResults,
            totalResults: results.length,
            averageRelevance: this.calculateAverageRelevance(results)
        };
    }

    groupByConceptAndRelevance(results) {
        const grouped = {};

        results.forEach(result => {
            result.concepts.forEach(concept => {
                if (!grouped[concept]) {
                    grouped[concept] = [];
                }
                grouped[concept].push({
                    content: result.content,
                    relevance: result.relevanceScore
                });
            });
        });

        // Sort within each concept group by relevance
        Object.keys(grouped).forEach(concept => {
            grouped[concept].sort((a, b) => b.relevance - a.relevance);
        });

        return grouped;
    }

    calculateAverageRelevance(results) {
        if (results.length === 0) return 0;
        const sum = results.reduce((acc, result) => acc + result.relevanceScore, 0);
        return sum / results.length;
    }

    async deleteCollection() {
        const startTime = Date.now();
        try {
            logger.loggers.vectorStore.info({
                type: 'delete_collection_start',
                details: {
                    collectionName: this.collectionName
                }
            });

            await this.vectorStore.delete();

            logger.loggers.vectorStore.info({
                type: 'delete_collection_complete',
                details: {
                    collectionName: this.collectionName,
                    processingTime: Date.now() - startTime
                }
            });
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'delete_collection_error',
                details: {
                    collectionName: this.collectionName,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    async getCollectionStats() {
        const startTime = Date.now();
        try {
            logger.loggers.vectorStore.info({
                type: 'get_stats_start',
                details: {
                    collectionName: this.collectionName
                }
            });

            const response = await fetch(`http://localhost:8000/api/v1/collections/${this.collectionName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            const stats = {
                documentCount: data.count || 0,
                lastUpdated: new Date().toISOString(),
                status: "Connected to ChromaDB",
                metadata: data.metadata || {}
            };

            logger.loggers.vectorStore.info({
                type: 'get_stats_complete',
                details: {
                    collectionName: this.collectionName,
                    stats: stats,
                    processingTime: Date.now() - startTime
                }
            });

            return stats;
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'get_stats_error',
                details: {
                    collectionName: this.collectionName,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });

            return {
                documentCount: "Unknown",
                lastUpdated: new Date().toISOString(),
                status: "Error connecting to ChromaDB",
                error: error.message
            };
        }
    }
    
}

module.exports = { VectorStore };

