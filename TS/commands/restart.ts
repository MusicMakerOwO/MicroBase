// const { SlashCommandBuilder } = require('@discordjs/builders');
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from '../typings';

export default {
	data: new SlashCommandBuilder()
		.setName('restart')
		.setDescription('Restarts the bot.'),
	async execute(interaction: CommandInteraction) {
		interaction.reply('Restarting...').then(() => {
			process.exit(1);
		});
	}
}
module.exports = exports.default;