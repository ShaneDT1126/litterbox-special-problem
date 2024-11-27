class SocraticProcessor {
    constructor() {
        this.teachingSteps = {
            UNDERSTAND: "understand",
            BREAK_DOWN: "break_down",
            GUIDE: "guide",
            VERIFY: "verify",
            ELABORATE: "elaborate",
            REFLECT: "reflect"
        };

        // Computer Architecture specific concepts and relationships
        this.domainConcepts = {
            core_concepts: [
                "cpu", "cache", "memory", "pipeline", "instruction set",
                "architecture", "register", "alu", "control unit", "bus",
                "addressing mode", "interrupt", "i/o", "processor",
                "assembly", "machine code", "fetch cycle", "execute cycle",
                "pipelining", "branch prediction", "virtual memory", "cache coherence",
                "risc", "cisc", "microarchitecture", "parallel processing"
            ],
            relationships: {
                "cpu": ["alu", "control unit", "registers", "cache"],
                "memory": ["cache", "ram", "addressing mode", "virtual memory"],
                "pipeline": ["fetch cycle", "execute cycle", "instruction set", "hazards"],
                "architecture": ["instruction set", "processor", "memory", "i/o"],
                "cache": ["memory hierarchy", "cache coherence", "replacement policy"],
                "instruction set": ["risc", "cisc", "assembly", "machine code"]
            }
        };
    }

    async processQuery(query, context, queryType) {
        try {
            // Step 1: Validate query is related to computer architecture
            if (!this.isComputerArchitectureQuery(query)) {
                return this.generateOutOfScopeResponse();
            }

            // Step 2: Extract main concept and related terms
            const conceptAnalysis = this.analyzeQuery(query);

            // Step 3: Determine complexity and approach
            const teachingStrategy = this.determineTeachingStrategy(
                conceptAnalysis,
                context,
                queryType
            );

            // Step 4: Generate Socratic steps
            const steps = await this.generateSocraticSteps(
                conceptAnalysis,
                teachingStrategy,
                context
            );

            return {
                concept: conceptAnalysis.mainConcept,
                relatedConcepts: conceptAnalysis.relatedConcepts,
                context: context,
                steps: steps,
                queryType: queryType.type,
                complexity: teachingStrategy.complexity,
                approach: teachingStrategy.approach
            };
        } catch (error) {
            console.error("Error in processQuery:", error);
            throw error;
        }
    }

    isComputerArchitectureQuery(query) {
        const normalizedQuery = query.toLowerCase();
        
        // Check if query contains any core concepts
        const containsCoreConcept = this.domainConcepts.core_concepts.some(concept => 
            normalizedQuery.includes(concept.toLowerCase())
        );

        // Check for related technical terms
        const technicalTerms = [
            "computer", "hardware", "system", "digital", "logic",
            "performance", "design", "organization", "structure"
        ];

        const containsTechnicalTerm = technicalTerms.some(term => 
            normalizedQuery.includes(term.toLowerCase())
        );

        return containsCoreConcept || containsTechnicalTerm;
    }

    analyzeQuery(query) {
        const normalizedQuery = query.toLowerCase();
        
        // Extract main concept
        const mainConcept = this.extractMainConcept(normalizedQuery);
        
        // Find related concepts
        const relatedConcepts = this.findRelatedConcepts(mainConcept);
        
        // Identify specific aspects mentioned in query
        const aspects = this.identifyQueryAspects(normalizedQuery);

        return {
            mainConcept,
            relatedConcepts,
            aspects,
            originalQuery: query
        };
    }

    extractMainConcept(normalizedQuery) {
        // Remove common question words
        const cleanedQuery = normalizedQuery
            .replace(/what is|how does|explain|describe|tell me about|can you|please|could you/g, '')
            .trim();

        // Find the first matching core concept
        const matchingConcept = this.domainConcepts.core_concepts.find(concept => 
            cleanedQuery.includes(concept.toLowerCase())
        );

        return matchingConcept || cleanedQuery;
    }

    findRelatedConcepts(mainConcept) {
        // Get directly related concepts from relationships
        const directlyRelated = this.domainConcepts.relationships[mainConcept] || [];
        
        // Find concepts that have this as a related concept
        const indirectlyRelated = Object.entries(this.domainConcepts.relationships)
            .filter(([concept, related]) => related.includes(mainConcept))
            .map(([concept]) => concept);

        return [...new Set([...directlyRelated, ...indirectlyRelated])];
    }

    identifyQueryAspects(normalizedQuery) {
        const aspects = {
            isDefinition: /what is|define|meaning of/.test(normalizedQuery),
            isProcess: /how does|how do|process|work/.test(normalizedQuery),
            isComparison: /compare|difference|versus|vs|better/.test(normalizedQuery),
            isProblem: /solve|calculate|compute|find|determine/.test(normalizedQuery),
            isApplication: /use|apply|implement|example|practical/.test(normalizedQuery)
        };

        return aspects;
    }

    generateOutOfScopeResponse() {
        return {
            concept: null,
            relatedConcepts: [],
            context: null,
            steps: [{
                type: this.teachingSteps.UNDERSTAND,
                content: "I notice your question isn't specifically about Computer Architecture. I'm specialized in Computer Architecture topics. Would you like to ask something about CPU, memory, instruction sets, or other computer hardware concepts?"
            }],
            queryType: "out_of_scope",
            complexity: "na",
            approach: "redirect"
        };
    }

    determineTeachingStrategy(conceptAnalysis, context, queryType) {
        const complexity = this.assessComplexity(conceptAnalysis);
        const approach = this.selectTeachingApproach(complexity, conceptAnalysis.aspects);

        return {
            complexity,
            approach,
            recommendedSteps: this.planTeachingSteps(approach, conceptAnalysis),
            adaptations: this.determineAdaptations(complexity, conceptAnalysis.aspects)
        };
    }

    assessComplexity(conceptAnalysis) {
        const complexityFactors = {
            // Concept complexity
            conceptDepth: this.getConceptDepth(conceptAnalysis.mainConcept),
            relatedConceptsCount: conceptAnalysis.relatedConcepts.length,
            
            // Query complexity
            aspectCount: Object.values(conceptAnalysis.aspects)
                .filter(Boolean).length,
            
            // Topic complexity based on predefined weights
            topicWeight: this.getTopicComplexityWeight(conceptAnalysis.mainConcept)
        };

        const complexityScore = 
            (complexityFactors.conceptDepth * 2) +
            (complexityFactors.relatedConceptsCount * 1.5) +
            (complexityFactors.aspectCount * 1) +
            (complexityFactors.topicWeight * 2);

        return {
            level: this.determineComplexityLevel(complexityScore),
            factors: complexityFactors,
            score: complexityScore
        };
    }

    getConceptDepth(concept) {
        const conceptHierarchy = {
            basic: ["register", "alu", "bus", "cache"],
            intermediate: ["pipeline", "memory hierarchy", "instruction set"],
            advanced: ["branch prediction", "cache coherence", "virtual memory"]
        };

        if (conceptHierarchy.basic.includes(concept)) return 1;
        if (conceptHierarchy.intermediate.includes(concept)) return 2;
        if (conceptHierarchy.advanced.includes(concept)) return 3;
        return 1; // Default to basic if not found
    }

    getTopicComplexityWeight(concept) {
        const weights = {
            "cpu": 1.5,
            "cache": 2,
            "pipeline": 2.5,
            "virtual memory": 3,
            "cache coherence": 3,
            "branch prediction": 2.5
        };
        return weights[concept] || 1;
    }

    determineComplexityLevel(score) {
        if (score <= 5) return "basic";
        if (score <= 8) return "intermediate";
        return "advanced";
    }

    selectTeachingApproach(complexity, aspects) {
        const approaches = {
            basic: {
                style: "foundational",
                pacing: "gradual",
                analogyUse: "frequent",
                questionDepth: "surface"
            },
            intermediate: {
                style: "guided_discovery",
                pacing: "moderate",
                analogyUse: "selective",
                questionDepth: "moderate"
            },
            advanced: {
                style: "problem_based",
                pacing: "challenging",
                analogyUse: "technical",
                questionDepth: "deep"
            }
        };

        return approaches[complexity.level];
    }

    async generateSocraticSteps(conceptAnalysis, teachingStrategy, context) {
        const steps = [];
        const { mainConcept, aspects } = conceptAnalysis;
        const { complexity } = teachingStrategy;

        // Step 1: Initial Understanding Assessment
        steps.push(this.createUnderstandingAssessment(mainConcept, complexity.level));

        // Step 2: Concept Breakdown
        steps.push(...this.createConceptBreakdown(mainConcept, teachingStrategy));

        // Step 3: Guided Exploration
        steps.push(...this.createGuidedExploration(conceptAnalysis, teachingStrategy));

        // Step 4: Verification and Application
        steps.push(...this.createVerificationSteps(conceptAnalysis, teachingStrategy));

        // Step 5: Connection Building
        steps.push(...this.createConnectionSteps(conceptAnalysis, teachingStrategy));

        // Step 6: Reflection and Summary
        steps.push(this.createReflectionStep(conceptAnalysis, teachingStrategy));

        return this.filterAndPrioritizeSteps(steps, teachingStrategy);
    }

    createUnderstandingAssessment(concept, complexityLevel) {
        const assessmentTemplates = {
            basic: [
                `What do you already know about ${concept}?`,
                `Can you describe ${concept} in your own words?`,
                `What comes to mind when you think about ${concept}?`
            ],
            intermediate: [
                `How would you explain the role of ${concept} in a computer system?`,
                `What aspects of ${concept} are you most familiar with?`,
                `What challenges have you encountered when learning about ${concept}?`
            ],
            advanced: [
                `How does ${concept} relate to other computer architecture concepts you've studied?`,
                `What are the key principles underlying ${concept}?`,
                `What complexities do you see in understanding ${concept}?`
            ]
        };

        return {
            type: this.teachingSteps.UNDERSTAND,
            content: this.selectRandomTemplate(assessmentTemplates[complexityLevel]),
            priority: 1
        };
    }

    createConceptBreakdown(concept, teachingStrategy) {
        const steps = [];
        const components = this.getConceptComponents(concept);

        components.forEach((component, index) => {
            steps.push({
                type: this.teachingSteps.BREAK_DOWN,
                content: this.generateComponentQuestion(component, teachingStrategy),
                priority: index + 2
            });
        });

        return steps;
    }

    getConceptComponents(concept) {
        const componentMap = {
            "cpu": ["control unit", "alu", "registers"],
            "cache": ["cache lines", "replacement policy", "write policy"],
            "pipeline": ["fetch", "decode", "execute", "memory", "writeback"],
            // Add more concept breakdowns
        };

        return componentMap[concept] || [concept];
    }

    generateComponentQuestion(component, teachingStrategy) {
        const { complexity } = teachingStrategy;
        const questionTemplates = {
            basic: `What do you think is the purpose of the ${component}?`,
            intermediate: `How might the ${component} interact with other parts of the system?`,
            advanced: `What design considerations would affect the implementation of the ${component}?`
        };

        return questionTemplates[complexity.level];
    }

    selectRandomTemplate(templates) {
        return templates[Math.floor(Math.random() * templates.length)];
    }

    filterAndPrioritizeSteps(steps, teachingStrategy) {
        // Sort steps by priority
        const sortedSteps = steps.sort((a, b) => a.priority - b.priority);

        // Limit number of steps based on complexity
        const stepLimits = {
            basic: 5,
            intermediate: 7,
            advanced: 9
        };

        return sortedSteps.slice(0, stepLimits[teachingStrategy.complexity.level]);
    }

    createGuidedExploration(conceptAnalysis, teachingStrategy) {
        const steps = [];
        const { mainConcept, aspects } = conceptAnalysis;
        const { complexity } = teachingStrategy;

        // Add exploration questions based on concept aspects
        if (aspects.isProcess) {
            steps.push(...this.createProcessExplorationSteps(mainConcept, complexity.level));
        }
        if (aspects.isComparison) {
            steps.push(...this.createComparisonExplorationSteps(mainConcept, conceptAnalysis.relatedConcepts));
        }
        if (aspects.isProblem) {
            steps.push(...this.createProblemSolvingSteps(mainConcept, complexity.level));
        }

        return steps.map((step, index) => ({
            ...step,
            priority: index + 5 // Start priority after concept breakdown
        }));
    }

    createProcessExplorationSteps(concept, complexityLevel) {
        const processTemplates = {
            basic: [
                `What do you think happens first in ${concept}?`,
                `What might be the next step after that?`,
                `How do you think this process completes?`
            ],
            intermediate: [
                `What conditions might affect the ${concept} process?`,
                `How might different scenarios change the process flow?`,
                `What potential bottlenecks do you see in this process?`
            ],
            advanced: [
                `How might we optimize this process?`,
                `What trade-offs might we encounter in different implementations?`,
                `How does this process handle edge cases?`
            ]
        };

        return processTemplates[complexityLevel].map(content => ({
            type: this.teachingSteps.GUIDE,
            content
        }));
    }

    createComparisonExplorationSteps(concept, relatedConcepts) {
        return relatedConcepts.slice(0, 2).map(relatedConcept => ({
            type: this.teachingSteps.GUIDE,
            content: `How might ${concept} differ from ${relatedConcept} in terms of functionality?`
        }));
    }

    createProblemSolvingSteps(concept, complexityLevel) {
        const problemTemplates = {
            basic: [
                `What information would we need to solve a problem involving ${concept}?`,
                `How would we start approaching this problem?`
            ],
            intermediate: [
                `What factors should we consider when optimizing ${concept}?`,
                `How might different constraints affect our solution?`
            ],
            advanced: [
                `How would we evaluate different solution approaches?`,
                `What performance metrics should we consider?`
            ]
        };

        return problemTemplates[complexityLevel].map(content => ({
            type: this.teachingSteps.GUIDE,
            content
        }));
    }

    createVerificationSteps(conceptAnalysis, teachingStrategy) {
        const { mainConcept } = conceptAnalysis;
        const { complexity } = teachingStrategy;

        const verificationTemplates = {
            basic: [
                `Can you explain ${mainConcept} in your own words?`,
                `How would you verify if your understanding is correct?`
            ],
            intermediate: [
                `What evidence would support your explanation of ${mainConcept}?`,
                `How would you test your understanding in a practical scenario?`
            ],
            advanced: [
                `How would you validate your understanding of ${mainConcept} in different contexts?`,
                `What experiments could we design to test our assumptions?`
            ]
        };

        return verificationTemplates[complexity.level].map((content, index) => ({
            type: this.teachingSteps.VERIFY,
            content,
            priority: index + 10 // High priority for verification
        }));
    }

    createConnectionSteps(conceptAnalysis, teachingStrategy) {
        const { mainConcept, relatedConcepts } = conceptAnalysis;
        const steps = [];

        // Create connection questions
        relatedConcepts.slice(0, 2).forEach(relatedConcept => {
            steps.push({
                type: this.teachingSteps.ELABORATE,
                content: `How does ${mainConcept} interact with ${relatedConcept}?`,
                priority: 8
            });
        });

        // Add real-world connection
        steps.push({
            type: this.teachingSteps.ELABORATE,
            content: `Can you think of a real-world scenario where ${mainConcept} would be crucial?`,
            priority: 9
        });

        return steps;
    }

    createReflectionStep(conceptAnalysis, teachingStrategy) {
        const { mainConcept } = conceptAnalysis;
        const { complexity } = teachingStrategy;

        const reflectionTemplates = {
            basic: `What was the most interesting thing you learned about ${mainConcept}?`,
            intermediate: `How has your understanding of ${mainConcept} evolved during our discussion?`,
            advanced: `What new questions about ${mainConcept} have emerged from our discussion?`
        };

        return {
            type: this.teachingSteps.REFLECT,
            content: reflectionTemplates[complexity.level],
            priority: 15 // Highest priority, should come last
        };
    }
}

module.exports = { SocraticProcessor };
