/** @format */

// src/database/db.js
require("dotenv").config();
const mongoose = require("mongoose");
const color = require("colors");

const connectDB = async () => {
	try {
		const client = await mongoose.connect(process.env.MONGODB_URI);
		console.log(`MongoDB Connected: ${client.connection.host}`.green.inverse);
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};

module.exports = connectDB;
