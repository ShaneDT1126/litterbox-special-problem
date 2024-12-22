const { OpenAIEmbeddings } = require("@langchain/openai");
const cosineSimilarity = require('compute-cosine-similarity');

class Route {
    constructor(name, utterances, action, scoreThreshold = 0.65) {
        this.name = name;
        this.utterances = utterances;
        this.action = action;
        this.scoreThreshold = scoreThreshold;
    }

    async execute(query) {
        if (this.action) {
            return await this.action(query);
        }
        return `Executing default action for route: ${this.name}`;
    }
}

class SemanticRouter {
    constructor(routes, embeddingModel) {
        this.routes = routes;
        this.embeddingModel = embeddingModel || new OpenAIEmbeddings({
            openAIApiKey: process.env.SECRET_OPENAI_API_KEY,
        });
        this.routeEmbeddings = null;
    }

    async initialize() {
        const allUtterances = this.routes.flatMap(route => route.utterances);
        this.routeEmbeddings = await this.embeddingModel.embedDocuments(allUtterances);
    }

    async route(query) {
        if (!this.routeEmbeddings) {
            await this.initialize();
        }

        const queryEmbedding = await this.embeddingModel.embedQuery(query);
        let bestMatchIndex = -1;
        let bestMatchScore = -Infinity;

        this.routeEmbeddings.forEach((embedding, index) => {
            const similarityScore = cosineSimilarity(queryEmbedding, embedding);
            if (similarityScore > bestMatchScore) {
                bestMatchScore = similarityScore;
                bestMatchIndex = index;
            }
        });

        let currentIndex = 0;
        for (const route of this.routes) {
            if (bestMatchIndex < currentIndex + route.utterances.length) {
                if (bestMatchScore >= route.scoreThreshold) {
                    return route;
                }
                break;
            }
            currentIndex += route.utterances.length;
        }

        return null; // No matching route found
    }
}

module.exports = { SemanticRouter, Route };
