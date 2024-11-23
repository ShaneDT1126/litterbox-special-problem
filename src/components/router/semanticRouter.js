// src/components/router/semanticRouter.js

class SemanticRouter {
    constructor() {
        this.queryTypes = {
            CONCEPT_EXPLANATION: "concept_explanation",
            PROBLEM_SOLVING: "problem_solving",
            COMPARISON: "comparison",
            APPLICATION: "application",
            VERIFICATION: "verification"
        };

        // Define patterns for Computer Architecture topics
        this.patterns = {
            [this.queryTypes.CONCEPT_EXPLANATION]: {
                patterns: [
                    "what is",
                    "explain",
                    "describe",
                    "define",
                    "how does",
                    "tell me about"
                ],
                topics: [
                    "cpu",
                    "cache",
                    "memory",
                    "pipeline",
                    "instruction set",
                    "architecture",
                    "register",
                    "alu",
                    "control unit"
                ]
            },
            [this.queryTypes.PROBLEM_SOLVING]: {
                patterns: [
                    "solve",
                    "calculate",
                    "find",
                    "determine",
                    "compute",
                    "how many",
                    "what is the result"
                ],
                topics: [
                    "cache hit ratio",
                    "memory access time",
                    "pipeline hazard",
                    "clock cycles",
                    "performance"
                ]
            },
            [this.queryTypes.COMPARISON]: {
                patterns: [
                    "compare",
                    "difference between",
                    "versus",
                    "better",
                    "advantages",
                    "disadvantages"
                ],
                topics: [
                    "risc vs cisc",
                    "cache levels",
                    "memory types",
                    "addressing modes"
                ]
            },
            [this.queryTypes.APPLICATION]: {
                patterns: [
                    "example",
                    "use case",
                    "application",
                    "when to use",
                    "real world"
                ],
                topics: [
                    "pipelining",
                    "cache memory",
                    "virtual memory",
                    "instruction set"
                ]
            },
            [this.queryTypes.VERIFICATION]: {
                patterns: [
                    "is it correct",
                    "am i right",
                    "check my answer",
                    "verify",
                    "validate"
                ],
                topics: []  // Applicable to any topic
            }
        };
    }

    async routeQuery(query) {
        try {
            query = query.toLowerCase();
            let bestMatch = {
                type: null,
                confidence: 0,
                detectedPattern: null,
                topic: null
            };

            // Check each query type
            for (const [type, typeData] of Object.entries(this.patterns)) {
                // Check for pattern matches
                const patternMatch = typeData.patterns.find(pattern => 
                    query.includes(pattern)
                );

                if (patternMatch) {
                    // Check for topic matches if available
                    let topicMatch = null;
                    if (typeData.topics && typeData.topics.length > 0) {
                        topicMatch = typeData.topics.find(topic => 
                            query.includes(topic)
                        );
                    }

                    // Calculate confidence based on pattern and topic matches
                    const confidence = this.calculateConfidence(
                        patternMatch,
                        topicMatch,
                        query
                    );

                    // Update best match if confidence is higher
                    if (confidence > bestMatch.confidence) {
                        bestMatch = {
                            type: type,
                            confidence: confidence,
                            detectedPattern: patternMatch,
                            topic: topicMatch
                        };
                    }
                }
            }

            // Return best match if confidence meets threshold
            if (bestMatch.confidence >= 0.6) {
                return bestMatch;
            }

            // Default to concept explanation if no clear match
            return {
                type: this.queryTypes.CONCEPT_EXPLANATION,
                confidence: 0.5,
                detectedPattern: null,
                topic: null
            };

        } catch (error) {
            console.error("Error in routeQuery:", error);
            throw error;
        }
    }

    calculateConfidence(pattern, topic, query) {
        let confidence = 0;

        // Base confidence from pattern match
        confidence += 0.6;

        // Additional confidence from topic match
        if (topic) {
            confidence += 0.3;
        }

        // Adjust confidence based on query length and complexity
        const words = query.split(' ').length;
        if (words > 3 && words < 15) {
            confidence += 0.1;
        }

        // Cap confidence at 1.0
        return Math.min(confidence, 1.0);
    }
}

module.exports = { SemanticRouter };
