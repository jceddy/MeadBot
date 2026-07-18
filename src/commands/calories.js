const { EmbedBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');

module.exports = {
  name: 'calories',
  description: 'Estimates calories from percent alcohol, FG, bottle size, and serving size.',
  execute(message, args) {
    if (args.length < 4) {
      message.channel.send(
        'Usage: !calories <percent-alcohol:number> <fg:number> <bottle-ml:number> <serving-ml:number>'
      );
      return;
    }

    const result = CalculatorAPI.CalculateCalories(
      parseFloat(args[0]),
      parseFloat(args[1]),
      parseFloat(args[2]),
      parseFloat(args[3])
    );

    if (result.error) {
      if (result.errorType === CalculatorAPI.Constants.ErrorTypes.IS_NAN) {
        message.channel.send(args[result.errorArgumentPosition] + ' is not a number.');
      } else {
        message.channel.send(result.errorMessage);
      }
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Calories')
      .addFields(
        { name: 'Percentage Alcohol', value: result.percentAlcohol.toFixed(1), inline: true },
        { name: 'FG', value: result.fg.toFixed(3), inline: true },
        { name: 'Alcohol g/L', value: result.alcoholGramsLiter.toFixed(1), inline: true },
        { name: 'Alcohol calories/L', value: result.alcoholCalories.toFixed(1), inline: true },
        { name: 'Bottle (ml)', value: result.bottleVolume.toFixed(1), inline: true },
        { name: 'Serving (ml)', value: result.servingVolume.toFixed(1), inline: true },
        { name: 'Residual Sugar', value: result.residualSugar.toFixed(1), inline: true },
        { name: 'Residual Calories', value: result.residualCalories.toFixed(1), inline: true },
        { name: 'Total Calories (bottle)', value: result.totalCaloriesBottle.toFixed(1), inline: true },
        { name: 'Total Calories (250ml glass)', value: result.totalCalories250.toFixed(1), inline: true },
        { name: 'Total Calories (serving)', value: result.totalCaloriesServing.toFixed(1), inline: true }
      );
    message.channel.send({ embeds: [embed] });
  },
};
