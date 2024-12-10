//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});
exports. default = {
	name: 'ping',
	description: 'Pong!',
	cooldown: 5,
	execute(message, client, args) {
		if (args.length) return message.reply('No arguments allowed');
		message.reply('Pong.');
	}
}
module.exports = exports.default;