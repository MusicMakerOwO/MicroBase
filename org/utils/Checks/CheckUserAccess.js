module.exports = function CheckUserAccess(requiredRoles, userIDs, member, user) {
	if (member && requiredRoles) {
		const hasRole = requiredRoles.some(roleID => member._roles.includes(roleID));
		if (!hasRole && !member.permissions.has('Administrator')) {
			throw ['You don\'t have permission to use this command!', 'Missing roles'];
		}
	}

	if (Array.isArray(userIDs) && !userIDs.includes(user.id)) {
		throw ['You don\'t have permission to use this command!', 'User not whitelisted'];
	}
}