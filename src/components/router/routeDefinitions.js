const { Route } = require('./semanticRouter');

const routes = [
    new Route("greeting", ["hello", "hi", "hey"], async (query) => "Hello! How can I help you with computer architecture today?"),
    new Route("farewell", ["goodbye", "bye", "see you"], async (query) => "Goodbye! Feel free to return if you have more questions about computer architecture."),
    new Route("help", ["help", "assistance", "support"], async (query) => "How may I assist you with computer architecture concepts today?"),
    new Route("cpu", ["cpu", "processor", "central processing unit"], async (query) => "The CPU is a core component of computer architecture. What would you like to know about it?"),
    new Route("memory", ["memory", "ram", "rom"], async (query) => "Memory is crucial in computer architecture. What aspect of memory systems would you like to explore?"),
    new Route("instruction_set", ["instruction set", "isa", "instruction set architecture"], async (query) => "The instruction set architecture is fundamental to how a CPU operates. What specific aspect of ISA are you interested in?"),
    new Route("cache", ["cache", "cache memory"], async (query) => "Cache memory plays a crucial role in improving CPU performance. What would you like to know about cache systems?"),
    new Route("pipelining", ["pipeline", "pipelining"], async (query) => "Pipelining is a key technique for improving CPU performance. What aspect of pipelining would you like to explore?"),
];

module.exports = routes;
