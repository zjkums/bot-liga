require('dotenv').config(); 
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Carga de comandos
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}`);
    console.log(`🏦 Sistema de economía y gestión de liga listo.`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        // Ejecuta el comando normalmente
        await command.execute(interaction);

    } catch (error) {
        console.error("Error detectado en el comando:", error);
        
        const respuestaError = { content: '❌ Hubo un error ejecutando el comando.', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(respuestaError).catch(() => {});
        } else {
            await interaction.reply(respuestaError).catch(() => {});
        }
    }
});

// Login usando la variable de entorno configurada en el panel
client.login(process.env.DISCORD_TOKEN);