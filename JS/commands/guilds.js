//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});// const { SlashCommandBuilder } = require('@discordjs/builders');
var _builders = require('@discordjs/builders');
exports. default = {
	defer: false,
	data: new (0, _builders.SlashCommandBuilder)()
		.setName('guilds')
		.setDescription('List all guilds the bot is in'),
	async execute(interaction, client) {
		const guilds = await client.shards.fetchClientValue('guilds.cache.size'); // [ { shardID: 0, value: 10 }, { shardID: 1, value: 12 }, ... ]
		const totalGuilds = guilds.reduce((acc, val) => acc + val.value, 0);
		const shardCount = guilds.length;
		const shards = guilds.map((guild) => `Shard ${guild.shardID}: ${guild.value} guilds`).join('\n');

		await interaction.reply(`Total guilds: ${totalGuilds}\nShard count: ${shardCount}\n\n${shards}`);
	}
}
module.exports = exports.default;