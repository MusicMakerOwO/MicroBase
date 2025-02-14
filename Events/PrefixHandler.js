const CheckCooldown = require('../Utils/Checks/Cooldown');
const GuildOwner = require('../Utils/Checks/GuildOwner');
const IDAccess = require('../Utils/Checks/IDAccess');
const RoleAccess = require('../Utils/Checks/RoleAccess');
const Permission = require('../Utils/Checks/Permissions');
const { PREFIX, FANCY_ERRORS } = require('../config.json');
module.exports = {
	name: 'messageCreate',
	execute: async function(client, message) {
		
		if (message.author.bot) return;
		if (!message.content?.startsWith(PREFIX)) return;
		const args = message.content.slice(PREFIX.length).split(/\s+/);
		const name = args.shift().toLowerCase();
		const command = client.messages.get(name);
		if (!command) {
			client.logs.error(`Command not found: ${name}`);
			return await message.reply(`There was an error while executing this command!\n\`\`\`Command not found\`\`\``).catch(() => { });
		}
		try {
			if (command.cooldown) 	CheckCooldown(client, message.author.id, name, command.cooldown);
			if (command.guilds) 	IDAccess(command.guilds, message.guildId, 'Guild');
			if (command.channels)	IDAccess(command.channels, message.channelId, 'Channel');
			if (command.users) 	 	IDAccess(command.users, message.author.id, 'User');
			if (command.owner) 		GuildOwner(message.guild ? message.guild.ownerId : undefined , message.author.id);
			if (command.roles) 		RoleAccess(command.roles, message.member);
	
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
			const payload = {
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
			if (!FANCY_ERRORS) {
				await message.reply(`There was an error while executing this command!\n\`\`\`${error}\`\`\``).catch(() => { });
			} else {
				const errorData = ErrorParse(error);
				if (errorData) {
					const embed = {
						color: 0xff0000,
						description: `
	Command: \`${name}\`
	Error: \`${errorData.message}\`
	\`\`\`\n${errorData.lines.join('\n')}\`\`\``,
					};
					await message.reply({ embeds: [embed] }).catch(() => {});
				}
			}
		}
	}
}