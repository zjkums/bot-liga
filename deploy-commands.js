require('dotenv').config(); // Carga las variables desde el .env
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

// Usamos el token desde el archivo .env por seguridad
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comandos slash...');
    
    // Usamos el ID de la aplicación que ya tenías
    await rest.put(
      Routes.applicationCommands('1455965905996611584'),
      { body: commands }
    );
    
    console.log('✅ Comandos registrados exitosamente');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();