//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});
 function CheckCooldown(client, userID, command, cooldown) {
	const timeRemaining = client.cooldowns.get(`${userID}-${command}`) || 0;
	const remaining = (timeRemaining - Date.now()) / 1000;
	if (remaining > 0) {
		throw [`Please wait ${remaining.toFixed(1)} more seconds before reusing the \`${command}\` command!`, 'On cooldown'];
	}
	client.cooldowns.set(`${userID}-${command}`, Date.now() + cooldown * 1000);
} exports.default = CheckCooldown;
module.exports = exports.default;