import { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { MicroClient, CommandInteraction } from '../typings';

export default {
	alias: ['echo'],
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Say something!'),
	async execute(interaction: CommandInteraction, client: MicroClient) {
		const modal = new ModalBuilder()
		.setTitle('Say something!')
		.setCustomId('say')

		const input = new TextInputBuilder()
		.setCustomId('message')
		.setPlaceholder('Type something...')
		.setLabel('Message')
		.setStyle(TextInputStyle.Paragraph)

		const question = new ActionRowBuilder<TextInputBuilder>()
		.addComponents(input)

		modal.addComponents(question)

		await interaction.showModal(modal)
	}
}
module.exports = exports.default;