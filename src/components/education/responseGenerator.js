class ResponseGenerator {
    constructor() {
        this.responseTemplates = {
            introduction: "Let's explore {concept} together.",
            guidance: "Think about this: {question}",
            verification: "To make sure we're on the same page: {check}",
            encouragement: "That's an interesting perspective. Let's dig deeper.",
            connection: "How does this connect to {related_concept}?"
        };
    }

    async generateResponse(context, queryType, socraticSteps) {
        try {
            let response = [];

            // Add introduction
            response.push(this.responseTemplates.introduction.replace(
                '{concept}', 
                socraticSteps.concept
            ));

            // Process each Socratic step
            for (const step of socraticSteps.steps) {
                response.push(this.formatStepResponse(step));
            }

            // Add educational scaffolding
            response.push(this.addScaffolding(queryType.type));

            return response.join('\n\n');
        } catch (error) {
            console.error("Error generating response:", error);
            throw error;
        }
    }

    formatStepResponse(step) {
        switch (step.type) {
            case 'understand':
                return `📚 ${step.content}`;
            case 'break_down':
                return `🔍 ${step.content}`;
            case 'guide':
                return `💡 ${step.content}`;
            case 'verify':
                return `✅ ${step.content}`;
            default:
                return step.content;
        }
    }

    addScaffolding(queryType) {
        const scaffolding = {
            concept_explanation: "Take a moment to think about this concept. What aspects are still unclear?",
            problem_solving: "Before we proceed, let's make sure we understand each step. What questions do you have?",
            comparison: "Consider the key differences we've discussed. How would you summarize them?",
            application: "Think about how you might apply this in a real-world scenario."
        };

        return scaffolding[queryType] || scaffolding.concept_explanation;
    }

    formatForTeams(response) {
        // Format response for Teams message
        return {
            type: 'message',
            text: response,
            importance: 'normal'
        };
    }
}

module.exports = { ResponseGenerator };
