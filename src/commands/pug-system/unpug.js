/** @format */

const pugModel = require("../../models/pug-model");

module.exports = {
	devOnly: false,
	name: "unpug",
	description: "Leave the PUG Queue!",
	callback: async (client, interaction) => {
		try {
			const interactionGuildId = interaction.guild.id;
			console.log(`Interaction received from guild: ${interactionGuildId}`);

			// Fetch the guild directly
			const guild = await client.guilds.fetch(interactionGuildId);
			console.log(`Fetched guild data: ${guild.id}`);

			const pugRole = guild.roles.cache.find(
				(role) => role.name === "PUG Queue"
			);
			if (!pugRole) {
				console.log("PUG Queue role not found!");
				return interaction.reply("PUG Queue role not found!");
			}

			const userId = interaction.user.id;

			const existingData = await pugModel.findOne({
				serverId: guild.id,
			});

			if (!existingData) {
				console.log("PUG data not found for this server!");
				return interaction.reply(
					"PUG data not found for this server! Please run /setup first."
				);
			}

			const updatedQueuedPlayers = existingData.queuedPlayers.filter(
				(player) => player.userId !== userId
			);
			existingData.queuedPlayers = updatedQueuedPlayers;

			await existingData.save();

			const member = guild.members.cache.get(userId);
			if (member) {
				await member.roles.remove(pugRole, `User left the PUG Queue`);
			}

			interaction.reply(`You have left the PUG Queue.`);
		} catch (error) {
			console.error("Error in UNPUG command:", error);
			interaction.reply("Error leaving PUG Queue. Please try again!");
		}
	},
};
