const { PDFLoader } = require("langchain/document_loaders/fs/pdf"); // Changed this line
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("@langchain/core/documents");
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../../utils/logger');

class DocumentProcessor {
    constructor() {
        this.chunkSize = 1000;
        this.chunkOverlap = 200;
        this.dataFolder = path.join(__dirname, '../../data/computer_organization_architecture');
        
        // Track processed files
        this.processedFiles = new Map(); // filename -> hash
        this.processingLock = false;

        // Define computer architecture specific separators
        this.separators = [
            "\n\n",    // New paragraphs
            "\n### ",  // Section headers
            "\n## ",   // Chapter headers
            ". ",      // Sentences
            ";\n",     // List items
            ":\n"      // Definitions
        ];

        // Log initialization
        logger.loggers.documentProcessor.info({
            type: 'initialization',
            details: {
                chunkSize: this.chunkSize,
                chunkOverlap: this.chunkOverlap,
                dataFolder: this.dataFolder,
                separatorsCount: this.separators.length
            }
        });

        const files = fs.readdirSync(this.dataFolder);
        logger.loggers.documentProcessor.info({
            type: 'files_found',
            details: {
                dataFolder: this.dataFolder,
                files: files
            }
        });
    }

    async processDocuments() {
        if (this.processingLock) {
            logger.loggers.documentProcessor.warn({
                type: 'processing_locked',
                message: 'Document processing already in progress'
            });
            return null;
        }

        this.processingLock = true;
        const startTime = Date.now();

        try {
            // Get list of PDF files and their hashes
            const pdfFiles = await this._getPDFFilesWithHashes();
            
            // Filter only new or modified files
            const filesToProcess = pdfFiles.filter(file => {
                const currentHash = file.hash;
                const storedHash = this.processedFiles.get(file.name);
                return !storedHash || storedHash !== currentHash;
            });

            if (filesToProcess.length === 0) {
                logger.loggers.documentProcessor.info({
                    type: 'no_new_documents',
                    message: 'No new or modified documents to process'
                });
                return null;
            }

            logger.loggers.documentProcessor.info({
                type: 'processing_new_documents',
                details: {
                    newFileCount: filesToProcess.length,
                    files: filesToProcess.map(f => f.name)
                }
            });

            // Process new documents
            const documents = await this._loadDocuments(filesToProcess);
            const processedDocs = await this.processContent(documents);

            // Update processed files tracking
            filesToProcess.forEach(file => {
                this.processedFiles.set(file.name, file.hash);
            });

            return processedDocs;

        } catch (error) {
            logger.loggers.documentProcessor.error({
                type: 'process_error',
                details: { error: error.message }
            });
            throw error;
        } finally {
            this.processingLock = false;
        }
    }

    async _getPDFFilesWithHashes() {
        const files = fs.readdirSync(this.dataFolder)
            .filter(file => file.toLowerCase().endsWith('.pdf'))
            .map(filename => {
                const filePath = path.join(this.dataFolder, filename);
                const fileContent = fs.readFileSync(filePath);
                const hash = crypto.createHash('md5').update(fileContent).digest('hex');
                
                return {
                    name: filename,
                    path: filePath,
                    hash
                };
            });

        return files;
    }

    async _loadDocuments(files) {
        const documents = [];
        for (const file of files) {
            try {
                const loader = new PDFLoader(file.path, {
                    splitPages: true
                });
                
                const docs = await loader.load();
                
                // Add file metadata to documents
                const enhancedDocs = docs.map(doc => ({
                    ...doc,
                    metadata: {
                        ...doc.metadata,
                        fileHash: file.hash,
                        fileName: file.name,
                        processedDate: new Date().toISOString()
                    }
                }));

                documents.push(...enhancedDocs);

                logger.loggers.documentProcessor.info({
                    type: 'file_loaded',
                    details: {
                        fileName: file.name,
                        pageCount: docs.length
                    }
                });
            } catch (error) {
                logger.loggers.documentProcessor.error({
                    type: 'file_load_error',
                    details: {
                        fileName: file.name,
                        error: error.message
                    }
                });
            }
        }
        return documents;
    }
  
    async processContent(documents) {
        const startTime = Date.now();
        try {
            logger.loggers.documentProcessor.info({
                type: 'content_processing_start',
                details: {
                    documentCount: documents.length
                }
            });

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: this.chunkSize,
                chunkOverlap: this.chunkOverlap,
                separators: this.separators
            });

            let processedDocs = [];
            let chunkCount = 0;

