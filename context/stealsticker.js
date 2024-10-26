const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
	data: new ContextMenuCommandBuilder()
	.setName('stealsticker')
	.setType(ApplicationCommandType.Message),
	async execute(interaction, client) {
		const message = interaction.targetMessage;
		const sticker = message.stickers.first();
		if (!sticker) return interaction.reply({ content: 'This message does not have any stickers.', ephemeral: true });

		await interaction.reply({ content: sticker.url, ephemeral: true });
	}
}