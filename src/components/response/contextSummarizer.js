const OpenAI = require("openai");
const logger = require("../../utils/logger");
const TokenCounter = require("../../utils/tokenCounter");

class ContextSummarizer {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.SECRET_OPENAI_API_KEY
        });
        this.tokenCounter = new TokenCounter();
    }

    async summarizeContext(conversationHistory) {
        try {
            if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
                return this._getDefaultSummary();
            }

            const technicalContext = await this._extractTechnicalContext(conversationHistory);
            const learningProgress = this._analyzeLearningProgress(conversationHistory);

            return {
                technicalConcepts: technicalContext.concepts || [],
                understanding: {
                    mastered: Array.from(learningProgress.understoodConcepts || []),
                    needsWork: Array.from(learningProgress.needsGuidance || [])
                },
                currentLevel: learningProgress.currentLevel || 'beginner',
                recentFocus: learningProgress.recentTopics || []
            };

        } catch (error) {
            logger.loggers.contextSummarizer.error({
                type: 'summarization_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            return this._getDefaultSummary();
        }
    }

    async _extractTechnicalContext(history) {
        try {
            const technicalConcepts = new Set();
            const conceptRelations = new Map();

            for (const turn of history) {
                const text = `${turn.userQuery || ''} ${turn.botResponse || ''}`;
                const extractedConcepts = await this._extractTechnicalTerms(text);
                
                if (Array.isArray(extractedConcepts)) {
                    extractedConcepts.forEach(concept => {
                        if (concept && typeof concept === 'string') {
                            technicalConcepts.add(concept.toLowerCase());
                        }
                    });
                }
            }

            return {
                concepts: Array.from(technicalConcepts),
                relations: Object.fromEntries(conceptRelations)
            };

        } catch (error) {
            logger.loggers.contextSummarizer.error({
                type: 'technical_context_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            return { concepts: [], relations: {} };
        }
    }

    _extractTechnicalTerms(text) {
        try {
            const technicalTerms = [
                'cpu', 'cache', 'memory', 'pipeline', 'register',
                'alu', 'instruction set', 'branch prediction',
                'virtual memory', 'addressing', 'bus', 'interrupt',
                'fetch', 'decode', 'execute', 'writeback',
                'throughput', 'latency', 'bandwidth', 'ram',
                'decoder', 'enable', 'chip', 'bits', 'words'
            ];

            return technicalTerms.filter(term => 
                text.toLowerCase().includes(term)
            );
        } catch (error) {
            logger.loggers.contextSummarizer.error({
                type: 'term_extraction_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            return [];
        }
    }

    _analyzeLearningProgress(history) {
        try {
            const progress = {
                understoodConcepts: new Set(),
                needsGuidance: new Set(),
                currentLevel: 'beginner',
                recentTopics: []
            };

            history.slice(-5).forEach(turn => {
                const understanding = this._assessUnderstanding(turn);
                
                understanding.masteredConcepts.forEach(concept => 
                    progress.understoodConcepts.add(concept)
                );
                
                understanding.strugglingConcepts.forEach(concept => 
                    progress.needsGuidance.add(concept)
                );

                if (understanding.mainTopic) {
                    progress.recentTopics.push(understanding.mainTopic);
                }
            });

            progress.currentLevel = this._determineLevel(progress);
            return progress;

        } catch (error) {
            logger.loggers.contextSummarizer.error({
                type: 'learning_progress_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            return {
                understoodConcepts: new Set(),
                needsGuidance: new Set(),
                currentLevel: 'beginner',
                recentTopics: []
            };
        }
    }

    _assessUnderstanding(turn) {
        try {
            const response = turn.botResponse?.toLowerCase() || '';
            const query = turn.userQuery?.toLowerCase() || '';

            return {
                masteredConcepts: this._identifyMasteredConcepts(response, query),
                strugglingConcepts: this._identifyStrugglingConcepts(response, query),
                mainTopic: this._identifyMainTopic(query),
                confidenceLevel: this._assessConfidenceLevel(response)
            };
        } catch (error) {
            return {
                masteredConcepts: [],
                strugglingConcepts: [],
                mainTopic: 'general',
                confidenceLevel: 'low'
            };
        }
    }

    _identifyMasteredConcepts(response, query) {
        const masteredIndicators = [
            'correct', 'well explained', 'good point',
            'exactly right', 'that\'s right'
        ];
        return this._extractConceptsWithIndicators(response, query, masteredIndicators);
    }

    _identifyStrugglingConcepts(response, query) {
        const struggleIndicators = [
            'let\'s review', 'consider again', 'think about',
            'remember that', 'important to note'
        ];
        return this._extractConceptsWithIndicators(response, query, struggleIndicators);
    }

    _extractConceptsWithIndicators(response, query, indicators) {
        try {
            const concepts = new Set();
            const terms = this._extractTechnicalTerms(query + ' ' + response);

            indicators.forEach(indicator => {
                if (response.includes(indicator)) {
                    terms.forEach(term => concepts.add(term));
                }
            });

            return Array.from(concepts);
        } catch (error) {
            return [];
        }
    }

    _identifyMainTopic(query) {
        const terms = this._extractTechnicalTerms(query);
        return terms[0] || 'computer architecture';
    }

    _assessConfidenceLevel(response) {
        const confidenceIndicators = {
            high: ['clearly', 'definitely', 'exactly', 'precisely'],
            medium: ['probably', 'likely', 'seems', 'appears'],
            low: ['might', 'could', 'perhaps', 'maybe']
        };

        let score = 0;
        Object.entries(confidenceIndicators).forEach(([level, indicators]) => {
            indicators.forEach(indicator => {
                if (response.includes(indicator)) {
                    score += level === 'high' ? 2 : level === 'medium' ? 1 : 0;
                }
            });
        });

        return score > 3 ? 'high' : score > 1 ? 'medium' : 'low';
    }

    _determineLevel(progress) {
        const masteredCount = progress.understoodConcepts.size;
        const strugglingCount = progress.needsGuidance.size;
        
        if (masteredCount > strugglingCount * 2) {
            return 'advanced';
        } else if (masteredCount > strugglingCount) {
            return 'intermediate';
        } else {
            return 'beginner';
        }
    }

    _getDefaultSummary() {
        return {
            technicalConcepts: [],
            understanding: {
                mastered: [],
                needsWork: []
            },
            currentLevel: 'beginner',
            recentFocus: []
        };
    }

    async summarizeForPrompt(context) {
        try {
            const summary = await this.summarizeContext(context);
            
            return {
                technicalFocus: summary.technicalConcepts.join(', '),
                understandingLevel: summary.currentLevel,
                needsGuidance: summary.understanding.needsWork.join(', '),
                recentTopics: summary.recentFocus.join(', ')
            };
        } catch (error) {
            logger.loggers.contextSummarizer.error({
                type: 'prompt_summary_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            
            return {
                technicalFocus: 'computer architecture',
                understandingLevel: 'intermediate',
                needsGuidance: '',
                recentTopics: ''
            };
        }
    }

    _getSurroundingText(text, indicator, windowSize = 50) {
        try {
            const index = text.indexOf(indicator);
            if (index === -1) return '';

            const start = Math.max(0, index - windowSize);
            const end = Math.min(text.length, index + indicator.length + windowSize);
            return text.slice(start, end);
        } catch (error) {
            return '';
        }
    }
}

module.exports = ContextSummarizer;
