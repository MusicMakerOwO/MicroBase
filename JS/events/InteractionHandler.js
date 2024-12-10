//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Cooldown = require('../Utils/Checks/Cooldown'); var _Cooldown2 = _interopRequireDefault(_Cooldown);
var _GuildOwner = require('../Utils/Checks/GuildOwner'); var _GuildOwner2 = _interopRequireDefault(_GuildOwner);
var _IDAccess = require('../Utils/Checks/IDAccess'); var _IDAccess2 = _interopRequireDefault(_IDAccess);
var _RoleAccess = require('../Utils/Checks/RoleAccess'); var _RoleAccess2 = _interopRequireDefault(_RoleAccess);
var _Permissions = require('../Utils/Checks/Permissions'); var _Permissions2 = _interopRequireDefault(_Permissions);

var _Collector = require('../Utils/Overrides/Collector'); var _Collector2 = _interopRequireDefault(_Collector);

var _FindError = require('../Utils/FindError'); var _FindError2 = _interopRequireDefault(_FindError);
const { FANCY_ERRORS } = require('../../config.json') ;

// const collector = interaction.createCollector();
// collector.on('collect', ...);
function createCollector() {
	return new (0, _Collector2.default)(this.client, this);
}

module.exports = {
	name: 'interactionCreate',
	execute: async function (client, interaction) {

		Object.assign(interaction, { createCollector });

		const BoundHandler = InteractionHandler.bind(null, client, interaction);

		switch (interaction.type) {
			case 4: // Autocomplete
			case 2: // Slash Commands + Context Menus
				if (interaction.commandType === 1) {
					const subcommand = interaction.options._subcommand || "";
					const subcommandGroup = interaction.options._subcommandGroup || "";
					const commandArgs = interaction.options._hoistedOptions || [];
					const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(" ")}`.trim();
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > /${interaction.commandName} ${args}`);
					await BoundHandler('commands');
				} else {
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > :${interaction.commandName}:`);
					await BoundHandler('context');
				}
				break;
			case 3: // Message Components
				if (interaction.isButton()) {
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > [${interaction.customId}]`);
					await BoundHandler('buttons');
				} else if (interaction.isAnySelectMenu()) {
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > <${interaction.customId}>`);
					await BoundHandler('menus');
				}
				break;
			case 5: // Modal submit
				client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > {${interaction.customId}}`);
				await BoundHandler('modals');
				break;
			default:
				client.logs.warn(`Unknown interaction type: ${interaction.type}`);
				client.logs.warn('Unsure how to handle this...');
				break;
		}
	}
}

async function InteractionHandler(client, interaction, type) {

	const args = 'customId' in interaction ? interaction.customId.split("_") : [];
	const name = args.shift() || interaction.commandName;

	const cachedResponse = client.responseCache.get(name);
	if (cachedResponse) {
		await interaction.reply(cachedResponse);
		return;
	}

	const component = client[type].get(name);
	if (!component) {
		await interaction.reply({
			content: `There was an error while executing this command!\n\`\`\`Command not found\`\`\``,
			ephemeral: true
		}).catch(() => { });
		client.logs.error(`${type} not found: ${name}`);
		return;
	}

	if ('defer' in component && component.defer !== null) {
		await interaction.deferReply({ ephemeral: component.defer }).catch(() => {});
	}

	try {
		if (component.cooldown) _Cooldown2.default.call(void 0, client, interaction.user.id, name, component.cooldown);
		if (component.guilds) _IDAccess2.default.call(void 0, component.guilds, interaction.guildId, 'Guild');
		if (component.channels) _IDAccess2.default.call(void 0, component.channels, interaction.channelId, 'Channel');
		if (component.users) _IDAccess2.default.call(void 0, component.users, interaction.user.id, 'User');
		if (component.owner) _GuildOwner2.default.call(void 0, interaction.guild ? interaction.guild.ownerId : undefined , interaction.user.id);
		if (component.roles) _RoleAccess2.default.call(void 0, component.roles, interaction.member);

		if (component.botPerms || component.userPerms) {
			if (!interaction.guild) throw ['This command cannot be used in DMs', 'DMs'];
			if (!interaction.user) throw ['This command cannot be used in DMs', 'DMs'];
			const botMember = interaction.guild === null
				? null
				: interaction.guild.members.cache.get(client.user.id) || await interaction.guild.members.fetch(client.user.id).catch(() => null)
			if (botMember !== null) {
				// This code will only trigger if
				// 1) Bot is in the guild (always will)
				// 2) Command not being run in DMs
				// 3) Client has GuildMembers intent
				// 4) Not actively rate limited
				_Permissions2.default.call(void 0, client, component.botPerms, botMember); // bot
				_Permissions2.default.call(void 0, client, component.userPerms, interaction.member); // user
			}
		}
	} catch (error) {
		await interaction.deferReply({ ephemeral: true }).catch(() => {});
		let payload = {
			content: '',
			embeds: [],
			components: [],
			files: [],
		}
		if (Array.isArray(error)) {
			const [response, reason] = error;
			payload.content = response;
			client.logs.error(`Blocked user from ${type}: ${reason}`);
		} else {
			payload.content = `There was an error while executing this command!\n\`\`\`${error}\`\`\``;
			client.logs.error(error);
		}
		await interaction.editReply(payload).catch(() => {});
	}

	try {
		interaction.allowCache = Boolean(component.cache);
		if (interaction.isAutocomplete()) {
			if (typeof component.autocomplete !== 'function') throw 'Autocomplete function not implemented';
			await component.autocomplete(interaction, client, type === 'commands' ? undefined : args);
		} else {
			await component.execute(interaction, client, type === 'commands' ? undefined : args);
		}
	} catch (error) {
		client.logs.error(error);

		if (FANCY_ERRORS) {
			const errorData = _FindError2.default.call(void 0, error);
			if (errorData) {
				const embed = {
					color: 0xFF0000,
					description: `
	Command: \`${name}\`
	Error: \`${errorData.message}\`
	\`\`\`js\n${errorData.lines.join('\n')}\`\`\``,
				}
				await interaction.editReply({
					content: '',
					embeds: [embed],
					components: [],
					files: [],
				}).catch(() => {});
				return;
			}
		}

		// dont save error messages lol
		interaction.allowCache = false;
		await interaction.deferReply({ ephemeral: true }).catch(() => {});
		await interaction.editReply({
			content: `There was an error while executing this command!\n\`\`\`${error}\`\`\``,
			embeds: [],
			components: [],
			files: [],
		}).catch(() => {});
	}
}
