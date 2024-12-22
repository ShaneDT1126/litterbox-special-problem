// src/tests/unit/rag/documentProcessor.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const DocumentProcessor = require('../../../components/rag/documentProcessor');
const { sampleDocuments } = require('../../fixtures/rag/documents');

describe('DocumentProcessor', () => {
    let documentProcessor;

    beforeEach(() => {
        documentProcessor = new DocumentProcessor();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('processDocuments', () => {
        it('should process documents correctly', async () => {
            // Test document processing
            const processedDocs = await documentProcessor.processDocuments(sampleDocuments);
            
            expect(processedDocs).to.be.an('array');
            expect(processedDocs).to.have.lengthOf(sampleDocuments.length);
            
            processedDocs.forEach((doc, index) => {
                expect(doc).to.have.property('title');
                expect(doc).to.have.property('content');
                expect(doc).to.have.property('metadata');
                expect(doc).to.have.property('embeddings');
            });
        });

        it('should handle empty document list', async () => {
            const processedDocs = await documentProcessor.processDocuments([]);
            expect(processedDocs).to.be.an('array');
            expect(processedDocs).to.have.lengthOf(0);
        });

        it('should handle invalid documents', async () => {
            const invalidDocs = [{ invalid: 'document' }];
            
            try {
                await documentProcessor.processDocuments(invalidDocs);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.an('error');
                expect(error.message).to.include('Invalid document format');
            }
        });
    });
});
