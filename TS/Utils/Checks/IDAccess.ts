// Guild IDs, channel IDs, and user IDs
// All share the same logic lol
export default function IDAccess(requiredIDs: string[], targetID: string | null, name: string) {
	if (!targetID) throw ['You can\'t use this command in a DM!', 'No target ID'];
	if (!requiredIDs.includes(targetID)) {
		throw ['You don\'t have permission to use this command!', `${name} not whitelisted`];
	}
}
module.exports = exports.default;