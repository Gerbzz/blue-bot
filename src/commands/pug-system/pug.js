/** @format */

const { ApplicationCommandOptionType } = require("discord.js");
const pugModel = require("../../models/pug-model");

const userTimeouts = new Map();

module.exports = {
	devOnly: false,
	name: "pug",
	description: "Join the PUG Queue!",
	options: [
		{
			name: "duration",
			description: "Queue duration in minutes",
			type: ApplicationCommandOptionType.Integer,
			minValue: 1,
			maxValue: 240, // Set the maximum value to 240 minutes
			required: true,
		},
	],
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

			const duration = interaction.options.getInteger("duration");
			const userId = interaction.user.id;
			const userTag = interaction.user.tag;

			// Enforce maximum duration value
			if (duration > 240) {
				return interaction.reply({
					content:
						"The maximum queue duration is 240 minutes. Please enter a valid duration.",
					ephemeral: true,
				});
			}

			const existingData = await pugModel.findOne({
				serverId: guild.id,
			});

			if (!existingData) {
				console.log("PUG data not found for this server!");
				return interaction.reply(
					"PUG data not found for this server! Please run /setup first."
				);
			}

			let playerProfile = existingData.playerProfiles.find(
				(profile) => profile.userId === userId
			);

			if (!playerProfile) {
				playerProfile = {
					userId,
					userTag,
					userQueueDuration: duration,
					userELO: 0,
					wins: 0,
					losses: 0,
					isEligibleToQueue: true,
				};
				existingData.playerProfiles.push(playerProfile);
			} else {
				playerProfile.userQueueDuration = duration;
			}

			const expireTime = Date.now() + duration * 60000;

			// Check if user is already in the queue
			const existingUserIndex = existingData.queuedPlayers.findIndex(
				(player) => player.userId === userId
			);
			if (existingUserIndex !== -1) {
				// Remove the existing user entry and add the new one
				existingData.queuedPlayers.splice(existingUserIndex, 1, {
					userId,
					userTag,
					joinTime: Date.now(),
					expireTime: expireTime,
				});
			} else {
				// Add the user to the queue
				existingData.queuedPlayers.push({
					userId,
					userTag,
					joinTime: Date.now(),
					expireTime: expireTime,
				});
			}

			await existingData.save();

			await interaction.member.roles.add(
				pugRole,
				`Duration: ${duration} minutes`
			);

			// Clear existing timeout if any
			if (userTimeouts.has(userId)) {
				clearTimeout(userTimeouts.get(userId));
			}

			// Set a new timeout
			const timeout = setTimeout(async () => {
				console.log(`Expiring user ${userId} from PUG Queue`);
				await removeUserFromQueue(userId, guild.id);

				const member = guild.members.cache.get(userId);
				if (member) {
					await member.roles.remove(
						pugRole,
						`PUG Queue expired after ${duration} minutes`
					);
				}

				// Remove the user from the map after expiration
				userTimeouts.delete(userId);
			}, duration * 60000);

			// Store the timeout
			userTimeouts.set(userId, timeout);

			interaction.reply(
				`You have joined the PUG Queue for ${duration} minutes!`
			);
		} catch (error) {
			console.error("Error in PUG command:", error);
			interaction.reply("Error joining PUG Queue. Please try again!");
		}
	},
};

async function removeUserFromQueue(userId, serverId) {
	const existingData = await pugModel.findOne({ serverId });
	if (!existingData) {
		console.log(`No PUG data found for server ID: ${serverId}`);
		return;
	}

	const updatedQueuedPlayers = existingData.queuedPlayers.filter(
		(player) => player.userId !== userId
	);
	existingData.queuedPlayers = updatedQueuedPlayers;
	await existingData.save();
	console.log(
		`User ${userId} removed from queued players in server ${serverId}.`
	);
}
