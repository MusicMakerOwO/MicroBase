//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});// const { SlashCommandBuilder } = require('@discordjs/builders');
var _builders = require('@discordjs/builders');
exports. default = {
	dev: true, // hide from all guilds except from config.json
	owner: true, // server owner only
	guilds: ['123456789012345678'], // guild whitelist via ID
	channels: ['123456789012345678'], // channel whitelist via ID
	roles: ['123456789012345678'], // required to have one of the listed role IDs
	users: ['123456789012345678'], // user whitelist via ID
	cooldown: 5, // cooldown in seconds
	userPerms: ['ManageGuild'], // required user permissions
	botPerms: ['Administrator'], // required bot permissions
	data: new (0, _builders.SlashCommandBuilder)()
		.setName('restricted')
		.setDescription('A restricted command')
		.addStringOption(x => x
			.setName('input')
			.setDescription('The input to echo back')
			.setRequired(true)
		),
	async execute(interaction) {
		const input = interaction.options.getString('input');
		await interaction.reply(`You provided: ${input}`);
	},
};
module.exports = exports.default;