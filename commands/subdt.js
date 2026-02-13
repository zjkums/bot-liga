const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subdt')
        .setDescription('🥈 Asignar un Sub DT oficial para un equipo')
        .addUserOption(o => o.setName('usuario').setDescription('El usuario a ascender').setRequired(true))
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo al que pertenecerá').setRequired(true)),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario');
        const equipo = interaction.options.getRole('equipo');
        const config = await db.get(`config_${interaction.guild.id}`);

        const esStaff = config?.staffRoles?.some(id => interaction.member.roles.cache.has(id));
        const esDT = interaction.member.roles.cache.has(config?.dtRole) && interaction.member.roles.cache.has(equipo.id);

        if (!esStaff && !esDT) return interaction.reply({ content: "❌ No tienes autoridad para nombrar cargos en este equipo.", ephemeral: true });

        const miembro = await interaction.guild.members.fetch(usuario.id);
        await miembro.roles.add(config.subDtRole);
        await db.set(`subdt_${usuario.id}`, equipo.id);

        const embed = new EmbedBuilder()
            .setTitle('🥈 Nombramiento de Cuerpo Técnico')
            .setColor('#3498db')
            .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
            .setDescription(`Se ha oficializado el ascenso de un nuevo miembro administrativo para el club.`)
            .addFields(
                { name: '👤 Nuevo Sub DT', value: `${usuario}\n(\`${usuario.tag}\`)`, inline: true },
                { name: '🏟️ Equipo Asignado', value: `${equipo}`, inline: true },
                { name: '🔑 Rango', value: `\`Asistente Técnico\``, inline: true },
                { name: '📅 Fecha Efectiva', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: 'Sistema de Gestión de Cargos - Liga de Voleibol' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};