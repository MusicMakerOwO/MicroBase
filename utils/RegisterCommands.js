const https = require('node:https');
const config = require('../config.json');

module.exports = async function (client) {
	const commands = [];
	const devCommands = [];
	const commandNames = [];
	for (const command of [...client.commands.values(), ...client.context.values()] ) {
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
			console.error(`[REGISTER] Failed to register ${command.data.name}: ${error}`);
		}
	}

	if (devCommands.length > 0 && !config.DEV_GUILD_ID) {
		console.warn(`You have dev commands but no DEV_GUILD_ID in config.json - These will not be registered!`);
	}

	// This is all that the Routes.applicationCommands() method does, but we don't need the extra dependency if it's literally just a string lmao
	// https://discord.com/developers/docs/tutorials/upgrading-to-application-commands#registering-commands
	const route = `https://discord.com/api/v10/applications/${config.APP_ID}/commands`;
	const devRoute = `https://discord.com/api/v10/applications/${config.APP_ID}/guilds/${config.DEV_GUILD_ID}/commands`;
	try {
		// public commands
		await MakeRequest('PUT', route, commands, config.TOKEN);

		if (typeof config.DEV_GUILD_ID === 'string' && devCommands.length > 1) {
			// dev commands
			await MakeRequest('PUT', devRoute, devCommands, config.TOKEN);
		}
	} catch (error) {
		console.error(error);
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
		req.on('error', error => reject(error));
		req.on('timeout', () => reject(new Error('Request timed out')));
		req.on('response', res => {
			const data = [];
			res.on('data', data.push.bind(data));
			res.on('end', () => {
				try {
					if (res.statusCode < 200 || res.statusCode >= 300) {
						const response = JSON.parse(data.join(''));
						throw new Error(`[ Discord API : ${res.statusCode}] ${response.message}`);
					}
					resolve(JSON.parse(data.join('')));
				} catch(error) {
					reject(error);
				}
			});
		});
		if (body) req.write(JSON.stringify(body));
		req.end();
	});
}