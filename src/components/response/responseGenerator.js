const OpenAI = require("openai");
const NodeCache = require('node-cache');
const logger = require("../../utils/logger");
const ContextSummarizer = require("./contextSummarizer");
const TokenCounter = require("../../utils/tokenCounter");
const EventEmitter = require('events');

class ResponseGenerator extends EventEmitter {
    constructor() {
        super();
        this.openai = new OpenAI({
            apiKey: process.env.SECRET_OPENAI_API_KEY
        });

        this.cache = new NodeCache({ stdTTL: 3600 });
        this.tokenCounter = new TokenCounter();
        this.contextSummarizer = new ContextSummarizer();

        this.MAX_TOKENS = 4096;
        this.MAX_RESPONSE_TOKENS = 500;
    }

    _constructGuidingPrompt(query, relevantContent, scaffoldingContext) {
        return `Student's question: "${query}"
        
        Scaffolding Guidelines:
        1. PROVIDE a clear learning framework
        2. STRUCTURE the content into progressive levels
        3. OFFER temporary supports that can be gradually removed
        4. INCLUDE worked examples with gaps for student engagement
        5. USE concept bridging to connect prior knowledge
        
        Response Structure:
        1. Start with a simplified version or model
        2. Provide partial worked examples
        3. Include strategic hints at key decision points
        4. Gradually increase complexity
        5. Build connections to previous concepts
        
        IMPORTANT:
        - Focus on building supporting structures
        - Provide progressive complexity levels
        - Include strategic hints at key points
        - Use worked examples with gaps
        - Connect to prior knowledge
        
        Relevant technical concepts: ${relevantContent.join(' ')}
        Current scaffolding context: ${JSON.stringify(scaffoldingContext)}`;
    }

    async generateGuidingResponse(query, relevantContent, scaffoldingContext, conversationHistory) {
        try {
            const cacheKey = this._generateCacheKey(query, scaffoldingContext);
            const cachedResponse = this.cache.get(cacheKey);

            if (cachedResponse) {
                logger.loggers.responseGenerator.info({
                    type: 'cache_hit',
                    details: { query, cacheKey }
                });
                this.emit('responseChunk', cachedResponse);
                return cachedResponse;
            }

            const summarizedContext = await this.contextSummarizer.summarizeContext(conversationHistory);
            const prompt = this._constructGuidingPrompt(query, relevantContent, scaffoldingContext);
            
            const messages = [
                { 
                    role: "system", 
                    content: this._getSystemPrompt()
                },
                { 
                    role: "user", 
                    content: prompt 
                }
            ];

            const stream = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                max_tokens: this.MAX_RESPONSE_TOKENS,
                temperature: 0.7,
                stream: true,
            });

            let generatedResponse = '';
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                generatedResponse += content;
                if (content) {
                    this.emit('responseChunk', content);
                }
            }

            if (!generatedResponse) {
                throw new Error("Invalid response from OpenAI API");
            }

            // Ensure response is in question format
            if (!this._isInQuestionFormat(generatedResponse)) {
                generatedResponse = this._reformatToQuestions(generatedResponse);
            }

            this.cache.set(cacheKey, generatedResponse);

            return {
                type: 'guided',
                content: generatedResponse,
                requiresFollowUp: true,
                tokenCount: this.tokenCounter.countTokens(generatedResponse)
            };

        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'response_generation_error',
                details: {
                    query,
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    _getSystemPrompt() {
        return `You are a computer architecture tutor using scaffolding techniques:
    
        SCAFFOLDING PRINCIPLES:
        1. Provide clear structure and frameworks
        2. Use progressive complexity levels
        3. Offer temporary supports
        4. Include partially worked examples
        5. Build on prior knowledge
        
        RESPONSE STRUCTURE:
        1. Start with a simplified model/framework
        2. Show a partial solution or worked example
        3. Highlight key decision points
        4. Provide strategic hints
        5. Connect to previous concepts
        
        INCLUDE:
        - Framework structures
        - Partial examples
        - Strategic hints
        - Progressive complexity
        - Knowledge bridges
        
        AVOID:
        - Pure Socratic questioning
        - Complete solutions
        - Direct answers
        - Overwhelming complexity`;
    }

    _isInQuestionFormat(content) {
        const questionCount = (content.match(/\?/g) || []).length;
        const hasThinkingPrompts = content.includes("think about") || 
                                 content.includes("consider") || 
                                 content.includes("what if");
        return questionCount >= 2 && hasThinkingPrompts;
    }

    _reformatToQuestions(content) {
        let questions = "Let's think about this step by step:\n\n";
        
        const sentences = content.split(/[.!?]+/).filter(s => s.trim());
        
        sentences.forEach((sentence, index) => {
            sentence = sentence.trim();
            if (!sentence) return;
            
            if (sentence.endsWith('?')) {
                questions += `${sentence}?\n`;
                return;
            }

            if (index === 0) {
                questions += `What do you think about ${sentence.toLowerCase()}?\n`;
            } else if (sentence.includes('because') || sentence.includes('due to')) {
                questions += `Why do you think this happens?\n`;
            } else if (sentence.includes('is') || sentence.includes('are')) {
                questions += `How would you explain ${sentence.toLowerCase()}?\n`;
            } else {
                questions += `What might happen if we consider ${sentence.toLowerCase()}?\n`;
            }
        });

        questions += "\nHint: Consider the key technical concepts involved.\n";
        questions += "\nWhat connections do you see between these ideas?\n";
        
        return questions;
    }

    _generateCacheKey(query, context) {
        const normalizedQuery = query.toLowerCase().trim();
        const contextHash = JSON.stringify(context);
        return `response_${normalizedQuery}_${contextHash}`;
    }

    async generateErrorResponse(error) {
        logger.loggers.responseGenerator.error({
            type: 'error_response_generation',
            details: {
                error: error.message,
                stack: error.stack
            }
        });

        return {
            type: 'error',
            content: "I apologize, but I encountered an error. Could you please rephrase your question? Remember, I'm here to guide you through understanding computer architecture concepts.",
            requiresFollowUp: true
        };
    }
}

module.exports = ResponseGenerator;