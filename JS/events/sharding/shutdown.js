//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});

exports. default = {
	// This is called if the manager ever requests the shard to terminate
	// You have 10 seconds to finish whatever you're doing before the shard is forcefully killed
	name: 'shutdown',
	execute: async function (client) {
		console.log(`Shard ${client.shards.shardID} is shutting down...`);
		client.destroy();
		process.exit(0);
	}
}
module.exports = exports.default;