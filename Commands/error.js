const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('error')
	.setDescription('oopsies'),
	async execute(interaction) {
		throw new Error('Oopsies');
	}
};