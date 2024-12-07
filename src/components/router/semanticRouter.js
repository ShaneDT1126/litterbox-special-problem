const logger = require('../../utils/logger');
class SemanticRouter {
    constructor() {
        this.queryTypes = {
            CONCEPT_EXPLANATION: "concept_explanation",
            PROBLEM_SOLVING: "problem_solving",
            COMPARISON: "comparison",
            APPLICATION: "application",
            VERIFICATION: "verification",
            OUT_OF_SCOPE: "out_of_scope"
        };

        // Comprehensive Computer Architecture topic taxonomy
        this.topicTaxonomy = {
            core_topics: {
                cpu: ["processor architecture", "instruction execution", "cpu components", 
                      "control unit", "alu", "registers", "clock cycle"],
                memory: ["memory hierarchy", "cache", "ram", "rom", "virtual memory",
                        "memory management", "addressing modes"],
                instruction_set: ["instruction types", "addressing modes", "opcodes",
                                "instruction format", "risc", "cisc"],
                pipelining: ["pipeline stages", "hazards", "forwarding", "branch prediction",
                           "instruction parallelism"],
                system_architecture: ["bus architecture", "i/o systems", "interrupts",
                                    "dma", "system integration"]
            },
            related_concepts: {
                performance: ["throughput", "latency", "speedup", "efficiency",
                            "benchmarking", "optimization"],
                design_principles: ["modularity", "parallelism", "pipelining",
                                  "memory hierarchy", "cost-performance"],
                advanced_topics: ["multiprocessing", "superscalar", "out-of-order execution",
                                "cache coherence", "virtual memory management"]
            },
            context_keywords: [
                "computer", "hardware", "processor", "system", "architecture",
                "performance", "design", "implementation", "organization"
            ]
        };

        // Non-computer architecture topics for filtering
        this.nonRelevantTopics = [
            "software development", "programming languages", "web development",
            "database", "networking", "operating system", "artificial intelligence",
            "machine learning", "software engineering", "web design", "mobile development"
        ];

        // Question patterns for type identification
        this.questionPatterns = {
            concept_explanation: [
                "what is", "explain", "describe", "define", "how does",
                "tell me about", "what does", "what are"
            ],
            problem_solving: [
                "solve", "calculate", "compute", "find", "determine",
                "how many", "what is the result", "evaluate"
            ],
            comparison: [
                "compare", "difference", "versus", "vs", "better",
                "advantages", "disadvantages", "pros and cons"
            ],
            application: [
                "use", "apply", "implement", "example", "practical",
                "real world", "application", "how can"
            ],
            verification: [
                "verify", "check", "validate", "correct", "right",
                "am i right", "is this correct", "is it true"
            ]
        };

        // Log initialization
        logger.loggers.semanticRouter.info({
            type: 'initialization',
            details: {
                queryTypes: Object.keys(this.queryTypes),
                topicTaxonomyLoaded: Boolean(this.topicTaxonomy),
                coreTopicsCount: Object.keys(this.topicTaxonomy.core_topics).length,
                relatedConceptsCount: Object.keys(this.topicTaxonomy.related_concepts).length
            }
        });
    }

