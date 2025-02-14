const Permissions = require('../Permissions');

module.exports = function CheckPermissions(client, permissionsArray, member) {
	if (!Array.isArray(permissionsArray) || !member) return;
	if (!client.user) return;

	const prefix = member.user.id === client.user.id ? 'I am' : 'You are';

	const missingPermissions = [];
	if (permissionsArray.length === 0) return;
	for (let i = 0; i < permissionsArray.length; i++) {
		const permission = permissionsArray[i];
		if (member.permissions.has(Permissions[permission])) continue;
		missingPermissions.push(permission);
	}

	if (missingPermissions.length > 0) {
		throw [`${prefix} missing the following permissions: \`${missingPermissions.join('`, `')}\``, 'Missing permissions'];
	}
};