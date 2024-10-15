// client.shards = new ShardManager(client, clusters, shardID, shardCount);

const MessageTypes = require('./MessageTypes.js');

module.exports = class ShardManager {
	#client = null;
	contructor (client, clusters, shardID, shardCount) {
		this.#client = client;

		this.clusters = clusters;
		this.shardID = shardID;
		this.shardCount = shardCount;

		this.activeRequests = new Map(); // <requestID, Promise>

		process.on('message', this.handleIncomingMessage.bind(this));
	}

	generateRequestID () {
		// 1-XXXXXX
		return `${this.shardID}-${Math.floor(Math.random() * 1_000_000)}`;
	}

	waitForRequest (requestID) {
		return new Promise((resolve, reject) => {
			this.activeRequests.set(requestID, { resolve, reject });
		});
	}

	broadcast (type, data) {
		const requestID = this.generateRequestID();
		process.send({
			type: MessageTypes.BROADCAST,
			requestID: requestID,
			type: type,
			data: data
		});
		return requestID;
	}

	async broadcastEval (script) {
		const payload = {
			script: Function.prototype.toString.call(script)
		};
		const requestID = this.broadcast(MessageTypes.BROADCAST_EVAL, payload);
		const result = await this.waitForRequest(requestID);
		return result;
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
		const { shardID, requestID, type, data } = message;
		if (shardID && shardID !== this.shardID) return;

		const request = this.activeRequests.get(requestID);
		if (!request) return;

		switch (type) {
			case MessageTypes.BROADCAST_EVAL_RESULT:
				request.resolve(data);
				break;
			case MessageTypes.SHUTDOWN:
				this.#client.emit('shutdown');
				break;
			case MessageTypes.BROADCAST_EVAL:
				const script = Function(data.script);
				const result = await script(this.#client);
				this.broadcast(MessageTypes.BROADCAST_EVAL_RESULT, { requestID, result });
				break;
			case MessageTypes.FETCH_CLIENT_VALUE:
				const fields = data.key.split('.');
				let value = this.#client;
				for (const field of fields) {
					value = value[field];
					if (typeof value === 'undefined' || value === null) {
						value = null;
						break;
					}
				}
				this.broadcast(MessageTypes.BROADCAST_EVAL_RESULT, { requestID, value });
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
				// oopsies something broke
				request.reject(data);
				break;
			default:
		}
	}
}