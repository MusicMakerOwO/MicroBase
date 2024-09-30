module.exports = function CheckGuildAccess(requiredGuilds, guildID) {
	if (Array.isArray(requiredGuilds) && !requiredGuilds.includes(guildID)) {
		throw ['You don\'t have permission to use this command!', 'Guild not whitelisted'];
	}
}