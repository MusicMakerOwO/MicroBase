//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _Cooldown = require('../Utils/Checks/Cooldown'); var _Cooldown2 = _interopRequireDefault(_Cooldown);
var _GuildOwner = require('../Utils/Checks/GuildOwner'); var _GuildOwner2 = _interopRequireDefault(_GuildOwner);
var _IDAccess = require('../Utils/Checks/IDAccess'); var _IDAccess2 = _interopRequireDefault(_IDAccess);
var _RoleAccess = require('../Utils/Checks/RoleAccess'); var _RoleAccess2 = _interopRequireDefault(_RoleAccess);
var _Permissions = require('../Utils/Checks/Permissions'); var _Permissions2 = _interopRequireDefault(_Permissions);
exports. default = {
	name: 'messageCreate',
	execute: async function(client, message) {
		const { PREFIX } = client.config;
		
		if (message.author.bot) return;
		if (!_optionalChain([message, 'access', _ => _.content, 'optionalAccess', _2 => _2.startsWith, 'call', _3 => _3(PREFIX)])) return;

		const args = message.content.slice(PREFIX.length).split(/\s+/);
		const name = args.shift().toLowerCase();

		const command = client.messages.get(name);
		if (!command) {
			client.logs.error(`Command not found: ${name}`);
			return await message.reply(`There was an error while executing this command!\n\`\`\`Command not found\`\`\``).catch(() => { });
		}

		try {
			if (command.cooldown) _Cooldown2.default.call(void 0, client, message.author.id, name, command.cooldown);
			if (command.guilds) _IDAccess2.default.call(void 0, command.guilds, message.guildId, 'Guild');
			if (command.channels) _IDAccess2.default.call(void 0, command.channels, message.channelId, 'Channel');
			if (command.users) _IDAccess2.default.call(void 0, command.users, message.author.id, 'User');
			if (command.owner) _GuildOwner2.default.call(void 0, message.guild ? message.guild.ownerId : undefined , message.author.id);
			if (command.roles) _RoleAccess2.default.call(void 0, command.roles, message.member);
	
			if (command.botPerms || command.userPerms) {
				if (!message.guild) throw ['This command cannot be used in DMs', 'DMs'];
				if (!message.author) throw ['This command cannot be used in DMs', 'DMs'];
				const botMember = message.guild === null
					? null
					: message.guild.members.cache.get(client.user.id) || await message.guild.members.fetch(client.user.id).catch(() => null)
				if (botMember !== null) {
					// This code will only trigger if
					// 1) Bot is in the guild (always will)
					// 2) Command not being run in DMs
					// 3) Client has GuildMembers intent
					// 4) Not actively rate limited
					_Permissions2.default.call(void 0, client, command.botPerms, botMember); // bot
					_Permissions2.default.call(void 0, client, command.userPerms, message.member); // user
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