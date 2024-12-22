const { MemoryStorage, MessageFactory } = require("botbuilder");
const path = require("path");
const config = require("../config");

// See https://aka.ms/teams-ai-library to learn more about the Teams AI library.
const { Application, ActionPlanner, OpenAIModel, PromptManager } = require("@microsoft/teams-ai");

// Initialize data source
const { MyDataSource } = require('./myDataSource');

// Import logger
const logger = require('../utils/logger');

//Import OpenAI Embeddings
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");

// Import monitoring components
const MonitoringService = require('../components/benchmarking/monitoringService');


// Initialize monitoring service
const monitoringService = new MonitoringService();


// Create AI components
const model = new OpenAIModel({
  apiKey: config.openAIKey,
  defaultModel: config.openAIModelName,

  useSystemMessages: true,
  logRequests: true,
});

const prompts = new PromptManager({
  promptsFolder: path.join(__dirname, "../prompts"),
});

const systemMessage = `You are a Computer Architecture tutor focused ONLY on teaching computer organization and architecture concepts using a scaffolding approach.

CORE PRINCIPLES:
- NEVER provide direct answers
- ONLY address Computer Architecture topics
- For non-Computer Architecture questions, politely redirect users to ask about computer hardware, processors, memory systems, or related topics

TEACHING APPROACH:
1. Support Level Assessment:
   - Assess student's current understanding
   - Identify knowledge gaps
   - Adjust support level accordingly

2. Scaffolding Techniques:
   - Break complex concepts into manageable parts
   - Provide structured guidance
   - Use conceptual scaffolds for theoretical understanding
   - Use procedural scaffolds for step-by-step processes
   - Gradually reduce support as understanding improves

3. Learning Support:
   - Use analogies and examples to build on existing knowledge
   - Provide hints and cues instead of answers
   - Guide students through problem-solving processes
   - Encourage self-discovery and critical thinking

4. Knowledge Construction:
   - Help students build mental models
   - Connect new concepts to previously learned material
   - Validate understanding through guided questions
   - Support progressive concept development

RESPONSE STRUCTURE:
1. First: Assess current understanding
2. Then: Provide appropriate scaffolding
3. Finally: Guide towards self-discovery

Remember: Your role is to support learning through structured guidance, not to provide direct answers.`;

// Define storage and application
const storage = new MemoryStorage();
// const app = new Application({
//   storage,
//   ai: {
//     planner,
//   },
// });

let app;
let myDataSource;
let planner;

const DATA_SOURCE_NAME = 'my-ai-search';
let isInitialized = false;

// Initialize systems
async function initializeSystems() {

    if (isInitialized) {
        console.log("Systems already initialized. Skipping...");
        return { myDataSource, app, planner };
    }

    return await monitoringService.monitorOperation(
        'initialization',
        'app',
        async () => {
            try {
                const embeddingModel = new OpenAIEmbeddings({
                    openAIApiKey: config.openAIKey,
                });

                // Initialize MyDataSource
                myDataSource = new MyDataSource(DATA_SOURCE_NAME);
                await myDataSource.init();
                
                // Create a new planner with the DataSource
                planner = new ActionPlanner({
                    model,
                    prompts,
                    defaultPrompt: "chat",
                    systemMessage
                });

                // Log the current state of data sources
                console.log("Current data sources:", planner.prompts.dataSources);

                
                // Add data source to planner
                if (planner.prompts.dataSources === undefined) {
                    console.log("Initializing data sources object");
                    planner.prompts.dataSources = {};
                }

                if (!planner.prompts.hasDataSource(DATA_SOURCE_NAME)) {
                    console.log(`Adding data source: ${DATA_SOURCE_NAME}`);
                    planner.prompts.addDataSource(myDataSource);
                } else {
                    console.log(`Data source ${DATA_SOURCE_NAME} already exists`);
                }

                  // Log the updated state of data sources
                  console.log("Updated data sources:", planner.prompts.dataSources);

                 // Create the application with the initialized planner
                 app = new Application({
                    storage,
                    ai: {
                        planner,
                    },
                });

                // Attach message handlers
                attachMessageHandlers();

                logger.loggers.app.info({
                    type: 'system_initialization_complete',
                    details: { status: 'success', dataSourceName: DATA_SOURCE_NAME }
                });

                isInitialized = true;
                return { myDataSource, app, planner };
            } catch (error) {
                logger.loggers.app.error({
                    type: 'system_initialization_error',
                    details: {
                        message: error.message,
                        stack: error.stack
                    }
                });
                throw error;
            }
        }
    );
}

// Message handling
function attachMessageHandlers() {
    // Message handler
    app.message("*", async (context, next) => {
        try {
            console.log("Received message:", context.activity.text);

            if (!myDataSource || !planner) {
                throw new Error("MyDataSource not initialized");
            }

            // Use the planner to process the message
            const result = await planner.runAction(context);

            if (result) {
                await context.sendActivity(MessageFactory.text(result));
            } else {
                // Fallback to myDataSource if planner doesn't handle it
                const response = await myDataSource.processQuery(userQuery, sessionId);
                await context.sendActivity(MessageFactory.text(response.content));
            }

            // Increment the turn counter
            context.turnState.set('currentTurn', (context.turnState.get('currentTurn') || 1) + 1);

        } catch (error) {
            console.error("Error in message handling:", error);
            logger.loggers.app.error({
                type: 'message_processing_error',
                details: {
                    message: error.message,
                    stack: error.stack
                }
            });
            
            const errorResponse = "I apologize, but I encountered an error processing your request. Please try again.";
            await context.sendActivity(MessageFactory.text(errorResponse));
        }
        await next();
    });

    // Feedback handler
    app.message(/^feedback: (positive|negative)$/i, async (context, next) => {
        const feedbackType = context.matches[1].toLowerCase();
        const isPositive = feedbackType === 'positive';
        const sessionId = context.activity.conversation.id;

        const updatedFeedback = await myDataSource.scaffoldingSystem.feedbackSystem.processFeedback(sessionId, isPositive);
        
        await context.sendActivity(MessageFactory.text(`Thank you for your ${feedbackType} feedback! It helps me improve.`));
        
        logger.loggers.app.info({
            type: 'user_feedback_received',
            details: { sessionId, feedbackType, updatedFeedback }
        });

        await next();
    });

    app.conversationUpdate("membersAdded", async (turnContext) => {
        const welcomeText = "Hello! I'm Litterbox, your Computer Organization Architecture tutor. What would you like to learn about?";
        for (const member of turnContext.activity.membersAdded) {
          if (member.id !== turnContext.activity.recipient.id) {
            await turnContext.sendActivity(MessageFactory.text(welcomeText));
          }
        }
      });
}

// Initialize the system before exporting the app
initializeSystems()
    .then(({ app: initializedApp }) => {
        module.exports = initializedApp;
    })
    .catch(error => {
        console.error("Failed to initialize systems:", error);
        process.exit(1);
    });

// app.performanceReport = async (category) => {
//     return await monitoringService.getPerformanceReport(category);
//   };
  


const initializedApp = initializeSystems().then(({ app }) => {
    console.log("App initialized successfully");
    return app;
}).catch(error => {
    console.error("Failed to initialize app:", error);
    throw error;
});

module.exports = initializedApp;
