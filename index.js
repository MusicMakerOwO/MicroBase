const preloadStart = process.hrtime.bigint();

const config = require('./config.json');

const ConfigTemplate = {
	TOKEN: 'string',
	APP_ID: 'string',
	DEV_GUILD_ID: 'string',

	PREFIX: 'string',

	HOT_RELOAD: 'boolean',
	PROCESS_HANDLERS: 'boolean',
	CHECK_INTENTS: 'boolean',
	CHECK_EVENT_NAMES: 'boolean',
	REGISTER_COMMANDS: 'boolean',
	FANCY_ERRORS: 'boolean'
}

for (const [key, type] of Object.entries(ConfigTemplate)) {
	if (!(key in config)) {
		Log.error(`[~] Missing ${key} in config.json`);
		process.exit(1);
	}

	if (typeof config[key] !== type) {
		Log.error(`[~] Expected ${key} to be a ${type} in config.json - Got ${typeof config[key]} instead`);
		process.exit(1);
	}
}

const { existsSync, readFileSync } = require('node:fs');
const { writeFile, lstat } = require('node:fs/promises');

const Log = require('./Utils/Logs');
const ComponentLoader = require('./Utils/ComponentLoader');
const EventLoader = require('./Utils/EventLoader');
const RegisterCommands = require('./Utils/RegisterCommands');
const FileWatch = require('./Utils/FileWatcher');
const CheckIntents = require('./Utils/CheckIntents');

const { Client } = require('discord.js');
const Debounce = require('./Utils/Debounce');
const { RESPONSE_CACHE } = require('./Events/InteractionHandler');

require('./Utils/ProcessHandler');

const preloadEnd = process.hrtime.bigint();
const preloadTime = Number(preloadEnd - preloadStart) / 1e6;
Log.custom(`Preload time: ${~~preloadTime}ms`, 0x7946ff);

const client = new Client({
	intents: [
		'MessageContent',
		'GuildMessages',
		'DirectMessages'
	]
});

client.config = config;
client.logs = Log;
client.cooldowns = new Map(); // guildID::userID -> timestamp

// These are all empty but need to be defined for the ComponentLoader
// They will be populated automatically, see below
client.commands = new Map();
client.context = new Map();
client.buttons = new Map();
client.menus = new Map();
client.modals = new Map();
client.messages = new Map();

// file path : [component type, component cache]
const COMPONENT_FOLDERS = {
	'./Commands': client.commands,
	'./Buttons' : client.buttons,
	'./Menus'   : client.menus,
	'./Modals'  : client.modals,
	'./Messages': client.messages,
	'./Context' : client.context,

	'./Events'  : null // handled separately
}

// The values here will be replaced with the file contents, or null if the file does not exist
const PRESET_FILES = {
	'./Commands': './Presets/Command',
	'./Buttons' : './Presets/Button',
	'./Menus'   : './Presets/Menu',
	'./Modals'  : './Presets/Modal',
	'./Messages': './Presets/Message',
	'./Context' : './Presets/Context',
	'./Events'  : './Presets/Event'
}

for (const [componentFolder, presetFile] of Object.entries(PRESET_FILES)) {
	const fullPath = `${__dirname}/${presetFile}`;
	if (!existsSync(fullPath)) {
		Log.error(`The preset "${presetFile}" file does not exist - Check the relative path!`);
		PRESET_FILES[componentFolder] = null;
		continue;
	}

	if (!(componentFolder in COMPONENT_FOLDERS)) {
		Log.error(`The folder "${componentFolder}" does not exist in the COMPONENT_FOLDERS lookup`);
		PRESET_FILES[componentFolder] = null;
		continue;
	}

	const data = readFileSync(fullPath, 'utf-8');
	if (data.length > 0) PRESET_FILES[componentFolder] = data;
}

