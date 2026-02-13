const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prestamo')
        .setDescription('📦 Cesión temporal de un jugador a otro club')
        .addUserOption(o => o.setName('jugador').setDescription('Jugador a prestar').setRequired(true))
        .addRoleOption(o => o.setName('origen').setDescription('Tu equipo (Origen)').setRequired(true))
        .addRoleOption(o => o.setName('destino').setDescription('Equipo que recibe (Destino)').setRequired(true))
        .addIntegerOption(o => o.setName('costo').setDescription('Costo de la cesión').setRequired(true))
        .addIntegerOption(o => o.setName('tiempo').setDescription('Duración en minutos').setRequired(true)),

    async execute(interaction) {
        const jugador = interaction.options.getUser('jugador');
        const origen = interaction.options.getRole('origen');
        const destino = interaction.options.getRole('destino');
        const costo = interaction.options.getInteger('costo');
        const tiempo = interaction.options.getInteger('tiempo');

        const saldoD = await db.get(`presupuesto_${destino.id}`) || 0;
        if (saldoD < costo) return interaction.reply("❌ El equipo de destino no tiene fondos suficientes.");

        const miembro = await interaction.guild.members.fetch(jugador.id);
        await db.sub(`presupuesto_${destino.id}`, costo);
        await db.add(`presupuesto_${origen.id}`, costo);
        await miembro.roles.remove(origen);
        await miembro.roles.add(destino);

        const retornoUnix = Math.floor((Date.now() + tiempo * 60000) / 1000);

        const embed = new EmbedBuilder()
            .setTitle('📦 Cesión Temporal Oficializada')
            .setColor('#9b59b6')
            .setThumbnail(jugador.displayAvatarURL({ dynamic: true }))
            .setDescription(`Se ha registrado un movimiento temporal en el mercado de pases.`)
            .addFields(
                { name: '👤 Jugador Cedido', value: `${jugador}\n(\`${jugador.tag}\`)`, inline: false },
                { name: '🏠 Club de Origen', value: `${origen}`, inline: true },
                { name: '✈️ Club de Destino', value: `${destino}`, inline: true },
                { name: '💰 Costo Operación', value: `\`$${costo.toLocaleString()}\``, inline: true },
                { name: '⏰ Fecha de Retorno', value: `<t:${retornoUnix}:F>\n(<t:${retornoUnix}:R>)`, inline: false }
            )
            .setFooter({ text: 'El retorno a origen es automático' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        setTimeout(async () => {
            const m = await interaction.guild.members.fetch(jugador.id).catch(() => null);
            if (m) {
                await m.roles.remove(destino);
                await m.roles.add(origen);
                interaction.channel.send({ content: `⏰ **Fin de Préstamo:** ${jugador} ha regresado oficialmente a **${origen.name}**.` });
            }
        }, tiempo * 60000);
    }
};