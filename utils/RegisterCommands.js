const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const Logs = require('./Logs.js');

module.exports = (client) => {

	Logs.info('Started refreshing application (/) commands.');

	const commands = [];
	const devCommands = [];
	const commandNames = [];
	for (const [_, command] of client.commands) {
		const commandData = typeof command.data?.toJSON === 'function' ? command.data.toJSON() : command.data;
		commandData.dm_permission ??= false; // dms false by default
		try {
			if (!commandData) throw `No command.data found - Did you forget to save the file?`;
			if (commandNames.includes(commandData?.name)) continue;
			commandNames.push(commandData.name);
			if (command.dev) {
				devCommands.push(commandData);
			} else {
				commands.push(commandData);
			}
		} catch(error) {
			Logs.error(`[REGISTER] Failed to register ${command.data.name}: ${error}`);
		}
	}

	if (devCommands.length > 0 && !client.config.DEV_GUILD_ID) {
		Logs.warn(`You have dev commands but no DEV_GUILD_ID in config.json - These will not be registered!`);
	}

	const rest = new REST({ version: '10' }).setToken(client.config.TOKEN);
	try {
		// public commands
		rest.put(
			Routes.applicationCommands(client.config.APP_ID),
			{ body: commands },
		);

		if (typeof client.config.DEV_GUILD_ID === 'string' && devCommands.length > 1) {
			// dev commands
			rest.put(
				Routes.applicationGuildCommands(client.config.APP_ID, client.config.DEV_GUILD_ID),
				{ body: devCommands },
			);
		}

		Logs.info('Successfully reloaded application (/) commands.');
	} catch (error) {
		Logs.error(error);
	}
}
