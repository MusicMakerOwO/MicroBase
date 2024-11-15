// const collector = interaction.createCollector(interaction);

const { EventEmitter } = require('events');

const TIME_TO_LIVE = 300_000; // 5 minutes

import { MicroClient } from '../../typings';
import { ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';

export default class Collector extends EventEmitter {
	#client: MicroClient;
	#clearTimeout: NodeJS.Timeout | null;
	public interaction: ChatInputCommandInteraction | ButtonInteraction;

	constructor(client: MicroClient, interaction: (ChatInputCommandInteraction | ButtonInteraction) & { messageID: string }) {
		super();

		// @ts-ignore Added internally by custom overrides
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

	handleInteraction(interaction: unknown) {
		this.resetTimeout();
		this.emit('collect', interaction);
	}

	end() { this.handleEnd(); }
	handleEnd() {
		this.emit('end');
		this.destroy();
	}
}
module.exports = exports.default;