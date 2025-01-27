const logger = require('../../utils/logger');
const FeedbackSystem = require('./feedbackSystem');
const ProgressiveReduction = require('./progressiveReduction');
const ResponseGenerator = require('../response/responseGenerator');
const PerformanceMonitor = require('../benchmarking/performanceMonitor');
const TokenCounter = require("../../utils/tokenCounter");
const EventEmitter = require('events');
const OpenAI = require('openai');

class ScaffoldingSystem extends EventEmitter {
    constructor(multiQueryRetriever, conversationMemory) {
        super();
        this.multiQueryRetriever = multiQueryRetriever;
        this.conversationMemory = conversationMemory;
        this.responseGenerator = new ResponseGenerator();
        this.feedbackSystem = new FeedbackSystem();
        this.progressiveReduction = new ProgressiveReduction();
        this.performanceMonitor = new PerformanceMonitor();
        this.tokenCounter = new TokenCounter();

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.scaffoldLevels = ['high', 'medium', 'low', 'none'];
    }

    async processWithScaffolding(query, context) {
        const startTime = Date.now();
        let scaffoldingContext = {
            supportLevel: this._determineSupportLevel(context),
            reductionLevel: this.progressiveReduction.determineReductionLevel(context.sessionId)
        };

        logger.loggers.scaffolding.info({
            type: 'scaffold_process_start',
            details: { query, context: scaffoldingContext }
        });

        // Topic classification method to determine if the query is related to computer architecture
        const topicClassification = await this._classifyTopic(query);
        if (topicClassification.topic === 'Unrelated' || topicClassification.confidence < 0.7) {
            return this._createRedirectResponse();
        }

        const conversationContext = this.conversationMemory.getConversationContext(context.sessionId);
        const conversationSummary = this.conversationMemory.summarizeConversation(context.sessionId);
        scaffoldingContext = this._adjustScaffoldingBasedOnTopics(scaffoldingContext, conversationSummary.topics);

        // Break down complex questions
        const subQuestions = await this._breakDownComplexQuestion(query);
        const responses = [];

        for (const subQuery of subQuestions) {
            const relevantContent = await this.multiQueryRetriever.retrieveDocuments(
                subQuery, 
                context.routingResult,
                conversationContext,
                conversationSummary.topics
            );
    
            const reducedContent = this.progressiveReduction.reduceContent(relevantContent, scaffoldingContext.reductionLevel);        
    
            const subResponse = await this.responseGenerator.generateGuidingResponse(
                subQuery,
                reducedContent,
                scaffoldingContext,
                conversationContext
            );
    
            responses.push(subResponse);
        }

        const finalResponse = responses.join('\n\n');

        this.conversationMemory.addTurn(context.sessionId, query, finalResponse, {
            supportLevel: scaffoldingContext.supportLevel,
            reductionLevel: scaffoldingContext.reductionLevel,
            topicClassification: topicClassification
        });

        const processingTime = Date.now() - startTime;

        logger.loggers.scaffolding.info({
            type: 'scaffold_process_complete',
            details: {
                scaffoldType: 'default',
                supportLevel: scaffoldingContext.supportLevel,
                reductionLevel: scaffoldingContext.reductionLevel,
                topicClassification: topicClassification,
                subQuestionsCount: subQuestions.length,
                processingTime
            }
        });

        return {
            message: finalResponse,
            scaffoldingContext,
            conversationSummary: this.conversationMemory.summarizeConversation(context.sessionId),
            topicClassification: topicClassification
        };
    }

    _determineSupportLevel(context) {
        const feedbackRatio = this.feedbackSystem.getFeedbackRatio(context.sessionId);
        const currentLevel = this.scaffoldLevels.indexOf(context.currentSupportLevel || 'medium');
        
        if (feedbackRatio > 0.7) {
            return this.scaffoldLevels[Math.max(0, currentLevel - 1)];
        } else if (feedbackRatio < 0.3) {
            return this.scaffoldLevels[Math.min(this.scaffoldLevels.length - 1, currentLevel + 1)];
        }
        
        return this.scaffoldLevels[currentLevel];
    }
    

    _isComputerArchitectureRelated(query) {
        const keywords = [
            'cpu', 'memory', 'cache', 'instruction', 'pipeline', 'architecture', 
            'processor', 'alu', 'register', 'bus', 'von neumann', 'harvard', 
            'risc', 'cisc', 'microarchitecture', 'assembly', 'machine code', 
            'clock cycle', 'fetch', 'decode', 'execute', 'writeback', 'branch prediction',
            'superscalar', 'out-of-order execution', 'simd', 'mimd', 'parallel processing',
            'cache coherence', 'virtual memory', 'tlb', 'page table', 'interrupt',
            'dma', 'io', 'peripheral', 'motherboard', 'chipset', 'northbridge', 'southbridge'
        ];

        const queryLower = query.toLowerCase();
        return keywords.some(keyword => queryLower.includes(keyword));
    }

