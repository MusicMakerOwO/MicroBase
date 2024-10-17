const Permissions = require('../Permissions.js');

module.exports = function CheckPermissions(client, permissionsArray, member) {
	if (!Array.isArray(permissionsArray) || !member) return;

	const prefix = member.user.id === client.user.id ? 'I am' : 'You are';

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