// const { SlashCommandBuilder } = require('@discordjs/builders');
import { SlashCommandBuilder } from '@discordjs/builders';
import { MicroClient, CommandInteraction } from '../typings';

module.exports = {
	alias: 'pong',
	// aliases: ['pong'],
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pong!'),
	autocomplete: async function(interaction: CommandInteraction, client: MicroClient) {
		// this is optional, called on any autocomplete stuff
	},
	execute: async function(interaction: CommandInteraction, client: MicroClient) {
		await interaction.deferReply({ ephemeral: true, content: 'Pong!' });
		await interaction.reply({ content: 'Pong again!', hidden: true });
		await interaction.reply('This is pretty cool lol');
	}
}