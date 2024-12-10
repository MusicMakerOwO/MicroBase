//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});

exports. default = {
	customID: 'say',
	async execute(interaction, client) {
		const message = interaction.fields.getTextInputValue('message');
		await interaction.deferReply({ ephemeral: true });
		
		try {
			await interaction.channel.send(message);
			await interaction.deleteReply();
		} catch (error) {
			await interaction.editReply('Failed to send message - Check I have permission to send messages in this channel!');
		}
	}
}
module.exports = exports.default;