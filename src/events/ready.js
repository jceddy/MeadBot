const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const ACTIVITIES = require('../data/activities.js');
const notifyAdmin = require('../utils/notifyAdmin.js');
const { scheduleCleanup } = require('../jobs/cleanup.js');
const { resetFatherDate } = require('../reactions/passiveReactions.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    await notifyAdmin(client, 'My unit is ready!');

    const activity = ACTIVITIES[CalculatorAPI.RandomInteger(ACTIVITIES.length)];
    client.user.setActivity(activity.name, { type: activity.type });

    scheduleCleanup(client);
    resetFatherDate();
  },
};
