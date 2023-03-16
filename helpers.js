const fs = require("fs");
const axios = require("axios");
const moment = require("moment");

const getTemplate = () => {
  // read file from disk
  const template = fs.readFileSync("templates/games template.docx");
  // convert to base64
  const base64 = Buffer.from(template).toString("base64");
  // send to client
  return base64;
};

const getData = async (filter = "all") => {
  try {
    const res = await axios.get(`https://smsgames.kwikbet.co.ke/api/v2/games`);
    const newData = res.data.map((d) => {
      const startTime = moment(d.startTime)
        .add(3, "hours")
        .format("DD/MM HH:mm");

      let isTodayGame = false;
      if (moment().isSame(moment(d.startTime), "day")) {
        isTodayGame = true;
      }

      // format the odds to 2 decimal places
      d.homeOdds = parseFloat(d.homeOdds).toFixed(2);
      d.awayOdds = parseFloat(d.awayOdds).toFixed(2);
      d.drawOdds = parseFloat(d.drawOdds).toFixed(2);

      d.meta.un = parseFloat(d.meta.un || 0).toFixed(2);
      d.meta.ov = parseFloat(d.meta.ov || 0).toFixed(2);
      d.meta.gg = parseFloat(d.meta.gg || 0).toFixed(2);
      d.meta.ng = parseFloat(d.meta.ng || 0).toFixed(2);

      return { ...d, startTime, isTodayGame };
    });

    const topGames = {
      title: "Today's Highlights",
      data: [],
    };

    const todayGames = {
      title: "Today's Games",
      data: [],
    };

    const allGames = {
      title: "All Games",
      data: newData,
    };

    for (let i = 0; i < newData.length; i++) {
      // if the game is a highlight add it to the topGames array
      if (newData[i].isHighlight && newData[i].isTodayGame) {
        topGames.data.push(newData[i]);
      }

      // if the game is a today game and not a highlight add it to the todayGames array
      if (newData[i].isTodayGame && !newData[i].isHighlight) {
        todayGames.data.push(newData[i]);
      }
    }

    if (filter === "top") {
      return [topGames];
    }

    if (filter === "today") {
      return [todayGames];
    }

    return [allGames];
  } catch (err) {
    console.log(err);
    return [];
  }
};

module.exports = { getTemplate, getData };
