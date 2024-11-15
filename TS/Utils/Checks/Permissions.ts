import Permissions from "../Permissions";
import { MicroClient } from "../../typings";
import { APIGuildMember, GuildMember } from "discord.js";

export default function CheckPermissions(client: MicroClient, permissionsArray: string[] | undefined, member: GuildMember | APIGuildMember | null) {
	if (!Array.isArray(permissionsArray) || !member) return;
	if (!client.user) return;

	const prefix = member.user.id === client.user.id ? 'I am' : 'You are';

	const missingPermissions: string[] = [];
	if (permissionsArray.length === 0) return;
	for (const permission of permissionsArray) {
		// @ts-ignore
		if (member.permissions.has(Permissions[permission])) continue;
		missingPermissions.push(permission);
	}

	if (missingPermissions.length > 0) {
		throw [`${prefix} missing the following permissions: \`${missingPermissions.join('`, `')}\``, 'Missing permissions'];
	}
}
module.exports = exports.default;