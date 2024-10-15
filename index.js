const https = require('node:https');
const fs = require('node:fs');

require('./utils/CheckPackages.js')();

const CRC32 = require('./utils/crc32.js');
const ComponentLoader = require('./utils/ComponentLoader.js');
const RegisterCommands = require('./utils/RegisterCommands.js');

// We don't want to run this on the bot instance or it will run for each and every shard lol

const config = require('./config.json');

const errors = [];

if (typeof config.TOKEN !== 'string' || config.TOKEN.length === 0) {
	errors.push('Please provide a valid TOKEN in config.json');
}
if (typeof config.PREFIX !== 'string' || config.PREFIX.length === 0) {
	errors.push('Please provide a valid PREFIX in config.json');
}
if (typeof config.APP_ID !== 'string' || config.APP_ID.length === 0) {
	errors.push('Please provide a valid APP_ID in config.json');
}
if (typeof config.DEV_GUILD_ID !== 'string') {
	errors.push('Please provide a valid DEV_GUILD_ID in config.json');
}

if (errors.length > 0) {
	for (const error of errors) {
		console.error(`[~] ${error}`);
	}
	process.exit(1);
}

async function MakeRequest(method, route, body, token) {
	return new Promise((resolve, reject) => {
		const request = https.request(route, {
			method: method,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bot ${token}`
			}
		});
		request.on('error', error => reject(error));
		request.on('timeout', () => reject(new Error('Request timed out')));
		request.on('response', response => {
			const data = [];
			response.on('data', data.push.bind(data));
			response.on('end', () => {
				if (response.statusCode < 200 || response.statusCode >= 300) {
					const response = JSON.parse(data.join(''));
					throw new Error(`[ Discord API : ${response.statusCode}] ${response.message}`);
				}
				resolve(JSON.parse(data.join('')));
			});
		});
		if (body) request.write(JSON.stringify(body));
		request.end();
	});
}

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
		name: command.name,
		description: command.description,
		type: command.type ?? 1,
		options: command.options ?? [],
		dm_permission: command.dm_permission ?? false,
		nsfw: command.nsfw ?? false
	}
}

function TokenizeCommand(command) {
	return CRC32(JSON.stringify(command, StringifyFunction));
}

function CheckCommandEquality(oldCommand, newCommand) {
	const oldToken = TokenizeCommand(oldCommand);
	const newToken = TokenizeCommand(newCommand);
	return oldToken === newToken;
}

function NeedsRegister(oldCommands, newCommands) {
	if (Object.keys(oldCommands).length !== Object.keys(newCommands).length) {
		console.log('Length mismatch');
		console.log(Object.keys(oldCommands).length, Object.keys(newCommands).length);
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

DynamicRegister();
async function DynamicRegister() {
	console.log('Checking commands, this may take a second...');
	const oldCommands = {};
	const newCommands = {};

	const oldDevCommands = {};
	const newDevCommands = {};

	const components = {
		commands: new Map()
	}
	ComponentLoader(components, 'commands');

	for (const [name, command] of components.commands.entries()) {
		if (command.dev) {
			newDevCommands[name] = SimplifyCommand(command.data);
		} else {
			newCommands[name] = SimplifyCommand(command.data);
		}
	}

	const registeredCommands = await MakeRequest('GET', `https://discord.com/api/v10/applications/${config.APP_ID}/commands`, null, config.TOKEN); // Array

	if (registeredCommands.length === 0) {
		await RegisterCommands(components);
		return;
	}
	// oldCommands = Object.fromEntries(registeredCommands.map(command => [command.name, command]));
	for (const command of registeredCommands) {
		oldCommands[command.name] = SimplifyCommand(command);
	}

	let needsRegister = NeedsRegister(oldCommands, newCommands);
	// Only check dev commands if no change is needed, this prevents unnecessary API calls
	// Won't matter if dev commands are different if the public commands are also different, still need to register
	if (!needsRegister && config.DEV_GUILD_ID.length > 0) {
		const registeredDevCommands = await MakeRequest('GET', `https://discord.com/api/v10/applications/${config.APP_ID}/guilds/${config.DEV_GUILD_ID}/commands`, null, config.TOKEN); // Array

		if (registeredDevCommands.length === 0) {
			RegisterCommands(components);
			return;
		}
		// oldDevCommands = Object.fromEntries(registeredDevCommands.map(command => [command.name, command]));
		for (const command of registeredDevCommands) {
			oldDevCommands[command.name] = SimplifyCommand(command);
		}

		needsRegister = NeedsRegister(oldDevCommands, newDevCommands);
	}

	if (needsRegister) {
		console.log('Started refreshing application (/) commands');
		await RegisterCommands(components);
		console.log('Successfully reloaded application (/) commands.');
	} else {
		console.log('No changes detected, skipping registration');
	}
}