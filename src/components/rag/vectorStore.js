const { OpenAIEmbeddings } = require("@langchain/openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { Document } = require("langchain/document");

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
    }

    async initialize() {
        try {
            console.log("Initializing vector store...");
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
            console.log("Vector store initialized successfully");
        } catch (error) {
            console.log("Creating new collection...");
            try {
                this.vectorStore = await Chroma.fromDocuments(
                    [], // Empty documents array
                    this.embeddings,
                    {
                        collectionName: this.collectionName,
                        url: "http://localhost:8000",
                        collectionMetadata: {
                            "hnsw:space": "cosine"
                        }
                    }
                );
                console.log("New collection created successfully");
            } catch (createError) {
                console.error("Error creating collection:", createError);
                throw createError;
            }
        }
    }

    async addDocuments(documents) {
        try {
            console.log(`Adding ${documents.length} documents to vector store...`);
            
            // Process documents in batches to prevent memory issues
            const batchSize = 50;
            for (let i = 0; i < documents.length; i += batchSize) {
                const batch = documents.slice(i, i + batchSize);
                await this.processBatch(batch);
            }

            console.log("Documents added successfully");
        } catch (error) {
            console.error("Error adding documents:", error);
            throw error;
        }
    }

    async processBatch(documents) {
        // Add metadata and IDs to documents
        const enhancedDocs = documents.map(doc => ({
            ...doc,
            metadata: {
                ...doc.metadata,
                timestamp: new Date().toISOString(),
                source: "computer_architecture_textbook"
            }
        }));

        await this.vectorStore.addDocuments(enhancedDocs);
    }

    async query(query, options = {}) {
        try {
            // Apply topic-specific filtering
            const filter = this.buildMetadataFilter(options);
            
            // Retrieve relevant documents
            const results = await this.vectorStore.similaritySearchWithScore(
                query,
                5, // Number of results to retrieve
                filter
            );

            // Process and filter results
            const processedResults = await this.processQueryResults(results, options);

            return this.formatResults(processedResults);
        } catch (error) {
            console.error("Error querying vector store:", error);
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
        // Filter results based on relevance threshold
        const filteredResults = results.filter(([doc, score]) => 
            score >= this.relevanceThreshold
        );

        // Sort by relevance and process
        return filteredResults.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            relevanceScore: score,
            concepts: doc.metadata.concepts || []
        }));
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
        try {
            await this.vectorStore.delete();
            console.log("Collection deleted successfully");
        } catch (error) {
            console.error("Error deleting collection:", error);
            throw error;
        }
    }

    async getCollectionStats() {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/collections/${this.collectionName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            return {
                documentCount: data.count || 0,
                lastUpdated: new Date().toISOString(),
                status: "Connected to ChromaDB",
                metadata: data.metadata || {}
            };
        } catch (error) {
            console.error("Error getting collection stats:", error);
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

