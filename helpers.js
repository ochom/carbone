const carbone = require("carbone");
const fs = require("fs");
const axios = require("axios");
const moment = require("moment");

const libre = require("libreoffice-convert");
libre.convertAsync = require("util").promisify(libre.convert);

const getTemplate = () => {
  // read file from disk
  const template = fs.readFileSync("templates/games template.docx");
  // convert to base64
  const base64 = Buffer.from(template).toString("base64");
  // send to client
  return base64;
};

const parseOdds = (odds) => {
  const oddsFloat = parseFloat(odds || 0).toFixed(2);
  return oddsFloat.length > 4 ? oddsFloat.slice(0, 4) : oddsFloat;
};

const getData = async (filter = "all") => {
  try {
    const res = await axios.get("https://smsgames.kwikbet.co.ke/api/v2/games");
    const newData = res.data.map((d) => {
      const startTime = moment(d.startTime)
        .add(3, "hours")
        .format("DD/MM HH:mm");

      let isTodayGame = false;
      if (moment().isSame(moment(d.startTime), "day")) {
        isTodayGame = true;
      }

      // format the odds to 3 digits either max e.g 1.234 return 1.23 and 15.678 return 15.7
      d.homeOdds = parseOdds(d.homeOdds);
      d.awayOdds = parseOdds(d.awayOdds);
      d.drawOdds = parseOdds(d.drawOdds);

      d.meta.un = parseOdds(d.meta.un);
      d.meta.ov = parseOdds(d.meta.ov);
      d.meta.gg = parseOdds(d.meta.gg);
      d.meta.ng = parseOdds(d.meta.ng);

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

const generateContent = async (filter) => {
  const data = await getData(filter);
  const template = getTemplate();

  return new Promise((resolve, reject) => {
    // template name with timestamp
    const input = `/tmp/template-${Date.now()}.docx`;

    // write to disk
    fs.writeFileSync(input, Buffer.from(template, "base64"));

    carbone.render(input, data, async (err, result) => {
      if (err) {
        return reject(err);
      }

      // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
      const pdfBuf = await libre.convertAsync(result, ".pdf", undefined);
      return resolve(pdfBuf);
    });
  });
};

module.exports = { getTemplate, getData, generateContent };
