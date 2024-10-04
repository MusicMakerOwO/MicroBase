const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	alias: 'pong',
	// aliases: ['pong'],
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pong!'),
	autocomplete: async function(interaction, client) {
		// this is optional, called on any autocomplete stuff
	},
	execute: async function(interaction, client) {
		await interaction.deferReply({ ephemeral: true, content: 'Pong!' });
		await interaction.reply({ content: 'Pong again!', ephemeral: true });
		await interaction.reply('This is pretty cool lol');
	}
}
