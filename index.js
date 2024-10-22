const https = require('node:https');
const ChildProcess = require('node:child_process'); // shards are spawned as child processes

const MIN_SHARDS = 1;
const MAX_SHARDS = 16;
const GUILDS_PER_SHARD = 2000;

// Won't catch any missing packages in this file since it is pre-compiled
// It will work on the second run, so either run this twice or install manually
require('./utils/CheckPackages.js')();

const MessageTypes = require('./utils/Sharding/MessageTypes.js'); // enum for sharding communication
/*
module.exports = {
	BROADCAST_EVAL: 0,
	BROADCAST_EVAL_RESULT: 1,
	FETCH_CLIENT_VALUE: 2,
	SHARD_READY: 3,
	PERFORMANCE_METRICS: 4,
	LOG: 5,

	SHUTDOWN: 99,

	// IPC error codes
	IPC_UNKNOWN_TYPE: 100,
	IPC_INVALID_PAYLOAD: 101,
	IPC_UNKNOWN_REQUEST_ID: 102,
	IPC_UNKNOWN_ERROR: 199
}
*/

const Prompt = require('./utils/Prompt.js');
const CRC32 = require('./utils/crc32.js');
const ComponentLoader = require('./utils/ComponentLoader.js');

// We don't want to run this on the bot instance or it will run for each and every shard lol
const RegisterCommands = require('./utils/RegisterCommands.js');


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

