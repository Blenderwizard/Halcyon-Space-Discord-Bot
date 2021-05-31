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
    messageReacts: [String], //This uses ids, safe to change emoji names.
    messageRoles: [String] //This uses ids, safe to change the name of roles.
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
                    let targetemoji = await message.guild.emojis.cache.find(emoji => emoji.name === command[i]);
                    let targetrole = await message.guild.roles.cache.find(role => role.name === command[i + 1]);
                    messageReacts.push(targetemoji.id);
                    messageRoles.push(targetrole.id);
                }
                let targetmessage = await message.channel.messages.fetch(messageID);
                for (let i = 0; i < messageReacts.length; i++) {
                    let reactingEmojiID = messageReacts[i];
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
                    let targetemoji = await message.guild.emojis.cache.find(emoji => emoji.name === command[i]);
                    let targetrole = await message.guild.roles.cache.find(role => role.name === command[i + 1]);
                    messageReacts.push(targetemoji.id);
                    messageRoles.push(targetrole.id);
                }
                let targetchannel = client.channels.resolve(command[1]);
                let targetmessage = await targetchannel.messages.fetch(messageID);
                for (let i = 0; i < messageReacts.length; i++) {
                    let reactingEmojiID = messageReacts[i];
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
            // Editing a react message inside of the channel --> messageID {add or remove} {if (add) {emojiname rolename (repeated)}, if (remove) {emojiname (repeated}}
        } else if (command[0] === "editRM") {
            if (!message.member.hasPermission('ADMINISTRATOR')) return;
            try {
                let messageID = command[1];
                let action = command[2];
                if (action === "add") {
                    if (command.length % 2 !== 1) return;
                    let messageReacts = [];
                    let messageRoles = [];
                    for (let i = 3; i < command.length; i += 2) {
                        let targetemoji = await message.guild.emojis.cache.find(emoji => emoji.name === command[i]);
                        let targetrole = await message.guild.roles.cache.find(role => role.name === command[i + 1]);
                        messageReacts.push(targetemoji.id);
                        messageRoles.push(targetrole.id);
                    }
                    const doc = await RoleReact.findOne({ 'messageID': messageID });
                    if (doc == null) return;
                    let targetmessage = await message.channel.messages.fetch(messageID);
                    for (let i = 0; i < messageReacts.length; i++) {
                        let reactingEmojiID = messageReacts[i];
                        targetmessage.react(reactingEmojiID);
                    }
                    let combinedMessageReacts = [];
                    let combinedMessageRoles = [];
                    for (let i = 0; i < messageReacts.length; i++) {
                        combinedMessageReacts.push(messageReacts[i]);
                        combinedMessageRoles.push(messageRoles[i]);
                    }
                    for (let i = 0; i < doc.messageReacts.length; i++) {
                        combinedMessageReacts.push(doc.messageReacts[i]);
                        combinedMessageRoles.push(doc.messageRoles[i]);
                    }
                    doc.messageReacts = combinedMessageReacts;
                    doc.messageRoles = combinedMessageRoles;
                    await doc.save();
                } else if (action === "remove") {
                    let messageReacts = [];
                    if (command.lenght <= 3) return;
                    for (let i = 3; i < command.length; i++) {
                        let targetemoji = await message.guild.emojis.cache.find(emoji => emoji.name === command[i]);
                        messageReacts.push(targetemoji.id);
                    }
                    const doc = await RoleReact.findOne({ 'messageID': messageID });
                    if (doc == null) return;
                    let targetmessage = await message.channel.messages.fetch(messageID);
                    for (let i = 0; i < messageReacts.length; i++) {
                        targetmessage.reactions.cache.get(messageReacts[i]).remove().catch(error => console.error('Failed to remove reactions: ', error));
                    }
                    let lessMessageReacts = doc.messageReacts;
                    let lessMessageRoles = doc.messageRoles;
                    for (let i = 0; i < doc.messageReacts.length; i++) {
                        for (let j = 0; j < messageReacts.length; j++) {
                            if (doc.messageReacts[i] === messageReacts[j]) {
                                lessMessageReacts.splice(i, 1);
                                lessMessageRoles.splice(i, 1);
                                i--;
                            }
                        }
                    }
                    doc.messageReacts = lessMessageReacts;
                    doc.messageRoles = lessMessageRoles;
                    await doc.save();
                }
            } catch (err) {
                console.log(err);
            }
        }
    });

    // The raw event is used to capture reactions from uncached messages.
    client.on('raw', async (packet) => {
        if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
        const guild = client.guilds.resolve(packet.d.guild_id);
        const channel = client.channels.resolve(packet.d.channel_id);
        const message = await channel.messages.fetch(packet.d.message_id);
        const user = await guild.members.fetch(packet.d.user_id);
        const emoji = packet.d.emoji.id;
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
