//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _MessageTypes = require('./MessageTypes'); var _MessageTypes2 = _interopRequireDefault(_MessageTypes);
 class ShardManager {
	#client;
	constructor (client, shardID, shardCount) {
		if (!process.send) return null; // cancel initialization if sharding is not enabled

		this.#client = client;

		this.shardID = shardID;
		this.shardCount = shardCount;

		this.activeRequests = new Map(); // <requestID, Promise>

		this.ready = false;

		process.on('message', this.handleIncomingMessage.bind(this));
	}

	respond(data) {
		if (!process.send) return;
		process.send(data);
	}

	generateRequestID () {
		// 1-XXXXXX
		return `${this.shardID}-${Math.floor(Math.random() * 1000000)}`;
	}

	waitForRequest (requestID) {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.activeRequests.delete(requestID);
				reject('Request timed out');
			}, 10000);
			const finish = (...args) => {
				clearTimeout(timeout);
				this.activeRequests.delete(requestID);
				resolve(args);
			};
			this.activeRequests.set(requestID, { resolve: finish, reject });
		});
	}

	broadcast (type, data = null, requestID = '') {
		if (!isFinite(this.shardID) || !process.send) throw new Error('Sharding is not enabled, make sure you ran the manager in the index.js file');
		if (typeof type === 'string') {
			type = _MessageTypes2.default[type];
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
		this.broadcast(_MessageTypes2.default.REGISTER_COMMANDS);
	}

	broadcastReady () {
		if (this.ready) return;
		this.broadcast(_MessageTypes2.default.SHARD_READY);
		this.ready = true;
	}

	async broadcastEval (script) {
		const payload = {
			script: Function.prototype.toString.call(script)
		};
		const requestID = this.broadcast(_MessageTypes2.default.BROADCAST_EVAL, payload);
		return this.waitForRequest(requestID);
	}

	// "guilds.cache.size"
	async fetchClientValue (key)  {
		const requestID = this.broadcast(_MessageTypes2.default.FETCH_CLIENT_VALUE, { key });
		const result = await this.waitForRequest(requestID);
		return result;
	}

	async handleIncomingMessage (message) {

		if (typeof message !== 'object' || message === null) {
			console.warn('[~] Invalid message received');
			console.warn(message);
			return;
		}
	
		const { type, requestID, data } = message ;
	
		if (!Object.values(_MessageTypes2.default).includes(type)) {
			this.respond({ type: _MessageTypes2.default.IPC_UNKNOWN_TYPE, shardID: this.shardID, requestID });
			return;
		}
	
		if (typeof requestID !== 'string' || requestID.length === 0) {
			this.respond({ type: _MessageTypes2.default.IPC_UNKNOWN_REQUEST_ID, shardID: this.shardID, requestID });
			return;
		}

		const request = this.activeRequests.get(requestID);

		switch (type) {
			case _MessageTypes2.default.HEARTBEAT:
				this.broadcast(_MessageTypes2.default.HEARTBEAT_ACK);
				// If no response is received within 30 seconds, the manager will assume the shard is dead
				// This could be either due to lag, stuck in a loop, or the shard being fully dead somehow
				// In this case it won't get a graceful shutdown and will be forcefully killed
				break;
			case _MessageTypes2.default.BROADCAST_EVAL_RESULT:
				if (!request) return;
				request.resolve(data);
				break;
			case _MessageTypes2.default.SHUTDOWN:
				this.#client.emit('shutdown');
				break;
			case _MessageTypes2.default.BROADCAST_EVAL:
				eval(`(${data.script})()`);
				break;
			case _MessageTypes2.default.FETCH_CLIENT_VALUE:
				const fields = data.key.split('.');
				let value = this.#client;
				for (const field of fields) {
					value = value[field];
					if (typeof value === undefined || value === null) {
						value = null;
						break;
					}
				}
				this.broadcast(_MessageTypes2.default.BROADCAST_EVAL_RESULT, { shardID: this.shardID, value }, requestID);
				break;
			case _MessageTypes2.default.HOT_RELOAD:
				this.#client.emit('hotReload', data);
				break;
			case _MessageTypes2.default.SHARD_READY:
			case _MessageTypes2.default.PERFORMANCE_METRICS:
			case _MessageTypes2.default.LOG:
				// will never be received by the manager
				break;
			case _MessageTypes2.default.IPC_UNKNOWN_TYPE:
			case _MessageTypes2.default.IPC_INVALID_PAYLOAD:
			case _MessageTypes2.default.IPC_UNKNOWN_REQUEST_ID:
			case _MessageTypes2.default.IPC_UNKNOWN_ERROR:
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
} exports.default = ShardManager;
module.exports = exports.default;