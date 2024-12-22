const natural = require('natural');
const logger = require('../../utils/logger');
const TfIdf = natural.TfIdf;

class ProgressiveReduction {
    constructor() {
        this.reductionLevels = ['none', 'low', 'medium', 'high'];
        this.tokenizer = new natural.WordTokenizer();
    }

    determineReductionLevel(sessionId, feedback) {
        const { positiveCount, negativeCount } = feedback;
        const totalFeedback = positiveCount + negativeCount;
        const positiveRatio = totalFeedback > 0 ? positiveCount / totalFeedback : 0;

        let reductionLevel;
        if (totalFeedback < 5) {
            reductionLevel = 'none';
        } else if (positiveRatio > 0.8) {
            reductionLevel = 'high';
        } else if (positiveRatio > 0.6) {
            reductionLevel = 'medium';
        } else {
            reductionLevel = 'low';
        }

        logger.loggers.scaffolding.info({
            type: 'reduction_level_determined',
            details: { sessionId, feedback, reductionLevel }
        });

        return reductionLevel;
    }

    applyReduction(content, reductionLevel) {
        switch (reductionLevel) {
            case 'high':
                return this._highReduction(content);
            case 'medium':
                return this._mediumReduction(content);
            case 'low':
                return this._lowReduction(content);
            default:
                return content;
        }
    }

    _highReduction(content) {
        const sentences = this._splitIntoSentences(content);
        const importantSentences = this._getImportantSentences(sentences, 0.3);
        return this._reconstructContent(importantSentences);
    }

    _mediumReduction(content) {
        const sentences = this._splitIntoSentences(content);
        const importantSentences = this._getImportantSentences(sentences, 0.6);
        return this._reconstructContent(importantSentences);
    }

    _lowReduction(content) {
        const sentences = this._splitIntoSentences(content);
        const importantSentences = this._getImportantSentences(sentences, 0.8);
        return this._reconstructContent(importantSentences);
    }

    _getImportantSentences(sentences, percentage) {
        const tfidf = new TfIdf();

        // Add each sentence to the TF-IDF model
        sentences.forEach(sentence => tfidf.addDocument(sentence));

        // Calculate importance scores for each sentence
        const sentenceScores = sentences.map((sentence, index) => {
            const words = this.tokenizer.tokenize(sentence);
            const score = words.reduce((sum, word) => sum + tfidf.tfidf(word, index), 0);
            return { sentence, score, index };
        });

        // Sort sentences by importance score
        sentenceScores.sort((a, b) => b.score - a.score);

        // Select top percentage of sentences
        const numSentences = Math.ceil(sentences.length * percentage);
        return sentenceScores.slice(0, numSentences);
    }

    _reconstructContent(importantSentences) {
        // Sort sentences back to their original order
        importantSentences.sort((a, b) => a.index - b.index);

        return importantSentences.map(item => item.sentence).join(' ');
    }

    _splitIntoSentences(content) {
        return content.match(/[^\.!\?]+[\.!\?]+/g) || [];
    }

    _selectSentences(sentences, percentage) {
        const numSentences = Math.max(1, Math.ceil(sentences.length * percentage));
        return sentences.slice(0, numSentences).join(' ');
    }
}

module.exports = ProgressiveReduction;
