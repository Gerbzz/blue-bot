/** @format */

// src/handlers/eventHandler.js
const path = require("path");
const getAllFiles = require("../utils/get-all-files");

module.exports = (client, arg) => {
	const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true);

	for (const eventFolder of eventFolders) {
		const eventFiles = getAllFiles(eventFolder);
		eventFiles.sort((a, b) => a > b);
		console.log(eventFiles);

		const eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

		client.on(eventName, async (arg) => {
			for (const eventFile of eventFiles) {
				const eventFunction = require(eventFile);
				console.log(eventFile, typeof eventFunction); // Add this line
				await eventFunction(client, arg);
			}
		});
	}
};
