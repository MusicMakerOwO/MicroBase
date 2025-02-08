require('./Utils/ProcessHandler');

const Log = require('./Utils/Logs');
const ComponentLoader = require('./Utils/ComponentLoader');
const EventLoader = require('./Utils/EventLoader');
const RegisterCommands = require('./Utils/RegisterCommands');
const FileWatch = require('./Utils/FileWatcher');
const CheckIntents = require('./Utils/CheckIntents');

const { Client } = require('discord.js');
const { existsSync } = require('node:fs');

const client = new Client({
	intents: [
		'MessageContent',
		'GuildMessages',
		'DirectMessages'
	]
});

// type checking done in the index.js
client.config = require('./config.json');
client.logs = Log;
client.cooldowns = new Map(); // guildID::userID -> timestamp
client.activeCollectors = new Map(); // messageID -> collector
client.responseCache = new Map(); // messageID -> response
client.fileErrors = new Map(); // file -> error

// These are all empty but need to be defined for the ComponentLoader
// They will be populated automatically, see below
client.commands = new Map();
client.context = new Map();
client.buttons = new Map();
client.menus = new Map();
client.modals = new Map();
client.messages = new Map();

// file path : [component type, component cache]
const ComponentFolders = {
	'./Commands': client.commands,
	'./Buttons' : client.buttons,
	'./Menus'   : client.menus,
	'./Modals'  : client.modals,
	'./Messages': client.messages,
	'./Context' : client.context,

	'./Events'  : null // handled separately
}

for (const [path, cache] of Object.entries(ComponentFolders)) {
	if (cache === null) {
		EventLoader(client, path);
		let ListenerCount = 0;
		for (const listeners of Object.values(client._events)) {
			ListenerCount += listeners.length;
		}
		client.logs.debug(`Loaded ${ListenerCount - 1} events`);
		continue;
	}

	if (!cache) {
		client.logs.error(`No cache found for ${path}`);
		continue;
	}

	if (!existsSync(path)) {
		client.logs.error(`The '${path.split('/')[1]}' folder does not exist - Check the relative path!`);
		delete ComponentFolders[path]; // remove it from the lookup so it doesn't get checked later
		continue;
	}
	
	ComponentLoader(path, cache);
	client.logs.debug(`Loaded ${cache.size} ${path.split('/')[1]}`);
}

// This will only check intents loaded by the event loader
// If they are defined below this point they will not be checked
CheckIntents(client);

RegisterCommands(client);

function HotReload(cache, componentFolder, filePath, type) {
	if (type !== 0) return; // 0 = file, 1 = directory, 2 = symlink

	const isEvent = cache === null;

	// repopulate the cache, register commands if needed

	if (isEvent) {
		client.removeAllListeners();
		EventLoader(client);
		client.logs.debug(`Loaded ${ListenerCount - 1} events`);
		return;
	}

	cache.clear();

	ComponentLoader(componentFolder, cache);
	client.logs.debug(`Loaded ${cache.size} ${componentFolder.split('/')[1]}`);
}

client.logs.info(`Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', function () {
	client.logs.custom(`Logged in as ${client.user.tag}!`, 0x7946ff);

	for (const [path, cache] of Object.entries(ComponentFolders)) {
		const watcher = new FileWatch(path, true);
		const callback = HotReload.bind(null, cache, path);
		watcher.onAdd = callback;
		watcher.onRemove = callback;
		watcher.onChange = callback;
	}
});