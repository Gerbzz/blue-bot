/** @format */
const mongoose = require("mongoose");

const pugSchema = new mongoose.Schema({
	serverId: { type: String, required: true },
	categoryName: { type: String, required: false },
	categoryIds: [{ type: String, required: false }],
	playerProfiles: [
		{
			userId: String,
			userTag: String,
			userQueueDuration: Number,
			userELO: Number,
			wins: Number,
			losses: Number,
			isEligibleToQueue: { type: Boolean, default: true },
		},
	],
	queuedPlayers: { type: Array, required: false },
	mapList: { type: Array, required: true },
});

const pugModel = mongoose.model("pugModel", pugSchema);

module.exports = pugModel;
