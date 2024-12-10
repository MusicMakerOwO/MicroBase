//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Permissions = require('../Permissions'); var _Permissions2 = _interopRequireDefault(_Permissions);
 function CheckPermissions(client, permissionsArray, member) {
	if (!Array.isArray(permissionsArray) || !member) return;
	if (!client.user) return;

	const prefix = member.user.id === client.user.id ? 'I am' : 'You are';

	const missingPermissions = [];
	if (permissionsArray.length === 0) return;
	for (const permission of permissionsArray) {
		if (member.permissions.has(_Permissions2.default[permission])) continue;
		missingPermissions.push(permission);
	}

	if (missingPermissions.length > 0) {
		throw [`${prefix} missing the following permissions: \`${missingPermissions.join('`, `')}\``, 'Missing permissions'];
	}
} exports.default = CheckPermissions;
module.exports = exports.default;