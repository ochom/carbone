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

      return { ...d, startTime };
    });
    return newData;
  } catch (err) {
    console.log(err);
    return [];
  }
};

module.exports = { getTemplate, getData };