    async routeQuery(query) {
        const startTime = Date.now();
        try {
            logger.loggers.semanticRouter.info({
                type: 'route_start',
                details: {
                    query: query
                }
            });
    
            const normalizedQuery = query.toLowerCase().trim();
            
            const relevanceCheck = this.checkQueryRelevance(normalizedQuery);
            if (!relevanceCheck.isRelevant) {
                logger.loggers.semanticRouter.info({
                    type: 'out_of_scope_detected',
                    details: {
                        query: query,
                        reason: relevanceCheck.reason,
                        processingTime: Date.now() - startTime
                    }
                });
                return this.createOutOfScopeResponse(relevanceCheck.reason);
            }
    
            const queryAnalysis = this.analyzeQuery(normalizedQuery);
    
            if (queryAnalysis.confidence < 0.4) {
                logger.loggers.semanticRouter.info({
                    type: 'low_confidence_detected',
                    details: {
                        query: query,
                        confidence: queryAnalysis.confidence,
                        processingTime: Date.now() - startTime
                    }
                });
                return this.createClarificationRequest(queryAnalysis);
            }
    
            const result = {
                type: queryAnalysis.type,
                topic: queryAnalysis.topic,
                subtopic: queryAnalysis.subtopic,
                confidence: queryAnalysis.confidence,
                suggestedApproach: queryAnalysis.suggestedApproach,
                relevantConcepts: queryAnalysis.relevantConcepts
            };
    
            logger.loggers.semanticRouter.info({
                type: 'route_complete',
                details: {
                    query: query,
                    result: result,
                    processingTime: Date.now() - startTime
                }
            });
    
            return result;
        } catch (error) {
            logger.loggers.semanticRouter.error({
                type: 'route_error',
                details: {
                    query: query,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }
    
    checkQueryRelevance(query) {
        const startTime = Date.now();
        try {
            const nonRelevantMatch = this.nonRelevantTopics.find(topic => 
                query.includes(topic.toLowerCase())
            );
            
            if (nonRelevantMatch) {
                logger.loggers.semanticRouter.info({
                    type: 'relevance_check',
                    details: {
                        result: 'non_relevant',
                        matchedTopic: nonRelevantMatch,
                        processingTime: Date.now() - startTime
                    }
                });

                return {
                    isRelevant: false,
                    reason: `This appears to be about ${nonRelevantMatch}, which is outside my expertise in Computer Architecture.`
                };
            }

            const relevanceResult = this.checkTopicRelevance(query);

            logger.loggers.semanticRouter.info({
                type: 'relevance_check',
                details: {
                    result: relevanceResult.isRelevant ? 'relevant' : 'non_relevant',
                    relevanceDetails: relevanceResult,
                    processingTime: Date.now() - startTime
                }
            });

            return relevanceResult;
        } catch (error) {
            logger.loggers.semanticRouter.error({
                type: 'relevance_check_error',
                details: {
                    query: query,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    validateContextKeywords(query, foundKeywords) {
        // Validate that context keywords are used in relevant context
        const computerArchitecturePatterns = [
            /computer.*architecture/i,
            /hardware.*design/i,
            /system.*organization/i,
            /processor.*design/i,
            /hardware.*implementation/i
        ];

        // Check for strong patterns
        const hasStrongPattern = computerArchitecturePatterns.some(pattern => 
            pattern.test(query)
        );

        if (hasStrongPattern) {
            return true;
        }

        // Check keyword combinations
        const keywordCombinations = [
            ["computer", "hardware"],
            ["processor", "design"],
            ["system", "architecture"],
            ["hardware", "organization"]
        ];

        return keywordCombinations.some(combination => 
            combination.every(keyword => foundKeywords.includes(keyword))
        );
    }

    generateOutOfScopeReason(query) {
        const baseMessage = "This question doesn't appear to be related to Computer Architecture.";
        const helpMessage = "I can help you with topics like:";
        const examples = [
            "CPU design and organization",
            "Memory systems and hierarchy",
            "Instruction set architecture",
            "Pipelining and performance",
            "Computer hardware architecture"
        ];

        return `${baseMessage}\n${helpMessage}\n${examples.map(ex => `• ${ex}`).join('\n')}`;
    }

    createOutOfScopeResponse(reason) {
        return {
            type: this.queryTypes.OUT_OF_SCOPE,
            confidence: 1.0,
            reason: reason,
            suggestedApproach: "redirect",
            isOutOfScope: true
        };
    }

    createClarificationRequest(analysis) {
        const clarificationTemplates = {
            general: "Could you please rephrase your question specifically about computer architecture?",
            topic_specific: `Are you asking about ${analysis.topic} in the context of computer architecture?`,
            suggestion: "For example, you could ask about how it relates to processor design or system organization."
        };

        return {
            type: this.queryTypes.VERIFICATION,
            confidence: analysis.confidence,
            clarificationNeeded: true,
            message: analysis.topic ? 
                clarificationTemplates.topic_specific : 
                clarificationTemplates.general,
            suggestion: clarificationTemplates.suggestion
        };
    }

    analyzeQuery(query) {
        const startTime = Date.now();
        try {
            logger.loggers.semanticRouter.info({
                type: 'analysis_start',
                details: {
                    query: query
                }
            });

            const queryType = this.identifyQueryType(query);
            const topicAnalysis = this.identifyTopicAndSubtopic(query);
            const relevantConcepts = this.findRelevantConcepts(query, topicAnalysis);
            const confidence = this.calculateConfidence(query, queryType, topicAnalysis);
            const suggestedApproach = this.determineSuggestedApproach(
                queryType, 
                topicAnalysis, 
                confidence
            );

            const result = {
                type: queryType,
                topic: topicAnalysis.topic,
                subtopic: topicAnalysis.subtopic,
                confidence,
                suggestedApproach,
                relevantConcepts
            };

            logger.loggers.semanticRouter.info({
                type: 'analysis_complete',
                details: {
                    result: result,
                    processingTime: Date.now() - startTime
                }
            });

            return result;
        } catch (error) {
            logger.loggers.semanticRouter.error({
                type: 'analysis_error',
                details: {
                    query: query,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    identifyQueryType(query) {
        const startTime = Date.now();
        try {
            let bestMatch = {
                type: this.queryTypes.CONCEPT_EXPLANATION,
                matchCount: 0
            };

            for (const [type, patterns] of Object.entries(this.questionPatterns)) {
                const matchCount = patterns.filter(pattern => 
                    query.includes(pattern)).length;
                if (matchCount > bestMatch.matchCount) {
                    bestMatch = { type, matchCount };
                }
            }

            logger.loggers.semanticRouter.info({
                type: 'query_type_identification',
                details: {
                    identifiedType: bestMatch.type,
                    matchCount: bestMatch.matchCount,
                    processingTime: Date.now() - startTime
                }
            });

            return bestMatch.type;
        } catch (error) {
            logger.loggers.semanticRouter.error({
                type: 'query_type_identification_error',
                details: {
                    query: query,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

    identifyTopicAndSubtopic(query) {
        let bestMatch = {
            topic: null,
            subtopic: null,
            matchScore: 0,
            depth: 0
        };

        // Check core topics first
        for (const [topic, subtopics] of Object.entries(this.topicTaxonomy.core_topics)) {
            const topicMatch = this.checkTopicMatch(query, topic, subtopics);
            if (topicMatch.matchScore > bestMatch.matchScore) {
                bestMatch = topicMatch;
            }
        }

        // If no strong core topic match, check related concepts
        if (bestMatch.matchScore < 0.5) {
            for (const [concept, details] of Object.entries(this.topicTaxonomy.related_concepts)) {
                const conceptMatch = this.checkTopicMatch(query, concept, details);
                if (conceptMatch.matchScore > bestMatch.matchScore) {
                    bestMatch = conceptMatch;
                }
            }
        }

        return bestMatch;
    }

    checkTopicMatch(query, topic, subtopics) {
        const match = {
            topic: null,
            subtopic: null,
            matchScore: 0,
            depth: 0
        };

        // Check main topic
        if (query.includes(topic.toLowerCase())) {
            match.topic = topic;
            match.matchScore = 0.6;
            match.depth = 1;
        }

        // Check subtopics
        for (const subtopic of subtopics) {
            if (query.includes(subtopic.toLowerCase())) {
                match.topic = topic;
                match.subtopic = subtopic;
                match.matchScore = 0.8;
                match.depth = 2;
                break;
            }
        }

        return match;
    }

    findRelevantConcepts(query, topicAnalysis) {
        const relevantConcepts = new Set();

        // Add directly related concepts from taxonomy
        if (topicAnalysis.topic) {
            const relatedTopics = this.topicTaxonomy.core_topics[topicAnalysis.topic] || [];
            relatedTopics.forEach(topic => relevantConcepts.add(topic));
        }

        // Add concepts from context keywords
        this.topicTaxonomy.context_keywords.forEach(keyword => {
            if (query.includes(keyword)) {
                relevantConcepts.add(keyword);
            }
        });

        return Array.from(relevantConcepts);
    }

    calculateConfidence(query, queryType, topicAnalysis) {
        const startTime = Date.now();
        try {
            let confidence = 0;
            confidence += topicAnalysis.matchScore;
            confidence += this.questionPatterns[queryType].some(pattern => 
                query.includes(pattern)) ? 0.2 : 0;

            const contextKeywordCount = this.topicTaxonomy.context_keywords
                .filter(keyword => query.includes(keyword)).length;
            confidence += Math.min(contextKeywordCount * 0.05, 0.2);
            confidence += this.calculateQuerySpecificity(query, topicAnalysis);

            const finalConfidence = Math.min(confidence, 1.0);

            logger.loggers.semanticRouter.info({
                type: 'confidence_calculation',
                details: {
                    finalConfidence,
                    components: {
                        topicMatch: topicAnalysis.matchScore,
                        queryTypeClarity: confidence - topicAnalysis.matchScore,
                        contextKeywords: contextKeywordCount,
                        specificity: this.calculateQuerySpecificity(query, topicAnalysis)
                    },
                    processingTime: Date.now() - startTime
                }
            });

            return finalConfidence;
        } catch (error) {
            logger.loggers.semanticRouter.error({
                type: 'confidence_calculation_error',
                details: {
                    query: query,
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }


    calculateQuerySpecificity(query, topicAnalysis) {
        let specificity = 0;

        // Check for technical terms
        specificity += topicAnalysis.depth * 0.1;

        // Check for specific metrics or parameters
        if (/\b\d+\s*(bit|byte|hz|cycles?)\b/i.test(query)) {
            specificity += 0.1;
        }

        // Check for comparative elements
        if (/\b(versus|vs|compared|better|worse|faster|slower)\b/i.test(query)) {
            specificity += 0.05;
        }

        return Math.min(specificity, 0.2);
    }

    determineSuggestedApproach(queryType, topicAnalysis, confidence) {
        const startTime = Date.now();
        try {
            const approaches = {
                basic: {
                    method: "foundational",
                    style: "step_by_step",
                    depth: "introductory"
                },
                intermediate: {
                    method: "analytical",
                    style: "guided_discovery",
                    depth: "detailed"
                },
                advanced: {
                    method: "comprehensive",
                    style: "problem_based",
                    depth: "in_depth"
                }
            };

            let complexity = "basic";
            if (confidence > 0.7 && topicAnalysis.depth > 1) {
                complexity = "advanced";
            } else if (confidence > 0.5) {
                complexity = "intermediate";
            }

            const approach = {
                ...approaches[complexity],
                queryType,
                topicSpecific: Boolean(topicAnalysis.subtopic)
            };

            logger.loggers.semanticRouter.info({
                type: 'approach_determination',
                details: {
                    complexity,
                    approach,
                    factors: {
                        confidence,
                        topicDepth: topicAnalysis.depth,
                        hasSubtopic: Boolean(topicAnalysis.subtopic)
                    },
                    processingTime: Date.now() - startTime
                }
            });

            return approach;
        } catch (error) {
            logger.loggers.semanticRouter.error({
                type: 'approach_determination_error',
                details: {
                    message: error.message,
                    stack: error.stack,
                    processingTime: Date.now() - startTime
                }
            });
            throw error;
        }
    }

}

module.exports = SemanticRouter;
