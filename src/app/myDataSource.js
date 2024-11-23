const path = require("path");
const fs = require("fs");
const { Application } = require("@microsoft/teams-ai");
/**
 * A data source that searches through a local directory of files for a given query.
 */
class MyDataSource {
    /**
     * Creates a new instance of the MyDataSource instance.
     */
    constructor(name) {
        this.name = name;
        this.vectorStore = null;
    }

    /**
     * Initializes the data source.
     */
    // init() {
    //     const filePath = path.join(__dirname, "../data");
    //     const files = fs.readdirSync(filePath);
    //     this._data = files.map(file => {
    //         return fs.readFileSync(path.join(filePath, file), "utf-8");
    //     });
    // }

    async init() {
        try {
            // Initialize vector store
            const { VectorStore } = require("../components/rag/vectorStore");
            this.vectorStore = new VectorStore();
            await this.vectorStore.initialize();
            console.log("MyDataSource initialized successfully");
        } catch (error) {
            console.error("Error initializing MyDataSource:", error);
        }
    }

    /**
     * Renders the data source as a string of text.
     */
    // async renderData(context, memory, tokenizer, maxTokens) {
    //     const query = memory.getValue("temp.input");
    //     if(!query) {
    //         return { output: "", length: 0, tooLong: false };
    //     }
    //     for (let data of this._data) {
    //         if (data.includes(query)) {
    //             return { output: this.formatDocument(data), length: data.length, tooLong: false };
    //         }
    //     }
    //     if (query.toLocaleLowerCase().includes("perksplus")) {
    //         return { output: this.formatDocument(this._data[0]), length: this._data[0].length, tooLong: false };
    //     } else if (query.toLocaleLowerCase().includes("company") || query.toLocaleLowerCase().includes("history")) {
    //         return { output: this.formatDocument(this._data[1]), length: this._data[1].length, tooLong: false };
    //     } else if (query.toLocaleLowerCase().includes("northwind") || query.toLocaleLowerCase().includes("health")) {
    //         return { output: this.formatDocument(this._data[2]), length: this._data[2].length, tooLong: false };
    //     }
    //     return { output: "", length: 0, tooLong: false };
    // }

    async renderData(context, memory, tokenizer, maxTokens) {
        try {
            const query = memory.getValue('temp.input');
            if (!query) {
                return {
                    output: "",
                    length: 0,
                    tooLong: false
                };
            }

            // Get relevant content from vector store
            const relevantContent = await this.vectorStore.query(query);
            
            // Format the content for Socratic teaching
            const formattedContent = `
                Relevant concepts to discuss:
                ${relevantContent}

                Guide the student through:
                1. Understanding the basic concepts
                2. Making connections to prior knowledge
                3. Discovering relationships between components
                4. Applying concepts to real-world scenarios
            `;

            return {
                output: formattedContent,
                length: tokenizer.encode(formattedContent).length,
                tooLong: false
            };
        } catch (error) {
            console.error("Error in renderData:", error);
            return {
                output: "I apologize, but I'm having trouble accessing the relevant information.",
                length: 0,
                tooLong: false
            };
        }
    }

    /**
     * Formats the result string 
     */
    // formatDocument(result) {
    //     return `<context>${result}</context>`;
    // }


}

module.exports = {
  MyDataSource,
};