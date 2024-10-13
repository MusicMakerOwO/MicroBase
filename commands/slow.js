const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	cache: true,
	data: new SlashCommandBuilder()
	.setName('slow')
	.setDescription('Demo for caching in microbase'),
	execute: async function (interaction) {
		await interaction.reply('This is a slow command!');
		
		// Simulate lag
		await new Promise(resolve => setTimeout(resolve, 2000));

		await interaction.editReply('Finished!');
	}
}