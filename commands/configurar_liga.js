const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar_liga')
        .setDescription('⚙️ Establece los roles de DT, Sub DT y Agente Libre')
        .addRoleOption(o => o.setName('rol_dt').setDescription('Rol para Directores Técnicos').setRequired(true))
        .addRoleOption(o => o.setName('rol_subdt').setDescription('Rol para Sub Directores Técnicos').setRequired(true))
        .addRoleOption(o => o.setName('rol_libre').setDescription('Rol para jugadores sin equipo').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const roles = {
            dt: interaction.options.getRole('rol_dt').id,
            subdt: interaction.options.getRole('rol_subdt').id,
            libre: interaction.options.getRole('rol_libre').id
        };

        await db.set(`config_roles_${interaction.guild.id}`, roles);

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Configuración del Sistema Finalizada')
            .setColor('#f1c40f')
            .setDescription('Los privilegios de gestión y el mercado de pases han sido actualizados.')
            .addFields(
                { name: '👨‍💼 Gestión DT', value: `<@&${roles.dt}>`, inline: true },
                { name: '📋 Gestión Sub DT', value: `<@&${roles.subdt}>`, inline: true },
                { name: '🏃 Estado Libre', value: `<@&${roles.libre}>`, inline: true }
            )
            .setFooter({ text: 'Sistema de Liga v2.0', iconURL: interaction.guild.iconURL() });

        await interaction.reply({ embeds: [embed] });
    }
};