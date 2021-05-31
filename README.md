# Halcyon Space Discord Bot
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

This is a small bot created for the [Halcyon Space Destiny 2 Clan](https://www.bungie.net/en/ClanV2?groupid=4371365) Discord.

## Requirements
This bot requires a mongodb database. The env variable named DB_URI takes the Mongodb database uri.

For the bot token, the env variable named DISCORD_TOKEN takes the discord bot token

## Commands
> .createRM [Message ID] [Emoji Name 1] [Role Name 1] ... [Emoji Name N] [Role Name N]

Creates a react message using the message id, the first emoji will grant the first role and so forth.

> .createRMO [Channel ID] [Message ID] [Emoji Name 1] [Role Name 1] ... [Emoji Name N] [Role Name N]

Creates a react message in another channel using the message id, the first emoji will grant the first role and so forth.

> .editRM [Message ID] add [Emoji Name 1] [Role Name 1] ... [Emoji name N] [Role Name N]

Edits an existing react message and adds more reactions to the specified reactions.

> .editRM [Message ID] remove [Emoji Name 1] ... [Emoji name N]

Edits an existing react message and removes all specified emojies from the specified reaction message.