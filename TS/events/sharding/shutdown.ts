import { MicroClient } from "../../typings";

export default {
	// This is called if the manager ever requests the shard to terminate
	// You have 10 seconds to finish whatever you're doing before the shard is forcefully killed
	name: 'shutdown',
	execute: async function (client: MicroClient) {
		console.log(`Shard ${client.shards.shardID} is shutting down...`);
		client.destroy();
		process.exit(0);
	}
}
module.exports = exports.default;