class SocraticProcessor {
    constructor() {
        this.promptTemplates = {
            concept_explanation: `
                As a Computer Architecture tutor, I'll help you understand {concept}.
                Let's break this down step by step:
                1. First, can you tell me what you already know about {concept}?
                2. {context}
                3. How would you explain {concept} in your own words?
            `,
            problem_solving: `
                Let's solve this problem together:
                1. What do you think is the first step in solving this?
                2. {context}
                3. Can you identify the key components we need to consider?
            `
        };
    }

    async processQuery(query, context, queryType) {
        try {
            const template = this.promptTemplates[queryType.type];
            const concept = query.replace(/what is|explain|how does/gi, '').trim();

            const socraticSteps = {
                type: queryType.type,
                concept: concept,
                context: context,
                steps: [
                    {
                        type: 'question',
                        content: 'What do you already know about this topic?'
                    },
                    {
                        type: 'context',
                        content: context
                    },
                    {
                        type: 'guidance',
                        content: `Let's break down ${concept} into simpler parts.`
                    },
                    {
                        type: 'verification',
                        content: 'Can you explain what you understand so far?'
                    },
                    {
                        type: 'deep_dive',
                        content: `What are the key components of ${concept}?`
                    },
                    {
                        type: 'application',
                        content: `Can you think of an example where ${concept} is used?`
                    },
                    {
                        type: 'summary',
                        content: `How would you summarize ${concept} in your own words?`
                    }
                ]
            };

            return socraticSteps;
        } catch (error) {
            console.error("Error processing query:", error);
            throw error;
        }
    }
}
