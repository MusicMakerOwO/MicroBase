// const collector = interaction.createCollector(interaction);

const { EventEmitter } = require('events');

const TIME_TO_LIVE = 300_000; // 5 minutes

module.exports = class Collector extends EventEmitter {
	#client = null;
	#clearTimeout = null;

	constructor(client, interaction) {
		super();

		this.messageID = interaction.messageID ?? interaction.message?.id;
		if (!this.messageID) throw new Error('Interaction must have a message, make sure you replied first');

		this.#client = client;
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

	end = this.handleEnd;
	handleEnd() {
		this.emit('end');
		this.destroy();
	}
}