//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _discordjs = require('discord.js');
 function MemberAccess(requiredRoles, member) {
	if (!member) throw ['You don\'t have permission to use this command!', 'Missing member, are they in a guild?'];
	if (!(member instanceof _discordjs.GuildMember)) throw ['You don\'t have permission to use this command!', 'Member is not a GuildMember'];
	if (!requiredRoles.length) return;

	// const hasRole = requiredRoles.some(Array.prototype.includes.bind(member._roles));
	let hasRole = false;
	for (let i = 0; i < requiredRoles.length; i++) {
		for (let j = 0, role = member._roles[j]; j < member._roles.length; j++) {
			if (role === requiredRoles[i]) {
				hasRole = true;
				break;
			}
		}
	}
	if (!hasRole && !member.permissions.has('Administrator')) {
		throw ['You don\'t have permission to use this command!', 'Missing roles'];
	}
} exports.default = MemberAccess;
module.exports = exports.default;