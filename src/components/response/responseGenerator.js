const OpenAI = require("openai");;
const logger = require("../../utils/logger");

class ResponseGenerator {
    constructor() {
        if (!process.env.SECRET_OPENAI_API_KEY) {
            throw new Error("OpenAI API key is not set in environment variables");
        }
        this.openai = new OpenAI({
            apiKey: process.env.SECRET_OPENAI_API_KEY
        });
    }

    async generateResponse(query, relevantContent, scaffoldingContext, conversationHistory) {
        try {
            // Construct prompt
            const prompt = this._constructPrompt(query, relevantContent, scaffoldingContext, conversationHistory);

            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "system", content: "You are a helpful assistant specializing in computer architecture. Provide detailed, accurate responses while adapting to the user's level of understanding."},
                    {role: "user", content: prompt}
                ],
                max_tokens: 500,
                temperature: 0.7,
            });

            if (!response || !response.choices || response.choices.length === 0) {
                throw new Error("Invalid response from OpenAI API");
            }

            // Extract content from response
            const generatedResponse = response.choices[0].message.content.trim();

            logger.loggers.responseGenerator.info({
                type: 'response_generated',
                details: { query, responseLength: generatedResponse.length }
            });

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
            return "I apologize, but I'm having trouble generating a response at the moment. Could you please try again or rephrase your question?";
        }
    }

    _constructPrompt(query, relevantContent, scaffoldingContext, conversationHistory) {
        const contentSummary = relevantContent ? relevantContent.join('\n\n') : '';
        return `
User Query: ${query}
Relevant Info: ${contentSummary}
Scaffolding Context: ${JSON.stringify(scaffoldingContext)}
Conversation History: ${conversationHistory}
`;
    }
}

module.exports = ResponseGenerator;