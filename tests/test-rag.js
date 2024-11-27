const DocumentProcessor = require('../src/components/rag/documentProcessor');
const VectorStore = require('../src/components/rag/vectorStore');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testRAGSystem() {
    try {
        console.log("Starting RAG system test...");

        // Initialize components
        const documentProcessor = new DocumentProcessor();
        const vectorStore = new VectorStore();

        // Test document processing
        console.log("Testing document processing...");
        const processedDocs = await documentProcessor.processDocuments();
        console.log(`Processed ${processedDocs.length} documents`);

        // Initialize vector store
        console.log("Initializing vector store...");
        await vectorStore.initialize();

        // Add documents to vector store
        console.log("Adding documents to vector store...");
        await vectorStore.addDocuments(processedDocs);

        // Test query
        const testQueries = [
            "What is cache memory?",
            "How does pipelining work in CPU?",
            "Explain RISC architecture"
        ];

        for (const query of testQueries) {
            console.log(`\nTesting query: "${query}"`);
            const results = await vectorStore.query(query);
            console.log("Results:", JSON.stringify(results, null, 2));
        }

        console.log("\nRAG system test completed successfully!");
    } catch (error) {
        console.error("Error testing RAG system:", error);
        console.error("Error details:", error.stack);
    }
}

// Run the test
testRAGSystem();
