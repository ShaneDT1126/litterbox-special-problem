class ResponseGenerator {
    constructor() {
        this.responseTemplates = {
            // Core response templates
            initial: {
                acknowledgment: "I understand you're interested in learning about {concept}.",
                priorKnowledge: "Could you share what you already know about {concept}?",
                guidance: "Let's explore this step by step."
            },
            persistence: {
                gentle: "I understand your eagerness to get the answer, but let's work through this together.",
                firm: "Remember, true understanding comes from discovering the answer yourself.",
                explanation: "Instead of giving you the answer, let me help you break this down."
            },
            scaffolding: {
                breakdown: "Let's break this into smaller parts. First, let's consider {part}.",
                connection: "How do you think this relates to {related_concept}?",
                verification: "What makes you think that might be the case?",
                encouragement: "You're on the right track. What might be the next step?"
            }
        };

        this.prohibitedPatterns = [
            "the answer is",
            "the solution is",
            "here's the answer",
            "correct answer",
            "solution would be",
            "you should use",
            "you need to use",
            "the result is"
        ];
    }

    async generateResponse(context, queryType, socraticSteps) {
        try {
            let response = [];
            const concept = socraticSteps.concept;

            // Initial response structure
            response.push(this._formatInitialResponse(concept));

            // Process Socratic steps
            response.push(...this._processSocraticSteps(socraticSteps));

            // Add educational scaffolding
            response.push(this._addScaffolding(queryType.type));

            // Verify response doesn't contain direct answers
            const finalResponse = response.join('\n\n');
            if (this._containsDirectAnswer(finalResponse)) {
                return this._generateAlternativeResponse(concept, queryType);
            }

            return finalResponse;
        } catch (error) {
            console.error("Error generating response:", error);
            throw error;
        }
    }

    _formatInitialResponse(concept) {
        return this.responseTemplates.initial.acknowledgment.replace('{concept}', concept) + '\n' +
               this.responseTemplates.initial.priorKnowledge.replace('{concept}', concept) + '\n' +
               this.responseTemplates.initial.guidance;
    }

    _processSocraticSteps(socraticSteps) {
        return socraticSteps.steps.map(step => {
            return this._formatStepResponse(step);
        });
    }

    _formatStepResponse(step) {
        switch (step.type) {
            case 'understand':
                return `🤔 ${step.content}`;
            case 'break_down':
                return `📝 ${step.content}`;
            case 'guide':
                return `💡 ${step.content}`;
            case 'verify':
                return `✅ ${step.content}`;
            case 'elaborate':
                return `🔍 ${step.content}`;
            default:
                return step.content;
        }
    }

    _addScaffolding(queryType) {
        const scaffolding = {
            concept_explanation: "What aspects of this concept would you like to explore further?",
            problem_solving: "Which part of this problem seems most challenging to you?",
            comparison: "How would you compare these different aspects we've discussed?",
            application: "Can you think of a practical situation where this might apply?",
            verification: "How would you verify your understanding of this concept?"
        };

        return scaffolding[queryType] || scaffolding.concept_explanation;
    }

    _containsDirectAnswer(response) {
        return this.prohibitedPatterns.some(pattern => 
            response.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    _generateAlternativeResponse(concept, queryType) {
        return [
            this.responseTemplates.persistence.gentle,
            this.responseTemplates.scaffolding.breakdown.replace('{part}', concept),
            "Let's approach this step by step:",
            "1. What do you already understand about this topic?",
            "2. Which specific part is unclear to you?",
            "3. How might this relate to concepts you're already familiar with?",
            this._addScaffolding(queryType)
        ].join('\n\n');
    }

    formatForTeams(response) {
        return {
            type: 'message',
            text: response,
            importance: 'normal'
        };
    }

    handlePersistentRequests(concept, attemptCount) {
        const responses = [
            this.responseTemplates.persistence.gentle,
            this.responseTemplates.persistence.firm,
            this.responseTemplates.persistence.explanation
        ];

        const index = Math.min(attemptCount - 1, responses.length - 1);
        return responses[index] + '\n\n' + 
               this.responseTemplates.scaffolding.breakdown.replace('{part}', concept);
    }
}

module.exports = { ResponseGenerator };
