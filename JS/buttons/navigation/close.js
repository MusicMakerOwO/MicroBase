//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});

exports. default = {
	customID: 'close',
	execute: async function(interaction) {
		await interaction.deferUpdate();
		await interaction.deleteReply();
	}
}
module.exports = exports.default;