/** @format */

const { EmbedBuilder } = require("discord.js");
const pugModel = require("../../models/pug-model");
require("dotenv").config();

let commandCooldown = false;

module.exports = {
	name: "mapvote",
	description: "Vote for maps in the PUG Queue.",
	options: [],
	callback: async (client, interaction) => {
		if (commandCooldown) {
			return interaction.reply({
				content:
					"The mapvote command is on cooldown. Please wait 3 minutes before using it again.",
				ephemeral: true,
			});
		}

		try {
			const pugData = await pugModel.findOne({
				serverId: interaction.guild.id,
			});

			if (!pugData) {
				console.log("PUG data not found for this server!");
				return interaction.reply(
					"PUG data not found for this server! Please run /setup first."
				);
			}

			const mapList = pugData.mapList;
			if (!mapList || mapList.length === 0) {
				console.log("Map list is empty!");
				return interaction.reply(
					"Map list is empty. Please add maps using /setup command."
				);
			}

			const fields = mapList.map((map, index) => {
				return {
					name: `${index + 1}️⃣ - ${map}`,
					value: "\n", // Add a newline character
					inline: false,
				};
			});

			const embed = new EmbedBuilder()
				.setTitle("Which map do you want to play?")
				.setDescription("React below to vote for a map.")
				.setColor("#112b80") // Blue color
				.addFields(fields);

			// Defer the initial reply
			await interaction.deferReply({ ephemeral: false });
			const message = await interaction.channel.send({ embeds: [embed] });
			console.log("Message sent for voting.");

			// Add reactions to the message
			const reactionPromises = mapList.map((_, index) =>
				message.react(`${index + 1}️⃣`)
			);
			await Promise.all(reactionPromises);
			console.log("Reactions added to the message.");

			// Create a reaction collector
			const filter = (reaction, user) => user.id !== message.author.id;
			const collector = message.createReactionCollector({
				filter,
				time: 10000, // 3 minutes for testing
			});

			// Handle reactions
			const votedUsers = new Set();
			const ROLE_ID = process.env.ROLE_ID;
			const ROLE_ID_MLG = process.env.ROLE_ID_MLG;
			const ROLE_ID_WR = process.env.ROLE_ID_WR;
			const rolesMention = [ROLE_ID, ROLE_ID_MLG, ROLE_ID_WR]
				.map((roleId) => `<@&${roleId}>`)
				.join(" ");

			collector.on("collect", async (reaction, user) => {
				const member = await interaction.guild.members.fetch(user.id);

				const allowedRoleIds = [ROLE_ID, ROLE_ID_MLG, ROLE_ID_WR];
				if (!allowedRoleIds.some((id) => member.roles.cache.has(id))) {
					console.log(
						`User ${user.username} does not have any of the required roles.`
					);
					return;
				}

				if (!votedUsers.has(`${user.id}-${reaction.emoji.name}`)) {
					console.log(
						`User ${user.username} voted for map ${
							mapList[parseInt(reaction.emoji.name) - 1]
						}.`
					);

					// Add user's ID and reaction emoji name to votedUsers set
					votedUsers.add(`${user.id}-${reaction.emoji.name}`);
				}
			});

			client.on("messageReactionRemove", async (reaction, user) => {
				if (user.bot) return; // Ignore reactions from bots

				const member = await interaction.guild.members.fetch(user.id);

				const allowedRoleIds = [ROLE_ID, ROLE_ID_MLG, ROLE_ID_WR];
				if (!allowedRoleIds.some((id) => member.roles.cache.has(id))) {
					console.log(
						`User ${user.username} does not have any of the required roles.`
					);
					return;
				}

				if (reaction.message.id === message.id) {
					console.log(
						`User ${user.username} removed their vote for map ${
							mapList[parseInt(reaction.emoji.name) - 1]
						}.`
					);

					// Remove user's ID and reaction emoji name from votedUsers set
					votedUsers.delete(`${user.id}-${reaction.emoji.name}`);
				}
			});

			collector.on("end", async () => {
				console.log("Voting ended. Processing results...");

				try {
					const fetchedMessage = await message.channel.messages.fetch(
						message.id
					); // Fetch the latest message
					const embed = fetchedMessage.embeds[0]; // Get the embed from the fetched message

					// Process votes and calculate winner(s)
					const reactionCounts = fetchedMessage.reactions.cache.map(
						(reaction) => ({
							emoji: reaction.emoji.name,
							count: reaction.count - 1, // Subtract the bot's reaction
						})
					);

					let highestVoteCount = 0;
					const winners = [];

					for (let i = 0; i < reactionCounts.length; i++) {
						const mapVoteCount = reactionCounts[i].count;
						if (mapVoteCount > highestVoteCount) {
							highestVoteCount = mapVoteCount;
							winners.length = 0; // Clear previous winners
							winners.push(mapList[i]); // Add the current map
						} else if (mapVoteCount === highestVoteCount) {
							winners.push(mapList[i]); // Add tied maps
						}
					}

					let resultDescription;
					if (winners.length === 1) {
						resultDescription = `The winning map is: **${winners[0]}** with ${highestVoteCount} votes!`;
					} else if (winners.length > 1) {
						resultDescription = `It's a tie! The winning maps are: **${winners.join(
							", "
						)}** with ${highestVoteCount} votes each!`;
					} else {
						resultDescription = "No votes were cast for any map.";
					}

					// Create the results embed
					const resultsEmbed = new EmbedBuilder()
						.setTitle("Voting Results")
						.setDescription(resultDescription)
						.setColor("#112b80") // Blue color
						.addFields(
							{
								name: "NY 1",
								value:
									"steam://connect/45.63.23.48:27015/hipfire\nhttps://tinyurl.com/BlueNY1\nConsole Command: connect 45.63.23.48:27015/hipfire",
								inline: false,
							},
							{
								name: "NY 2",
								value:
									"steam://connect/45.63.23.48:27016/hipfire\nhttps://tinyurl.com/BlueNY2\nConsole Command: connect 45.63.23.48:27016/hipfire",
								inline: false,
							},
							{
								name: "Dallas 1",
								value:
									"steam://connect/103.214.110.114/hipfire\nhttps://tinyurl.com/BlueDal3\nConsole Command: connect 103.214.110.114/hipfire",
								inline: false,
							},
							{
								name: "Dallas 2",
								value:
									"steam://connect/45.32.202.115:27016/hipfire\nhttps://tinyurl.com/BlueDal2\nConsole Command: connect 45.32.202.115:27016/hipfire",
								inline: false,
							}
						);

					// Send the results embed
					await interaction.channel.send({ embeds: [resultsEmbed] });
				} catch (error) {
					console.error("Error processing votes:", error);
					await interaction.channel.send(
						"Error processing voting results. Please try again!"
					);
				}
			});

			// Set command cooldown and clear after 3 minutes (180000 milliseconds)
			commandCooldown = true;
			setTimeout(() => {
				commandCooldown = false;
			}, 180000);

			// Follow up message mentioning the roles
			await interaction.followUp({
				content: `${rolesMention}, voting for maps in the PUG Queue has started!`,
				ephemeral: false,
			});
		} catch (error) {
			console.error("Error executing the mapvote command:", error);
			await interaction.reply(
				"An error occurred while starting the voting. Please try again!"
			);
		}
	},
};
