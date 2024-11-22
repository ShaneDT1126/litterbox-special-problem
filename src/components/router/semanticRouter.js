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
            
            // Check patterns for each query type
            for (const [type, patterns] of Object.entries(this.patterns)) {
                if (patterns.some(pattern => query.includes(pattern))) {
                    return {
                        type: type,
                        confidence: 0.8, // You could implement more sophisticated confidence scoring
                        detectedPattern: patterns.find(pattern => query.includes(pattern))
                    };
                }
            }

            // Default to concept explanation if no pattern matches
            return {
                type: this.queryTypes.CONCEPT_EXPLANATION,
                confidence: 0.5,
                detectedPattern: null
            };
        } catch (error) {
            console.error("Error routing query:", error);
            throw error;
        }
    }
}
