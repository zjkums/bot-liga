const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sueldo')
        .setDescription('💵 Pago masivo de sueldos')
        .addSubcommand(sub => sub.setName('dts').setDescription('Pagar a Dueños').addIntegerOption(o => o.setName('monto').setRequired(true).setDescription('Monto')))
        .addSubcommand(sub => sub.setName('subdts').setDescription('Pagar a Sub DTs').addIntegerOption(o => o.setName('monto').setRequired(true).setDescription('Monto')))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const monto = interaction.options.getInteger('monto');
        const config = await db.get(`config_${interaction.guild.id}`);
        await interaction.deferReply();

        const miembros = await interaction.guild.members.fetch();
        let rolId = sub === 'dts' ? config.dtRole : config.subDtRole;
        const beneficiarios = miembros.filter(m => m.roles.cache.has(rolId));

        for (const [id, m] of beneficiarios) { await db.add(`cartera_${m.id}`, monto); }

        const embed = new EmbedBuilder()
            .setTitle('💵 Nómina Procesada')
            .setColor('#2ecc71')
            .addFields(
                { name: '🎭 Cargo', value: sub === 'dts' ? 'Dueños' : 'Sub DTs', inline: true },
                { name: '💰 Monto', value: `\`$${monto.toLocaleString()}\``, inline: true },
                { name: '👥 Total', value: `${beneficiarios.size}`, inline: true }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};