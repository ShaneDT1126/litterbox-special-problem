class SocraticProcessor {
    constructor() {
        this.teachingSteps = {
            UNDERSTAND: "understand",
            BREAK_DOWN: "break_down",
            GUIDE: "guide",
            VERIFY: "verify",
            ELABORATE: "elaborate"
        };

        this.promptTemplates = {
            understand: "What do you already know about {concept}?",
            break_down: "Let's break this down into smaller parts. First, let's look at {part}.",
            guide: "Think about {concept}. What might be the next logical step?",
            verify: "Can you explain why you think that's the case?",
            elaborate: "How would this concept connect to {related_concept}?"
        };
    }

    async processQuery(query, context, queryType) {
        try {
            const concept = this.extractMainConcept(query);
            const steps = await this.createSocraticSteps(concept, context, queryType);
            
            return {
                concept: concept,
                context: context,
                steps: steps,
                queryType: queryType.type
            };
        } catch (error) {
            console.error("Error in processQuery:", error);
            throw error;
        }
    }

    extractMainConcept(query) {
        // Remove common question words and get the main concept
        return query
            .toLowerCase()
            .replace(/what is|how does|explain|describe|tell me about/g, '')
            .trim();
    }

    async createSocraticSteps(concept, context, queryType) {
        const steps = [];

        // Add initial understanding check
        steps.push({
            type: this.teachingSteps.UNDERSTAND,
            content: this.promptTemplates.understand.replace('{concept}', concept)
        });

        // Add context-based guidance
        if (context) {
            steps.push({
                type: this.teachingSteps.BREAK_DOWN,
                content: `Based on our course materials: ${context}`
            });
        }

        // Add concept-specific questions
        steps.push({
            type: this.teachingSteps.GUIDE,
            content: this.createConceptSpecificQuestions(concept, queryType)
        });

        // Add verification step
        steps.push({
            type: this.teachingSteps.VERIFY,
            content: this.promptTemplates.verify
        });

        return steps;
    }

    createConceptSpecificQuestions(concept, queryType) {
        switch (queryType.type) {
            case 'concept_explanation':
                return `How would you explain ${concept} to someone who's never heard of it before?`;
            case 'problem_solving':
                return `What information do we need to solve this problem about ${concept}?`;
            case 'comparison':
                return `What are the key aspects of ${concept} we should focus on?`;
            default:
                return this.promptTemplates.guide.replace('{concept}', concept);
        }
    }
}

module.exports = { SocraticProcessor };
