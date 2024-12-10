//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }// node app.js 0 1
const shardID = parseInt(process.argv[2]);
const shardCount = parseInt(process.argv[3]);
if (shardID && isNaN(shardCount)) {
	console.error('Shard ID was set but no shard count was defined');
	process.exit(1);
}

// These 2 modules run on automatically so we don't care about the return value
require('./Utils/Overrides/Interactions');
require('./Utils/Overrides/InteractionEvents');

require('./Utils/ProcessHandler');

if (!process.send) require('./Utils/CheckPackages');

var _ShardManager = require('./Utils/Sharding/ShardManager'); var _ShardManager2 = _interopRequireDefault(_ShardManager);
var _ComponentLoader = require('./Utils/ComponentLoader'); var _ComponentLoader2 = _interopRequireDefault(_ComponentLoader);
var _EventLoader = require('./Utils/EventLoader'); var _EventLoader2 = _interopRequireDefault(_EventLoader);
var _Logs = require('./Utils/Logs'); var _Logs2 = _interopRequireDefault(_Logs);
var _RegisterCommands = require('./Utils/RegisterCommands'); var _RegisterCommands2 = _interopRequireDefault(_RegisterCommands);
var _FileWatch = require('./Utils/FileWatch'); var _FileWatch2 = _interopRequireDefault(_FileWatch);
var _CheckIntents = require('./Utils/CheckIntents'); var _CheckIntents2 = _interopRequireDefault(_CheckIntents);
var _discordjs = require('discord.js');

const client = new (0, _discordjs.Client)({
	... isFinite(shardID) ? { shards: [shardID, shardCount] } : {},
	intents: [
		'MessageContent',
		'GuildMessages',
		'DirectMessages'
	]
}) ;

// type checking done in the index.js
client.config = require('../config.json');
client.logs = _Logs2.default;
client.cooldowns = new Map(); // guildID::userID -> timestamp
client.activeCollectors = new Map(); // messageID -> collector
client.responseCache = new Map(); // messageID -> response
client.shards = new (0, _ShardManager2.default)(client, shardID, shardCount);// class will not initialize if shardID is not a number, reduces memory overhead
client.fileErrors = new Map(); // file -> error

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
	_ComponentLoader2.default.call(void 0, client, module);
	// The map is initialized in the ComponentLoader
	client.logs.debug(`Loaded ${client[module].size} ${module}`);
}

_EventLoader2.default.call(void 0, client);
let ListenerCount = 0;
for (const listeners of Object.values(client._events)) {
	ListenerCount += listeners.length;
}
// DJS adds a default 'shardDisconnect' listener that we ignore
client.logs.debug(`Loaded ${ListenerCount - 1} events`);

// This will only check intents loaded by the event loader
// If they are defined below this point they will not be checked
_CheckIntents2.default.call(void 0, client);

if (isNaN(shardID)) {
	// We only register if the bot isn't started by the shard manager
	// The manger does a dynamic register but we don't have that luxury here
	client.logs.info(`Started refreshing application (/) commands`);
	_RegisterCommands2.default.call(void 0, client);
	client.logs.info(`Successfully reloaded application (/) commands`);
}

client.logs.info(`Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', function () {
	client.logs.custom(`Logged in as ${client.user.tag}!`, 0x7946ff);

	if (!process.send) {
		_FileWatch2.default.call(void 0, client); // listener for hot loading
	} else {
		client.shards.broadcastReady();
	}
});