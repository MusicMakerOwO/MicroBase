import { MicroClient, ModalInteraction } from "../typings";

export default {
	customID: 'say',
	async execute(interaction: ModalInteraction, client: MicroClient) {
		const message = interaction.fields.getTextInputValue('message');
		await interaction.deferReply({ ephemeral: true });
		
		try {
			// @ts-ignore
			await interaction.channel.send(message);
			await interaction.deleteReply();
		} catch (error) {
			await interaction.editReply('Failed to send message - Check I have permission to send messages in this channel!');
		}
	}
}
module.exports = exports.default;