const app = require("./src/app");
const db = require("./src/models");
const ExpressError = require("./src/utils/expressError.js");
const { initSocket } = require('./src/services/socketService');
const http = require('http'); // <-- ✅ ADD THIS LINE

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await db.sequelize.sync({ alter: false });
        console.log("Database synced");

        // Create HTTP server
        const server = http.createServer(app);

        // Initialize Socket.IO
        initSocket(server);
        // Start listening on the HTTP server instance so socket.io is attached correctly
        server.listen(PORT, () => {
            console.log(`Server is running on Port : ${PORT}`);
        });
    } catch (error) {
        console.error("Error syncing database:", error);
        throw new ExpressError(`Failed to sync database: ${error.message}`, 500);
    }
}
startServer();