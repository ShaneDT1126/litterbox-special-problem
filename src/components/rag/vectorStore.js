import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

class VectorStore {
    constructor() {
        this.embeddings = new OpenAIEmbeddings();
        this.vectorStore = null;
    }

    async initialize() {
        this.vectorStore = await Chroma.fromDocuments(
            [], 
            this.embeddings,
            { collectionName: "computer_architecture" }
        );
    }

    async addDocuments(pdfPaths) {
        try {
            const documentProcessor = new DocumentProcessor();
            
            for (const pdfPath of pdfPaths) {
                // Process each PDF
                const documents = await documentProcessor.processPDF(pdfPath);
                
                // Add to vector store
                await this.vectorStore.addDocuments(documents);
            }

            console.log("Documents added successfully");
        } catch (error) {
            console.error("Error adding documents:", error);
            throw error;
        }
    }

    async query(query, k = 3) {
        try {
            const results = await this.vectorStore.similaritySearch(query, k);
            return results.map(doc => doc.pageContent).join("\n");
        } catch (error) {
            console.error("Error querying vector store:", error);
            throw error;
        }
    }
}
