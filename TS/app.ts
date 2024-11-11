// node app.js 0 1
const shardID = parseInt(process.argv[2]);
const shardCount = parseInt(process.argv[3]);
if (shardID && isNaN(shardCount)) {
	console.error('Shard ID was set but no shard count was defined');
	process.exit(1);
}

// These 2 modules run on automatically so we don't care about the return value
import './Utils/Overrides/Interactions';
import './Utils/Overrides/InteractionEvent';

import ProcessHandler from './Utils/ProcessHandler';
import ShardManager from './Utils/Sharding/ShardManager';
import ComponentLoader from './Utils/ComponentLoader';
import EventLoader from './Utils/EventLoader';
import Log from './Utils/Logs';

import { MicroClient } from './typings';

ProcessHandler();


import { Client } from 'discord.js';
const client = new Client({
	... isFinite(shardID) ? { shards: [shardID, shardCount] } : {},
	intents: [
		'MessageContent',
		'GuildMessages',
		'DirectMessages'
	]
}) as MicroClient;

// type checking done in the index.js
client.config = require('./config.json');
client.logs = Log;
client.cooldowns = new Map<string, number>(); // guildID::userID -> timestamp
client.activeCollectors = new Map<string, any>(); // messageID -> collector
client.responseCache = new Map<string, any>(); // messageID -> response
client.shards = new ShardManager(client, shardID, shardCount);// class will not initialize if shardID is not a number, reduces memory overhead

const modules = [
	'context',
	'commands',
	'buttons',
	'menus',
	'modals',
	'messages',
];

for (let i = 0; i < modules.length; i++) {
	const module = modules[i];
	// @ts-ignore
	ComponentLoader(client, module);
	// The map is initialized in the ComponentLoader
	// @ts-ignore - TS doesn't like dynamic properties
	client.logs.debug(`Loaded ${client[module].size} ${module}`);
}

EventLoader(client);
let ListenerCount = 0;
for (const listeners of Object.values(client._events)) {
	ListenerCount += listeners.length;
}
// DJS adds a default 'shardDisconnect' listener that we ignore
client.logs.debug(`Loaded ${ListenerCount - 1} events`);

// This will only check intents loaded by the event loader
// If they are defined below this point they will not be checked
require('./utils/CheckIntents.js')(client);

if (isNaN(shardID)) {
	// We only register if the bot isn't started by the shard manager
	// The manger does a dynamic register but we don't have that luxury here
	client.logs.info(`Started refreshing application (/) commands`);
	require('./utils/RegisterCommands.js')(client);
	client.logs.info(`Successfully reloaded application (/) commands`);
}

client.logs.info(`Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', function () {
	// @ts-ignore
	client.logs.custom(`Logged in as ${client.user.tag}!`, 0x7946ff);

	if (!process.send) {
		require('./utils/FileWatch.js')(client); // listener for hot loading
	} else {
		client.shards.broadcastReady();
	}
});