import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

class DocumentProcessor {
    constructor() {
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
    }

    async processPDF(filePath) {
        try {
            // Load PDF
            const loader = new PDFLoader(filePath);
            const rawDocs = await loader.load();

            // Split text into chunks
            const splitDocs = await this.textSplitter.splitDocuments(rawDocs);

            return splitDocs;
        } catch (error) {
            console.error("Error processing PDF:", error);
            throw error;
        }
    }
}
