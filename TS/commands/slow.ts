import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from '../typings';

export default {
	defer: false, // defer without being ephemeral
	cache: true, // the next time you run this command it will jump straight to the bottom without delay
	data: new SlashCommandBuilder()
	.setName('slow')
	.setDescription('Demo for caching in microbase'),
	execute: async function (interaction: CommandInteraction) {

		// Spin the CPU for 3 seconds, we are gauranteed to get a "application did not respond" error
		const start = Date.now();
		while (Date.now() - start < 3000) { }

		await interaction.reply('This is a slow command...');
		
		// Simulate lag
		await new Promise(resolve => setTimeout(resolve, 3000));

		await interaction.editReply('Finished!');
	}
}
module.exports = exports.default;