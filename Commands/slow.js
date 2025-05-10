const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('slow')
	.setDescription('Demo for caching in microbase'),
	execute: async function (interaction) {
		
		await new Promise(resolve => setTimeout(resolve, 4000)); // stall for 4 seconds

		await interaction.reply('Finished!');
	}
};