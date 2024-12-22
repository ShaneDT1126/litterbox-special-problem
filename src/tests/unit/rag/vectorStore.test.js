const { expect } = require('chai');
const sinon = require('sinon');
const { VectorStore } = require('../../../components/rag/vectorStore');
const { sampleDocuments } = require('../../fixtures/rag/documents');

describe('VectorStore', () => {
    let vectorStore;
    let mockCollection;

    beforeEach(() => {
        // Mock collection methods
        mockCollection = {
            insert: sinon.stub().resolves(true),
            search: sinon.stub().resolves([
                { id: '1', score: 0.9, document: sampleDocuments[0] },
                { id: '2', score: 0.8, document: sampleDocuments[1] }
            ]),
            getStats: sinon.stub().resolves({
                documentCount: 2,
                vectorDimension: 384
            })
        };

        // Initialize VectorStore with mock collection
        vectorStore = new VectorStore();
        vectorStore.collection = mockCollection;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('initialize', () => {
        it('should initialize vector store successfully', async () => {
            const initializeResult = await vectorStore.initialize();
            expect(initializeResult).to.be.true;
            expect(vectorStore.collection).to.exist;
        });

        it('should handle initialization errors', async () => {
            vectorStore.collection = null;
            try {
                await vectorStore.initialize();
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.an('error');
                expect(error.message).to.include('initialization failed');
            }
        });
    });

    describe('addDocuments', () => {
        it('should add documents successfully', async () => {
            const result = await vectorStore.addDocuments(sampleDocuments);
            expect(result).to.be.true;
            expect(mockCollection.insert.calledOnce).to.be.true;
            expect(mockCollection.insert.firstCall.args[0]).to.have.lengthOf(sampleDocuments.length);
        });

        it('should handle empty document array', async () => {
            const result = await vectorStore.addDocuments([]);
            expect(result).to.be.true;
            expect(mockCollection.insert.called).to.be.false;
        });

        it('should handle insertion errors', async () => {
            mockCollection.insert.rejects(new Error('Insert failed'));
            try {
                await vectorStore.addDocuments(sampleDocuments);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.an('error');
                expect(error.message).to.include('Insert failed');
            }
        });
    });

    describe('enhancedQuery', () => {
        it('should perform enhanced query successfully', async () => {
            const query = "What is CPU cache?";
            const results = await vectorStore.enhancedQuery(query);
            
            expect(results).to.be.an('array');
            expect(results).to.have.lengthOf(2);
            expect(mockCollection.search.calledOnce).to.be.true;
            
            results.forEach(result => {
                expect(result).to.have.property('score');
                expect(result).to.have.property('document');
            });
        });

        it('should handle empty query', async () => {
            try {
                await vectorStore.enhancedQuery('');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.an('error');
                expect(error.message).to.include('Invalid query');
            }
        });

        it('should handle search errors', async () => {
            mockCollection.search.rejects(new Error('Search failed'));
            try {
                await vectorStore.enhancedQuery('test query');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.an('error');
                expect(error.message).to.include('Search failed');
            }
        });
    });

    describe('getCollectionStats', () => {
        it('should return collection statistics', async () => {
            const stats = await vectorStore.getCollectionStats();
            expect(stats).to.have.property('documentCount', 2);
            expect(stats).to.have.property('vectorDimension', 384);
            expect(mockCollection.getStats.calledOnce).to.be.true;
        });

        it('should handle stats retrieval errors', async () => {
            mockCollection.getStats.rejects(new Error('Stats retrieval failed'));
            try {
                await vectorStore.getCollectionStats();
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.an('error');
                expect(error.message).to.include('Stats retrieval failed');
            }
        });
    });
});
