import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { MicroClient, MessageContextInteraction } from '../typings';

export default{
	data: new ContextMenuCommandBuilder()
	.setName('stealsticker')
	// @ts-ignore - TODO lol
	.setType(ApplicationCommandType.Message),
	async execute(interaction: MessageContextInteraction, client: MicroClient) {
		const message = interaction.targetMessage;
		const sticker = message.stickers.first();
		if (!sticker) return interaction.reply({ content: 'This message does not have any stickers.', ephemeral: true });

		await interaction.reply({ content: sticker.url, ephemeral: true });
	}
}
module.exports = exports.default;