const CheckGuildAccess = require('../utils/Checks/CheckGuildAccess');
const CheckUserAccess = require('../utils/Checks/CheckUserAccess');
const CheckPermissions = require('../utils/Checks/CheckPermissions');
const CheckCooldown = require('../utils/Checks/CheckCooldown');

const Collector = require('../utils/Overrides/Collector');

// const collector = interaction.createCollector();
// collector.on('collect', ...);
function createCollector() {
	return new Collector(this.client, this);
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
					const subcommand = interaction.options._subcommand ?? "";
					const subcommandGroup = interaction.options._subcommandGroup ?? "";
					const commandArgs = interaction.options._hoistedOptions ?? [];
					const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(" ")}`.trim();
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > /${interaction.commandName} ${args}`);
					await BoundHandler('commands');
				} else if (interaction.commandType === 3) {
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > :${interaction.commandName}:`);
					await BoundHandler('context');
				} else {
					client.logs.warn(`Unknown command type: ${interaction.commandType}`);
					client.logs.warn('Unsure how to handle this...');
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

	const args = interaction.customId?.split("_") ?? [];
	const name = args.shift() ?? interaction.commandName;

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

	try {
		CheckGuildAccess(component.guilds, interaction.guildId);
		CheckUserAccess(component.roles, component.users, interaction.member, interaction.user);
		CheckCooldown(client, interaction.user.id, name, component.cooldown);

		const botMember = interaction.guild === null
			? null
			: interaction.guild.members.cache.get(client.user.id) ?? await interaction.guild?.members.fetch(client.user.id).catch(() => null)
		if (botMember !== null) {
			// This code will only trigger if
			// 1) Bot is in the guild (always will)
			// 2) Command not being run in DMs
			// 3) Client has GuildMembers intent
			// 4) Not actively rate limited
			CheckPermissions(client, component.clientPerms, botMember); // bot
			CheckPermissions(client, component.userPerms, interaction.member); // user
		}
	} catch ([response, reason]) {
		await interaction.reply({
			content: response,
			ephemeral: true
		}).catch(() => { });
		client.logs.error(`Blocked user from ${type}: ${reason}`);
		return;
	}

	try {
		interaction.allowCache = component.cache;
		if (interaction.isAutocomplete()) {
			await component.autocomplete(interaction, client, type === 'commands' ? undefined : args);
		} else {
			await component.execute(interaction, client, type === 'commands' ? undefined : args);
		}
	} catch (error) {
		// dont save error messages lol
		interaction.allowCache = false;
		client.logs.error(error.stack);
		await interaction.deferReply({ ephemeral: true }).catch(() => { });
		await interaction.editReply({
			content: `There was an error while executing this command!\n\`\`\`${error}\`\`\``,
			embeds: [],
			components: [],
			files: [],
			ephemeral: true
		}).catch(() => {});
	}
}
