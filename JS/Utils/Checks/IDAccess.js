//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});// Guild IDs, channel IDs, and user IDs
// All share the same logic lol
 function IDAccess(requiredIDs, targetID, name) {
	if (!targetID) throw ['You can\'t use this command in a DM!', 'No target ID'];
	if (!requiredIDs.includes(targetID)) {
		throw ['You don\'t have permission to use this command!', `${name} not whitelisted`];
	}
} exports.default = IDAccess;
module.exports = exports.default;