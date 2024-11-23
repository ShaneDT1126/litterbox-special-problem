// src/components/rag/documentProcessor.js
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("langchain/document");

class DocumentProcessor {
    constructor() {
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ["\n\n", "\n", ".", "!", "?", ";", ":", " ", ""],
        });
    }

    async processPDF(filePath) {
        try {
            console.log(`Processing PDF: ${filePath}`);

            // Load PDF
            const loader = new PDFLoader(filePath, {
                splitPages: true,
                pdfjs: () => import("pdfjs-dist/legacy/build/pdf.js"),
            });

            // Load PDF content
            const pages = await loader.load();
            console.log(`Loaded ${pages.length} pages from PDF`);

            // Split content into chunks
            const documents = await this.textSplitter.splitDocuments(pages);
            console.log(`Split into ${documents.length} chunks`);

            // Process and clean each chunk
            const processedDocs = documents.map(doc => this.processDocument(doc));

            return processedDocs;
        } catch (error) {
            console.error(`Error processing PDF ${filePath}:`, error);
            throw error;
        }
    }

    processDocument(doc) {
        try {
            // Clean and format the text
            const cleanedText = this.cleanText(doc.pageContent);

            // Create metadata
            const metadata = {
                ...doc.metadata,
                chunk_type: "pdf_chunk",
                processed_date: new Date().toISOString(),
            };

            // Return new document with cleaned text and metadata
            return new Document({
                pageContent: cleanedText,
                metadata: metadata,
            });
        } catch (error) {
            console.error("Error processing document:", error);
            throw error;
        }
    }

    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
            .replace(/[\r\n]+/g, '\n')      // Normalize line breaks
            .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
            .trim();
    }

    extractKeyTerms(text) {
        // Extract important computer architecture terms
        const commonTerms = [
            "CPU", "cache", "memory", "pipeline",
            "instruction set", "architecture",
            "register", "ALU", "control unit",
            // Add more relevant terms
        ];

        const foundTerms = commonTerms.filter(term => 
            text.toLowerCase().includes(term.toLowerCase())
        );

        return foundTerms;
    }
}

module.exports = { DocumentProcessor };
