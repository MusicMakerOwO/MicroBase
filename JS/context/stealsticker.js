//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _discordjs = require('discord.js');
exports. default ={
	data: new (0, _discordjs.ContextMenuCommandBuilder)()
	.setName('stealsticker')
	.setType(_discordjs.ApplicationCommandType.Message),
	async execute(interaction, client) {
		const message = interaction.targetMessage;
		const sticker = message.stickers.first();
		if (!sticker) return interaction.reply({ content: 'This message does not have any stickers.', ephemeral: true });

		await interaction.reply({ content: sticker.url, ephemeral: true });
	}
}
module.exports = exports.default;