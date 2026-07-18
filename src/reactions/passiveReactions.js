const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const config = require('../config.js');
const mediaPath = require('../utils/mediaPath.js');

// tracks the last time the "You're not my real father!" joke fired, reset on bot start
let fatherDate = new Date();
function resetFatherDate() {
  fatherDate = new Date();
}

const RANDOM_RESPONSES = [
  (message) => `Watchoo talkin' 'bout, ${message.author.toString()}?`,
  () => "Them's fightin' words!",
  () => 'Nuh-uh!',
  () => 'SMH',
  () => '🤦',
  () => '🤦‍♂️',
  () => '🤦‍♀️',
  () => 'That is some StatBot crap right there.',
  () => ({ embeds: [new EmbedBuilder().setImage('https://media0.giphy.com/media/l1J9u3TZfpmeDLkD6/giphy.gif')] }),
  () => 'That really chaps my hide.',
];

function isMeadHall(message) {
  return message.guild != null && message.guild.id === config.guilds.theMeadHall;
}

// Reacts/replies to keyword-triggered "vibe" messages. Mirrors the original bot's
// exclusive if/else-if chain: only the first matching rule fires per message.
// Only called for non-command messages.
async function handlePassiveReactions(message) {
  const messageLower = message.content.toLowerCase().replace(/ {2,}/g, ' ');

  if (messageLower.includes('chili') && isMeadHall(message)) {
    await message.react(messageLower.includes('bean') ? config.emoji.chiliBean : config.emoji.chiliNoBean);
  } else if ((messageLower.includes(' raisin ') || messageLower.includes(' raisins ')) && isMeadHall(message)) {
    if (CalculatorAPI.RandomInteger(300) === 1) {
      const embed = new EmbedBuilder().setImage(config.links.paddlinImage);
      await message.channel.send({ embeds: [embed] });
    } else {
      await message.react(config.emoji.raisin);
    }
  } else if (
    isMeadHall(message) &&
    (messageLower.includes(' thc ') ||
      messageLower.includes('psychadelic') ||
      messageLower.includes('mad honey') ||
      messageLower.includes('meat honey') ||
      (messageLower.includes(' weed ') && messageLower.includes('mead')))
  ) {
    await message.react('🤦');
    await message.react('🤦‍♂️');
    await message.react('🤦‍♀️');
  } else if (messageLower.includes('this is the way') || messageLower.includes('show you the way')) {
    const attachment = new AttachmentBuilder(mediaPath('mando.gif'), { name: 'mando.gif' });
    const embed = new EmbedBuilder().setImage('attachment://mando.gif');
    await message.channel.send({ embeds: [embed], files: [attachment] });
  } else if (isMeadHall(message) && (messageLower.includes('texas') || messageLower.includes(' tx '))) {
    await message.react(config.emoji.texas);
  } else if (
    isMeadHall(message) &&
    (messageLower.includes('minnesota') || messageLower.includes('minnesnowta') || messageLower.includes(' mn '))
  ) {
    await message.react(config.emoji.minnesota);
  } else if (isMeadHall(message) && messageLower.includes('ireland')) {
    await message.react('🇮🇪');
  } else if (isMeadHall(message) && (messageLower.includes('chicago') || messageLower.includes('chi-town'))) {
    await message.react(config.emoji.chicago);
  } else if (
    isMeadHall(message) &&
    (messageLower.includes('goddamn you') ||
      messageLower.includes('fuck off') ||
      messageLower.includes('i hate you')) &&
    (messageLower.includes(' bot') || messageLower.includes('meadbot'))
  ) {
    await message.react('😢');
    await message.channel.send('No you!');
  } else if (messageLower.includes('love you') && messageLower.includes('meadbot')) {
    await message.channel.send('😍');
  } else if (config.channels.banter.includes(message.channel.id)) {
    if (messageLower.includes('meadbot')) {
      if (CalculatorAPI.GetDaysBetween(fatherDate, new Date()) > 1) {
        resetFatherDate();
        await message.channel.send("You're not my real father!");
      }
    } else if (CalculatorAPI.RandomInteger(300) === 1) {
      const response = RANDOM_RESPONSES[CalculatorAPI.RandomInteger(10)](message);
      await message.channel.send(response);
    }
  } else if (
    messageLower.includes('fuck') &&
    message.channel.id !== config.channels.thunderDome &&
    isMeadHall(message)
  ) {
    if (CalculatorAPI.RandomInteger(300) === 1) {
      await message.channel.send(message.author.toString() + ' has baggy pants!');
    }
  } else if (message.author.id === config.easterEggUsers.yeah) {
    if (CalculatorAPI.RandomInteger(300) === 1) {
      await message.channel.send('yeah.');
    }
  } else if (config.easterEggUsers.reactOnly.includes(message.author.id)) {
    if (CalculatorAPI.RandomInteger(300) === 1) {
      await message.react(config.emoji.easterEggReact);
    }
  } else if (messageLower.includes(' esters')) {
    // originally 6 images hotlinked from Discord's CDN; those links have since expired.
    // These 5 were recovered and are now served as local attachments instead.
    const ESTERS_IMAGES = {
      1: 'esters-ballmer.jpg',
      2: 'esters-braveheart.jpg',
      3: 'esters-krystenritter.jpg',
      4: 'esters-whisper.png',
      5: 'esters-ancientaliens.png',
    };
    const imageFile = ESTERS_IMAGES[CalculatorAPI.RandomInteger(100)];
    if (imageFile) {
      const attachment = new AttachmentBuilder(mediaPath(imageFile), { name: imageFile });
      const embed = new EmbedBuilder().setImage('attachment://' + imageFile);
      await message.channel.send({ embeds: [embed], files: [attachment] });
    }
  }
}

module.exports = { handlePassiveReactions, resetFatherDate };