async function MakeRequest(method, route, body) {
	return new Promise((resolve, reject) => {
		const request = https.request(route, {
			method: method,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bot ${config.TOKEN}`
			}
		});
		request.on('error', error => reject(error));
		request.on('timeout', () => reject(new Error('Request timed out')));
		request.on('response', response => {
			const data = [];
			response.on('data', data.push.bind(data));
			response.on('end', () => {
				if (response.statusCode < 200 || response.statusCode >= 300) {
					const response = JSON.parse(data.join(''));
					throw new Error(`[ Discord API : ${response.statusCode}] ${response.message}`);
				}
				resolve(JSON.parse(data.join('')));
			});
		});
		if (body) request.write(JSON.stringify(body));
		request.end();
	});
}

function StringifyFunction(key, value) {
	switch (typeof value) {
		case 'function':
			return null;
		case 'bigint':
			return Number(value); // introduces precision issues, you should consider that
		case 'undefined':
		case 'object':
			return value === null ? 'null' : value;
	}
	return value;
}

function SimplifyCommand(command) {
	return {
		name: command.name,
		description: command.description,
		type: command.type ?? 1,
		options: command.options ?? [],
		dm_permission: command.dm_permission ?? false,
		nsfw: command.nsfw ?? false
	}
}

function TokenizeCommand(command) {
	return CRC32(JSON.stringify(command, StringifyFunction));
}

function CheckCommandEquality(oldCommand, newCommand) {
	const oldToken = TokenizeCommand(oldCommand);
	const newToken = TokenizeCommand(newCommand);
	return oldToken === newToken;
}

function NeedsRegister(oldCommands, newCommands) {
	if (Object.keys(oldCommands).length !== Object.keys(newCommands).length) {
		console.log('Length mismatch');
		console.log(Object.keys(oldCommands).length, Object.keys(newCommands).length);
		return true;
	}
	for (const [name, command] of Object.entries(oldCommands)) {
		if (!newCommands[name]) {
			return true;
		}
		if (!CheckCommandEquality(command, newCommands[name])) {
			return true;
		}
	}
	return false;
}

async function DynamicRegister() {
	console.log('Checking commands, this may take a second...');
	const oldCommands = {};
	const newCommands = {};

	const oldDevCommands = {};
	const newDevCommands = {};

	const components = {
		commands: new Map()
	}
	ComponentLoader(components, 'commands');

	for (const [name, command] of components.commands.entries()) {
		if (command.dev) {
			newDevCommands[name] = SimplifyCommand(command.data);
		} else {
			newCommands[name] = SimplifyCommand(command.data);
		}
	}

	const registeredCommands = await MakeRequest('GET', `https://discord.com/api/v10/applications/${config.APP_ID}/commands`, null); // Array

	if (registeredCommands.length === 0) {
		await RegisterCommands(components);
		return;
	}
	// oldCommands = Object.fromEntries(registeredCommands.map(command => [command.name, command]));
	for (const command of registeredCommands) {
		oldCommands[command.name] = SimplifyCommand(command);
	}

	let needsRegister = NeedsRegister(oldCommands, newCommands);
	// Only check dev commands if no change is needed, this prevents unnecessary API calls
	// Won't matter if dev commands are different if the public commands are also different, still need to register
	if (!needsRegister && config.DEV_GUILD_ID.length > 0) {
		const registeredDevCommands = await MakeRequest('GET', `https://discord.com/api/v10/applications/${config.APP_ID}/guilds/${config.DEV_GUILD_ID}/commands`, null); // Array

		if (registeredDevCommands.length === 0) {
			RegisterCommands(components);
			return;
		}
		// oldDevCommands = Object.fromEntries(registeredDevCommands.map(command => [command.name, command]));
		for (const command of registeredDevCommands) {
			oldDevCommands[command.name] = SimplifyCommand(command);
		}

		needsRegister = NeedsRegister(oldDevCommands, newDevCommands);
	}

	if (needsRegister) {
		console.log('Started refreshing application (/) commands');
		await RegisterCommands(components);
		console.log('Successfully reloaded application (/) commands.');
	} else {
		console.log('No changes detected, skipping registration');
	}
}

async function GetGuildCount() {
	const guilds = await MakeRequest('GET', `https://discord.com/api/v10/users/@me/guilds`, null);
	return guilds.length;
}

async function GetShardCount() {
	const guildCount = await GetGuildCount();
	let shardCount = Math.ceil(guildCount / GUILDS_PER_SHARD);

	if (shardCount < MIN_SHARDS) {
		shardCount = MIN_SHARDS;
	}

	if (shardCount > MAX_SHARDS) {
		const recommendedShards = Math.ceil(guildCount / GUILDS_PER_SHARD);

		console.error(`You have exceeded the maximum shard count of ${MAX_SHARDS}, you should consider increasing the limit.`);
		console.error(`This will cause issues with your bot if you do not resolve this!`);
		console.warn(`Current guild count: ${guildCount}`);
		console.warn(`Current shard count: ${shardCount}`);
		console.warn(`Max shard count: ${MAX_SHARDS}`);
		console.error('-'.repeat(10), 'Recommendations', '-'.repeat(10));
		console.warn(`Shard count: ${recommendedShards}`);
		console.warn(`Guilds per shard: ${GUILDS_PER_SHARD}`);
		console.error('-'.repeat(13), 'Settings', '-'.repeat(13));
		console.error(`MIN_SHARDS: ${MIN_SHARDS}`);
		console.error(`MAX_SHARDS: ${MAX_SHARDS}`);
		console.error(`GUILDS_PER_SHARD: ${GUILDS_PER_SHARD}`);
		console.error('--'.repeat(18));
		const response = await Prompt(`\x1b[34mWould you like to use the recommended \x1b[0mshard count of ${recommendedShards}\x1b[34m? (Y/n/c)\x1b[0m `);
		
		if (response.toLowerCase() === 'c') {
			process.exit(0);
		}

		if (response.toLowerCase() === 'n') {
			return MAX_SHARDS;
		} else {
			return recommendedShards;
		}
	}

	return shardCount;
}

let shuttingDown = false;
const shards = new Map(); // <shardID, process> - shards are spawned as child processes
const shardCrashes = new Map(); // <shardID, last timestamp>
function CreateShard(shardID, shardCount = shards.size) {
	const shard = ChildProcess.fork('./app.js', [shardID, shardCount], {
		// JSON serialization allows for transmission of primitive types but not much else
		// Things like numbers, strings, booleans, arrays, and objects are fine
		// But if you need more complex data, like functions, you will need to convert it to a primitive
		// Either stringify if or convert it to a simpile object, ie. Map -> Object
		serialization: 'json',
		silent: true, // logs handled by master process
		stdio: 'pipe', // pipe stdout and stderr, doesn't go straight to console so we can intercept it and log it
	});
	shard.shutdown = () => {
		if (shard.connected) shard.send({ type: MessageTypes.SHUTDOWN });
	}
	BindListeners(shard, shardID);
	shards.set(shardID, shard);
	shardCrashes.set(shardID, Date.now());
}

function ClearLine() {
	process.stdout.write('\x1b[2K'); // clear current line
	process.stdout.write('\x1b[0G'); // move cursor back to beginning
}

function BindListeners(child, shardID) {
	child.stdout.on('data', message => {
		message = message.toString().trim();
		console.log(`[ Shard ${shardID} ] ${message}`);
	});
	child.stderr.on('data', message => {
		message = message.toString().trim();
		console.error(`[ Shard ${shardID} ] ${message}`);
	});
	child.on('exit', code => {
		console.warn(`[~] Shard ${shardID} exited with code ${code}`);
		shards.delete(shardID);
		if (code !== 0 && !shuttingDown) {
			const lastCrash = shardCrashes.get(shardID);
			const timeSinceCrash = Date.now() - lastCrash;
			if (timeSinceCrash < 10_000) {
				console.error(`[~] Shard ${shardID} crashed too quickly [${timeSinceCrash}ms], not respawning`);
				return;
			}
			console.error(`[~] Restarting shard ${shardID}...`);
			const newShard = CreateShard(shardID, shards.size + 1);
			shards.set(shardID, newShard);
		}
	});
}

async function Shutdown() {

	if (shuttingDown) return;
	shuttingDown = true; // prevent spawning more instances + double shutdown

	if (shards.size === 0) {
		// all shards either crashed or were shutdown
		console.log('\x1b[34m[~] No shards to shutdown, natural exit');
		process.exit(0);
	}

	ClearLine();
	console.warn('[~] Shutting down...');
	for (const shard of shards.values()) {
		if (!shard?.connected) continue;
		shard.shutdown();
	}

	let shutdownAttempts = 0;
	const MAX_SHUTDOWN_ATTEMPTS = 20;

	while (shards.size > 0 && shutdownAttempts < MAX_SHUTDOWN_ATTEMPTS) {
		// something is still ticking, wait a bit and try again
		await new Promise(resolve => setTimeout(resolve, 1_000));
		shutdownAttempts++;
	}


	// Something didn't close fully so we need to force it
	if (shards.size > 0) {
		for (const shard of shards.values()) {
			shard.kill();
		}
		console.warn('[~] Forced shutdown of all shards');
	}

	process.exit(0);
}

// Crtl+Z handler
process.on('SIGTSTP', Shutdown);

// Crtl+C handler
process.on('SIGINT', Shutdown);

process.on('SIGTERM', Shutdown);
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);
process.on('warning', console.warn);

// Process exit handler
process.on('exit', Shutdown);

// IPC relays
function ResetTimeout(requestID) {
	const oldTimeout = requestTimeouts.get(requestID);
	if (oldTimeout) {
		clearTimeout(oldTimeout);
	}

	const newTimeout = setTimeout(() => {
		activeRequests.delete(requestID);
	}, 10_000); // 10 seconds

	requestTimeouts.set(requestID, newTimeout);
}

const activeRequests = new Map(); // <requestID, results[]>
const requestTimeouts = new Map(); // <requestID, timeout>
process.on('message', message => {
	if (typeof message !== 'object' || message === null) {
		console.warn('[~] Invalid message received');
		console.warn(message);
		return;
	}

	const { type, shardID, requestID, data } = message;
	/*
	module.exports = {
		BROADCAST_EVAL: 0,
		BROADCAST_EVAL_RESULT: 1,
		BROADCAST_EVENT: 2,
		FETCH_CLIENT_VALUE: 3,
		SHARD_READY: 4,
		PERFORMANCE_METRICS: 5,
		LOG: 6,
		
		SHUTDOWN: 99,

		// IPC error codes
		IPC_UNKNOWN_TYPE: 100,
		IPC_INVALID_PAYLOAD: 101,
		IPC_UNKNOWN_REQUEST_ID: 102,
		IPC_UNKNOWN_ERROR: 199
	}
	*/

	const shard = shards.get(shardID);
	if (!shards.has(shardID)) {
		console.warn(`[~] Unknown shard ID: ${shardID}`);
		return;
	}

	if (!Object.keys(MessageTypes).includes(type)) {
		shard.send({ type: MessageTypes.IPC_UNKNOWN_TYPE, requestID });
		return;
	}

	if (typeof requestID !== 'string' || requestID.length === 0) {
		shard.send({ type: MessageTypes.IPC_UNKNOWN_REQUEST_ID });
		return;
	}

	switch (type) {
		case MessageTypes.BROADCAST_EVAL_RESULT:
			// eval expired
			if (!activeRequests.has(requestID)) return;

			ResetTimeout(requestID);
			const results = activeRequests.get(requestID);
			results.push(data);
			if (results.length === shards.size) {
				// every shard has responded, no more waiting
				for (const shard of shards.values()) {
					shard.send({ type: MessageTypes.BROADCAST_EVAL_RESULT, requestID, result: results });
				}
				activeRequests.delete(requestID);
			} else {
				activeRequests.set(requestID, results);
			}
			break;
		case MessageTypes.BROADCAST_EVAL:
			// send everywhere else
			activeRequests.set(requestID, []);
			ResetTimeout(requestID);
			for (const shard of shards.values()) {
				shard.send(message);
			}
			break;
		case MessageTypes.FETCH_CLIENT_VALUE:
			// bounce back to all shards
			activeRequests.set(requestID, []);
			for (const shard of shards.values()) {
				shard.send(message);
			}
			break;
		case MessageTypes.SHARD_READY:
			console.log(`[~] Shard ${shardID} is ready`);
			break;
		case MessageTypes.LOG:
			console.log(data);
			break;
		case MessageTypes.SHUTDOWN:
			// no lol
			break;
		case MessageTypes.IPC_UNKNOWN_TYPE:
		case MessageTypes.IPC_INVALID_PAYLOAD:
		case MessageTypes.IPC_UNKNOWN_REQUEST_ID:
		case MessageTypes.IPC_UNKNOWN_ERROR:
			// TODO: error handling
			break;
		default:
			console.warn(`[~] Unknown message type: ${type}`);
	}
});

// This is actually the main entry point, everything else is just setup o_O
( async () => {
	await DynamicRegister(); // register commands if needed

	const shardCount = await GetShardCount(); // get shard count based on guilds and user input
	if (shardCount <= 0) {
		console.warn('[~] Shard count is 0, nothing to do!');
		process.exit(0);
	}

	console.warn(`[~] Spawning ${shardCount} shards...`);
	for (let i = 0; i < shardCount; i++) {
		CreateShard(i, shardCount);
	}
})();

function ConvertMapToObject(map) {
	const obj = {};
	for (const [key, value] of map.entries()) {
		obj[key] = value;
	}
	return obj;
}