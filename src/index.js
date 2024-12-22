// Import required packages
const restify = require("restify");

// This bot's adapter
const adapter = require("./adapter");

// This bot's main dialog (now a promise)
const appPromise = require("./app/app");

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

// Initialize the bot
appPromise.then(app => {
    server.listen(process.env.port || process.env.PORT || 3978, () => {
        console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
    });

    // Listen for incoming server requests.
    server.post("/api/messages", async (req, res) => {
        // Route received a request to adapter for processing
        await adapter.process(req, res, async (context) => {
            // Dispatch to application for routing
            await app.run(context);
        });
    });
}).catch(error => {
    console.error("Failed to initialize app:", error);
    process.exit(1);
});
