import CheckCooldown from '../Utils/Checks/Cooldown';
import GuildOwner from '../Utils/Checks/GuildOwner';
import IDAccess from '../Utils/Checks/IDAccess';
import RoleAccess from '../Utils/Checks/RoleAccess';
import Permission from '../Utils/Checks/Permissions';

import Collector from '../Utils/Overrides/Collector';

import { MicroClient, MicroInteraction } from '../typings';

// const collector = interaction.createCollector();
// collector.on('collect', ...);
function createCollector() {
	// @ts-ignore
	return new Collector(this.client, this);
}

module.exports = {
	name: 'interactionCreate',
	execute: async function (client: MicroClient, interaction: MicroInteraction) {

		Object.assign(interaction, { createCollector });

		const BoundHandler = InteractionHandler.bind(null, client, interaction);

		switch (interaction.type) {
			case 4: // Autocomplete
			case 2: // Slash Commands + Context Menus
				if (interaction.commandType === 1) {
					// @ts-ignore
					const subcommand: string = interaction.options._subcommand || "";
					// @ts-ignore
					const subcommandGroup: string = interaction.options._subcommandGroup || "";
					// @ts-ignore
					const commandArgs: Array<{value: any}> = interaction.options._hoistedOptions || [];
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

async function InteractionHandler(client: MicroClient, interaction: MicroInteraction, type: 'commands' | 'context' | 'buttons' | 'menus' | 'modals') {

	const args = 'customId' in interaction ? interaction.customId.split("_") : [];
	// @ts-ignore
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
		if (component.cooldown) CheckCooldown(client, interaction.user.id, name, component.cooldown);
		if (component.guilds) IDAccess(component.guilds, interaction.guildId, 'Guild');
		if (component.channels) IDAccess(component.channels, interaction.channelId, 'Channel');
		if (component.users) IDAccess(component.users, interaction.user.id, 'User');
		if (component.owner) GuildOwner(interaction.guild ? interaction.guild.ownerId : undefined , interaction.user.id);
		if (component.roles) RoleAccess(component.roles, interaction.member);

		if (component.botPerms || component.userPerms) {
			if (!interaction.guild) throw ['This command cannot be used in DMs', 'DMs'];
			if (!interaction.user) throw ['This command cannot be used in DMs', 'DMs'];
			const botMember = interaction.guild === null
				? null
				// @ts-ignore
				: interaction.guild.members.cache.get(client.user.id) || await interaction.guild.members.fetch(client.user.id).catch(() => null)
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
			// @ts-ignore
			if (typeof component.autocomplete !== 'function') throw 'Autocomplete function not implemented';
			// @ts-ignore
			await component.autocomplete(interaction, client, type === 'commands' ? undefined : args);
		} else {
			await component.execute(interaction, client, type === 'commands' ? undefined : args);
		}
	} catch (error) {
		// dont save error messages lol
		interaction.allowCache = false;
		client.logs.error(error);
		await interaction.deferReply({ ephemeral: true }).catch(() => {});
		await interaction.editReply({
			content: `There was an error while executing this command!\n\`\`\`${error}\`\`\``,
			embeds: [],
			components: [],
			files: [],
		}).catch(() => {});
	}
}
