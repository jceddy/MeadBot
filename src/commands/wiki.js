const TOPIC_LINKS = {
  starter: '<https://wiki.meadtools.com/recipes>',
  'starter-recipes': '<https://wiki.meadtools.com/recipes>',
  user: '<https://wiki.meadtools.com/userrecipes>',
  'user-recipes': '<https://wiki.meadtools.com/userrecipes>',
  equipment: '<https://wiki.meadtools.com/resources/equipment>',
  process: '<https://wiki.meadtools.com/process/process_summary>',
  rehydration: '<https://wiki.meadtools.com/process/rehydration>',
  'yeast-rehydration': '<https://wiki.meadtools.com/process/rehydration>',
  sna: '<https://wiki.meadtools.com/process/staggered_nutrient_additions>',
  stabilization: '<https://wiki.meadtools.com/process/stabilization>',
  fining: '<https://wiki.meadtools.com/process/fining>',
  packaging: '<https://wiki.meadtools.com/process/packaging>',
  nutrients: '<https://wiki.meadtools.com/ingredients/nutrients>',
  nutes: '<https://wiki.meadtools.com/ingredients/nutrients>',
};

const DEFAULT_LINK = '<https://wiki.meadtools.com/>';
const USAGE =
  'Command: !wiki [starter-recipes|user-recipes|equipment|process|yeast-rehydration|sna|stabilization|fining|packaging|nutrients]';

module.exports = {
  name: 'wiki',
  description: 'Links to the MeadTools wiki, or a specific topic within it.',
  execute(message, args) {
    if (args.length === 0) {
      message.channel.send(DEFAULT_LINK);
      return;
    }

    const topic = args[0];
    if (['?', 'list', 'commands', 'list-commands'].includes(topic)) {
      message.channel.send(USAGE);
      return;
    }

    message.channel.send(TOPIC_LINKS[topic] || DEFAULT_LINK);
  },
};
