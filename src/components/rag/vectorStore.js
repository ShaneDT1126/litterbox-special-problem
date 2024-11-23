// src/components/rag/vectorStore.js
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { Chroma } = require("langchain/vectorstores/chroma");
const { Document } = require("langchain/document");

class VectorStore {
    constructor() {
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        this.vectorStore = null;
        this.collectionName = "computer_architecture";
    }

    async initialize() {
        try {
            console.log("Initializing vector store...");
            
            // Initialize Chroma vector store
            this.vectorStore = await Chroma.fromDocuments(
                [], // Start with empty documents
                this.embeddings,
                {
                    collectionName: this.collectionName,
                    url: "http://localhost:8000", // Default Chroma URL
                }
            );

            console.log("Vector store initialized successfully");
        } catch (error) {
            console.error("Error initializing vector store:", error);
            throw error;
        }
    }

    async addDocuments(documents) {
        try {
            if (!this.vectorStore) {
                throw new Error("Vector store not initialized");
            }

            console.log(`Adding ${documents.length} documents to vector store`);

            // Process documents in batches to avoid memory issues
            const batchSize = 5;
            for (let i = 0; i < documents.length; i += batchSize) {
                const batch = documents.slice(i, i + batchSize);
                await this.vectorStore.addDocuments(batch);
                console.log(`Processed batch ${i/batchSize + 1}`);
            }

            console.log("Documents added successfully");
        } catch (error) {
            console.error("Error adding documents:", error);
            throw error;
        }
    }

    async query(query, k = 3) {
        try {
            if (!this.vectorStore) {
                throw new Error("Vector store not initialized");
            }

            console.log(`Querying vector store with: ${query}`);

            // Perform similarity search
            const results = await this.vectorStore.similaritySearch(query, k);

            // Process and format results
            const formattedResults = this.formatResults(results);

            return formattedResults;
        } catch (error) {
            console.error("Error querying vector store:", error);
            throw error;
        }
    }

    formatResults(results) {
        try {
            // Combine and format the retrieved documents
            const formattedText = results
                .map(doc => {
                    return `
                        ${doc.pageContent}
                        ${this.formatMetadata(doc.metadata)}
                    `.trim();
                })
                .join('\n\n');

            return formattedText;
        } catch (error) {
            console.error("Error formatting results:", error);
            throw error;
        }
    }

    formatMetadata(metadata) {
        // Format metadata for context
        const relevantMetadata = {
            page: metadata.page || 'Unknown',
            chunk_type: metadata.chunk_type || 'Unknown',
        };

        return Object.entries(relevantMetadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ');
    }

    async deleteCollection() {
        try {
            if (this.vectorStore) {
                await this.vectorStore.delete();
                console.log("Collection deleted successfully");
            }
        } catch (error) {
            console.error("Error deleting collection:", error);
            throw error;
        }
    }
}

module.exports = { VectorStore };
