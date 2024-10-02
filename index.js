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