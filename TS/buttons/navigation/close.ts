import { ButtonInteraction } from "../../typings";

export default {
	customID: 'close',
	execute: async function(interaction: ButtonInteraction) {
		await interaction.deferUpdate();
		await interaction.deleteReply();
	}
}
module.exports = exports.default;