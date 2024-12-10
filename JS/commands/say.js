//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _discordjs = require('discord.js');
exports. default = {
	alias: ['echo'],
	data: new (0, _discordjs.SlashCommandBuilder)()
		.setName('say')
		.setDescription('Say something!'),
	async execute(interaction, client) {
		const modal = new (0, _discordjs.ModalBuilder)()
		.setTitle('Say something!')
		.setCustomId('say')

		const input = new (0, _discordjs.TextInputBuilder)()
		.setCustomId('message')
		.setPlaceholder('Type something...')
		.setLabel('Message')
		.setStyle(_discordjs.TextInputStyle.Paragraph)

		const question = new _discordjs.ActionRowBuilder()
		.addComponents(input)

		modal.addComponents(question)

		await interaction.showModal(modal)
	}
}
module.exports = exports.default;