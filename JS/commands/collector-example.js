//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _builders = require('@discordjs/builders');
exports. default = {
	data: new (0, _builders.SlashCommandBuilder)()
	.setName('poke')
	.setDescription('Poke the bot'),
	async execute(interaction, client) {
		const button = new _builders.ActionRowBuilder()
		.addComponents(
			new (0, _builders.ButtonBuilder)()
				.setCustomId('poke')
				.setLabel('Poke')
				.setStyle('Primary') // 1
		);

		await interaction.reply({
			content: 'Poke the bot!',
			components: [button]
		});

		const collector = interaction.createCollector()
		collector.on('collect', async (buttonInteraction) => {
			await buttonInteraction.reply({
				content: 'Hey dont poke me!',
				ephemeral: true
			});
		});
	}
}
module.exports = exports.default;