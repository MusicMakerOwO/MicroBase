require('./utils/CheckPackages')();
require('./utils/Overrides/Interactions')();
require('./utils/Overrides/InteractionEvent')();
require('./utils/ProcessHandlers')();

const { Client } = require('discord.js');
const client = new Client({
	intents: [
		'Guilds',
		'GuildMessages',
		'MessageContent',
	]
});

client.config = require('./config.json');
client.logs = require('./utils/Logs.js');
client.cooldowns = new Map();
client.activeCollectors = new Map(); // <messageID, collector>

const errors = [];

if (typeof client.config.TOKEN !== 'string' || client.config.TOKEN.length === 0) {
	errors.push('Please provide a valid TOKEN in config.json');
}
if (typeof client.config.PREFIX !== 'string' || client.config.PREFIX.length === 0) {
	errors.push('Please provide a valid PREFIX in config.json');
}
if (typeof client.config.APP_ID !== 'string' || client.config.APP_ID.length === 0) {
	errors.push('Please provide a valid APP_ID in config.json');
}
if (typeof client.config.DEV_GUILD_ID !== 'string') {
	errors.push('Please provide a valid DEV_GUILD_ID in config.json');
}

if (errors.length > 0) {
	for (const error of errors) {
		console.error(`[~] ${error}`);
	}
	process.exit(1);
}

require('./utils/ComponentLoader.js')(client);
require('./utils/EventLoader.js')(client);
require('./utils/RegisterCommands.js')(client);

client.logs.info(`Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', function () {
	client.logs.custom(`Logged in as ${client.user.tag}!`, 0x7946ff);

	// It's a weird place but I am assuming by the time it logs in you are finished adding events
	// Adding events after it runs this function will not get checked
	require('./utils/CheckIntents.js')(client);
	require('./utils/FileWatch.js')(client); // listener for hot loading
});