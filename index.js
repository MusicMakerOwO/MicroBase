require('./Utils/ProcessHandler');

const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const config = require('./config.json');

const Log = require('./Utils/Logs');
const ComponentLoader = require('./Utils/ComponentLoader');
const EventLoader = require('./Utils/EventLoader');
const RegisterCommands = require('./Utils/RegisterCommands');
const FileWatch = require('./Utils/FileWatcher');
const CheckIntents = require('./Utils/CheckIntents');

const { Client } = require('discord.js');
const ReadFolder = require('./Utils/ReadFolder');
const Debounce = require('./Utils/Debounce');

const client = new Client({
	intents: [
		'MessageContent',
		'GuildMessages',
		'DirectMessages'
	]
});

// type checking done in the index.js
client.config = config;
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
	if (!existsSync(presetFile)) {
		Log.error(`The preset "${presetFile}" file does not exist - Check the relative path!`);
		PRESET_FILES[componentFolder] = null;
		continue;
	}

	if (!(componentFolder in COMPONENT_FOLDERS)) {
		Log.error(`The folder "${componentFolder}" does not exist in the COMPONENT_FOLDERS lookup`);
		PRESET_FILES[componentFolder] = null;
		continue;
	}

	const data = readFileSync(presetFile, 'utf-8');
	if (data.length > 0) PRESET_FILES[componentFolder] = data;
}

for (const [path, cache] of Object.entries(COMPONENT_FOLDERS)) {
	if (cache === null) {
		EventLoader(client, path);
		let ListenerCount = 0;
		for (const listeners of Object.values(client._events)) {
			ListenerCount += listeners.length;
		}
		Log.debug(`Loaded ${ListenerCount - 1} events`);
		continue;
	}

	if (!cache) {
		Log.error(`No cache found for ${path}`);
		continue;
	}

	if (!existsSync(path)) {
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

	const isEvent = cache === null;

	// repopulate the cache, register commands if needed

	if (isEvent) {
		client.removeAllListeners();
		EventLoader(client);
		let ListenerCount = 0;
		for (const listeners of Object.values(client._events)) {
			ListenerCount += listeners.length;
		}
		Log.debug(`Loaded ${ListenerCount - 1} events`);
		return;
	}

	const files = ReadFolder(`${__dirname}/${componentFolder}`);
	for (let i = 0; i < files.length; i++) {
		delete require.cache[ require.resolve(files[i]) ];
	}

	cache.clear();

	ComponentLoader(componentFolder, cache);
	Log.debug(`Loaded ${cache.size} ${componentFolder.split('/')[1]}`);

	// Check by reference, not by cache contents
	if (cache == client.commands) {
		await RegisterCommands(client);
	}
}

function PresetFile(cache, componentFolder, callback, filePath) {
	const presetData = PRESET_FILES[componentFolder];
	if (!presetData) return;

	// write into the new file
	writeFileSync(filePath, presetData);

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
		const watcher = new FileWatch(path, true);
		const callback = Debounce(HotReload.bind(null, cache, path), 1_000);
		watcher.onAdd = PresetFile.bind(null, cache, path, callback);
		watcher.onRemove = callback;
		watcher.onChange = callback;
	}
});