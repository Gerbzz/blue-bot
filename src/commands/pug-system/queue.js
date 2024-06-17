/** @format */

const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

module.exports = {
	devOnly: false,
	name: "queue",
	description:
		"View members in the PUG Queue, Missed Last Game, and Waiting Room roles.",
	callback: async (client, interaction) => {
		try {
			const guild = interaction.guild;
			const pugRole = guild.roles.cache.get(process.env.ROLE_ID);
			const missedLastGameRole = guild.roles.cache.get(process.env.ROLE_ID_MLG);
			const waitingRoomRole = guild.roles.cache.get(process.env.ROLE_ID_WR);

			if (!pugRole || !missedLastGameRole || !waitingRoomRole) {
				console.log("One or more roles not found!");
				return interaction.reply("One or more roles not found!");
			}

			const pugMembers = pugRole.members.map((member) => member.user.username);
			const missedLastGameMembers = missedLastGameRole.members.map(
				(member) => member.user.username
			);
			const waitingRoomMembers = waitingRoomRole.members.map(
				(member) => member.user.username
			);

			const totalMembersSet = new Set();
			pugRole.members.forEach((member) => totalMembersSet.add(member.id));
			missedLastGameRole.members.forEach((member) =>
				totalMembersSet.add(member.id)
			);
			waitingRoomRole.members.forEach((member) =>
				totalMembersSet.add(member.id)
			);
			const totalMembers = totalMembersSet.size;

			const embed = new EmbedBuilder()
				.setTitle("PUG Queue")
				.addFields(
					{
						name: "Count",
						value: `${pugMembers.length}/10`,
					},
					{
						name: "Members",
						value: pugMembers.length > 0 ? pugMembers.join("\n") : "None",
					}
				)
				.setColor("#112b80") // Blue color
				.setTimestamp();

			interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error("Error in QUEUE command:", error);
			interaction.reply("Error fetching queue information. Please try again!");
		}
	},
};
