const { PDFLoader } = require("langchain/document_loaders/fs/pdf"); // Changed this line
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("@langchain/core/documents");
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

class DocumentProcessor {
    constructor() {
        this.chunkSize = 1000;
        this.chunkOverlap = 200;
        this.dataFolder = path.join(__dirname, '../../data/computer_organization_architecture');
        
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
    }

    async processDocuments() {
        const startTime = Date.now();
        try {
            logger.loggers.documentProcessor.info({
                type: 'process_start',
                details: {
                    operation: 'document_processing'
                }
            });

            const documents = await this.loadDocuments();
            const processedDocs = await this.processContent(documents);

            logger.loggers.documentProcessor.info({
                type: 'process_complete',
                details: {
                    inputDocuments: documents.length,
                    outputDocuments: processedDocs.length,
                    processingTime: Date.now() - startTime
                }
            });

            return processedDocs;
        } catch (error) {
            logger.loggers.documentProcessor.error({
                type: 'process_error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    async loadDocuments() {
        const startTime = Date.now();
        try {
            const pdfFiles = fs.readdirSync(this.dataFolder)
                .filter(file => file.toLowerCase().endsWith('.pdf'));

            if (pdfFiles.length === 0) {
                logger.loggers.documentProcessor.warn({
                    type: 'load_warning',
                    details: {
                        message: 'No PDF files found in the data folder',
                        folder: this.dataFolder
                    }
                });
                throw new Error("No PDF files found in the data folder");
            }

            logger.loggers.documentProcessor.info({
                type: 'load_start',
                details: {
                    fileCount: pdfFiles.length,
                    files: pdfFiles
                }
            });

            let allDocuments = [];
            for (const pdfFile of pdfFiles) {
                const fileStartTime = Date.now();
                const filePath = path.join(this.dataFolder, pdfFile);
                
                try {
                    const loader = new PDFLoader(filePath, {
                        splitPages: true
                    });

                    const docs = await loader.load();
                    allDocuments = allDocuments.concat(docs);

                    logger.loggers.documentProcessor.info({
                        type: 'file_processed',
                        details: {
                            file: pdfFile,
                            pageCount: docs.length,
                            processingTime: Date.now() - fileStartTime
                        }
                    });
                } catch (fileError) {
                    logger.loggers.documentProcessor.error({
                        type: 'file_processing_error',
                        details: {
                            file: pdfFile,
                            message: fileError.message,
                            stack: fileError.stack
                        }
                    });
                }
            }

            logger.loggers.documentProcessor.info({
                type: 'load_complete',
                details: {
                    totalFiles: pdfFiles.length,
                    totalDocuments: allDocuments.length,
                    processingTime: Date.now() - startTime
                }
            });

            return allDocuments;
        } catch (error) {
            logger.loggers.documentProcessor.error({
                type: 'load_error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
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
