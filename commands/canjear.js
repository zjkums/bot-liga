const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('canjear')
        .setDescription('💸 Procesar canjes de premios o cobro de multas')
        .addSubcommand(sub => 
            sub.setName('jugador')
            .setDescription('Descontar de la cartera de un usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addIntegerOption(o => o.setName('monto').setDescription('Cantidad a descontar').setRequired(true))
            .addStringOption(o => o.setName('motivo').setDescription('Razón del canje/multa').setRequired(true)))
        .addSubcommand(sub => 
            sub.setName('equipo')
            .setDescription('Descontar del presupuesto de un club')
            .addRoleOption(o => o.setName('rol').setDescription('Equipo').setRequired(true))
            .addIntegerOption(o => o.setName('monto').setDescription('Cantidad a descontar').setRequired(true))
            .addStringOption(o => o.setName('motivo').setDescription('Razón del canje/multa').setRequired(true))),

    async execute(interaction) {
        const config = await db.get(`config_${interaction.guild.id}`);
        const esStaff = config?.staffRoles?.some(id => interaction.member.roles.cache.has(id));
        if (!esStaff) return interaction.reply({ content: "❌ Solo el Staff administrativo puede procesar transacciones de canje.", ephemeral: true });

        const sub = interaction.options.getSubcommand();
        const monto = interaction.options.getInteger('monto');
        const motivo = interaction.options.getString('motivo');

        const embed = new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: 'Sistema de Tesorería - Registro Oficial', iconURL: interaction.guild.iconURL() });

        if (sub === 'jugador') {
            const usuario = interaction.options.getUser('usuario');
            const saldo = await db.get(`cartera_${usuario.id}`) || 0;
            if (saldo < monto) return interaction.reply(`❌ Fondos insuficientes. **${usuario.username}** tiene $${saldo.toLocaleString()}.`);
            
            await db.sub(`cartera_${usuario.id}`, monto);
            embed.setTitle('🎁 Canje / Multa Procesada')
                .setColor('#e67e22')
                .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
                .setDescription(`Se ha realizado un descuento en la cuenta personal del usuario.`)
                .addFields(
                    { name: '👤 Usuario Beneficiario', value: `${usuario}`, inline: true },
                    { name: '💰 Monto Debitado', value: `\`-$${monto.toLocaleString()}\``, inline: true },
                    { name: '📝 Concepto / Motivo', value: `*${motivo}*`, inline: false }
                );
        } else {
            const equipo = interaction.options.getRole('rol');
            const saldoE = await db.get(`presupuesto_${equipo.id}`) || 0;
            if (saldoE < monto) return interaction.reply(`❌ El equipo no tiene fondos suficientes para este canje.`);

            await db.sub(`presupuesto_${equipo.id}`, monto);
            embed.setTitle('🏟️ Gasto de Club Registrado')
                .setColor('#d35400')
                .setDescription(`Se ha procesado un pago/canje desde el presupuesto del equipo.`)
                .addFields(
                    { name: '🛡️ Entidad Deportiva', value: `${equipo}`, inline: true },
                    { name: '💰 Saldo Debitado', value: `\`-$${monto.toLocaleString()}\``, inline: true },
                    { name: '📝 Concepto / Motivo', value: `*${motivo}*`, inline: false }
                );
        }

        return interaction.reply({ embeds: [embed] });
    }
};