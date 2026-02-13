const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('equipo_gestion')
        .setDescription('🏟️ Registro de clubes')
        .addSubcommand(sub => sub.setName('registrar').setDescription('Añadir equipo').addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true)))
        .addSubcommand(sub => sub.setName('eliminar').setDescription('Remover equipo').addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const rol = interaction.options.getRole('rol');
        let equipos = await db.get(`equipos_lista_${interaction.guild.id}`) || [];

        if (sub === 'registrar') {
            equipos.push(rol.id);
            await db.set(`equipos_lista_${interaction.guild.id}`, equipos);
            return interaction.reply(`✅ Club **${rol.name}** registrado.`);
        } else {
            equipos = equipos.filter(id => id !== rol.id);
            await db.set(`equipos_lista_${interaction.guild.id}`, equipos);
            return interaction.reply(`🗑️ Club **${rol.name}** eliminado.`);
        }
    }
};