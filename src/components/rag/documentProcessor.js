const { PDFLoader } = require("langchain/document_loaders/fs/pdf"); // Changed this line
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("@langchain/core/documents");
const path = require('path');
const fs = require('fs');

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
    }

    async processDocuments() {
        try {
            console.log("Starting document processing...");
            const documents = await this.loadDocuments();
            const processedDocs = await this.processContent(documents);
            return processedDocs;
        } catch (error) {
            console.error("Error in processDocuments:", error);
            throw error;
        }
    }

    async loadDocuments() {
        try {
            const pdfFiles = fs.readdirSync(this.dataFolder)
                .filter(file => file.toLowerCase().endsWith('.pdf'));
    
            if (pdfFiles.length === 0) {
                throw new Error("No PDF files found in the data folder");
            }
    
            let allDocuments = [];
            for (const pdfFile of pdfFiles) {
                const filePath = path.join(this.dataFolder, pdfFile);
                console.log(`Loading PDF: ${pdfFile}`);
                
                const loader = new PDFLoader(filePath, {
                    splitPages: true
                });
    
                const docs = await loader.load();
                allDocuments = allDocuments.concat(docs);
            }
    
            return allDocuments;
        } catch (error) {
            console.error("Error loading documents:", error);
            throw error;
        }
    }
    
    async processContent(documents) {
        try {
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: this.chunkSize,
                chunkOverlap: this.chunkOverlap,
                separators: this.separators
            });

            let processedDocs = [];
            for (const doc of documents) {
                const chunks = await splitter.splitDocuments([doc]);
                
                // Process each chunk
                const enhancedChunks = chunks.map(chunk => {
                    return new Document({
                        pageContent: this.cleanText(chunk.pageContent),
                        metadata: {
                            ...chunk.metadata,
                            concepts: this.extractConcepts(chunk.pageContent),
                            source_type: "textbook",
                            processed_date: new Date().toISOString()
                        }
                    });
                });

                processedDocs = processedDocs.concat(enhancedChunks);
            }

            return processedDocs;
        } catch (error) {
            console.error("Error processing content:", error);
            throw error;
        }
    }

    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
            .replace(/\n+/g, '\n')          // Replace multiple newlines with single newline
            .replace(/[^\w\s\n.,;:?!-()]/g, '') // Remove special characters except basic punctuation
            .trim();
    }

    extractConcepts(text) {
        // Computer architecture specific concepts to identify
        const concepts = [
            "CPU", "ALU", "Control Unit", "Cache", "Memory",
            "Pipeline", "Instruction Set", "Register", "Bus",
            "Architecture", "Processor", "I/O", "Addressing",
            "RISC", "CISC", "Virtual Memory", "Cache Coherence"
        ];

        const foundConcepts = concepts.filter(concept => 
            text.toLowerCase().includes(concept.toLowerCase())
        );

        return [...new Set(foundConcepts)]; // Remove duplicates
    }

    async validateDocument(doc) {
        // Validate document structure and content
        if (!doc.pageContent || typeof doc.pageContent !== 'string') {
            throw new Error('Invalid document content');
        }

        if (!doc.metadata || typeof doc.metadata !== 'object') {
            throw new Error('Invalid document metadata');
        }

        // Check for computer architecture relevance
        const concepts = this.extractConcepts(doc.pageContent);
        if (concepts.length === 0) {
            console.warn('Document may not be relevant to computer architecture');
        }

        return {
            isValid: true,
            concepts: concepts,
            warnings: concepts.length === 0 ? ['Low relevance to computer architecture'] : []
        };
    }
}

module.exports = DocumentProcessor;