            for (const doc of documents) {
                const docStartTime = Date.now();
                const chunks = await splitter.splitDocuments([doc]);
                
                const enhancedChunks = chunks.map(chunk => {
                    const concepts = this.extractConcepts(chunk.pageContent);
                    chunkCount++;

                    return new Document({
                        pageContent: this.cleanText(chunk.pageContent),
                        metadata: {
                            ...chunk.metadata,
                            concepts: concepts,
                            source_type: "textbook",
                            processed_date: new Date().toISOString()
                        }
                    });
                });

                processedDocs = processedDocs.concat(enhancedChunks);

                logger.loggers.documentProcessor.info({
                    type: 'document_chunks_processed',
                    details: {
                        originalLength: doc.pageContent.length,
                        chunks: enhancedChunks.length,
                        processingTime: Date.now() - docStartTime,
                        conceptsFound: enhancedChunks.reduce((acc, chunk) => 
                            acc + chunk.metadata.concepts.length, 0)
                    }
                });
            }

            logger.loggers.documentProcessor.info({
                type: 'content_processing_complete',
                details: {
                    inputDocuments: documents.length,
                    totalChunks: chunkCount,
                    outputDocuments: processedDocs.length,
                    processingTime: Date.now() - startTime,
                    averageChunksPerDocument: chunkCount / documents.length
                }
            });

            return processedDocs;
        } catch (error) {
            logger.loggers.documentProcessor.error({
                type: 'content_processing_error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }


    cleanText(text) {
        const startTime = Date.now();
        try {
            const originalLength = text.length;
            const cleanedText = text
                .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
                .replace(/\n+/g, '\n')          // Replace multiple newlines with single newline
                .replace(/[^\w\s\n.,;:?!-()]/g, '') // Remove special characters except basic punctuation
                .trim();

            logger.loggers.documentProcessor.info({
                type: 'text_cleaning',
                details: {
                    originalLength,
                    cleanedLength: cleanedText.length,
                    reductionPercentage: ((originalLength - cleanedText.length) / originalLength * 100).toFixed(2),
                    processingTime: Date.now() - startTime
                }
            });

            return cleanedText;
        } catch (error) {
            logger.loggers.documentProcessor.error({
                type: 'text_cleaning_error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    extractConcepts(text) {
        const startTime = Date.now();
        try {
            const concepts = [
                "CPU", "ALU", "Control Unit", "Cache", "Memory",
                "Pipeline", "Instruction Set", "Register", "Bus",
                "Architecture", "Processor", "I/O", "Addressing",
                "RISC", "CISC", "Virtual Memory", "Cache Coherence"
            ];

            const foundConcepts = concepts.filter(concept => 
                text.toLowerCase().includes(concept.toLowerCase())
            );

            const uniqueConcepts = [...new Set(foundConcepts)];

            logger.loggers.documentProcessor.info({
                type: 'concept_extraction',
                details: {
                    textLength: text.length,
                    conceptsFound: uniqueConcepts.length,
                    concepts: uniqueConcepts,
                    processingTime: Date.now() - startTime
                }
            });

            return uniqueConcepts;
        } catch (error) {
            logger.loggers.documentProcessor.error({
                type: 'concept_extraction_error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            return [];
        }
    }

    async validateDocument(doc) {
        const startTime = Date.now();
        try {
            logger.loggers.documentProcessor.info({
                type: 'validation_start',
                details: {
                    documentId: doc.metadata?.id || 'unknown'
                }
            });

            const structureValidation = {
                hasContent: Boolean(doc.pageContent),
                contentIsString: typeof doc.pageContent === 'string',
                hasMetadata: Boolean(doc.metadata),
                metadataIsObject: typeof doc.metadata === 'object'
            };

            const concepts = this.extractConcepts(doc.pageContent);
            const isRelevant = concepts.length > 0;

            const validationResult = {
                isValid: structureValidation.hasContent && 
                        structureValidation.contentIsString && 
                        structureValidation.hasMetadata && 
                        structureValidation.metadataIsObject,
                concepts: concepts,
                warnings: []
            };

            if (!isRelevant) {
                validationResult.warnings.push('Low relevance to computer architecture');
            }

            if (doc.pageContent.length < 50) {
                validationResult.warnings.push('Document content might be too short');
            }

            logger.loggers.documentProcessor.info({
                type: 'validation_complete',
                details: {
                    documentId: doc.metadata?.id || 'unknown',
                    validationResult: {
                        ...validationResult,
                        structureValidation,
                        contentLength: doc.pageContent.length,
                        conceptCount: concepts.length
                    },
                    processingTime: Date.now() - startTime
                }
            });

            return validationResult;
        } catch (error) {
            logger.loggers.documentProcessor.error({
                type: 'validation_error',
                details: {
                    documentId: doc.metadata?.id || 'unknown',
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }
}

module.exports = DocumentProcessor;
