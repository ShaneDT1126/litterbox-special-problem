const { VectorStore } = require('./vectorStore');
const DocumentProcessor = require('./documentProcessor');
const { MultiQueryRetriever } = require('./multiQueryRetriever');
const logger = require('../../utils/logger');
const path = require('path');
const { EventEmitter } = require('events');
const fs = require('fs');

class DocumentManager extends EventEmitter {
    constructor() {
        super();
        this.documentProcessor = new DocumentProcessor();
        this.vectorStore = new VectorStore();
        this.isProcessing = false;
        this.lastProcessed = null;
        this.processedFiles = new Map();
        
        // Path for storing processing status
        this.statusFilePath = path.join(__dirname, '../../data/processing_status.json');
        
        // Initialize processing status
        this.processingStatus = this._loadProcessingStatus();

        // Ensure data directory exists
        const dataDir = path.dirname(this.statusFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    async initialize() {
        try {
            logger.loggers.documentManager.info({
                type: 'initialization',
                details: {
                    status: 'starting',
                    timestamp: new Date().toISOString()
                }
            });

            // Initialize vector store
            this.vectorStore = new VectorStore();
            await this.vectorStore.initialize();

            // Load previous processing status
            await this._syncProcessingStatus();

            // Initialize MultiQueryRetriever with vectorStore
            this.multiQueryRetriever = new MultiQueryRetriever(this.vectorStore);

            // Add event listener for feedback
            this.on('feedback', async (sessionId, feedback) => {
                await this.refreshVectorStore(sessionId, feedback);
            });

            logger.loggers.documentManager.info({
                type: 'initialization',
                details: {
                    status: 'complete',
                    timestamp: new Date().toISOString()
                }
            });

            await this.processDocuments(false);

            return {
                status: 'success',
                vectorStore: this.vectorStore,
                multiQueryRetriever: this.multiQueryRetriever
            };

        } catch (error) {
            logger.loggers.documentManager.error({
                type: 'initialization_error',
                details: { error: error.message }
            });

            throw new Error(`DocumentManager initialization failed: ${error.message}`);
        }
    }

    async processDocuments(force = false) {
        logger.loggers.documentManager.info({
            type: 'process_documents_start',
            details: {
                force,
                lastProcessed: this.processingStatus.lastProcessed,
                isProcessing: this.isProcessing
            }
        });
    
        // Get current document count
        const stats = await this.vectorStore.getCollectionStats();
        const isEmpty = stats.documentCount === 0;
    
        // Force processing if store is empty
        if (isEmpty) {
            force = true;
            logger.loggers.documentManager.info({
                type: 'process_documents_force',
                details: {
                    reason: 'Vector store is empty',
                    documentCount: stats.documentCount
                }
            });
        }
    
        if (!force && this.processingStatus.lastProcessed) {
            const lastProcessedTime = new Date(this.processingStatus.lastProcessed).getTime();
            const currentTime = new Date().getTime();
            const timeDifference = currentTime - lastProcessedTime;
            
            if (timeDifference < 24 * 60 * 60 * 1000) {
                logger.loggers.documentManager.info({
                    type: 'process_documents',
                    details: {
                        status: 'skipped',
                        message: 'Documents were recently processed',
                        lastProcessed: this.processingStatus.lastProcessed
                    }
                });
                return;
            }
        }
    
        // Process documents
        const documents = await this.documentProcessor.processDocuments();

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
        
        // Store in ChromaDB
        await this.vectorStore.addDocuments(classifiedDocuments);
    
        // Update processing status
        this.processingStatus.lastProcessed = new Date().toISOString();
        this.processingStatus.documentCount = (await this.vectorStore.getCollectionStats()).documentCount;
        await this._saveProcessingStatus();
    
        logger.loggers.documentManager.info({
            type: 'process_documents_complete',
            details: {
                documentsProcessed: documents.length,
                totalDocuments: this.processingStatus.documentCount,
                lastProcessed: this.processingStatus.lastProcessed
            }
        });
    }    
    
    async processNewDocuments() {
        if (this.isProcessing) {
            logger.loggers.documentManager.warn({
                type: 'process_documents',
                details: {
                    status: 'skipped',
                    message: 'Document processing already in progress'
                }
            });
            return;
        }

        this.isProcessing = true;

        try {
            // Check if documents were recently processed
            const lastProcessed = this.processingStatus.lastProcessed;
            const now = new Date().getTime();
            const timeSinceLastProcess = lastProcessed ? 
                now - new Date(lastProcessed).getTime() : 
                Number.MAX_SAFE_INTEGER;

            // If processed within last 5 minutes, skip
            if (timeSinceLastProcess < 300000) { // 5 minutes in milliseconds
                logger.loggers.documentManager.info({
                    type: 'process_documents',
                    details: {
                        status: 'skipped',
                        message: 'Documents were recently processed',
                        lastProcessed
                    }
                });
                return;
            }

            logger.loggers.documentManager.info({
                type: 'process_documents',
                details: {
                    status: 'starting',
                    timestamp: new Date().toISOString()
                }
            });

            // Process documents using document processor
            const processedDocs = await this.documentProcessor.processDocuments();

            if (!processedDocs || processedDocs.length === 0) {
                logger.loggers.documentManager.info({
                    type: 'process_documents',
                    details: {
                        status: 'complete',
                        message: 'No new documents to process'
                    }
                });
                return;
            }

            // Add documents to vector store
            await this.vectorStore.addDocuments(processedDocs);

            // Update processing status
            this.processingStatus.documentCount += processedDocs.length;
            this.processingStatus.lastProcessed = new Date().toISOString();
            await this._saveProcessingStatus();

            logger.loggers.documentManager.info({
                type: 'process_documents',
                details: {
                    status: 'complete',
                    documentsProcessed: processedDocs.length,
                    totalDocuments: this.processingStatus.documentCount
                }
            });

            return processedDocs;
        } catch (error) {
            logger.loggers.documentManager.error({
                type: 'process_documents_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }


    async _syncProcessingStatus() {
        try {
            const stats = await this.vectorStore.getCollectionStats();
            
            this.processingStatus.documentCount = stats.documentCount || 0;
            this.processingStatus.lastProcessed = new Date().toISOString();

            await this._saveProcessingStatus();

            logger.logOperation('documentManager', 'sync_status', {
                documentCount: this.processingStatus.documentCount,
                lastProcessed: this.processingStatus.lastProcessed
            });

        } catch (error) {
            logger.logError('documentManager', error);
        }
    }

    _loadProcessingStatus() {
        try {
            if (fs.existsSync(this.statusFilePath)) {
                const status = JSON.parse(fs.readFileSync(this.statusFilePath, 'utf8'));
                logger.loggers.documentManager.info({
                    type: 'load_status',
                    details: {
                        status: status
                    }
                });
                return status;
            }
            return {
                lastProcessed: null,
                processedFiles: {},
                documentCount: 0
            };
        } catch (error) {
            logger.logError('documentManager', error);
            return {
                lastProcessed: null,
                processedFiles: {},
                documentCount: 0
            };
        }
    }

    async _saveProcessingStatus() {
        try {
            fs.writeFileSync(
                this.statusFilePath,
                JSON.stringify(this.processingStatus, null, 2)
            );
            
            logger.logOperation('documentManager', 'save_status', {
                status: 'success',
                documentCount: this.processingStatus.documentCount
            });
        } catch (error) {
            logger.logError('documentManager', error);
        }
    }

    async getProcessingStatus() {
        return {
            ...this.processingStatus,
            vectorStoreStats: await this.vectorStore.getCollectionStats()
        };
    }

    getVectorStore() {
        if (!this.vectorStore) {
            throw new Error('VectorStore not initialized');
        }
        return this.vectorStore;
    }

    getMultiQueryRetriever() {
        if (!this.multiQueryRetriever) {
            throw new Error('MultiQueryRetriever not initialized');
        }
        return this.multiQueryRetriever;
    }
    
    async refreshVectorStore(sessionId, feedback) {
        const recentQueries = this.conversationMemory.getRecentQueries(sessionId, 5); // Get last 5 queries
        const relevantDocuments = await this.multiQueryRetriever.retrieveDocuments(
            recentQueries.join(' '),
            { name: 'general' }, // Assuming a general route
            [],
            []
        );
    
        // Re-embed relevant documents with feedback
        const updatedDocuments = relevantDocuments.map(doc => ({
            ...doc,
            metadata: {
                ...doc.metadata,
                relevance: feedback.isPositive ? 'high' : 'low'
            }
        }));
    
        await this.vectorStore.updateDocuments(updatedDocuments);
    
        logger.loggers.documentManager.info({
            type: 'vector_store_refreshed',
            details: {
                sessionId,
                updatedDocumentsCount: updatedDocuments.length
            }
        });
    }

}

module.exports = DocumentManager;
