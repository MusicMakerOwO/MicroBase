const CheckGuildAccess = require('../utils/Checks/CheckGuildAccess.js');
const CheckUserAccess = require('../utils/Checks/CheckUserAccess.js');
const CheckPermissions = require('../utils/Checks/CheckPermissions.js');
const CheckCooldown = require('../utils/Checks/CheckCooldown.js');

module.exports = {
	name: 'messageCreate',
	execute: async function(client, message) {
		const { PREFIX } = client.config;
		
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
			CheckGuildAccess(command.guilds, message.guildId);
			CheckUserAccess(command.roles, command.users, message.member, message.author);
			CheckCooldown(client, message.author.id, name, command.cooldown);

			const botMember = message.guild?.members.cache.get(client.user.id) ?? await message.guild?.members.fetch(client.user.id).catch(() => null);
			if (botMember !== null) {
				CheckPermissions(command.clientPerms, botMember); // bot
				CheckPermissions(command.userPerms, message.member); // user
			}
		} catch ([response, reason]) {
			await message.reply(response).catch(() => { });
			client.logs.error(`Blocked user from message: ${reason}`);
			return;
		}

		try {
			await command.execute(message, client, args);
		} catch (error) {
			client.logs.error(error.stack);
			await message.reply(`There was an error while executing this command!\n\`\`\`${error}\`\`\``).catch(() => { });
		} finally {
			client.cooldowns.set(message.author.id, Date.now() + command.cooldown * 1000);
			setTimeout(client.cooldowns.delete.bind(client.cooldowns, message.author.id), command.cooldown * 1000);
		}
	}
}