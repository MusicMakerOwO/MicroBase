const config = require('../config.json');
const https = require('https');
const Logs = require('./Logs');
const CRC32 = require('./CRC32');
const { InteractionContextType } = require('discord.js');

// This is all that the Routes.applicationCommands() method does, but we don't need the extra dependency if it's literally just a string lmao
// https://discord.com/developers/docs/tutorials/upgrading-to-application-commands#registering-commands
const PUBLIC_ROUTE = `https://discord.com/api/v10/applications/${config.APP_ID}/commands`;
const DEV_ROUTE = `https://discord.com/api/v10/applications/${config.APP_ID}/guilds/${config.DEV_GUILD_ID}/commands`;

const DEFAULT_COMMAND_ACCESS = [ InteractionContextType.Guild ];

async function RegisterCommands(client) {

	Logs.info(`Started refreshing application (/) commands`);
	
	const commands = [];
	const devCommands = [];
	const commandNames = [];
	const localCommands = [...client.commands.values(), ...client.context.values()];
	for (let i = 0; i < localCommands.length; i++) {
		const command = localCommands[i];
		const commandData = (typeof command.data.toJSON === 'function') ? command.data.toJSON() : command.data;
		try {
			if (!commandData) throw `No command.data found - Did you forget to save the file?`;
			if (commandNames.includes(commandData.name)) continue;
			commandNames.push(commandData.name);
			commandData.contexts ??= DEFAULT_COMMAND_ACCESS;
			if (command.dev) {
				devCommands.push(commandData);
			} else {
				commands.push(commandData);
			}
		} catch(error) {
			Logs.error(`[REGISTER] Failed to register ${command.data.name}: ${error}`);
		}
	}

	if (devCommands.length > 0 && !config.DEV_GUILD_ID) {
		Logs.warn(`You have dev commands but no DEV_GUILD_ID in config.json - These will not be registered!`);
	}

	try {
		// public commands
		await MakeRequest('PUT', PUBLIC_ROUTE, commands);

		if (typeof config.DEV_GUILD_ID === 'string' && devCommands.length > 1) {
			// dev commands
			await MakeRequest('PUT', DEV_ROUTE, devCommands);
		}

		Logs.info(`Successfully reloaded application (/) commands`);
	} catch (error) {
		Logs.error(error);
	}
}

async function MakeRequest(method, route, body) {
	return new Promise((resolve, reject) => {
		const req = https.request(route, {
			method,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bot ${config.TOKEN}`
			}
		});
		req.on('error', error => reject(error));
		req.on('timeout', () => reject(new Error('Request timed out')));
		req.on('response', res => {
			const data = [];
			res.on('data', data.push.bind(data));
			res.on('end', () => {
				try {
					if (!res.statusCode) throw new Error('No status code returned - This is likely a network error');
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
};

function StringifyFunction(key, value) {
	switch (typeof value) {
		case 'function':
			return null;
		case 'bigint':
			return Number(value); // introduces precision issues, you should consider that
		case 'undefined':
		case 'object':
			return value === null ? 'null' : value;
	}
	return value;
}

function SimplifyCommand(command) {
	return {
		name: command.name ?? '',
		description: command.description ?? '',
		type: command.type ?? 1,
		options: command.options ?? [],
		contexts: command.contexts ?? DEFAULT_COMMAND_ACCESS,
		nsfw: command.nsfw ?? false
	}
}

function TokenizeCommand(command) {
	const commandString = JSON.stringify(command, StringifyFunction);
	return CRC32(commandString);
}

function CheckCommandEquality(oldCommand, newCommand) {
	const oldToken = TokenizeCommand(oldCommand);
	const newToken = TokenizeCommand(newCommand);
	return oldToken === newToken;
}

function NeedsRegister(oldCommands, newCommands) {
	if (Object.keys(oldCommands).length !== Object.keys(newCommands).length) {
		return true;
	}
	for (const [name, command] of Object.entries(oldCommands)) {
		if (!newCommands[name]) {
			return true;
		}
		if (!CheckCommandEquality(command, newCommands[name])) {
			return true;
		}
	}
	return false;
}

let lastRegister = 0;
module.exports = async function DynamicRegister(client, force = false) {

	if (!config.REGISTER_COMMANDS) {
		Logs.warn('Command registration is disabled in config.json');
		return;
	}
	
	if (force) {
		await RegisterCommands(client);
		return;
	}

	if (Date.now() - lastRegister < 1000 * 10) return; // 10 second cooldown
	lastRegister = Date.now();

	Logs.info('Checking slash commands, this may take a second...');
	const oldCommands = {};
	const newCommands = {};

	const oldDevCommands = {};
	const newDevCommands = {};

	const localCommands = [...client.commands.values(), ...client.context.values()];
	for (let i = 0; i < localCommands.length; i++) {
		const command = localCommands[i];
		if (typeof command?.data !== 'object') {
			Logs.error(`Command ${command.name} has no data object`);
			continue;
		}

		const commandData = SimplifyCommand(command.data);
		if (command.dev) {
			newDevCommands[commandData.name] = commandData;
		} else {
			newCommands[commandData.name] = commandData;
		}
	}

	const registeredCommands = await MakeRequest('GET', PUBLIC_ROUTE, null);
	for (let i = 0; i < registeredCommands.length; i++) {
		const APICommand = registeredCommands[i];
		const commandData = SimplifyCommand(APICommand);
		oldCommands[commandData.name] = commandData;
	}

	let needToRegister = NeedsRegister(oldCommands, newCommands);
	if (config.DEV_GUILD_ID && !needToRegister) {
		// additional API request to check guild commands

		const registeredDevCommands = await MakeRequest('GET', DEV_ROUTE, null);
		for (let i = 0; i < registeredDevCommands.length; i++) {
			const APICommand = registeredDevCommands[i];
			const commandData = SimplifyCommand(APICommand);
			oldDevCommands[commandData.name] = commandData;
		}

		needToRegister = NeedsRegister(oldDevCommands, newDevCommands);
	}

	if (needToRegister) {
		await RegisterCommands(client);
	} else {
		Logs.info('No changes detected in commands');
	}
}