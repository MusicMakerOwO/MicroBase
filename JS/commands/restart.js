//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});// const { SlashCommandBuilder } = require('@discordjs/builders');
var _builders = require('@discordjs/builders');
exports. default = {
	data: new (0, _builders.SlashCommandBuilder)()
		.setName('restart')
		.setDescription('Restarts the bot.'),
	async execute(interaction) {
		interaction.reply('Restarting...').then(() => {
			process.exit(1);
		});
	}
}
module.exports = exports.default;