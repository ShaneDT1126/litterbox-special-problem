const TokenCounter = require("../../utils/tokenCounter");

class ContextSummarizer {
    constructor(maxTokens = 1000) {
        this.maxTokens = maxTokens;
        this.tokenCounter = new TokenCounter();
    }

    summarizeContext(context) {
        let tokenCount = this.tokenCounter.countTokens(context);
        if (tokenCount <= this.maxTokens) {
            return context;
        }

        // Split context into sentences
        const sentences = context.split(/[.!?]+\s/);
        let summarizedContext = '';
        let currentTokens = 0;

        for (const sentence of sentences) {
            const sentenceTokens = this.tokenCounter.countTokens(sentence);
            if (currentTokens + sentenceTokens > this.maxTokens) {
                break;
            }
            summarizedContext += sentence + '. ';
            currentTokens += sentenceTokens;
        }

        return summarizedContext.trim();
    }
}

module.exports = ContextSummarizer;
