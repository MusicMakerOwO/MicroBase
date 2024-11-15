export default function GuildOwner(ownerID: string | undefined, userID: string) {
	if (!ownerID) throw ['You can\'t use this command in a DM!', 'No guild found'];
	if (userID !== ownerID) throw ['You don\'t have permission to use this command!', 'Not the guild owner'];
}
module.exports = exports.default;