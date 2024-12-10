//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});

exports. default = {
	customID: 'save',
	execute: async function(interaction) {
		const embed = {
			color: 0x00ff00,
			description: 'Your edits have been saved!'
		}

		await interaction.update({
			content: '',
			embeds: [embed],
			components: []
		})

		await new Promise(resolve => setTimeout(resolve, 1000 * 5));
		await interaction.deleteReply().catch( () => {} );
	}
}
module.exports = exports.default;