//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _discordjs = require('discord.js');
exports. default = {
	data: new (0, _discordjs.SlashCommandBuilder)()
	.setName('error')
	.setDescription('oopsies'),
	async execute(interaction) {
		throw new Error('Oopsies');
	}
}
module.exports = exports.default;