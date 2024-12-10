//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});

exports. default = {
	customID: 'select',
	execute: async function(client, interaction) {
		const selected = interaction.values[0];

		await interaction.reply({
			content: `You selected: ${selected}`,
			ephemeral: true
		});
	}
}
module.exports = exports.default;