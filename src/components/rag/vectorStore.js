const { OpenAIEmbeddings } = require("@langchain/openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { MultiQueryRetriever } = require('./multiQueryRetriever');
const logger = require('../../utils/logger');
const { ChromaClient } = require('chromadb');

class VectorStore {
    constructor() {
        // OpenAI embeddings configuration
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.SECRET_OPENAI_API_KEY,
        });

        this.vectorStore = null;
        this.collectionName = "computer_architecture";
        this.relevanceThreshold = 0.75; // Minimum similarity score

        // Add tracking for processed documents
        this.processedDocs = new Set();

        // ChromaDB configuration
        const chromaHost = process.env.CHROMA_HOST || 'localhost';
        const chromaPort = process.env.CHROMA_PORT || '8000';

        // Initialize ChromaDB client
        this.client = new ChromaClient({
            path: `http://${chromaHost}:${chromaPort}`,
        });

        // Initialize MultiQueryRetriever
        this.multiQueryRetriever = new MultiQueryRetriever(this);
        
        // Metadata filters for computer architecture topics
        this.topicFilters = {
            core: ["cpu", "memory", "cache", "pipeline", "instruction_set"],
            advanced: ["virtual_memory", "cache_coherence", "branch_prediction"],
            performance: ["optimization", "throughput", "latency"]
        };

        // Add retry mechanism
        this.maxRetries = 5;
        this.retryDelay = 2000; // 2 seconds

        // Log configuration
        logger.loggers.vectorStore.info({
            type: 'initialization',
            details: {
                collectionName: this.collectionName,
                relevanceThreshold: this.relevanceThreshold,
                chromaConfig: {
                    host: chromaHost,
                    port: chromaPort,
                    authEnabled: process.env.CHROMA_AUTH_ENABLED === 'true'
                }
            }
        });
    }

    async initialize() {
        let retries = 0;
        const startTime = Date.now();

        while (retries < this.maxRetries) {
            try {
                logger.loggers.vectorStore.info({
                    type: 'initialize_start',
                    details: {
                        collectionName: this.collectionName,
                        attempt: retries + 1
                    }
                });

                // Try to connect to ChromaDB
                await this.client.heartbeat();

                // Get or create collection with embedding function
                this.collection = await this.client.getOrCreateCollection({
                    name: this.collectionName,
                });

                // Initialize vector store
                this.vectorStore = await Chroma.fromExistingCollection(
                    this.embeddings,
                    { collectionName: this.collectionName }
                );

                // Get collection info
                const collectionInfo = await this.getCollectionStats();

                // Update processedDocs Set with existing document IDs
                if (collectionInfo && collectionInfo.documentIds) {
                    collectionInfo.documentIds.forEach(id => this.processedDocs.add(id));
                }

                logger.loggers.vectorStore.info({
                    type: 'initialize_complete',
                    details: {
                        processingTime: Date.now() - startTime,
                        documentCount: collectionInfo?.documentCount || 0,
                        status: 'success',
                        attempt: retries + 1
                    }
                });

                return;
            } catch (error) {
                retries++;
                if (retries === this.maxRetries) {
                    logger.loggers.vectorStore.error({
                        type: 'initialize_error',
                        details: {
                            error: error.message,
                            attempts: retries
                        }
                    });
                    throw error;
                }

                logger.loggers.vectorStore.info({
                    type: 'initialize_retry',
                    details: {
                        attempt: retries,
                        nextRetryIn: this.retryDelay
                    }
                });

                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    async _createNewCollection() {
        try {
            logger.loggers.vectorStore.info({
                type: 'create_collection_start'
            });

            this.vectorStore = await Chroma.fromDocuments(
                [],
                this.embeddings,
                {
                    collectionName: this.collectionName,
                    ...this.chromaConfig
                }
            );

            logger.loggers.vectorStore.info({
                type: 'create_collection_complete'
            });
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'create_collection_error',
                details: { error: error.message }
            });
            throw error;
        }
    }

    // Method for multi-query retrieval
    async enhancedQuery(query, options = {}) {
        const startTime = Date.now();
        try {
            logger.loggers.vectorStore.info({
                type: 'enhanced_query_start',
                details: {
                    query: query,
                    options: options
                }
            });

            // Get results using multi-query retrieval
            const multiResults = await this.multiQueryRetriever.retrieveDocuments(
                query,
                options,
                [], // Conversation context (empty for now)
                [] // Topics (empty for now)
            );

            // Process and format results
            const processedResults = await this.processQueryResults(multiResults, options);
            const formattedResults = this.formatResults(processedResults);

            logger.loggers.vectorStore.info({
                type: 'enhanced_query_complete',
                details: {
                    resultCount: multiResults.length,
                    processingTime: Date.now() - startTime
                }
            });

            return formattedResults;
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'enhanced_query_error',
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

    async addDocuments(documents) {
        const startTime = Date.now();
        try {
            if (!this.collection) {
                throw new Error('Collection not initialized');
            }

            logger.loggers.vectorStore.info({
                type: 'add_documents_start',
                details: {
                    documentCount: documents.length
                }
            });

            // Prepare documents for ChromaDB
            const embeddings = await this.embeddings.embedDocuments(
                documents.map(doc => doc.pageContent)
            );

            // Generate IDs for documents
            const ids = documents.map((_, index) => 
                `doc_${Date.now()}_${index}`
            );

            // Classify documents by topic
            const classifiedDocuments = await Promise.all(documents.map(async (doc) => {
                const classification = await this.multiQueryRetriever._classifyTopic(doc.pageContent);
                return {
                    ...doc,
                    metadata: {
                        ...doc.metadata,
                        topic: classification.topic,
                        confidence: classification.confidence
                    }
                };
            }));

            // Add to ChromaDB collection
            await this.collection.add({
                ids: ids,
                embeddings: embeddings,
                documents: classifiedDocuments.map(doc => doc.pageContent),
                metadatas: classifiedDocuments  .map(doc => doc.metadata || {})
            });

            logger.loggers.vectorStore.info({
                type: 'add_documents_complete',
                details: {
                    processedCount: documents.length,
                    processingTime: Date.now() - startTime
                }
            });

            // Verify storage
            const stats = await this.getCollectionStats();
            logger.loggers.vectorStore.info({
                type: 'storage_verification',
                details: {
                    documentCount: stats.documentCount,
                    status: stats.status
                }
            });

        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'add_documents_error',
                details: {
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
    
            // Get topic classification
            const topicClassification = await this.multiQueryRetriever._classifyTopic(query);
            
            // Create the where clause for ChromaDB
            const whereClause = {
                topic: { $eq: topicClassification }
            };
    
            // Generate embeddings for the query
            const queryEmbedding = await this.embeddings.embedQuery(query);
    
            // Perform the similarity search with metadata filtering
            const results = await this.vectorStore.similaritySearchVectorWithScore(
                queryEmbedding,
                5, // Number of results to return
                whereClause
            );
    
            // Filter results by relevance threshold
            const filteredResults = results.filter(([_, score]) => 
                score >= this.relevanceThreshold
            );
    
            // Process and format results
            const processedResults = filteredResults.map(([doc, score]) => ({
                content: doc.pageContent,
                metadata: doc.metadata,
                relevanceScore: score,
                concepts: doc.metadata.concepts || []
            }));
    
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
    
            return processedResults;
    
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

            // Get collection count directly from ChromaDB client
            const count = await this.collection.count();
            
            const stats = {
                documentCount: count,
                lastUpdated: new Date().toISOString(),
                status: "Connected to ChromaDB",
                metadata: {}
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
    
    async deleteCollection() {
        try {
            logger.loggers.vectorStore.info({
                type: 'delete_collection_start',
                details: { collectionName: this.collectionName }
            });

            // Method 1: Using ChromaDB client
            await this.client.deleteCollection({
                name: this.collectionName
            });

            // Reset the collection and vectorStore
            this.collection = null;
            this.vectorStore = null;

            logger.loggers.vectorStore.info({
                type: 'delete_collection_complete',
                details: { collectionName: this.collectionName }
            });
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'delete_collection_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }
    
    async updateDocuments(documents) {
        const startTime = Date.now();
        try {
            logger.loggers.vectorStore.info({
                type: 'update_documents_start',
                details: { documentCount: documents.length }
            });
    
            // Prepare documents for ChromaDB
            const embeddings = await this.embeddings.embedDocuments(
                documents.map(doc => doc.pageContent)
            );
    
            // Update documents in ChromaDB collection
            await this.collection.update({
                ids: documents.map(doc => doc.id),
                embeddings: embeddings,
                documents: documents.map(doc => doc.pageContent),
                metadatas: documents.map(doc => doc.metadata || {})
            });
    
            logger.loggers.vectorStore.info({
                type: 'update_documents_complete',
                details: {
                    updatedCount: documents.length,
                    processingTime: Date.now() - startTime
                }
            });
        } catch (error) {
            logger.loggers.vectorStore.error({
                type: 'update_documents_error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }
}

module.exports = { VectorStore };

