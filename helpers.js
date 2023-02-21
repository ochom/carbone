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

const getData = async () => {
  try {
    const res = await axios.get("https://smsgames.kwikbet.co.ke/api/v2/games");
    const newData = res.data.map((d) => {
      const startTime = moment(d.startTime).format("DD/MM HH:mm");

      // format the odds to 2 decimal places
      d.homeOdds = parseFloat(d.homeOdds).toFixed(2);
      d.awayOdds = parseFloat(d.awayOdds).toFixed(2);
      d.drawOdds = parseFloat(d.drawOdds).toFixed(2);

      d.meta.un = parseFloat(d.meta.un || 0).toFixed(2);
      d.meta.ov = parseFloat(d.meta.ov || 0).toFixed(2);
      d.meta.gg = parseFloat(d.meta.gg || 0).toFixed(2);
      d.meta.ng = parseFloat(d.meta.ng || 0).toFixed(2);

      return { ...d, startTime };
    });
    return newData;
  } catch (err) {
    console.log(err);
    return [];
  }
};

module.exports = { getTemplate, getData };
