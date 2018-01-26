/**
 * Original code from nexu-dev, https://github.com/nexu-dev/discord.js-client
 * Newly edited by Darko Pendragon (Demise).
 * Other contributions: Rodabaugh, mcao.
 */

const stream = require('youtube-audio-stream');
const search = require('youtube-search');
const ypi = require('youtube-playlist-info');
const Discord = require('discord.js');
const PACKAGE = require('./package.json');

/**
 * Takes a discord.js client and turns it into a client bot.
 * Extra thanks to Rodabaugh for helping with some tweaks and ideas.
 *
 * @param {Client} client - The discord.js client.
 * @param {object} options - Options to configure the client bot.
 */

module.exports = function(client, options) {
  // Node check.
  if (process.version.slice(1).split('.')[0] < 8) {
    console.log(new Error(`node 8 or higher is needed, please update`));
    process.exit(1);
  };

  // Get all options.
  class Music {
    constructor(client, options) {
      this.commands = new Map();
      this.aliases = new Map();
      this.youtubeKey = (options && options.youtubeKey);
      this.botPrefix = (options && options.prefix) || '!';
      this.global = (options && options.global) || false;
      this.maxQueueSize = parseInt((options && options.maxQueueSize) || 20);
      this.defVolume = parseInt((options && options.volume) || 50);
      this.anyoneCanSkip = (options && options.anyoneCanSkip) || false;
      this.clearInvoker = (options && options.clearInvoker) || false;
      this.helpCmd = (options && options.helpCmd) || 'musichelp';
      this.disableHelp = (options && options.disableHelp) || false;
      this.helpHelp = (options && options.helpHelp) || "Shows help for commands.";
      this.helpAlt = (options && options.helpAlt) || [];
      this.playCmd = (options && options.playCmd) || 'play';
      this.disablePlay = (options && options.disablePlay) || false;
      this.playHelp = (options && options.playHelp) || "Queue a song/playlist by URL or search for a song.";
      this.playAlt = (options && options.playAlt) || [];
      this.skipCmd = (options && options.skipCmd) || 'skip';
      this.disableSkip = (options && options.disableSkip) || false;
      this.skipHelp = (options && options.skipHelp) || "Skip a song or multi songs.";
      this.skipAlt = (options && options.skipAlt) || [];
      this.queueCmd = (options && options.queueCmd) || 'queue';
      this.disableQueue = (options && options.disableQueue) || false;
      this.queueHelp = (options && options.queueHelp) || "Shows the current queue.";
      this.queueAlt = (options && options.queueAlt) || [];
      this.pauseCmd = (options && options.pauseCmd) || 'pause';
      this.pauseHelp = (options && options.pauseHelp) || "Pauses the queue.";
      this.disablePause = (options && options.disablePause) || false;
      this.pauseAlt = (options && options.pauseAlt) || [];
      this.resumeCmd = (options && options.resumeCmd) || 'resume';
      this.disableResume = (options && options.disableResume) || false;
      this.resumeHelp = (options && options.resumeHelp) || "Resume the queue.";
      this.resumeAlt = (options && options.resumeAlt) || [];
      this.volumeCmd = (options && options.volumeCmd) || 'volume';
      this.disableVolume = (options && options.disableVolume) || false;
      this.volumeHelp = (options && options.volumeHelp) || "Adjusts the volume of the bot.";
      this.volumeAlt = (options && options.volumeAlt) || [];
      this.leaveCmd = (options && options.leaveCmd) || 'leave';
      this.disableLeave = (options && options.disableLeave) || false;
      this.leaveHelp = (options && options.leaveHelp) || "Leave and clear the queue.";
      this.leaveAlt = (options && options.leaveAlt) || [];
      this.clearCmd = (options && options.clearCmd) || 'clearqueue';
      this.disableClear = (options && options.disableClear) || false;
      this.clearHelp = (options && options.clearHelp) || "Clears the current queue.";
      this.clearAlt = (options && options.clearAlt) || [];
      this.loopCmd = (options && options.loopCmd) || 'loop';
      this.disableLoop = (options && options.disableLoop) || false;
      this.loopHelp = (options && options.loopHelp) || "Changes the loop state.";
      this.loopAlt = (options && options.loopAlt) || [];
      this.ownerCmd = (options && options.ownerCmd) || 'owner';
      this.disableOwnerCmd = (options && options.disableOwnerCmd) || false;
      this.ownerHelp = (options && options.ownerHelp) || "Owner commands and functions.";
      this.ownerAlt = (options && options.ownerAlt) || [];
      this.npCmd = (options && options.npCmd) || 'np';
      this.disableNp = (options && options.disableNp) || false;
      this.npHelp = (options && options.npHelp) || "Shows the currenlty playing song.";
      this.npAlt = (options && options.npAlt) || [];
      this.enableQueueStat = (options && options.enableQueueStat) || false;
      this.anyoneCanAdjust = (options && options.anyoneCanAdjust) || false;
      this.ownerOverMember = (options && options.ownerOverMember) || false;
      this.botOwner = (options && options.botOwner) || null;
      this.logging = (options && options.logging) || false;
      this.enableAliveMessage = (options && options.enableAliveMessage) || false;
      this.aliveMessage = (options && options.aliveMessage) || "";
      this.aliveMessageTime = parseInt((options && options.aliveMessageTime) || 600000);
      this.requesterName = (options && options.requesterName) || false;
      this.inlineEmbeds = (options && options.inlineEmbeds) || false;
      this.queues = {};
      this.loops = {};
    }

    logger(cmd, msg, text) {
      console.log(`[${cmd}] [${msg.guild.name}] ${text}`);
    }
  }

  var musicbot = new Music(client, options);

  //Init errors.
  function musicBotStart() {
    if (musicbot.disableLeave &&
      musicbot.disableSkip &&
      musicbot.disablePlay &&
      musicbot.disableQueue &&
      musicbot.disableHelp &&
      musicbot.disableResume &&
      musicbot.disablePause &&
      musicbot.disableLoop &&
      musicbot.disableClear &&
      musicbot.disableNp &&
      musicbot.disableVolume) {
      console.log(new Error(`all commands disabled`));
      process.exit(1);
    };
    if (typeof musicbot.helpHelp !== 'string') {
      console.log(new TypeError(`helpHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.helpAlt !== 'object') {
      console.log(new TypeError(`helpAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.playHelp !== 'string') {
      console.log(new TypeError(`playHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.playAlt !== 'object') {
      console.log(new TypeError(`playAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.queueHelp !== 'string') {
      console.log(new TypeError(`queueHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.queueAlt !== 'object') {
      console.log(new TypeError(`queueAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.pauseHelp !== 'string') {
      console.log(new TypeError(`pauseHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.pauseAlt !== 'object') {
      console.log(new TypeError(`pauseAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.resumeHelp !== 'string') {
      console.log(new TypeError(`resumeHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.resumeAlt !== 'object') {
      console.log(new TypeError(`resumeAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.volumeHelp !== 'string') {
      console.log(new TypeError(`volumeHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.volumeAlt !== 'object') {
      console.log(new TypeError(`volumeAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.leaveHelp !== 'string') {
      console.log(new TypeError(`leaveHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.leaveAlt !== 'object') {
      console.log(new TypeError(`leaveAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.clearHelp !== 'string') {
      console.log(new TypeError(`clearHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.clearAlt !== 'object') {
      console.log(new TypeError(`clearAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.loopHelp !== 'string') {
      console.log(new TypeError(`loopHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.loopAlt !== 'object') {
      console.log(new TypeError(`loopAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.npHelp !== 'string') {
      console.log(new TypeError(`npHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.npAlt !== 'object') {
      console.log(new TypeError(`npAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.ownerHelp !== 'string') {
      console.log(new TypeError(`ownerHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.ownerAlt !== 'object') {
      console.log(new TypeError(`ownerAlt must be an array`));
      process.exit(1);
    };
    if (typeof musicbot.skipHelp !== 'string') {
      console.log(new TypeError(`skipHelp must be a string`))
      process.exit(1);
    };
    if (typeof musicbot.skipAlt !== 'object') {
      console.log(new TypeError(`skipAlt must be an array`));
      process.exit(1);
    };
    if (!musicbot.youtubeKey) {
      console.log(new Error(`youtubeKey is required but missing`));
      process.exit(1);
    };
    if (musicbot.youtubeKey && typeof musicbot.youtubeKey !== 'string') {
      console.log(new TypeError(`youtubeKey must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.disableHelp !== 'boolean') {
      console.log(new TypeError(`disableHelp must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disablePlay !== 'boolean') {
      console.log(new TypeError(`disablePlay must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disableSkip !== 'boolean') {
      console.log(new TypeError(`disableSkip must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disableQueue !== 'boolean') {
      console.log(new TypeError(`disableQueue must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disablePause !== 'boolean') {
      console.log(new TypeError(`disablePause must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disableResume !== 'boolean') {
      console.log(new TypeError(`disableResume must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disableLeave !== 'boolean') {
      console.log(new TypeError(`disableLeave must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disableClear !== 'boolean') {
      console.log(new TypeError(`disableClear must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disableLoop !== 'boolean') {
      console.log(new TypeError(`disableLoop must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disableNp !== 'boolean') {
      console.log(new TypeError(`disableNp must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.disableOwnerCmd !== 'boolean') {
      console.log(new TypeError(`disableOwnerCmd must be a boolean`));
      process.exit(1);
    }
    if (typeof musicbot.ownerCmd !== 'string') {
      console.log(new TypeError(`ownerCmd must be a string`));
      process.exit(1);
    }
    if (typeof musicbot.ownerOverMember !== 'boolean') {
      console.log(new TypeError(`ownerOverMember must be a boolean`));
      process.exit(1);
    };
    if (musicbot.ownerOverMember && typeof musicbot.botOwner !== 'string') {
      console.log(new TypeError(`botOwner must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.botPrefix !== 'string') {
      console.log(new TypeError(`prefix must be a string`));
      process.exit(1);
    };
    if (musicbot.botPrefix.length < 1 || musicbot.botPrefix.length > 10) {
      console.log(new RangeError(`prefix length must be between 1 and 10`));
      process.exit(1);
    };
    if (typeof musicbot.global !== 'boolean') {
      console.log(new TypeError(`global must be a boolean`));
      process.exit(1);
    };
    if (typeof musicbot.maxQueueSize !== 'number') {
      console.log(new TypeError(`maxQueueSize must be a number`));
      process.exit(1);
    };
    if (!Number.isInteger(musicbot.maxQueueSize) || musicbot.maxQueueSize < 1) {
      console.log(new TypeError(`maxQueueSize must be an integer more than 0`));
      process.exit(1);
    };
    if (typeof musicbot.defVolume !== 'number') {
      console.log(new TypeError(`defaultVolume must be a number`));
      process.exit(1);
    };
    if (!Number.isInteger(musicbot.defVolume) || musicbot.defVolume < 1 || musicbot.defVolume > 200) {
      console.log(new TypeError(`defaultVolume must be an integer between 1 and 200`));
      process.exit(1);
    };
    if (typeof musicbot.anyoneCanSkip !== 'boolean') {
      console.log(new TypeError(`anyoneCanSkip must be a boolean`));
      process.exit(1);
    };
    if (typeof musicbot.clearInvoker !== 'boolean') {
      console.log(new TypeError(`clearInvoker must be a boolean`));
      process.exit(1);
    };
    if (typeof musicbot.enableAliveMessage !== 'boolean') {
      console.log(new TypeError(`enableAliveMessage must be a boolean`));
      process.exit(1);
    };
    if (typeof musicbot.aliveMessage !== 'string') {
      console.log(new TypeError(`aliveMessage must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.aliveMessageTime !== 'number') {
      console.log(new TypeError(`aliveMessageTime must be a number`));
      process.exit(1);
    };
    if (typeof musicbot.helpCmd !== 'string') {
      console.log(new TypeError(`helpCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.playCmd !== 'string') {
      console.log(new TypeError(`playCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.skipCmd !== 'string') {
      console.log(new TypeError(`skipCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.queueCmd !== 'string') {
      console.log(new TypeError(`queueCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.pauseCmd !== 'string') {
      console.log(new TypeError(`pauseCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.npCmd !== 'string') {
      console.log(new TypeError(`npCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.resumeCmd !== 'string') {
      console.log(new TypeError(`resumeCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.volumeCmd !== 'string') {
      console.log(new TypeError(`volumeCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.leaveCmd !== 'string') {
      console.log(new TypeError(`leaveCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.clearCmd !== 'string') {
      console.log(new TypeError(`clearCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.loopCmd !== 'string') {
      console.log(new TypeError(`loopCmd must be a string`));
      process.exit(1);
    };
    if (typeof musicbot.enableQueueStat !== 'boolean') {
      console.log(new TypeError(`enableQueueStat must be a boolean`));
      process.exit(1);
    };
    if (typeof musicbot.anyoneCanAdjust !== 'boolean') {
      console.log(new TypeError(`anyoneCanAdjust must be a boolean`));
      process.exit(1);
    };
    if (typeof musicbot.logging !== 'boolean') {
      console.log(new TypeError(`logging must be a boolean`));
      process.exit(1);
    };
    if (typeof musicbot.requesterName !== 'boolean') {
      console.log(new TypeError(`requesterName must be a boolean`));
      process.exit(1);
    };
    if (typeof musicbot.inlineEmbeds !== 'boolean') {
      console.log(new TypeError(`inlineEmbeds must be a boolean`));
      process.exit(1);
    };
    if (musicbot.global && musicbot.maxQueueSize < 50) console.warn(`global queues are enabled while maxQueueSize is below 50! Recommended to use a higher size.`);

    // Set those commands, baby.
    try {
      if (!musicbot.commands.has(musicbot.helpCmd)) {
        const help_props = {
          name: musicbot.helpCmd,
          usage: `${musicbot.botPrefix}${musicbot.helpCmd} [command]`,
          disabled: musicbot.disableHelp,
          help: musicbot.helpHelp,
          aliases: musicbot.helpAlt,
          admin: false,
          run: "musichelp"
        };
        musicbot.commands.set(musicbot.helpCmd, help_props);
      };
      if (!musicbot.commands.has(musicbot.playCmd)) {
        const play_props = {
          name: musicbot.playCmd,
          usage: `${musicbot.botPrefix}${musicbot.playCmd} <song to queue>`,
          disabled: musicbot.disablePlay,
          help: musicbot.playHelp,
          aliases: musicbot.playAlt,
          admin: false,
          run: "play"
        };
        musicbot.commands.set(musicbot.playCmd, play_props);
      };
      if (!musicbot.commands.has(musicbot.skipCmd)) {
        const skip_props = {
          name: musicbot.skipCmd,
          usage: `${musicbot.botPrefix}${musicbot.skipCmd} [numberOfSongs]`,
          disabled: musicbot.disableSkip,
          help: musicbot.skipHelp,
          aliases: musicbot.skipAlt,
          admin: true,
          run: "skip"
        };
        musicbot.commands.set(musicbot.skipCmd, skip_props);
      };
      if (!musicbot.commands.has(musicbot.queueCmd)) {
        const queue_props = {
          name: musicbot.queueCmd,
          usage: `${musicbot.botPrefix}${musicbot.queueCmd} [songNumber]`,
          disabled: musicbot.disableQueue,
          help: musicbot.queueHelp,
          aliases: musicbot.queueAlt,
          admin: false,
          run: "queue"
        };
        musicbot.commands.set(musicbot.queueCmd, queue_props);
      };
      if (!musicbot.commands.has(musicbot.pauseCmd)) {
        const pause_props = {
          name: musicbot.pauseCmd,
          usage: null,
          disabled: musicbot.disablePause,
          help: musicbot.pauseHelp,
          aliases: musicbot.pauseAlt,
          admin: false,
          run: "pause"
        };
        musicbot.commands.set(musicbot.pauseCmd, pause_props);
      };
      if (!musicbot.commands.has(musicbot.resumeCmd)) {
        const resume_props = {
          name: musicbot.resumeCmd,
          usage: null,
          disabled: musicbot.disableResume,
          help: musicbot.resumeHelp,
          aliases: musicbot.resumeAlt,
          admin: false,
          run: "resume"
        };
        musicbot.commands.set(musicbot.resumeCmd, resume_props);
      };
      if (!musicbot.commands.has(musicbot.volumeCmd)) {
        const volume_props = {
          name: musicbot.volumeCmd,
          usage: `${musicbot.botPrefix}${musicbot.volumeCmd} <1 - 200>`,
          disabled: musicbot.disableVolume,
          help: musicbot.volumeHelp,
          aliases: musicbot.volumeAlt,
          admin: false,
          run: "volume"
        };
        musicbot.commands.set(musicbot.volumeCmd, volume_props);
      };
      if (!musicbot.commands.has(musicbot.clearCmd)) {
        const clear_props = {
          name: musicbot.clearCmd,
          usage: null,
          disabled: musicbot.disableClear,
          help: musicbot.clearHelp,
          aliases: musicbot.clearAlt,
          admin: false,
          run: "clear"
        };
        musicbot.commands.set(musicbot.clearCmd, clear_props);
      };
      if (!musicbot.commands.has(musicbot.npCmd)) {
        const np_props = {
          name: musicbot.npCmd,
          usage: null,
          disabled: musicbot.disableNp,
          help: musicbot.npHelp,
          aliases: musicbot.npAlt,
          admin: false,
          run: "np"
        };
        musicbot.commands.set(musicbot.npCmd, np_props);
      };
      if (!musicbot.commands.has(musicbot.ownerCmd)) {
        const owner_props = {
          name: musicbot.ownerCmd,
          usage: null,
          disabled: musicbot.disableOwnerCmd,
          help: musicbot.ownerHelp,
          aliases: musicbot.ownerAlt,
          admin: false,
          run: "ownerCommands"
        };
        musicbot.commands.set(musicbot.ownerCmd, owner_props);
      };
      if (!musicbot.commands.has(musicbot.leaveCmd)) {
        const leave_props = {
          name: musicbot.leaveCmd,
          usage: null,
          disabled: musicbot.disableLeave,
          help: musicbot.leaveHelp,
          aliases: musicbot.leaveAlt,
          admin: false,
          run: "leave"
        };
        musicbot.commands.set(musicbot.leaveCmd, leave_props);
      };
      if (!musicbot.commands.has(musicbot.loopCmd)) {
        const loop_props = {
          name: musicbot.loopCmd,
          usage: null,
          disabled: musicbot.disableLoop,
          help: musicbot.loopHelp,
          aliases: musicbot.loopAlt,
          admin: false,
          run: "loop"
        };
        musicbot.commands.set(musicbot.loopCmd, loop_props);
      };

      // Load the aliases. Hopefully.
      for (var i = 0; i < musicbot.commands.length; i++) {
        let command = musicbot.commands[i];
        if (command.aliases.length > 0) {
          for (var a = 0; a < command.aliases.length; a++) {
            let props = {
              name: command.name,
              usage: command.usage,
              disabled: command.disabled,
              help: command.help,
              aliases: command.aliases,
              admin: command.admin,
              run: command.run
            };
            musicbot.aliases.set(command.aliases[a], props);
          };
        };
      };
    } catch (e) {
      console.log(e.stack);
      process.exit(1);
    };
  };
  musicBotStart();

  //Set the YouTube API key.
  const opts = {
    maxResults: 50,
    key: musicbot.youtubeKey
  };

  // Catch message events.
  client.on('message', msg => {
    const message = msg.content.trim();

    // Check if the message is a command.
    if (message.startsWith(musicbot.botPrefix)) {
      // Get the command, suffix.
      const command = message.substring(musicbot.botPrefix.length).split(/[ \n]/)[0].trim();
      const suffix = message.substring(musicbot.botPrefix.length + command.length).trim();

      // Process the commands.
      if (musicbot.commands.has(command)) {
        let tCmd = musicbot.commands.get(command);
        if (!tCmd.disabled) return musicbot[tCmd.run](msg, suffix);
      } else if (musicbot.aliases.has(command)) {
        let aCmd = musicbot.commands.get(command);
        if (!aCmd.disabled) return musicbot[aCmd.run](msg, suffix);
      };
    };
  });

  // Client ready event for some extra stuff.
  client.on("ready", () => {
    if (musicbot.enableAliveMessage) {
      setInterval(function liveMessage() {
        if (musicbot.aliveMessage.length < 3) {
          musicbot.aliveMessage = `----------------------------------\n${client.user.username} online since ${client.readyAt}!\n----------------------------------`;
        } else {
          musicbot.aliveMessage = musicbot.aliveMessage.replace(/{{username}}/g, `${client.user.username}`).replace(/{{starttime}}/g, `${client.readyAt}`);
        }
        console.log(musicbot.aliveMessage);
      }, musicbot.aliveMessageTime);
    };
    var startmsg = `------- ${client.user.username} -------\n> version: ${PACKAGE.version}\n> Extra logging disabled.\n> Global queues are disabled.\n> node: ${process.version}\n------- ${client.user.username} -------`;
    if (musicbot.logging) startmsg = startmsg.replace("Extra logging disabled.", "Extra logging enabled.");
    if (musicbot.global) startmsg = startmsg.replace("Global queues are disabled.", "Global queues are enabled.");
    console.log(startmsg);
    if (!musicbot.enableQueueStat) console.log(`[MUSIC] enableQueueStat is 'false'. Queue will not have a Playing/Paused indicator.`);
  });

  /**
   * Checks if a user is an admin.
   *
   * @param {GuildMember} member - The guild member
   * @returns {boolean} - If the user is admin.
   */
  musicbot.isAdmin = (member) => {
    if (musicbot.ownerOverMember && member.id === musicbot.botOwner) return true;
    return member.hasPermission("ADMINISTRATOR");
  };

  /**
   * Checks if the user can skip the song.
   *
   * @param {GuildMember} member - The guild member
   * @param {array} queue - The current queue
   * @returns {boolean} - If the user can skip
   */
  musicbot.canSkip = (member, queue) => {
    if (musicbot.anyoneCanSkip) return true;
    else if (musicbot.ownerOverMember && member.id === musicbot.botOwner) return true;
    else if (queue[0].requester === member.id) return true;
    else if (musicbot.isAdmin(member)) return true;
    else return false;
  };

  /**
   * Checks if the user can adjust volume.
   *
   * @param {GuildMember} member - The guild member
   * @param {array} queue - The current queue
   * @returns {boolean} - If the user can adjust
   */
  musicbot.canAdjust = (member, queue) => {
    if (musicbot.anyoneCanAdjust) return true;
    else if (queue[0].requester === member.id) return true;
    else if (musicbot.isAdmin(member)) return true;
    else return false;
  };

  /**
   * Deletes the command message if invoker is on.
   *
   * @param {Message} msg - the message of the command.
   */
  musicbot.dInvoker = (msg) => {
    if (musicbot.clearInvoker) {
      if (!msg || msg.length >= 0) return;
      msg.delete();
    }
  };

  /**
   * Gets the song queue of the server.
   *
   * @param {integer} server - The server id.
   * @returns {object} - The song queue.
   */
  musicbot.getQueue = (server) => {
    // Check if global queues are enabled.
    if (musicbot.global) server = '_'; // Change to global queue.

    // Return the queue.
    if (!musicbot.queues[server]) musicbot.queues[server] = [];
    return musicbot.queues[server];
  };

  /**
   * Gets the looping status of the server.
   *
   * @param {integer} server - The server id.
   * @returns {boolean} - The queue state.
   */
  musicbot.loopState = (server) => {
    if (musicbot.global) return false;
    if (musicbot.loops[server].looping) return true;
    else if (!musicbot.loops[server].looping) return false;
  };

  /**
   * Sets the looping status of the server.
   *
   * @param {integer} server - The server id.
   * @returns {boolean} - The queue state.
   */
  musicbot.setLoopState = (server, state) => {
    if (state && typeof state !== 'boolean') return console.log(`[loopingSet] ${new Error(`state wasnt a boolean`)}`);
    if (state === false) return musicbot.loops[server].looping = false;
    if (state === true) return musicbot.loops[server].looping = true;
  };

  /**
   * Sets the last played song of the server.
   *
   * @param {integer} server - The server id.
   */
  musicbot.setLast = (server, last) => {
    if (musicbot.global) return null;
    if (!last) musicbot.loops[server].last = null;
    else if (last) musicbot.loops[server].last = last;
  };

  /**
   * Gets the last played song of the server.
   *
   * @param {integer} server - The server id.
   * @returns {string} - The last played song.
   */
  musicbot.getLast = (server) => {
    if (!musicbot.loops[server].last) return null;
    else if (musicbot.loops[server].last) return musicbot.loops[server].last;
  };

  /**
   * The help command.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   */
  musicbot.musichelp = (msg, suffix) => {
    musicbot.dInvoker(msg);
    let command = suffix.trim();
    if (!suffix) {
      if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
        const embed = new Discord.RichEmbed();
        embed.setAuthor("Commands", msg.author.displayAvatarURL);
        embed.setDescription(`Use \`${musicbot.botPrefix}${musicbot.helpCmd} command name\` for help on usage.`);
        // embed.addField(musicbot.helpCmd, musicbot.helpHelp);
        const newCmds = Array.from(musicbot.commands);
        for (var i = 0; i < newCmds.length; i++) {
          let thisCmd = newCmds[i][1];
          if (!thisCmd.disabled) {
            embed.addField(thisCmd.name, thisCmd.help);
          };
        };
        embed.setColor(0x27e33d);
        setTimeout(() => {
          if (musicbot.messageHelp) {
            let sent = false;
            msg.author.send({
              embed
            }).then(() => {
              sent = true;
            });
            setTimeout(() => {
              if (!sent) return msg.channel.send({
                embed
              });
            }, 1200);
          } else {
            return msg.channel.send({
              embed
            });
          };
        }, 1500);
      } else {
        var cmdmsg = `= Music Commands =\nUse ${musicbot.botPrefix}${musicbot.helpCmd} [command] for help on a command.\n`;
        const newCmds = Array.from(musicbot.commands);
        for (var i = 0; i < newCmds.length; i++) {
          let thisCmd = newCmds[i][1];
          if (!thisCmd.disabled) {
            cmdmsg = cmdmsg + `\n• ${thisCmd.name}: ${thisCmd.help}`;
          };
        };
        setTimeout(() => {
          if (musicbot.messageHelp) {
            let sent = false;
            msg.author.send(cmdmsg, {
              code: 'asciidoc'
            }).then(() => {
              sent = true;
            });
            setTimeout(() => {
              if (!sent) return msg.channel.send(cmdmsg, {
                code: 'asciidoc'
              });
            }, 500);
          } else {
            return msg.channel.send(cmdmsg, {
              code: 'asciidoc'
            });
          };
        }, 1500);
      };
    } else if (musicbot.commands.has(command)) {
      if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
        const embed = new Discord.RichEmbed();
        command = musicbot.commands.get(command);
        embed.setAuthor(command.name, msg.client.user.avatarURL);
        embed.setDescription(command.help);
        if (command.aliases.length > 0) embed.addField(`Aliases`, command.aliases.join(", "), musicbot.inlineEmbeds);
        if (command.usage !== null) embed.addField(`Usage`, command.usage, musicbot.inlineEmbeds);
        embed.setColor(0x27e33d);
        msg.channel.send({
          embed
        });
      } else {
        command = musicbot.commands.get(command);
        var cmdhelp = `= ${command.name} =\n`;
        cmdhelp + `\n${command.help}`;
        if (command.usage !== null) cmdhelp = cmdhelp + `\nUsage: ${command.usage}\n`;
        if (command.aliases.length > 0) cmdhelp = cmdhelp + `\nAliases: ${command.aliases.join(", ")}`;
        msg.channel.send(cmdhelp, {
          code: 'asciidoc'
        });
      };
    } else if (musicbot.aliases.has(command)) {
      if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
        const embed = new Discord.RichEmbed();
        command = musicbot.aliases.get(command);
        embed.setAuthor(command.name, msg.client.user.avatarURL);
        embed.setDescription(command.help);
        if (command.aliases.length > 0) embed.addField(`Aliases`, command.aliases.join(", "), musicbot.inlineEmbeds);
        if (command.usage !== null) embed.addField(`Usage`, command.usage, musicbot.inlineEmbeds);
        embed.setColor(0x27e33d);
        msg.channel.send({
          embed
        });
      } else {
        command = musicbot.aliases.get(command);
        var cmdhelp = `= ${command.name} =\n`;
        cmdhelp + `\n${command.help}`;
        if (command.usage !== null) cmdhelp = cmdhelp + `\nUsage: ${command.usage}\n`;
        if (command.aliases.length > 0) cmdhelp = cmdhelp + `\nAliases: ${command.aliases.join(", ")}`;
        msg.channel.send(cmdhelp, {
          code: 'asciidoc'
        });
      };
    } else {
      msg.channel.send(musicbot.note('fail', `${suffix} is not a valid command!`));
    };
  };

  /**
   * The command for adding a song to the queue.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   */
  musicbot.play = (msg, suffix) => {
    musicbot.dInvoker(msg);
    // Make sure the user is in a voice channel.
    if (msg.member.voiceChannel === undefined) return msg.channel.send(musicbot.note('fail', `You're not in a voice channel~`));

    // Make sure the suffix exists.
    if (!suffix) return msg.channel.send(musicbot.note('fail', 'No video specified!'));

    // Get the queue.
    const queue = musicbot.getQueue(msg.guild.id);

    // Check if the queue has reached its maximum size.
    if (queue.length >= musicbot.maxQueueSize) return msg.channel.send(musicbot.note('fail', 'Maximum queue size reached!'));

    // Get the video information.
    msg.channel.send(musicbot.note('note', 'Searching...')).then(response => {
      var searchstring = suffix;
      if (searchstring.includes('list=')) {
        response.edit(musicbot.note('note', 'Playlist detected! Fetching...')).then(response => {
          // Get the playlist ID and make sure it's only paylist the ID.
          var playid = searchstring.toString().split('list=')[1];
          if (playid.toString().includes('?')) playid = playid.split('?')[0];
          if (playid.toString().includes('&t=')) playid = playid.split('&t=')[0];

          // Get info on the playlist.
          ypi.playlistInfo(musicbot.youtubeKey, playid, function(playlistItems) {
            const newItems = Array.from(playlistItems);
            var skippedVideos = [];
            var queuedVids = [];

            for (var i = 0; i < newItems.length; i++) {
              var results = newItems[i];
              if (queue.length > musicbot.maxQueueSize) {
                skippedVideos.push(results.title);
              } else if (results.kind !== 'youtube#video') {
                skippedVideos.push("[Channel] " + results.title);
              } else {
                if (!results.linnk) results.link = `https://www.youtube.com/watch?v=` + newItems[i].resourceId.videoId;
                results.channel = results.channelTitle;
                results.description = null;
                if (musicbot.requesterName) results.requester = msg.author.id;
                if (musicbot.requesterName) results.requesterAvatarURL = msg.author.displayAvatarURL;
                if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
                  queuedVids.push(results);
                } else {
                  queuedVids.push(results.title);
                }
                queue.push(results);
                if (queue.length === 1) musicbot.executeQueue(msg, queue);
              };
            };

            function endrun() {
              if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
                const embed = new Discord.RichEmbed();
                embed.setAuthor(`Song Queue`, client.user.avatarURL);
                embed.setTitle(`Queued ${queuedVids.length} | Skipped ${skippedVideos.length}`);
                if (skippedVideos.length >= queuedVids.length) embed.setDescription(`Looks like a lot of videos where skipped! This can happen for a few reasons. Regional restrictions, private restricions, and other blocks will prevet the bot from queueing songs.`);
                if (queuedVids.length >= 1) embed.addField(`1) ${queuedVids[0].channel}`, `[${queuedVids[0].title}](${queuedVids[0].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 2) embed.addField(`2) ${queuedVids[1].channel}`, `[${queuedVids[1].title}](${queuedVids[1].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 3) embed.addField(`3) ${queuedVids[2].channel}`, `[${queuedVids[2].title}](${queuedVids[2].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 4) embed.addField(`4) ${queuedVids[3].channel}`, `[${queuedVids[3].title}](${queuedVids[3].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 5) embed.addField(`5) ${queuedVids[4].channel}`, `[${queuedVids[4].title}](${queuedVids[4].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 6) embed.addField(`6) ${queuedVids[5].channel}`, `[${queuedVids[5].title}](${queuedVids[5].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 7) embed.addField(`7) ${queuedVids[6].channel}`, `[${queuedVids[6].title}](${queuedVids[6].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 8) embed.addField(`8) ${queuedVids[7].channel}`, `[${queuedVids[7].title}](${queuedVids[7].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 9) embed.addField(`9) ${queuedVids[8].channel}`, `[${queuedVids[8].title}](${queuedVids[8].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 10) embed.addField(`10) ${queuedVids[9].channel}`, `[${queuedVids[9].title}](${queuedVids[9].link})`, musicbot.inlineEmbeds);
                if (queuedVids.length >= 11) embed.addField(`And...`, `${queuedVids.length - 10} more songs!`);
                embed.setColor(0x27e33d);
                msg.channel.send({
                  embed
                });
              } else {
                var qvids = queuedVids.join('\n');
                var svids = skippedVideos.join('\n');
                if (qvids.toString().length > 1000) qvids = 'Over character count, replaced...';
                if (svids.toString().length > 1000) svids = 'Over character count, replaced...';

                if (svids != "") {
                  msg.channel.send(musicbot.note('wrap', `Queued:\n${qvids}\nSkipped: (Max Queue)\n${svids}`), {
                    split: true
                  });
                } else {
                  msg.channel.send(musicbot.note('wrap', `Queued:\n${qvids}`), {
                    split: true
                  });
                };
              };
              if (skippedVideos.length >= queuedVids.length) msg.channel.send(musicbot.note('note', 'Looks like a lot of videos where skipped! This can happen for a few reasons. Regional restrictions, private restricions, and other blocks will prevet the bot from queueing songs.'));
            };
            setTimeout(endrun, 1250);
          });

        })
      } else {
        search(searchstring, opts, function(err, results) {
          if (err) {
            if (musicbot.logging) musicbot.logger('playCmd', msg, err);
            const nerr = err.toString().split(':');
            return response.edit(musicbot.note('fail', `Error occoured!\n\`\`\`\n${nerr[0]}: ${nerr[1]}\n\`\`\``));
          };

          if (!results) {
            if (musicbot.logging) musicbot.logger('playCmd', msg, `${new Error(`results came up empty`)}`);
            return response.edit(musicbot.note('fail', `Couldn't get results.`));
          };

          function playStart(videos) {
            const text = videos.map((video, index) => (
              (index + 1) + ': ' + video.title
            )).join('\n');

            response.delete();
            msg.channel.send(`\`\`\`\nPlease enter the song number, or type cancel to cancel.\n${text}\n\`\`\``).then(imsg => {
              const filter = m => m.author.id === msg.author.id &&
                m.content.includes('1') ||
                m.content.includes('2') ||
                m.content.includes('3') ||
                m.content.includes('4') ||
                m.content.includes('5') ||
                m.content.includes('6') ||
                m.content.includes('7') ||
                m.content.includes('8') ||
                m.content.includes('9') ||
                m.content.includes('10') ||
                m.content.toLowerCase().includes('cancel');
              msg.channel.awaitMessages(filter, {
                  max: 1,
                  time: 60000,
                  errors: ['time']
                })
                .then(collected => {
                  const newColl = Array.from(collected);
                  const mcon = newColl[0][1].content;

                  if (mcon.toLowerCase().includes(`cancel`)) return imsg.edit(musicbot.note('note', 'Searching canceled.'));
                  const song_number = parseInt(mcon) - 1;
                  if (song_number >= 0) {
                    videos[song_number].requester = msg.author.id;
                    let editMess;

                    if (videos[song_number].title.includes('*')) {
                      const newTitle = videos[song_number].title.toString().replace(/\*/g, "\\*");
                      editMess = musicbot.note('note', `Queued **${newTitle}**`);
                    } else {
                      editMess = musicbot.note('note', `Queued **${videos[song_number].title}**`);
                    };

                    return imsg.edit(editMess).then(() => {
                      queue.push(videos[song_number]);
                      if (queue.length === 1 || !client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id)) musicbot.executeQueue(msg, queue);
                    }).catch(console.log);
                  };
                })
                .catch(collected => {
                  if (collected.toLowerCase().includes('error')) {
                    imsg.edit(`\`\`\`xl\nSearching canceled, error occoured!\n${collected}\n\`\`\``);
                  } else {
                    imsg.edit(`\`\`\`\nSearching canceled, timed out after 60 seconds.\n\`\`\``);
                  };
                  return;
                });
            });
          };

          var videos = [];
          for (var i = 0; i < 50; i++) {
            if (videos.length >= 10) {
              playStart(videos);
              i = 51;
            } else {
              if (results[i]) {
                if (results[i].kind === 'youtube#video') {
                  if (musicbot.requesterName) results.requester = msg.author.id;
                  if (musicbot.requesterName) results.requesterAvatarURL = msg.author.displayAvatarURL;
                  videos.push(results[i]);
                }
              }
            }
          };

        });
      };
    }).catch(console.log);
  };


  /**
   * The command for skipping a song.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   * @returns {<promise>} - The response message.
   */
  musicbot.skip = (msg, suffix) => {
    musicbot.dInvoker(msg)
    // Get the voice connection.
    const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
    if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No music being played.'));

    // Get the queue.
    const queue = musicbot.getQueue(msg.guild.id);

    if (!musicbot.canSkip(msg.member, queue)) return msg.channel.send(musicbot.note('fail', `You cannot skip this as you didn't queue it.`)).then((response) => {
      response.delete(5000);
    });

    var first = musicbot.loopState(msg.guild.id);
    if (first) musicbot.setLoopState(msg.guild.id, false);

    // Get the number to skip.
    let toSkip = 1; // Default 1.
    if (!isNaN(suffix) && parseInt(suffix) > 0) {
      toSkip = parseInt(suffix);
    }
    toSkip = Math.min(toSkip, queue.length);

    // Skip.
    queue.splice(0, toSkip - 1);

    // Resume and stop playing.
    try {
      const dispatcher = voiceConnection.player.dispatcher;
      if (!dispatcher || dispatcher === null) {
        if (musicbot.logging) return console.log(new Error(`dispatcher null on pay cmd [${msg.guild.name}] [${msg.author.username}]`));
      };
      if (voiceConnection.paused) dispatcher.resume();
      dispatcher.end();
    } catch (e) {
      if (musicbot.logging) console.log(new Error(`Play command dispatcher error from userID ${msg.author.id} in guildID ${msg.guild.id}\n${e.stack}`));
      const nerr = e.toString().split(':');
      return msg.channel.send(musicbot.note('fail', `Error occoured!\n\`\`\`\n${nerr[0]}: ${nerr[1]}\n\`\`\``));
    };

    if (first) return msg.channel.send(musicbot.note('note', 'Skipped **' + toSkip + '**! (Disabled Looping)'));
    msg.channel.send(musicbot.note('note', 'Skipped **' + toSkip + '**!'));
  }

  /**
   * The command for listing the queue.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   */
  musicbot.queue = (msg, suffix) => {
    musicbot.dInvoker(msg);
    // Get the queue.
    const queue = musicbot.getQueue(msg.guild.id);
    if (queue.length === 0) return msg.channel.send(musicbot.note(`note`, `The queue is empty.`));
    let text;
    // Get the queue text.
    // Choice added for names to shorten the text a bit if wanted.
    if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      const songNum = suffix ? parseInt(suffix) : 0;
      let maxRes = queue.length;

      if (songNum > 0) {
        if (songNum > queue.length) return msg.channel.send(musicbot.note('fail', 'Not a valid song number.'));
        const embed = new Discord.RichEmbed();
        const reqMem = client.users.get(queue[songNum].requester);
        embed.setAuthor(`Queued Song #${suffix}`, client.user.avatarURL);
        embed.addField(queue[songNum].channelTitle, `[${queue[songNum].title}](${queue[songNum].link})`, musicbot.inlineEmbeds);
        embed.setThumbnail(queue[songNum].thumbnails.high.url);
        embed.setColor(0x27e33d);
        if (musicbot.requesterName && reqMem) embed.setFooter(`Queued by: ${reqMem.username}`, queue[songNum].requesterAvatarURL);
        if (musicbot.requesterName && !reqMem) embed.setFooter(`Queued by: \`UnknownUser (id: ${queue[songNum].requester})\``, queue[songNum].requesterAvatarURL)
        msg.channel.send({
          embed
        });
      } else {
        const embed = new Discord.RichEmbed();
        if (queue.length > 25) maxRes = 25;
        if (musicbot.enableQueueStat) {
          //Get the status of the queue.
          let queueStatus = 'Stopped';
          const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
          if (voiceConnection !== null) {
            const dispatcher = voiceConnection.player.dispatcher;
            queueStatus = dispatcher.paused ? 'Paused' : 'Playing';

            embed.setAuthor(`Song Queue (${queueStatus})`, client.user.avatarURL);
          } else {
            embed.setAuthor(`Song Queue`, client.user.avatarURL);
          }
        }

        try {
          for (var i = 0; i < maxRes; i++) {
            embed.addField(`${queue[i].channelTitle}`, `[${queue[i].title}](${queue[i].link})`, musicbot.inlineEmbeds);
          };
          embed.setColor(0x27e33d);
          embed.setFooter(`Total songs: ${queue.length}`, msg.author.displayAvatarURL);
        } catch (e) {
          console.log(e.stack);
        };

        setTimeout(() => {
          msg.channel.send({
            embed
          });
        }, 1500);
      }
    } else {
      try {
        if (musicbot.requesterName) {
          text = queue.map((video, index) => (
            (index + 1) + ': ' + video.title + ' | Requested by ' + client.users.get(video.requester).username
          )).join('\n');
        } else {
          text = queue.map((video, index) => (
            (index + 1) + ': ' + video.title
          )).join('\n');
        };
      } catch (e) {
        if (musicbot.logging) console.log(`[${msg.guild.name}] [queueCmd] ` + e.stack);
        const nerr = e.toString().split(':');
        return msg.channel.send(musicbot.note('fail', `Error occoured!\n\`\`\`\n${nerr[0]}: ${nerr[1]}\n\`\`\``));

      } finally {

        if (text.length > 1900) {
          const newText = text.substr(0, 1899);
          const otherText = text.substr(1900, text.length);
          if (otherText.length > 1900) {
            msg.channel.send(musicbot.note('wrap', 'Queue (' + queueStatus + '):\n' + "Past character limit..."));
          } else {
            if (musicbot.enableQueueStat) {
              // Get the status of the queue.
              let queueStatus = 'Stopped';
              const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
              if (voiceConnection !== null) {
                const dispatcher = voiceConnection.player.dispatcher;
                queueStatus = dispatcher.paused ? 'Paused' : 'Playing';
              }

              // Send the queue and status.
              msg.channel.send(musicbot.note('wrap', 'Queue (' + queueStatus + '):\n' + newText));
              msg.channel.send(musicbot.note('wrap', 'Queue (2) (' + queueStatus + '):\n' + otherText));
            } else {
              msg.channel.send(musicbot.note('wrap', 'Queue:\n' + newText));
              msg.channel.send(musicbot.note('wrap', 'Queue (2):\n' + otherText));
            }
          };
        } else {
          if (musicbot.enableQueueStat) {
            // Get the status of the queue.
            let queueStatus = 'Stopped';
            const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            if (voiceConnection !== null) {
              const dispatcher = voiceConnection.player.dispatcher;
              queueStatus = dispatcher.paused ? 'Paused' : 'Playing';
            }

            // Send the queue and status.
            msg.channel.send(musicbot.note('wrap', 'Queue (' + queueStatus + '):\n' + text));
          } else {
            msg.channel.send(musicbot.note('wrap', 'Queue:\n' + text));
          }
        }
      }
    }
  };

  /**
   * The command for information about the current song.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   * @returns {<promise>} - The response message.
   */
  musicbot.np = (msg, suffix) => {
    musicbot.dInvoker(msg);
    // Get the voice connection.
    const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
    if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No music is being played.'));
    const dispatcher = voiceConnection.player.dispatcher;
    const queue = musicbot.getQueue(msg.guild.id);
    if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      const embed = new Discord.RichEmbed();
      try {
        embed.setAuthor('Now Playing', client.user.avatarURL);
        var songTitle = queue[0].title.replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\*/g, '\\*').replace(/_/g, '\\_').replace(/~/g, '\\~').replace(/`/g, '\\`');
        embed.setColor(0x27e33d);
        embed.addField(queue[0].channelTitle, `[${songTitle}](${queue[0].link})`, musicbot.inlineEmbeds);
        embed.setImage(queue[0].thumbnails.high.url);
        const resMem = client.users.get(queue[0].requester);
        if (musicbot.requesterName && resMem) embed.setFooter(`Requested by ${client.users.get(queue[0].requester).username}`, queue[0].requesterAvatarURL);
        if (musicbot.requesterName && !resMem) embed.setFooter(`Requested by \`UnknownUser (ID: ${queue[0].requester})\``, queue[0].requesterAvatarURL);
        msg.channel.send({
          embed
        });
      } catch (e) {
        console.log(`[${msg.guild.name}] [npCmd] ` + e.stack);
      };
    } else {
      try {
        var songTitle = queue[0].title.replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\*/g, '\\*').replace(/_/g, '\\_').replace(/~/g, '\\~').replace(/`/g, '\\`');
        msg.channel.send(`Now Playing: **${songTitle}**\nRequested By: ${client.users.get(queue[0].requester).username}`)
      } catch (e) {
        console.log(`[${msg.guild.name}] [npCmd] ` + e.stack);
      };
    }
  }

  /**
   * The command for pausing the current song.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   * @returns {<promise>} - The response message.
   */
  musicbot.pause = (msg, suffix) => {
    musicbot.dInvoker(msg)
    // Get the voice connection.
    const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
    if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No music being played.'));

    if (!musicbot.isAdmin(msg.member)) return msg.channel.send(musicbot.note('fail', 'Only Admins are allowed to use this command.'));

    // Pause.
    const dispatcher = voiceConnection.player.dispatcher;
    if (dispatcher.paused) return msg.channel.send(musicbot.note(`fail`, `Music already paused!`));
    msg.channel.send(musicbot.note('note', 'Playback paused.'));
    if (!dispatcher.paused) dispatcher.pause();
  }

  /**
   * The command for leaving the channel and clearing the queue.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   * @returns {<promise>} - The response message.
   */
  musicbot.leave = (msg, suffix) => {
    musicbot.dInvoker(msg);
    if (musicbot.isAdmin(msg.member)) {
      const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
      if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'I\'m not in a voice channel.'));
      // Clear the queue.
      const queue = musicbot.getQueue(msg.guild.id);
      queue.splice(0, queue.length);

      // End the stream and disconnect.
      if (!voiceConnection.player.dispatcher) return;
      voiceConnection.player.dispatcher.end();
      voiceConnection.disconnect();
      musicbot.setLoopState(msg.guild.id, false);
      msg.channel.send(musicbot.note('note', 'Successfully left your voice channel!'));
    } else {
      msg.channel.send(musicbot.note('fail', 'Only Admins are allowed to use this command.'));
    }
  }

  /**
   * The command for clearing the song queue.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   */
  musicbot.clearqueue = (msg, suffix) => {
    musicbot.dInvoker(msg)
    if (musicbot.isAdmin(msg.member)) {
      const queue = musicbot.getQueue(msg.guild.id);
      const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
      if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'I\'m not in a channel!'));

      queue.splice(0, queue.length);
      msg.channel.send(musicbot.note('note', 'Queue cleared~'));

      voiceConnection.player.dispatcher.end();
      voiceConnection.disconnect();
      musicbot.setLoopState(msg.guild.id, false);
    } else {
      msg.channel.send(musicbot.note('fail', `Only Admins are allowed to use this command.`));
    }
  }

  /**
   * The command for resuming the current song.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   * @returns {<promise>} - The response message.
   */
  musicbot.resume = (msg, suffix) => {
    musicbot.dInvoker(msg)
    // Get the voice connection.
    const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
    if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No music is being played.'));

    if (!musicbot.isAdmin(msg.member))
      return msg.channel.send(musicbot.note('fail', 'Only Admins are allowed to use this command.'));

    // Resume.
    msg.channel.send(musicbot.note('note', 'Playback resumed.'));
    const dispatcher = voiceConnection.player.dispatcher;
    if (dispatcher.paused) dispatcher.resume();
  };

  /**
   * The command for changing the song volume.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   * @returns {<promise>} - The response message.
   */
  musicbot.volume = (msg, suffix) => {
    musicbot.dInvoker(msg)
    // Get the voice connection.
    const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
    if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No music is being played.'));

    // Get the queue.
    const queue = musicbot.getQueue(msg.guild.id);

    if (!musicbot.canAdjust(msg.member, queue))
      return msg.channel.send(musicbot.note('fail', 'Only Admins are allowed to use this command.'));

    // Get the dispatcher
    const dispatcher = voiceConnection.player.dispatcher;

    if (suffix > 200 || suffix < 0) return msg.channel.send(musicbot.note('fail', 'Volume out of range!')).then((response) => {
      response.delete(5000);
    });

    msg.channel.send(musicbot.note('note', 'Volume set to ' + suffix));
    dispatcher.setVolume((suffix / 100));
  }

  /**
   * Looping command/option.
   *
   * @param {Message} msg - Original message.
   * @param {object} queue - The song queue for this server.
   * @param {string} suffix - Command suffix.
   */
  musicbot.loop = (msg, suffix) => {
    musicbot.dInvoker(msg);

    const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
    if (voiceConnection === null) return msg.channel.send(musicbot.note('fail', 'No music is being played.'));

    const looping = musicbot.loopState(msg.guild.id);

    if (looping) {
      musicbot.setLoopState(msg.guild.id, false);
      return msg.channel.send(musicbot.note('note', 'Looping disabled! :arrow_forward:'));
    } else if (!looping) {
      musicbot.setLoopState(msg.guild.id, true);
      return msg.channel.send(musicbot.note('note', 'Looping enabled! :repeat_one:'));
    };
  };

  /**
   * Owner command functions.
   *
   * @param {Message} msg - Original message.
   * @param {string} suffix - Command suffix.
   */
  musicbot.ownerCommands = (msg, suffix) => {
    return;
    // Disabed for now.
  };

  /**
   * Executes the next song in the queue.
   *
   * @param {Message} msg - Original message.
   * @param {object} queue - The song queue for this server.
   * @returns {<promise>} - The voice channel.
   */
  musicbot.executeQueue = (msg, queue) => {
    // If the queue is empty, finish.
    if (queue.length === 0) {
      msg.channel.send(musicbot.note('note', 'Playback finished.'));

      // Leave the voice channel.
      const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
      if (voiceConnection !== null) return voiceConnection.disconnect();
    }

    new Promise((resolve, reject) => {
      // Join the voice channel if not already in one.
      const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
      if (voiceConnection === null) {
        // Check if the user is in a voice channel.
        if (msg.member.voiceChannel && msg.member.voiceChannel.joinable) {
          msg.member.voiceChannel.join().then(connection => {
            resolve(connection);
          }).catch((error) => {
            console.log(error);
          });
        } else if (!msg.member.voiceChannel.joinable) {
          msg.channel.send(musicbot.note('fail', 'I do not have permission to join your voice channel!'))
          reject();
        } else {
          // Otherwise, clear the queue and do nothing.
          queue.splice(0, queue.length);
          reject();
        }
      } else {
        resolve(voiceConnection);
      }
    }).then(connection => {
      // Get the first item in the queue.
      const video = queue[0];

      // Play the video.
      try {
        if (!global) {
          const lvid = musicbot.getLast(msg.guild.id);
          musicbot.setLast(msg.guild.id, video);
          if (lvid !== video) {
            musicbot.np(msg, queue);
          };
        };
        let dispatcher = connection.playStream(stream(video.link), {
          seek: 0,
          volume: (musicbot.defVolume / 100)
        });

        connection.on('error', (error) => {
          // Skip to the next song.
          console.log(error);
          queue.shift();
          musicbot.executeQueue(msg, queue);
        });

        dispatcher.on('error', (error) => {
          // Skip to the next song.
          console.log(error);
          queue.shift();
          musicbot.executeQueue(msg, queue);
        });

        dispatcher.on('end', () => {
          var isLooping = musicbot.loopState(msg.guild.id)
          // Wait a second.
          setTimeout(() => {
            if (isLooping) {
              musicbot.executeQueue(msg, queue);
            } else {
              if (queue.length > 0) {
                // Remove the song from the queue.
                queue.shift();
                // Play the next song in the queue.
                musicbot.executeQueue(msg, queue);
              }
            }
          }, 1000);
        });
      } catch (error) {
        console.log(error);
      }
    }).catch((error) => {
      console.log(error);
    });
  };

  //Text wrapping and cleaning.
  musicbot.note = (type, text) => {
    if (type === 'wrap') {
      ntext = text
        .replace(/`/g, '`' + String.fromCharCode(8203))
        .replace(/@/g, '@' + String.fromCharCode(8203))
        .replace(client.token, 'REMOVED');
      return '```\n' + ntext + '\n```';
    } else if (type === 'note') {
      return ':musical_note: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
    } else if (type === 'fail') {
      return ':no_entry_sign: | ' + text.replace(/`/g, '`' + String.fromCharCode(8203));
    } else if (type === 'font') {
      return text.replace(/`/g, '`' + String.fromCharCode(8203))
        .replace(/@/g, '@' + String.fromCharCode(8203))
        .replace(/\\/g, '\\\\')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_')
        .replace(/~/g, '\\~')
        .replace(/`/g, '\\`');
    } else {
      console.log(new Error(`${type} was an invalid type`));
    }
  };
};
