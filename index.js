const https = require('node:https');
const fs = require('node:fs');

require('./utils/CheckPackages.js')();

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

const components = {
	commands: new Map(),
	buttons: new Map(),
	menus: new Map(),
	modals: new Map(),
	messages: new Map()
}
ComponentLoader(components, 'commands'); // only loading commands for now
RegisterCommands(components);

