const carbone = require("carbone");
const express = require("express");
const fs = require("fs");
const { getTemplate, getData } = require("./helpers");

const libre = require("libreoffice-convert");
libre.convertAsync = require("util").promisify(libre.convert);

let cache = {
  data: [],
  buffer: null,
  createdAt: null,
};

const streamData = async () => {
  setInterval(async () => {
    const data = await getData();

    // check if data has changed
    if (JSON.stringify(data) !== JSON.stringify(cache.data)) {
      console.log("Data changed");

      // update cache
      cache.data = data;
      cache.createdAt = null;
    }
  }, 1000 * 60 * 5);
};

const loadCache = async () => {
  if (cache.createdAt) {
    const now = new Date();
    const diff = now - cache.createdAt;
    const minutes = Math.floor(diff / 1000 / 60);

    if (minutes < 5) {
      console.log("Using cache");
      return new Promise((resolve) => {
        resolve(cache);
      });
    }

    console.log("Cache expired");
  }

  const template = getTemplate();
  if (cache.data.length === 0) {
    cache.data = await getData();
  }

  return new Promise((resolve, reject) => {
    // template name with timestamp
    const input = `/tmp/template-${Date.now()}.docx`;

    // write to disk
    fs.writeFileSync(input, Buffer.from(template, "base64"));

    carbone.render(input, cache.data, async (err, result) => {
      if (err) {
        return reject(err);
      }

      // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
      const pdfBuf = await libre.convertAsync(result, ".pdf", undefined);

      cache.buffer = pdfBuf;

      cache.createdAt = new Date();

      return resolve(cache);
    });
  });
};

// start streaming data
console.log("Starting data stream");
streamData();

const app = express();
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("Hello Carbone");
});

app.get("/template", async (req, res) => {
  res.send(getTemplate());
});

app.get("/data", async (req, res) => {
  const data = await getData();
  res.send(data);
});

app.post("/generate", async (req, res) => {
  let { template, data, convertTo } = req.body;
  if (!template) {
    template = getTemplate();
  }

  if (!data) {
    data = await getData();
  }

  if (!convertTo) {
    convertTo = "pdf";
  }

  // convert base64 to binary
  const binary = Buffer.from(template, "base64");

  // template name with timestamp
  const input = `/tmp/template-${Date.now()}.docx`;

  // write to disk
  fs.writeFileSync(input, binary);

  carbone.render(input, data, async (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    if (convertTo === "docx") {
      res.contentType(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      return res.send(result);
    }

    // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
    const pdfBuf = await libre.convertAsync(result, ".pdf", undefined);

    // send to client
    res.contentType("application/pdf");
    res.send(pdfBuf);
  });
});

app.get("/download-games", async (req, res) => {
  const cache = await loadCache();
  res.contentType("application/pdf");
  res.send(cache.buffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
