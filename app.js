'use strict';

//Mongoose Environment stuff
const mongoose =  require('mongoose');
const { Schema } = mongoose;

//Discord.js Envrionment stuff
const Discord = require('discord.js');
const client = new Discord.Client();

//Creating the shema for storing info on the database
console.log("Defining message schema ...")
const messageSchema = new Schema({
    message: String,
    messageID: String,
    messageReacts: [String], //This uses names and not ids, might have a problem later if the emoji name changes.
    messageRoles: [String] //This will use ids, safe to change the name of roles.
});

//Creating an object from the schema
console.log("Creating object from schema ...")
const RoleReact = mongoose.model('RoleReact', messageSchema);

//Loginin parameters, will be stored as env parameters
console.log("Entering mongo db login perameters ...")
mongoose.connect(process.env.DB_URI, { authSource: 'admin', useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

//Using Login parameters from above to login to the database, if can't connect the program throws the error
console.log("Attempting to connect to mongo db database ...");
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    //Once connected, all operations will now take place in this function
    console.log("Connected successfully to mongo db database :)");
    console.log("Atempting to connect to discord ...");
    client.on('ready', () => {
        console.log('Connected to discord, bot is now online :)');
    });

    // The bot commands WIP
    client.on('message', async(message) => {
        if (!message.guild) return;
        if (message.author.bot) return;
        if (!message.toString().startsWith('.')) return;
        let command = message.toString().substring(1, message.toString().length).split(" ");
        // Creating a reactmessage within the same channel --> messageID {emojiname rolename (repeated)}
        if (command[0] === "createRM") {
            if (!message.member.hasPermission('ADMINISTRATOR')) return;
            if (command.length % 2 !== 0) return;
            try {
                let messageID = command[1];
                let messageReacts = [];
                let messageRoles = [];
                for (let i = 2; i < command.length; i += 2) {
                    messageReacts.push(command[i]);
                    let targetrole = await message.guild.roles.cache.find(role => role.name === command[i + 1]);
                    messageRoles.push(targetrole.id);
                }
                let targetmessage = await message.channel.messages.fetch(messageID);
                for (let i = 0; i < messageReacts.length; i++) {
                    let reactingEmojiID = await client.emojis.cache.find(emoji => emoji.name === messageReacts[i]).id;
                    targetmessage.react(reactingEmojiID);
                }
                const newReactRoleMessage = new RoleReact({
                    message: targetmessage.toString(),
                    messageID: targetmessage.id,
                    messageReacts: messageReacts,
                    messageRoles: messageRoles
                });
                newReactRoleMessage.save(function (err) { if (err) return console.error(err); });
            } catch (err) {
                console.log(err);
            }
        // Creating a react message outside of the channel --> channelID messageID {emojiname rolename (repeated)}
        } else if (command[0] === "createRMO") {
            if (!message.member.hasPermission('ADMINISTRATOR')) return;
            if (command.length % 2 !== 1) return;
            try {
                let messageID = command[2];
                let messageReacts = [];
                let messageRoles = [];
                for (let i = 3; i < command.length; i += 2) {
                    messageReacts.push(command[i]);
                    let targetrole = await message.guild.roles.cache.find(role => role.name === command[i + 1]);
                    messageRoles.push(targetrole.id);
                }
                let targetchannel = client.channels.resolve(command[1]);
                console.log(targetchannel);
                let targetmessage = await targetchannel.messages.fetch(messageID);
                for (let i = 0; i < messageReacts.length; i++) {
                    let reactingEmojiID = await client.emojis.cache.find(emoji => emoji.name === messageReacts[i]).id;
                    targetmessage.react(reactingEmojiID);
                }
                const newReactRoleMessage = new RoleReact({
                    message: targetmessage.toString(),
                    messageID: targetmessage.id,
                    messageReacts: messageReacts,
                    messageRoles: messageRoles
                });
                newReactRoleMessage.save(function (err) { if (err) return console.error(err); });
            } catch (err) {
                console.log(err);
            }
        }
    });

    // The raw event is used to capture reactions from uncashed messages.
    client.on('raw', async (packet) => {
        if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
        const guild = client.guilds.resolve(packet.d.guild_id);
        const channel = client.channels.resolve(packet.d.channel_id);
        const message = await channel.messages.fetch(packet.d.message_id);
        const user = await guild.members.fetch(packet.d.user_id);
        const emoji = packet.d.emoji.name;
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            RoleReact.findOne({ 'messageID': packet.d.message_id }, function (err, messages) {
                if (err) return handleError(err);
                if (messages == null) return;
                if (user.bot) return;
                console.log(`${user.user.tag} added a reaction from a message found within the database`);
                for (let i = 0; i < messages.messageReacts.length; i++) {
                    if (messages.messageReacts[i] === (emoji)) {
                        if (!user.roles.cache.has(messages.messageRoles[i])) {
                            let role = guild.roles.cache.get(messages.messageRoles[i]);
                            user.roles.add(role).catch(console.error);
                            console.log(`${user.user.tag} gained role ${role.name}`);
                        }
                    }
                }
            });
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            RoleReact.findOne({ 'messageID': packet.d.message_id }, function (err, messages) {
                if (err) return handleError(err);
                if (messages == null) return;
                if (user.bot) return;
                console.log(`${user.user.tag} removed a reaction from a message found within the database`);
                for (let i = 0; i < messages.messageReacts.length; i++) {
                    if (messages.messageReacts[i] === (emoji)) {
                        if (user.roles.cache.has(messages.messageRoles[i])) {
                            let role = guild.roles.cache.get(messages.messageRoles[i]);
                            user.roles.remove(role).catch(console.error);
                            console.log(`${user.user.tag} lost role ${role.name}`);
                        }
                    }
                }
            });
        }
    });

    client.login(process.env.DISCORD_TOKEN);
});