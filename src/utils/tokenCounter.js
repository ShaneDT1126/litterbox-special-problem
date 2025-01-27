const { encodingForModel } = require("js-tiktoken");

class TokenCounter {
    constructor(model = "gpt-3.5-turbo") {
        this.encoding = encodingForModel(model);
    }

    countTokens(text) {
        const textAsString = String(text);
        return this.encoding.encode(textAsString).length;
    }

    countMessageTokens(messages) {
        let totalTokens = 0;
        for (const message of messages) {
            totalTokens += 4; // Every message follows <im_start>{role/name}\n{content}<im_end>\n
            for (const [key, value] of Object.entries(message)) {
                totalTokens += this.countTokens(value);
                if (key === "name") {
                    totalTokens -= 1; // Role is always required and always 1 token
                }
            }
        }
        totalTokens += 2; // Every reply is primed with <im_start>assistant
        return totalTokens;
    }
}

module.exports = TokenCounter;
