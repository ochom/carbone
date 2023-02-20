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

const briefTeamName = (name) => {
  // check if team name is too long e.g.  Borussia Dortmund or Borussia Mönchengladbach and return Borussia D or Borussia M
  if (name.length > 15) {
    return name.split(" ")[0].slice(0, 8);
  }

  return name;
};

const getData = async () => {
  try {
    const res = await axios.get("https://smsgames.kwikbet.co.ke/api/v2/games");
    const newData = res.data.map((d) => {
      const startTime = moment(d.startTime).format("DD/MM HH:mm");

      const homeTeam = briefTeamName(d.homeTeam);
      const awayTeam = briefTeamName(d.awayTeam);

      return { ...d, startTime, homeTeam, awayTeam };
    });
    return newData;
  } catch (err) {
    console.log(err);
    return [];
  }
};

module.exports = { getTemplate, getData };
