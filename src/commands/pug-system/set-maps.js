/** @format */
const {
	ApplicationCommandOptionType,
	PermissionFlagsBits,
} = require("discord.js");
const pugModel = require("../../models/pug-model");

module.exports = {
	name: "set-maps",
	description: "Set the map list for the PUG system. Admins only.",
	defaultPermission: false,
	options: [
		{
			name: "maps",
			description: "Comma-separated list of maps",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
	callback: async (client, interaction) => {
		if (
			!interaction.member.permissions.has(PermissionFlagsBits.Administrator)
		) {
			return interaction.reply(
				"You do not have permission to use this command!"
			);
		}

		try {
			const existingData = await pugModel.findOne({
				serverId: interaction.guild.id,
			});

			if (!existingData) {
				return interaction.reply(
					"PUG data not found for this server! Please run /setup first."
				);
			}

			const maps = interaction.options.getString("maps").split(",");
			existingData.mapList = maps;
			await existingData.save();

			interaction.reply("Map list updated successfully!");
		} catch (error) {
			console.error(error);
			interaction.reply("Error updating map list. Please try again!");
		}
	},
};
