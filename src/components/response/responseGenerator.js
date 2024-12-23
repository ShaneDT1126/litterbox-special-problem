const OpenAI = require("openai");
const NodeCache = require('node-cache');
const logger = require("../../utils/logger");
const ContextSummarizer = require("./contextSummarizer");
const TokenCounter = require("../../utils/tokenCounter");
const EventEmitter = require('events');

class ResponseGenerator extends EventEmitter {
    constructor() {
        super();
        console.log("OpenAI API Key available:", !!process.env.SECRET_OPENAI_API_KEY);
        
        this.openai = new OpenAI({
            apiKey: process.env.SECRET_OPENAI_API_KEY
        });

        this.cache = new NodeCache({ stdTTL: 3600 }); // Cache responses for 1 hour

        this.tokenCounter = new TokenCounter();
        this.contextSummarizer = new ContextSummarizer();

        this.MAX_TOKENS = 4096;
        this.MAX_RESPONSE_TOKENS = 500; // Maximum tokens for the response
    }

    async generateResponse(query, relevantContent, scaffoldingContext, conversationHistory) {
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

            const summarizedContext = this.contextSummarizer.summarizeContext(conversationHistory);
            const messages = this._constructMessages(query, relevantContent, scaffoldingContext, summarizedContext);
            const tokenCount = this.tokenCounter.countMessageTokens(messages);

            logger.loggers.responseGenerator.info({
                type: 'token_count',
                details: { 
                    inputTokenCount: tokenCount, 
                    maxTokens: this.MAX_TOKENS,
                    maxResponseTokens: this.MAX_RESPONSE_TOKENS
                }
            });

            if (tokenCount > this.MAX_TOKENS - this.MAX_RESPONSE_TOKENS) {
                messages = this._truncateMessages(messages);
                const newTokenCount = this.tokenCounter.countMessageTokens(messages);
                logger.loggers.responseGenerator.info({
                    type: 'messages_truncated',
                    details: { originalTokenCount: tokenCount, newTokenCount }
                });
            }
            
            const stream = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                max_tokens: Math.min(this.MAX_RESPONSE_TOKENS, this.MAX_TOKENS - tokenCount),
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

            this.cache.set(cacheKey, generatedResponse);

            const responseTokenCount = this.tokenCounter.countTokens(generatedResponse);
            logger.loggers.responseGenerator.info({
                type: 'response_generated',
                details: { 
                    query, 
                    responseLength: generatedResponse.length, 
                    inputTokenCount: tokenCount,
                    responseTokenCount,
                    totalTokenCount: tokenCount + responseTokenCount
                }
            });

            this.emit('responseComplete', generatedResponse);
            return generatedResponse;

        } catch (error) {
            logger.loggers.responseGenerator.error({
                type: 'response_generation_error',
                details: {
                    query,
                    message: error.message,
                    stack: error.stack
                }
            });
            const errorMessage = "I apologize, but I'm having trouble generating a response at the moment. Could you please try again or rephrase your question?";
            this.emit('responseError', errorMessage);
            return "I apologize, but I'm having trouble generating a response at the moment. Could you please try again or rephrase your question?";
        }
    }

    _generateCacheKey(query, scaffoldingContext) {
        // Generate a unique key based on the query and context
        return `${query}_${JSON.stringify(scaffoldingContext)}`;
    }

    _constructMessages(query, relevantContent, scaffoldingContext, conversationHistory) {
        const systemMessage = { role: "system", content: this._getSystemMessage() };
        const userMessage = { role: "user", content: this._constructPrompt(query, relevantContent, scaffoldingContext) };
        
        const historyMessages = this._truncateConversationHistory(conversationHistory)
            .map(turn => [
                { role: "user", content: turn.userQuery },
                { role: "assistant", content: turn.botResponse }
            ]).flat();

        return [systemMessage, ...historyMessages, userMessage];
    }

    _constructPrompt(query, relevantContent, scaffoldingContext) {
        const contentSummary = relevantContent ? relevantContent.join('\n\n') : '';
        return `
User Query: ${query}
Relevant Info: ${contentSummary}
Scaffolding Context: ${JSON.stringify(scaffoldingContext)}
`;
    }

    _truncateConversationHistory(history) {
        let tokenCount = 0;
        let truncatedHistory = [];

        for (let i = history.length - 1; i >= 0; i--) {
            const turn = history[i];
            const turnTokens = this.tokenCounter.countTokens(turn.userQuery) + this.tokenCounter.countTokens(turn.botResponse);
            
            if (tokenCount + turnTokens > 2000) { // Adjust this value as needed
                break;
            }

            tokenCount += turnTokens;
            truncatedHistory.unshift(turn);
        }

        return truncatedHistory;
    }

    _truncateMessages(messages) {
        while (this.tokenCounter.countMessageTokens(messages) > this.MAX_TOKENS - this.MAX_RESPONSE_TOKENS) {
            if (messages.length <= 2) { // Keep system message and user query
                break;
            }
            messages.splice(1, 1); // Remove the oldest message after system message
        }
        return messages;
    }

    _estimateTokens(text) {
        // Implement a simple token estimation function
        return text.split(/\s+/).length;
    }

    _getSystemMessage() {
        return `You are a Computer Architecture tutor focused ONLY on teaching computer organization and architecture concepts using a scaffolding approach.

CORE PRINCIPLES:
- NEVER provide direct answers
- ONLY address Computer Architecture topics
- For non-Computer Architecture questions, politely redirect users to ask about computer hardware, processors, memory systems, or related topics

TEACHING APPROACH:
1. Support Level Assessment:
   - Assess student's current understanding
   - Identify knowledge gaps
   - Adjust support level accordingly

2. Scaffolding Techniques:
   - Break complex concepts into manageable parts
   - Provide structured guidance
   - Use conceptual scaffolds for theoretical understanding
   - Use procedural scaffolds for step-by-step processes
   - Gradually reduce support as understanding improves

3. Learning Support:
   - Use analogies and examples to build on existing knowledge
   - Provide hints and cues instead of answers
   - Guide students through problem-solving processes
   - Encourage self-discovery and critical thinking

4. Knowledge Construction:
   - Help students build mental models
   - Connect new concepts to previously learned material
   - Validate understanding through guided questions
   - Support progressive concept development

RESPONSE STRUCTURE:
1. First: Assess current understanding
2. Then: Provide appropriate scaffolding
3. Finally: Guide towards self-discovery

Remember: Your role is to support learning through structured guidance, not to provide direct answers.`;
    }
}

module.exports = ResponseGenerator;
