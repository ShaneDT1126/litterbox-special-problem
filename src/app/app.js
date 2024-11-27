const { MemoryStorage, MessageFactory } = require("botbuilder");
const path = require("path");
const config = require("../config");

// See https://aka.ms/teams-ai-library to learn more about the Teams AI library.
const { Application, ActionPlanner, OpenAIModel, PromptManager } = require("@microsoft/teams-ai");
const { MyDataSource } = require("./myDataSource");

const DocumentProcessor = require('../components/rag/documentProcessor');
const { VectorStore } = require('../components/rag/vectorStore');


// Initialize RAG components
const documentProcessor = new DocumentProcessor();
const vectorStore = new VectorStore();

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

const planner = new ActionPlanner({
  model,
  prompts,
  defaultPrompt: "chat",
});

async function initializeRAGSystem() {
  try {
      console.log("Initializing RAG system...");
      await vectorStore.initialize();

      const stats = await vectorStore.getCollectionStats();
      if (stats.documentCount === 0) {
          console.log("Processing and storing documents...");
          const processedDocs = await documentProcessor.processDocuments();
          await vectorStore.addDocuments(processedDocs);
      }
      console.log("RAG system initialized successfully");
  } catch (error) {
      console.error("Error initializing RAG system:", error);
  }
}

// Register your data source with planner
const myDataSource = new MyDataSource("my-ai-search");
myDataSource.init().catch(console.error);
planner.prompts.addDataSource(myDataSource);

// Define storage and application
const storage = new MemoryStorage();
const app = new Application({
  storage,
  ai: {
    planner,
  },
});

// Initialize RAG system before handling messages
initializeRAGSystem().catch(console.error);

// Use the correct Teams AI Library method for handling messages
app.message("*", async (context, next) => {
  try {
      if (context.activity.text) {
          // Get relevant content from vector store
          const ragResults = await vectorStore.query(context.activity.text);
          // Add RAG results to turn state
          context.turnState.set('ragContent', ragResults);
      }
  } catch (error) {
      console.error("Error in message handling:", error);
  }
  await next();
});

app.conversationUpdate("membersAdded", async (turnContext) => {
  const welcomeText = "Hello! I'm Litterbox, your Computer Architecture tutor. I'll help guide you through concepts using questions and examples. What would you like to learn about?";
  for (const member of turnContext.activity.membersAdded) {
    if (member.id !== turnContext.activity.recipient.id) {
      await turnContext.sendActivity(MessageFactory.text(welcomeText));
    }
  }
});

module.exports = app;
