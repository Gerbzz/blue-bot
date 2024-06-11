/** @format */

// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const eventHandler = require("./src/handlers/event-handler.js");
const keepAlive = require("./keep-alive.js");
const checkExpiredQueues = require("./src/events/ready/checkExpiredQueues"); // Import the checkExpiredQueues function

// Connect to MongoDB
const connectDB = require("./src/database/db.js");

// Create a new Discord client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
	],
});

// This function will start the bot after ensuring the database is connected
async function startBot() {
	try {
		// Connect to the database
		await connectDB();
		// Database is connected, now we can start the event handling and keepAlive server
		eventHandler(client);
		keepAlive();
		// After database and keepAlive, log in to Discord
		await client.login(process.env.DISCORD_TOKEN);
		console.log(`Logged in as ${client.user.tag}`.green.inverse);

		// Start the interval to check for expired queues
		setInterval(async () => {
			await checkExpiredQueues(client);
		}, 1 * 60 * 1000); // Check every 5 minutes
	} catch (error) {
		console.error("Error starting the bot", error);
		process.exit(1);
	}
}

// Call the function to start the bot
startBot();
