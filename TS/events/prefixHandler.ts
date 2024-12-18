import CheckCooldown from '../Utils/Checks/Cooldown';
import GuildOwner from '../Utils/Checks/GuildOwner';
import IDAccess from '../Utils/Checks/IDAccess';
import RoleAccess from '../Utils/Checks/RoleAccess';
import Permission from '../Utils/Checks/Permissions';

import { MicroClient } from "../typings";
import { Message } from "discord.js";

export default {
	name: 'messageCreate',
	execute: async function(client: MicroClient, message: Message) {
		const { PREFIX } = client.config;
		
		if (message.author.bot) return;
		if (!message.content?.startsWith(PREFIX)) return;

		const args = message.content.slice(PREFIX.length).split(/\s+/);
		// @ts-ignore
		const name = args.shift().toLowerCase();

		const command = client.messages.get(name);
		if (!command) {
			client.logs.error(`Command not found: ${name}`);
			return await message.reply(`There was an error while executing this command!\n\`\`\`Command not found\`\`\``).catch(() => { });
		}

		try {
			if (command.cooldown) CheckCooldown(client, message.author.id, name, command.cooldown);
			if (command.guilds) IDAccess(command.guilds, message.guildId, 'Guild');
			if (command.channels) IDAccess(command.channels, message.channelId, 'Channel');
			if (command.users) IDAccess(command.users, message.author.id, 'User');
			if (command.owner) GuildOwner(message.guild ? message.guild.ownerId : undefined , message.author.id);
			if (command.roles) RoleAccess(command.roles, message.member);
	
			if (command.botPerms || command.userPerms) {
				if (!message.guild) throw ['This command cannot be used in DMs', 'DMs'];
				if (!message.author) throw ['This command cannot be used in DMs', 'DMs'];
				const botMember = message.guild === null
					? null
					// @ts-ignore
					: message.guild.members.cache.get(client.user.id) || await message.guild.members.fetch(client.user.id).catch(() => null)
				if (botMember !== null) {
					// This code will only trigger if
					// 1) Bot is in the guild (always will)
					// 2) Command not being run in DMs
					// 3) Client has GuildMembers intent
					// 4) Not actively rate limited
					Permission(client, command.botPerms, botMember); // bot
					Permission(client, command.userPerms, message.member); // user
				}
			}
		} catch (error) {
			let payload = {
				content: '',
				embeds: [],
				components: [],
				files: [],
			}
			if (Array.isArray(error)) {
				const [response, reason] = error;
				payload.content = response;
				client.logs.error(`Blocked user from message: ${reason}`);
			} else {
				payload.content = `There was an error while executing this command!\n\`\`\`${error}\`\`\``;
				client.logs.error(error);
			}
			await message.reply(payload).catch(() => { });
		}

		try {
			await command.execute(message, client, args);
		} catch (error) {
			client.logs.error(error);
			await message.reply(`There was an error while executing this command!\n\`\`\`${error}\`\`\``).catch(() => { });
		}
	}
}
module.exports = exports.default;