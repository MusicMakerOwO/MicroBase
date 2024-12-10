//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function GuildOwner(ownerID, userID) {
	if (!ownerID) throw ['You can\'t use this command in a DM!', 'No guild found'];
	if (userID !== ownerID) throw ['You don\'t have permission to use this command!', 'Not the guild owner'];
} exports.default = GuildOwner;
module.exports = exports.default;