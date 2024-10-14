// const { REST } = require('@discordjs/rest');
const https = require('node:https');
const Logs = require('./Logs.js');

module.exports = async function (client) {

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

	// This is all that the Routes.applicationCommands() method does, but we don't need the extra dependency if it's literally just a string lmao
	// https://discord.com/developers/docs/tutorials/upgrading-to-application-commands#registering-commands
	const route = `https://discord.com/api/v10/applications/${client.config.APP_ID}/commands`;
	const devRoute = `https://discord.com/api/v10/applications/${client.config.APP_ID}/guilds/${client.config.DEV_GUILD_ID}/commands`;
	try {
		// public commands
		// rest.put(
		// 	route,
		// 	{ body: commands },
		// );
		await MakeRequest('PUT', route, commands, client.config.TOKEN);

		if (typeof client.config.DEV_GUILD_ID === 'string' && devCommands.length > 1) {
			// dev commands
			// rest.put(
			// 	devRoute,
			// 	{ body: devCommands },
			// );
			await MakeRequest('PUT', devRoute, devCommands, client.config.TOKEN);
		}

		Logs.info('Successfully reloaded application (/) commands.');
	} catch (error) {
		Logs.error(error);
	}
}

async function MakeRequest(method, route, body, token) {
	return new Promise((resolve, reject) => {
		const req = https.request(route, {
			method,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bot ${token}`
			}
		});
		req.on('response', res => {
			let data = '';
			res.on('data', chunk => {
				data += chunk;
			});
			res.on('end', () => {
				try {
					resolve(JSON.parse(data));
				} catch(error) {
					reject(error);
				}
			});
		});
		req.on('error', error => {
			reject(error);
		});
		if (body) req.write(JSON.stringify(body));
		req.end();
	});
}