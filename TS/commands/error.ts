import { SlashCommandBuilder } from "discord.js";
import { CommandInteraction } from "../typings";

export default {
	data: new SlashCommandBuilder()
	.setName('error')
	.setDescription('oopsies'),
	async execute(interaction: CommandInteraction) {
		throw new Error('Oopsies');
	}
}
module.exports = exports.default;