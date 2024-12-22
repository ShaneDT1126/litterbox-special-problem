const { expect } = require('chai');
const DocumentProcessor = require('../../../components/rag/documentProcessor');
const { VectorStore } = require('../../../components/rag/vectorStore');
const { sampleDocuments } = require('../../fixtures/rag/documents');

describe('RAG System Integration', () => {
    let documentProcessor;
    let vectorStore;

    before(async () => {
        documentProcessor = new DocumentProcessor();
        vectorStore = new VectorStore();
        await vectorStore.initialize();
    });

    describe('End-to-end document processing and retrieval', () => {
        it('should process and retrieve documents successfully', async () => {
            // Process documents
            const processedDocs = await documentProcessor.processDocuments(sampleDocuments);
            expect(processedDocs).to.be.an('array');
            expect(processedDocs).to.have.lengthOf(sampleDocuments.length);

            // Add to vector store
            const addResult = await vectorStore.addDocuments(processedDocs);
            expect(addResult).to.be.true;

            // Query documents
            const query = "What is CPU cache?";
            const results = await vectorStore.enhancedQuery(query);
            
            expect(results).to.be.an('array');
            expect(results.length).to.be.greaterThan(0);
            
            // Verify result relevance
            const topResult = results[0];
            expect(topResult.document.title).to.include('CPU');
            expect(topResult.score).to.be.greaterThan(0.5);
        });
    });
});
