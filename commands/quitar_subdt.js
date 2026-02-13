const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quitar_subdt')
        .setDescription('⚖️ Revocar el cargo de un Sub DT')
        .addUserOption(o => o.setName('usuario').setDescription('El usuario a destituir').setRequired(true))
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo del que será removido').setRequired(true)),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario');
        const equipo = interaction.options.getRole('equipo');
        const config = await db.get(`config_${interaction.guild.id}`);

        const esStaff = config?.staffRoles?.some(id => interaction.member.roles.cache.has(id));
        const esDT = interaction.member.roles.cache.has(config?.dtRole) && interaction.member.roles.cache.has(equipo.id);

        if (!esStaff && !esDT) return interaction.reply({ content: "❌ Permisos insuficientes para realizar esta acción.", ephemeral: true });

        const miembro = await interaction.guild.members.fetch(usuario.id);
        await miembro.roles.remove(config.subDtRole);
        await db.delete(`subdt_${usuario.id}`);

        const embed = new EmbedBuilder()
            .setTitle('⚖️ Cese de Funciones')
            .setColor('#e67e22')
            .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
            .setDescription(`Se ha procesado la baja administrativa de un miembro del cuerpo técnico.`)
            .addFields(
                { name: '👤 Usuario', value: `${usuario}\n(\`${usuario.tag}\`)`, inline: true },
                { name: '🏟️ Club', value: `${equipo.name}`, inline: true },
                { name: '🚫 Estado', value: `\`Cargo Revocado\``, inline: true },
                { name: '📅 Fecha de Acción', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: 'Registro de Cambios Administrativos' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};