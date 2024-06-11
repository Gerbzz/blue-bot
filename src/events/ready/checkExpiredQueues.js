/** @format */

require("dotenv").config();
const pugModel = require("../../models/pug-model");

module.exports = async (client) => {
	console.log("Starting expired queue checker...");

	try {
		const allPugData = await pugModel.find({});
		console.log(`Found ${allPugData.length} PUG records in the database.`);

		for (const data of allPugData) {
			const { serverId, queuedPlayers } = data;
			console.log(
				`Server ID: ${serverId} - Queued players count: ${queuedPlayers.length}`
			);

			const currentTime = Date.now();
			const expiredPlayers = queuedPlayers.filter(
				(player) => player.expireTime <= currentTime
			);
			console.log(
				`Server ID: ${serverId} - Found ${expiredPlayers.length} expired players.`
			);

			const guild = client.guilds.cache.get(serverId);
			if (guild) {
				console.log(`Guild found: ${guild.name} (${guild.id}).`);

				// Get the role ID from environment variables
				const pugRoleId = process.env.ROLE_ID;
				const pugRole = guild.roles.cache.get(pugRoleId);

				if (!pugRole) {
					console.log("PUG role not found in guild.");
					continue;
				}

				// Fetch all members to ensure cache is up to date
				await guild.members.fetch();

				// Count members with the "PUG Queue" role
				const pugQueueMembers = guild.members.cache.filter((member) =>
					member.roles.cache.has(pugRoleId)
				);

				console.log(
					`Number of members with PUG Queue role: ${pugQueueMembers.size}`
				);

				// Handle expired players
				for (const player of expiredPlayers) {
					const { userId, userTag } = player;
					console.log(
						`Processing expired player: ${userTag} (${userId}) in server ${serverId}.`
					);

					const member = guild.members.cache.get(userId);
					if (member) {
						console.log(`Member found: ${member.user.tag} (${member.id}).`);
						await member.roles.remove(
							pugRole,
							`PUG Queue expired during bot downtime`
						);
						console.log(
							`Removed PUG role from member: ${member.user.tag} (${member.id}).`
						);
					} else {
						console.log("Member not found in guild.");
					}

					await removeUserFromQueue(userId, serverId);
					console.log(
						`Removed user ${userTag} (${userId}) from queue in server ${serverId}.`
					);
				}
			} else {
				console.log("Guild not found for server ID:", serverId);
			}
		}
	} catch (error) {
		console.error("Error checking expired queues on startup:", error);
	}
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
