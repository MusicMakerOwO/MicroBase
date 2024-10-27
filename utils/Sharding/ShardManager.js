// client.shards = new ShardManager(client, clusters, shardID, shardCount);

const MessageTypes = require('./MessageTypes.js');

const GuildCache = new Map();

module.exports = class ShardManager {
	#client = null;
	constructor (client, shardID, shardCount) {
		if (!process.send) return null; // cancel initialization if sharding is not enabled

		this.#client = client;

		this.shardID = shardID;
		this.shardCount = shardCount;

		this.activeRequests = new Map(); // <requestID, Promise>

		this.ready = false;

		process.on('message', this.handleIncomingMessage.bind(this));
	}

	async lookupGuild (guildID) {
		const shardID = (guildID >> 22) % this.shardCount;
		if (shardID === this.shardID) return this.#client.guilds.cache.get(guildID);
		if (GuildCache.has(guildID)) return GuildCache.get(guildID);

		// It's not worth the time and effort to destructure and reconstruct and entire guild object
		// IPC would suffer greatly from the shear amount of data transfered
		const guild = await this.#client.guilds.fetch(guildID).catch(() => null);
		if (guild) GuildCache.set(guildID, guild);

		return guild;
	}

	generateRequestID () {
		// 1-XXXXXX
		return `${this.shardID}-${Math.floor(Math.random() * 1_000_000)}`;
	}

	waitForRequest (requestID) {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.activeRequests.delete(requestID);
				reject('Request timed out');
			}, 10_000);
			const finish = (...args) => {
				clearTimeout(timeout);
				this.activeRequests.delete(requestID);
				resolve(...args);
			};
			this.activeRequests.set(requestID, { resolve: finish, reject });
		});
	}

	broadcast (type, data = null, requestID = '') {
		if (!isFinite(this.shardID) || !process.send) throw new Error('Sharding is not enabled, make sure you ran the manager in the index.js file');
		if (typeof type === 'string') {
			type = MessageTypes[type];
			if (!type) throw new Error('Invalid message type');
		}
		if (requestID.length === 0) requestID = this.generateRequestID();
		process.send({
			type: type,
			requestID: requestID,
			shardID: this.shardID,
			data: data
		});
		return requestID;
	}

	broadcastRegister () {
		this.broadcast(MessageTypes.REGISTER_COMMANDS);
	}

	broadcastReady () {
		if (this.ready) return;
		this.broadcast(MessageTypes.SHARD_READY);
		this.ready = true;
	}

	async broadcastEval (script) {
		const payload = {
			script: Function.prototype.toString.call(script)
		};
		const requestID = this.broadcast(MessageTypes.BROADCAST_EVAL, payload);
		return this.waitForRequest(requestID);
	}

	// "guilds.cache.size"
	async fetchClientValue (key) {
		const requestID = this.broadcast(MessageTypes.FETCH_CLIENT_VALUE, { key });
		const result = await this.waitForRequest(requestID);
		return result;
	}

	async broadcastEvent (event, data) {
		this.broadcast(MessageTypes.BROADCAST_EVENT, { event, data });
	}

	async handleIncomingMessage (message) {

		if (typeof message !== 'object' || message === null) {
			console.warn('[~] Invalid message received');
			console.warn(message);
			return;
		}
	
		const { type, shardID, requestID, data } = message;
	
		if (!Object.values(MessageTypes).includes(type)) {
			process.send({ type: MessageTypes.IPC_UNKNOWN_TYPE, requestID });
			return;
		}
	
		if (typeof requestID !== 'string' || requestID.length === 0) {
			process.send({ type: MessageTypes.IPC_UNKNOWN_REQUEST_ID });
			return;
		}

		const request = this.activeRequests.get(requestID);

		switch (type) {
			case MessageTypes.HEARTBEAT:
				this.broadcast(MessageTypes.HEARTBEAT_ACK);
				// If no response is received within 30 seconds, the manager will assume the shard is dead
				// This could be either due to lag, stuck in a loop, or the shard being fully dead somehow
				// In this case it won't get a graceful shutdown and will be forcefully killed
				break;
			case MessageTypes.BROADCAST_EVAL_RESULT:
				if (!request) return;
				request.resolve(data);
				break;
			case MessageTypes.SHUTDOWN:
				this.#client.emit('shutdown');
				break;
			case MessageTypes.BROADCAST_EVAL:
				eval(`(${data.script})()`);
				break;
			case MessageTypes.FETCH_CLIENT_VALUE:
				const fields = data.key.split('.');
				let value = this.#client;
				for (const field of fields) {
					value = value[field];
					if (typeof value === undefined || value === null) {
						value = null;
						break;
					}
				}
				this.broadcast(MessageTypes.BROADCAST_EVAL_RESULT, { shardID: this.shardID, value }, requestID);
				break;
			case MessageTypes.HOT_RELOAD:
				this.#client.emit('hotReload', data);
				break;
			case MessageTypes.SHARD_READY:
			case MessageTypes.PERFORMANCE_METRICS:
			case MessageTypes.LOG:
				// will never be received by the manager
				break;
			case MessageTypes.IPC_UNKNOWN_TYPE:
			case MessageTypes.IPC_INVALID_PAYLOAD:
			case MessageTypes.IPC_UNKNOWN_REQUEST_ID:
			case MessageTypes.IPC_UNKNOWN_ERROR:
				if (request) {
					request.reject(data);
				} else {
					console.warn(`Received an error message without a request:`, data);
				}
				break;
			default:
				if (request) {
					request.reject(`Unknown message type: ${type}`);
				} else {
					console.warn(`Unknown message type: ${type}`);
				}
				break;
		}
	}
}