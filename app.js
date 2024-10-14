// if this isn't a child process, exit
if (!process.send) {
	console.error('This bot cannot be run without a shard manager, run index.js instead');
	process.exit(1);
}

// node app.js 0
const shardID = parseInt(process.argv[2]); // possibly NaN if not specified
if (isNaN(shardID)) {
	console.error(`Invalid shard ID provided : ${process.argv[2]}`);
	process.exit(1);
}

require('./utils/Overrides/Interactions.js')();
require('./utils/Overrides/InteractionEvent.js')();
require('./utils/ProcessHandlers.js')();

const { Client } = require('discord.js');
const client = new Client({
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

require('./utils/ComponentLoader.js')(client);
require('./utils/EventLoader.js')(client);
require('./utils/RegisterCommands.js')(client);

// This will only check intents loaded by the event loader
// If they are defined below this point they will not be checked
require('./utils/CheckIntents.js')(client);

client.logs.info(`Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', function () {
	client.logs.custom(`Logged in as ${client.user.tag}!`, 0x7946ff);

	require('./utils/FileWatch.js')(client); // listener for hot loading
});