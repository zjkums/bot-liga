const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar_liga')
        .setDescription('⚙️ Configuración global de la liga')
        .addRoleOption(o => o.setName('staff1').setDescription('Primer rol de Staff').setRequired(true))
        .addRoleOption(o => o.setName('rol_dt').setDescription('Rol de los Dueños (DT)').setRequired(true))
        .addRoleOption(o => o.setName('rol_subdt').setDescription('Rol de los Sub DTs').setRequired(true))
        .addRoleOption(o => o.setName('staff2').setDescription('Segundo rol de Staff (Opcional)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const s1 = interaction.options.getRole('staff1');
        const s2 = interaction.options.getRole('staff2');
        const dt = interaction.options.getRole('rol_dt');
        const subdt = interaction.options.getRole('rol_subdt');

        const staffRoles = [s1.id];
        if (s2) staffRoles.push(s2.id);

        await db.set(`config_${interaction.guild.id}`, {
            staffRoles: staffRoles,
            dtRole: dt.id,
            subDtRole: subdt.id
        });

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Panel de Configuración')
            .setColor('#5865F2')
            .setThumbnail(interaction.guild.iconURL())
            .addFields(
                { name: '🛡️ Staff', value: staffRoles.map(id => `<@&${id}>`).join(', '), inline: false },
                { name: '📋 Jerarquía', value: `DTs: <@&${dt.id}>\nSubs: <@&${subdt.id}>`, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};