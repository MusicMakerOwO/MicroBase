//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true});// const collector = interaction.createCollector(interaction);

const { EventEmitter } = require('events');

const TIME_TO_LIVE = 300000; // 5 minutes
 class Collector extends EventEmitter {
	#client;
	#clearTimeout;
	constructor(client, interaction) {
		super();

		this.messageID = 'messageID' in interaction ? interaction.messageID : interaction.message.id;
		if (!this.messageID) throw new Error('Interaction must have a message, make sure you replied first');

		this.#client = client;
		this.#clearTimeout = null;
		this.interaction = interaction;

		this.#client.activeCollectors.set(this.messageID, this);

		this.resetTimeout();
	}

	resetTimeout() {
		if (this.#clearTimeout) clearTimeout(this.#clearTimeout);
		this.#clearTimeout = setTimeout(() => {
			this.emit('end');
			this.destroy();
		}, TIME_TO_LIVE);
	}

	destroy() {
		if (this.#clearTimeout) clearTimeout(this.#clearTimeout);
		this.removeAllListeners();
		this.#client.activeCollectors.delete(this.messageID);
	}

	handleInteraction(interaction) {
		this.resetTimeout();
		this.emit('collect', interaction);
	}

	end() { this.handleEnd(); }
	handleEnd() {
		this.emit('end');
		this.destroy();
	}
} exports.default = Collector;
module.exports = exports.default;