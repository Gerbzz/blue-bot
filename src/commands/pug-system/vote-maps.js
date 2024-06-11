/** @format */

const { EmbedBuilder, MessageReaction } = require("discord.js");
const pugModel = require("../../models/pug-model");
require("dotenv").config();

module.exports = {
	name: "vote-maps",
	description: "Vote for maps in the PUG Queue.",
	options: [],
	callback: async (client, interaction) => {
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
					name: `${index + 1}️⃣ - ${map} •`,
					value: "0 votes",
					inline: false,
				};
			});

			const embed = new EmbedBuilder()
				.setTitle("Which map do you want to play?")
				.setDescription("React below to vote for a map.")
				.addFields(fields);

			const message = await interaction.channel.send({ embeds: [embed] });
			console.log("Message sent for voting.");

			for (let i = 0; i < mapList.length; i++) {
				await message.react(`${i + 1}️⃣`); // 1️⃣, 2️⃣, 3️⃣, ...
			}
			console.log("Reactions added to the message.");

			const filter = (reaction, user) => user.id !== message.author.id;
			const collector = message.createReactionCollector({
				filter,
				time: 10000, // 10 seconds for testing
			});

			const votedUsers = new Set();
			const roleId = process.env.ROLE_ID;

			const ROLE_ID = process.env.ROLE_ID;
			const ROLE_ID_MLG = process.env.ROLE_ID_MLG;
			const ROLE_ID_WR = process.env.ROLE_ID_WR;

			collector.on("collect", async (reaction, user) => {
				const member = await interaction.guild.members.fetch(user.id);

				const allowedRoleIds = [ROLE_ID, ROLE_ID_MLG, ROLE_ID_WR];
				if (!allowedRoleIds.some((id) => member.roles.cache.has(id))) {
					console.log(
						`User ${user.username} does not have any of the required roles.`
					);
					return;
				}

				if (votedUsers.has(user.id)) return; // User has already voted
				votedUsers.add(user.id); // Add user to the set of voted users

				// Update vote count in embed
				const embed = message.embeds[0];
				const mapIndex = parseInt(reaction.emoji.name) - 1; // Get the map index from the reaction emoji
				const mapFieldName = `${mapIndex + 1}️⃣ - ${mapList[mapIndex]} •`;
				const fieldValue = embed.fields.find((field) =>
					field.name.startsWith(mapFieldName)
				);

				// Check if fieldValue is undefined before trying to update it
				if (fieldValue) {
					fieldValue.value = `${
						parseInt(fieldValue.value.split(" ")[0] || 0) + 1
					} votes`; // Increment vote count
					await message.edit({ embeds: [embed] }); // Update the embed
					console.log(
						`User ${user.username} voted for map ${mapList[mapIndex]}.`
					);
				} else {
					console.error("Field not found:", mapFieldName);
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
					// Check if the reaction removed is part of the voting message
					if (reaction.partial) {
						try {
							await reaction.fetch();
						} catch (error) {
							console.error("Error fetching removed reaction:", error);
							return;
						}
					}

					// Update the vote count in the embed
					if (reaction instanceof MessageReaction) {
						const embed = message.embeds[0];
						const mapIndex = parseInt(reaction.emoji.name) - 1;
						const mapFieldName = `${mapIndex + 1}️⃣ - ${mapList[mapIndex]} •`;
						const fieldValue = embed.fields.find((field) =>
							field.name.startsWith(mapFieldName)
						);

						if (fieldValue) {
							fieldValue.value = `${Math.max(
								parseInt(fieldValue.value.split(" ")[0] || 0) - 1,
								0
							)} votes`; // Decrement vote count
							await message.edit({ embeds: [embed] }); // Update the embed
							console.log(
								`User ${user.username} removed their vote for map ${mapList[mapIndex]}.`
							);

							// Remove user's ID from votedUsers set
							votedUsers.delete(user.id);
						} else {
							console.error("Field not found:", mapFieldName);
						}
					}
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
					let highestVoteCount = 0;
					const winners = [];
					for (let i = 0; i < embed.fields.length; i++) {
						const mapVoteCount = parseInt(
							embed.fields[i].value.split(" ")[0] || 0
						);
						if (mapVoteCount > highestVoteCount) {
							highestVoteCount = mapVoteCount;
							winners.length = 0; // Clear previous winners
							winners.push(embed.fields[i].name.split(" - ")[1].split(" •")[0]); // Extract map name
						} else if (mapVoteCount === highestVoteCount) {
							winners.push(embed.fields[i].name.split(" - ")[1].split(" •")[0]); // Add tied maps
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
		} catch (error) {
			console.error("Error in vote-maps command:", error);
			interaction.reply("Error processing voting. Please try again!");
		}
	},
};
