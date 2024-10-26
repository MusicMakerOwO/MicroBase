// node app.js 0 1
const shardID = parseInt(process.argv[2]);
const shardCount = parseInt(process.argv[3]);
if (shardID && isNaN(shardCount)) {
	console.error('Shard ID was set but no shard count was defined');
	process.exit(1);
}

require('./utils/Overrides/Interactions.js')();
require('./utils/Overrides/InteractionEvent.js')();
require('./utils/ProcessHandlers.js')();

const ComponentLoader = require('./utils/ComponentLoader.js');
const EventLoader = require('./utils/EventLoader.js');
const ShardManager = require('./utils/Sharding/ShardManager.js');

const { Client } = require('discord.js');
const client = new Client({
	... isFinite(shardID) ? {
		shardCount: shardCount,
		shards: shardID,
	} : {},
	intents: [
		'MessageContent',
		'GuildMessages',
		'DirectMessages',
	]
});

// Type checking is done in index.js
client.config = require('./config.json');
client.logs = require('./utils/Logs.js');
client.cooldowns = new Map();
client.activeCollectors = new Map(); // <messageID, collector>
client.responseCache = new Map(); // <commandName, response>
client.shards = new ShardManager(client, shardID, shardCount); // class will not initialize if shardID is not a number, reduces memory overhead

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
	ComponentLoader(client, module);
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
	client.logs.custom(`Logged in as ${client.user.tag}!`, 0x7946ff);

	if (!process.send) {
		require('./utils/FileWatch.js')(client); // listener for hot loading
	} else {
		client.shards.broadcastReady();
	}
});