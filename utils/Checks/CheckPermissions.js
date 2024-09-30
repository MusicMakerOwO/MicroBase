const { PermissionsBitField: { Flags: Permissions } } = require('discord.js');

module.exports = function CheckPermissions(permissionsArray, member) {
	if (!Array.isArray(permissionsArray) || !member) return;

	const prefix = member.user.id === client.id ? 'I am' : 'You are';

	const missingPermissions = [];
	if (permissionsArray.length === 0) return;
	for (const permission of permissionsArray) {
		if (member.permissions.has(Permissions[permission])) continue;
		missingPermissions.push(permission);
	}

	if (missingPermissions.length > 0) {
		throw [`${prefix} missing the following permissions: \`${missingPermissions.join('`, `')}\``, 'Missing permissions'];
	}
}