for (const [path, cache] of Object.entries(COMPONENT_FOLDERS)) {
	const fullPath = `${__dirname}/${path}`;
	if (cache === null) {
		client.removeAllListeners();
		EventLoader(client, path);
		let ListenerCount = 0;
		for (const listeners of Object.values(client._events)) {
			ListenerCount += listeners.length;
		}
		Log.debug(`Loaded ${ListenerCount} events`);
		continue;
	}

	if (!cache) {
		Log.error(`No cache found for ${path}`);
		continue;
	}

	if (!existsSync(fullPath)) {
		Log.error(`The '${path.split('/')[1]}' folder does not exist - Check the relative path!`);
		delete COMPONENT_FOLDERS[path]; // remove it from the lookup so it doesn't get checked later
		delete PRESET_FILES[path];
		continue;
	}
	
	ComponentLoader(path, cache);
	Log.debug(`Loaded ${cache.size} ${path.split('/')[1]}`);
}

// This will only check intents loaded by the event loader
// If they are defined below this point they will not be checked
if (config.CHECK_INTENTS) {
	CheckIntents(client);
} else {
	Log.warn('Intent checking is disabled in config.json');
}

RegisterCommands(client);

async function HotReload(cache, componentFolder, filePath, type = 0) {
	if (type !== 0) return; // 0 = file, 1 = directory, 2 = symlink

	try {
		const stat = await lstat(filePath);
		if (stat.isDirectory()) return;
		if (stat.isSymbolicLink()) return;
	} catch (err) {
		// file doesn't exist :(

		// slight edge case but there's no easy way to check this
		// If you delete an item on disk you can't check the metadata lol
		if (!filePath.endsWith('.js')) return;
	}

	const isEvent = cache === null;

	const oldComponent = require(filePath);

	delete require.cache[ require.resolve(filePath) ];

	// repopulate the cache, register commands if needed

	if (isEvent) {
		client.removeAllListeners();
		EventLoader(client, componentFolder);
		let ListenerCount = 0;
		for (const listeners of Object.values(client._events)) {
			ListenerCount += listeners.length;
		}
		Log.debug(`Loaded ${ListenerCount} events`);
		return;
	}

	cache.clear();

	ComponentLoader(componentFolder, cache);
	Log.debug(`Loaded ${cache.size} ${componentFolder.split('/')[1]}`);

	if (existsSync(filePath)) {
		const newComponent = require(filePath);

		// Check by reference, not by cache contents
		if (cache == client.commands) {
			const oldCommandData = oldComponent.data?.toJSON() ?? {};
			const newCommandData = newComponent.data?.toJSON() ?? {};
			if (JSON.stringify(oldCommandData) !== JSON.stringify(newCommandData)) {
				await RegisterCommands(client);
			}
		}
	} else {
		await RegisterCommands(client);
	}

	// we can't assume the response is the same
	RESPONSE_CACHE.clear();
}

async function PresetFile(cache, componentFolder, callback, filePath) {
	const presetData = PRESET_FILES[componentFolder];
	if (!presetData) return;

	const fileStats = await lstat(filePath);
	if (fileStats.isDirectory()) return;
	if (fileStats.isSymbolicLink()) return;

	// If you rename a file then it won't be empty
	// This will prevent overwriting existing files
	if (fileStats.size === 0) {
		await writeFile(filePath, presetData);
	}

	// reload the cache
	callback(filePath);
}

Log.info(`Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', function () {
	Log.custom(`Logged in as ${client.user.tag}!`, 0x7946ff);

	if (!config.HOT_RELOAD) {
		Log.warn('Hot reload is disabled in config.json');
		return;
	}

	for (const [path, cache] of Object.entries(COMPONENT_FOLDERS)) {
		const fullPath = `${__dirname}/${path}`;
		const watcher = new FileWatch(fullPath, true);
		const callback = Debounce(HotReload.bind(null, cache, path), 1_000);
		watcher.onAdd = PresetFile.bind(null, cache, path, callback);
		watcher.onRemove = callback;
		watcher.onChange = callback;
	}
});