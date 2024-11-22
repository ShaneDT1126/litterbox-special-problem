class SemanticRouter {
    constructor() {
        this.queryTypes = {
            CONCEPT_EXPLANATION: "concept_explanation",
            PROBLEM_SOLVING: "problem_solving",
            COMPARISON: "comparison",
            APPLICATION: "application"
        };

        this.patterns = {
            [this.queryTypes.CONCEPT_EXPLANATION]: [
                "what is",
                "explain",
                "describe",
                "define",
                "how does"
            ],
            [this.queryTypes.PROBLEM_SOLVING]: [
                "solve",
                "calculate",
                "find",
                "determine",
                "compute"
            ],
            [this.queryTypes.COMPARISON]: [
                "compare",
                "difference between",
                "versus",
                "better"
            ],
            [this.queryTypes.APPLICATION]: [
                "use case",
                "application",
                "when to use",
                "example"
            ]
        };
    }

    async routeQuery(query) {
        try {
            query = query.toLowerCase();
            let bestMatch = { type: null, confidence: 0, detectedPattern: null };
            
            // Check patterns for each query type
            for (const [type, patterns] of Object.entries(this.patterns)) {
                for (const { pattern, weight } of patterns) {
                    if (query.includes(pattern)) {
                        let confidence = weight;

                        // Adjust confidence based on query length
                        if (query.length > 50) {
                            confidence *= 1.1;
                        } else if (query.length < 10) {
                            confidence *= 0.9;
                        }

                        // Update best match if this pattern has higher confidence
                        if (confidence > bestMatch.confidence) {
                            bestMatch = { type, confidence, detectedPattern: pattern };
                        }
                    }
                }
            }

            // Default to concept explanation if no pattern matches
            if (!bestMatch.type) {
                bestMatch = {
                    type: this.queryTypes.CONCEPT_EXPLANATION,
                    confidence: 0.5,
                    detectedPattern: null
                };
            }
            return bestMatch;

        } catch (error) {
            console.error("Error routing query:", error);
            throw error;
        }
    }
}