    _createRedirectResponse() {
        return {
            message: "I apologize, but I'm specifically designed to assist with computer architecture topics. Could you please rephrase your question to relate to computer hardware, processors, memory systems, or similar topics? If you're not sure how to connect your question to computer architecture, I'd be happy to suggest some relevant topics we could explore.",
            scaffoldingContext: {
                supportLevel: 'high',
                reductionLevel: 'none'
            }
        };
    }

    updateUserProgress(sessionId, performance) {
        const newReductionLevel = this.progressiveReduction.updateReductionLevel(sessionId, performance);
        const newSupportLevel = this._determineSupportLevel({ sessionId, currentSupportLevel: this.scaffoldLevels[1] }); // Assuming 'medium' is index 1
    
        logger.loggers.scaffolding.info({
            type: 'user_progress_updated',
            details: { sessionId, performance, newReductionLevel, newSupportLevel }
        });
    
        return { reductionLevel: newReductionLevel, supportLevel: newSupportLevel };
    }

    _adjustScaffoldingBasedOnTopics(scaffoldingContext, topics) {
        const complexTopics = ['pipelining', 'cache coherence', 'virtual memory', 'branch prediction'];
        const complexityScore = topics.reduce((score, topic) => 
            complexTopics.includes(topic) ? score + 1 : score, 0);

        if (complexityScore > 2) {
            scaffoldingContext.supportLevel = this._increaseSupport(scaffoldingContext.supportLevel);
            scaffoldingContext.reductionLevel = this._decreaseReduction(scaffoldingContext.reductionLevel);
        } else if (complexityScore === 0) {
            scaffoldingContext.supportLevel = this._decreaseSupport(scaffoldingContext.supportLevel);
            scaffoldingContext.reductionLevel = this._increaseReduction(scaffoldingContext.reductionLevel);
        }

        return scaffoldingContext;
    }

    _increaseSupport(currentLevel) {
        const levels = ['low', 'medium', 'high'];
        const currentIndex = levels.indexOf(currentLevel);
        return levels[Math.min(currentIndex + 1, levels.length - 1)];
    }

    _decreaseSupport(currentLevel) {
        const levels = ['low', 'medium', 'high'];
        const currentIndex = levels.indexOf(currentLevel);
        return levels[Math.max(currentIndex - 1, 0)];
    }

    _increaseReduction(currentLevel) {
        const levels = ['none', 'low', 'medium', 'high'];
        const currentIndex = levels.indexOf(currentLevel);
        return levels[Math.min(currentIndex + 1, levels.length - 1)];
    }

    _decreaseReduction(currentLevel) {
        const levels = ['none', 'low', 'medium', 'high'];
        const currentIndex = levels.indexOf(currentLevel);
        return levels[Math.max(currentIndex - 1, 0)];
    }

    async _breakDownComplexQuestion(query) {
        const complexityThreshold = 20; // Adjust as needed
        if (query.split(' ').length <= complexityThreshold) {
            return [query];
        }
    
        // Use GPT to break down the question
        const prompt = `Break down this complex question into smaller, more manageable sub-questions:
        "${query}"
        Provide 2-3 sub-questions that, when answered, will help address the main question.`;
    
        const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant that breaks down complex questions." },
                { role: "user", content: prompt }
            ],
            max_tokens: 150,
            n: 1,
            temperature: 0.7,
        });
    
        return response.choices[0].message.content.split('\n').filter(q => q.trim() !== '');
    }

    async _classifyTopic(query) {
        const prompt = `Classify the following query into one of these computer architecture topics:
        CPU, Memory, Cache, Instruction Set, Pipelining, I/O, or Other.
        If it's not related to computer architecture, classify it as "Unrelated".
        
        Query: "${query}"
        
        Provide your answer in the format:
        Classification: [Your classification]
        Confidence: [A number between 0 and 1]`;
    
        const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a computer architecture expert that classifies queries." },
                { role: "user", content: prompt }
            ],
            max_tokens: 50,
            n: 1,
            temperature: 0.3,
        });
    
        const result = response.choices[0].message.content;
        const [classification, confidence] = result.split('\n');
        return {
            topic: classification.split(':')[1].trim(),
            confidence: parseFloat(confidence.split(':')[1].trim())
        };
    }
    
}

module.exports = ScaffoldingSystem;
