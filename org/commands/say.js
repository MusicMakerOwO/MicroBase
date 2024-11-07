const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
	alias: ['echo'],
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Say something!'),
	async execute(interaction, client) {
		const modal = new ModalBuilder()
		.setTitle('Say something!')
		.setCustomId('say')

		const input = new TextInputBuilder()
		.setCustomId('message')
		.setPlaceholder('Type something...')
		.setLabel('Message')
		.setStyle(TextInputStyle.Paragraph)

		const question = new ActionRowBuilder()
		.addComponents(input)

		modal.addComponents(question)

		await interaction.showModal(modal)
	}
}