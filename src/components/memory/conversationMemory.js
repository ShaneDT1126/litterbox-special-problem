const logger = require('../../utils/logger');
const natural = require('natural');
const Sentiment = require('sentiment');
const TfIdf = natural.TfIdf;

class ConversationMemory {
    constructor(maxTurns = 10) {
        this.conversations = new Map();
        this.maxTurns = maxTurns;
        this.tokenizer = new natural.WordTokenizer();
        this.sentiment = new Sentiment();
        this.stopwords = new Set(natural.stopwords);
    }

    addTurn(sessionId, userQuery, botResponse, metadata = {}) {
        if (!this.conversations.has(sessionId)) {
            this.conversations.set(sessionId, []);
        }

        const conversation = this.conversations.get(sessionId);
        conversation.push({ userQuery, botResponse, metadata, timestamp: Date.now() });

        // Keep only the last maxTurns
        if (conversation.length > this.maxTurns) {
            conversation.shift();
        }

        logger.loggers.conversationMemory.info({
            type: 'turn_added',
            details: { sessionId, turnCount: conversation.length }
        });
    }

    getConversationContext(sessionId, turnCount = this.maxTurns) {
        const conversation = this.conversations.get(sessionId) || [];
        const recentTurns = conversation.slice(-turnCount);

        return recentTurns.map(turn => ({
            userQuery: turn.userQuery,
            botResponse: turn.botResponse,
            metadata: turn.metadata
        }));
    }

    clearConversation(sessionId) {
        this.conversations.delete(sessionId);
        logger.loggers.conversationMemory.info({
            type: 'conversation_cleared',
            details: { sessionId }
        });
    }

    getLastUserQuery(sessionId) {
        const conversation = this.conversations.get(sessionId) || [];
        const lastTurn = conversation[conversation.length - 1];
        return lastTurn ? lastTurn.userQuery : null;
    }

    getLastBotResponse(sessionId) {
        const conversation = this.conversations.get(sessionId) || [];
        const lastTurn = conversation[conversation.length - 1];
        return lastTurn ? lastTurn.botResponse : null;
    }

    getTurnCount(sessionId) {
        const conversation = this.conversations.get(sessionId) || [];
        return conversation.length;
    }

    summarizeConversation(sessionId) {
        const conversation = this.conversations.get(sessionId) || [];
        const summary = {
            turnCount: conversation.length,
            topics: this._extractTopics(conversation),
            sentiment: this._analyzeSentiment(conversation),
            lastInteraction: conversation.length > 0 ? conversation[conversation.length - 1].timestamp : null
        };

        logger.loggers.conversationMemory.info({
            type: 'conversation_summarized',
            details: { sessionId, summary }
        });

        return summary;
    }

    _analyzeSentiment(conversation) {
        const allText = conversation.map(turn => `${turn.userQuery} ${turn.botResponse}`).join(' ');
        const result = this.sentiment.analyze(allText);
        return {
            score: result.score,
            comparative: result.comparative,
            positive: result.positive,
            negative: result.negative
        };
    }

    _extractTopics(conversation) {
        const tfidf = new TfIdf();
        
         // Add each turn to the TF-IDF calculator
         conversation.forEach(turn => {
            const text = `${turn.userQuery} ${turn.botResponse}`;
            tfidf.addDocument(this._preprocessText(text));
        });

        // Get the top 10 terms for the entire conversation
        const topTerms = [];
        tfidf.listTerms(0 /*document index*/).forEach(item => {
            if (topTerms.length < 10 && item.term.length > 1 && !this._isCommonTerm(item.term)) {
                topTerms.push({ term: item.term, tfidf: item.tfidf });
            }
        });

        // Cluster similar terms
        const clusters = this._clusterTerms(topTerms);

        // Select the top term from each cluster
        return clusters.map(cluster => cluster[0].term).slice(0, 5);
    }

    _preprocessText(text) {
        // Tokenize and remove stopwords
        return this.tokenizer.tokenize(text.toLowerCase())
            .filter(token => !this.stopwords.has(token));
    }

    _isCommonTerm(term) {
        const commonTerms = ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
        return commonTerms.includes(term);
    }

    _clusterTerms(terms) {
        const clusters = [];
        terms.forEach(term => {
            let added = false;
            for (let cluster of clusters) {
                if (this._areTermsSimilar(term.term, cluster[0].term)) {
                    cluster.push(term);
                    added = true;
                    break;
                }
            }
            if (!added) {
                clusters.push([term]);
            }
        });
        return clusters;
    }

    _areTermsSimilar(term1, term2) {
        const distance = natural.LevenshteinDistance(term1, term2);
        return distance <= 2; // Adjust this threshold as needed
    }

    provideFeedbackOnTopics(sessionId, topicFeedback) {
        const conversation = this.conversations.get(sessionId);
        if (!conversation) return;

        const lastTurn = conversation[conversation.length - 1];
        if (!lastTurn.metadata.topicFeedback) {
            lastTurn.metadata.topicFeedback = {};
        }

        Object.assign(lastTurn.metadata.topicFeedback, topicFeedback);

        logger.loggers.conversationMemory.info({
            type: 'topic_feedback_added',
            details: { sessionId, topicFeedback }
        });
    }

    
}

module.exports = ConversationMemory;
