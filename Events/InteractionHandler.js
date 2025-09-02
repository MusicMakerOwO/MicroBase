const CheckCooldown = require('../Utils/Checks/Cooldown');
const GuildOwner = require('../Utils/Checks/GuildOwner');
const IDAccess = require('../Utils/Checks/IDAccess');
const RoleAccess = require('../Utils/Checks/RoleAccess');
const Permission = require('../Utils/Checks/Permissions');

const ErrorParse = require('../Utils/FindError');

const { FANCY_ERRORS } = require('../config.json');

const { CommandInteraction, MessageFlags } = require("discord.js");

module.exports = {
	name: 'interactionCreate',
	execute: async function (client, interaction) {

		const BoundHandler = InteractionHandler.bind(null, client, interaction);

		CommandInteraction.prototype.reply = (function (original) { 
			// Prevents the decrepitated "ephemeral" message in later discord.js versions.
			// Also allows to use MessageFlags.IsComponentsV2 without needing to define "MesssageFlags" by simply doing v2: true
			return async function (options) {
				let messageFlags = [];
		
				if (options.v2) {
					messageFlags.push(MessageFlags.IsComponentsV2);
					delete options.v2;
				}
		
				if (options.ephemeral) {
					messageFlags.push(MessageFlags.Ephemeral);
					delete options.ephemeral;
				}
		
				if (messageFlags.length > 0) {
					options.flags = (options.flags ?? 0) |
						messageFlags.reduce((a, b) => a | b, 0);
				}

				return original.call(this, options);
			};
		})(CommandInteraction.prototype.reply);

		switch (interaction.type) {
			case 4: // Autocomplete
			case 2: // Slash Commands + Context Menus
				if (interaction.commandType === 1) {
					const subcommand = interaction.options._subcommand || "";
					const subcommandGroup = interaction.options._subcommandGroup || "";
					const commandArgs = interaction.options._hoistedOptions || [];
					const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(" ")}`.trim();
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > /${interaction.commandName} ${args}`);
					await BoundHandler('commands', client.commands);
				} else {
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > :${interaction.commandName}:`);
					await BoundHandler('context', client.context);
				}
				break;
			case 3: // Message Components
				if (interaction.isButton()) {
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > [${interaction.customId}]`);
					await BoundHandler('buttons', client.buttons);
				} else if (interaction.isAnySelectMenu()) {
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > <${interaction.customId}>`);
					await BoundHandler('menus', client.menus);
				}
				break;
			case 5: // Modal submit
				client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > {${interaction.customId}}`);
				await BoundHandler('modals', client.modals);
				break;
			default:
				client.logs.warn(`Unknown interaction type: ${interaction.type} - Unsure how to handle this...`);
				break;
		}
	}
}

const RESPONSE_CACHE = new Map(); // commandName -> { response }

module.exports.RESPONSE_CACHE = RESPONSE_CACHE;

// options = { value: string, name: string, type: number, focused?: boolean }[]
function CacheKey(name, options) {
	if (options === null || options === undefined) return name;
	options.sort((a, b) => a.name.localeCompare(b.name));
	const optionKey = options.map(x => x.name +'-'+ x.value).join('_');
	return `${name}_${optionKey}`;
}

async function InteractionHandler(client, interaction, type, cache) {

	const args = interaction.customId?.split("_") ?? [];
	const name = args.shift() ?? interaction.commandName;

	const component = cache.get(name);
	if (!component) {
		await interaction.reply({
			content: `There was an error while executing this command!\n\`\`\`Command not found\`\`\``,
			ephemeral: true
		}).catch(() => { });
		client.logs.error(`${type} not found: ${name}`);
		return;
	}

	const key = CacheKey(name, interaction.options?._hoistedOptions);
	if (RESPONSE_CACHE.has(key)) {
		const data = RESPONSE_CACHE.get(key);
		await interaction.reply(...data).catch(() => {});
		return;
	}

	if ('defer' in component && component.defer !== null) {
		await interaction.deferReply({ ephemeral: component.defer }).catch(() => {});
	}

	try {
		if (component.cooldown) CheckCooldown(client, interaction.user.id, name, component.cooldown);
		if (component.guilds) 	IDAccess(component.guilds, interaction.guildId, 'Guild');
		if (component.channels) IDAccess(component.channels, interaction.channelId, 'Channel');
		if (component.users) 	IDAccess(component.users, interaction.user.id, 'User');
		if (component.owner) 	GuildOwner(interaction.guild?.ownerId, interaction.user.id);
		if (component.roles) 	RoleAccess(component.roles, interaction.member);

		if (component.botPerms || component.userPerms) {
			if (!interaction.guild) throw ['This command cannot be used in DMs', 'DMs'];
			if (!interaction.user) throw ['This command cannot be used in DMs', 'DMs'];
			const botMember = interaction.guild ? interaction.guild.members.cache.get(client.user.id) ?? await interaction.guild.members.fetch(client.user.id).catch(() => null) : null;
			if (botMember !== null) {
				// This code will only trigger if
				// 1) Bot is in the guild (always will)
				// 2) Command not being run in DMs
				// 3) Client has GuildMembers intent
				// 4) Not actively rate limited
				Permission(client, component.botPerms, botMember); // bot
				Permission(client, component.userPerms, interaction.member); // user
			}
		}
	} catch (error) {
		await interaction.deferReply({ ephemeral: true }).catch(() => {});
		const payload = {
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
		return;
	}

	if (!interaction.isAutocomplete()) {
		const oldReply = interaction.reply.bind(interaction);
		const oldEdit = interaction.editReply.bind(interaction);
		interaction.reply = function (...args) {
			if (component.cache) RESPONSE_CACHE.set(key, args);
			const callback = (interaction.deferred || interaction.replied) ? oldEdit : oldReply;
			return callback(...args);
		}
		interaction.editReply = function (...args) {
			if (component.cache) RESPONSE_CACHE.set(key, args);
			return oldEdit(...args);
		}

		var timeout = setTimeout(async () => {
			if (interaction.deferred || interaction.replied) return;
			await interaction.deferReply();
		}, 1000);
	}

	try {
		const callback = interaction.isAutocomplete() ? component.autocomplete : component.execute;
		if (typeof callback !== 'function') throw new 'Command not implemented';
		await callback(interaction, client, type === 'commands' ? undefined : args);
		clearTimeout(timeout);
	} catch (error) {
		clearTimeout(timeout);
		RESPONSE_CACHE.delete(key);
		client.logs.error(error);

		await interaction.deferReply({ ephemeral: true }).catch(() => {});

		if (!FANCY_ERRORS || !(error instanceof Error)) {
			await interaction.editReply({
				content: `There was an error while executing this command!\n\`\`\`${error}\`\`\``,
				embeds: [],
				components: [],
				files: [],
			}).catch(() => {});
		} else {
			const errorData = ErrorParse(error);
			if (errorData) {
				const embed = {
					color: 0xFF0000,
					description: `
	Command: \`${name}\`
	Error: \`${errorData.message}\`
	\`\`\`\n${errorData.lines.join('\n')}\`\`\``,
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
	}
}
