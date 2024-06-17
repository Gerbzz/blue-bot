/** @format */
const {
	ApplicationCommandOptionType,
	PermissionFlagsBits,
} = require("discord.js");
const pugModel = require("../../models/pug-model");

// Adjusted setup command with added logging
module.exports = {
	name: "setup",
	description: "Setup initial PUG data. Admins only.",
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
			const guildId = interaction.guild.id;
			console.log(`Setup command received from guild: ${guildId}`);

			// Fetch the guild directly
			const guild = await client.guilds.fetch(guildId);
			console.log(`Fetched guild data: ${guild.id}`);

			const existingData = await pugModel.findOne({
				serverId: guildId,
			});

			if (existingData) {
				return interaction.reply(
					"PUG data already exists for this server! If you wish to update the map list please use /set-maps to update the map list!"
				);
			}

			console.log("this is the guildId before transfering...." + guildId);

			const maps = interaction.options.getString("maps").split(",");
			console.log("last check before adding to database" + guildId);
			const initialData = {
				serverId: guildId,
				playerProfiles: [],
				queuedPlayers: [],
				mapList: maps,
			};

			const newPugData = new pugModel(initialData);
			await newPugData.save();

			interaction.reply("PUG setup completed successfully!");
		} catch (error) {
			console.error(error);
			interaction.reply("Error setting up PUG data. Please try again!");
		}
	},
};
