module.exports = {
	customID: 'close',
	execute: async function(interaction) {
		await interaction.deferUpdate();
		await interaction.deleteReply();
	}
}