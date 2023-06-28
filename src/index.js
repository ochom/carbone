import express, { json } from "express";
import { writeFileSync } from "fs";
import cors from "cors";
import { getTemplate, getData, generateContent } from "./helpers.js";
import carbone from "carbone";
import { convert } from "libreoffice-convert";
import { promisify } from "util";

const convertAsync = promisify(convert);

const cache = {
  all: {
    binary: null,
    lastUpdated: null,
  },
  top: {
    binary: null,
    lastUpdated: null,
  },
  today: {
    binary: null,
    lastUpdated: null,
  },
};

const updateCache = async (filter) => {
  const startTime = new Date();
  if (!cache[filter]) {
    filter = "all";
  }

  const memory = cache[filter];

  memory.binary = await generateContent(filter);
  memory.lastUpdated = new Date();

  cache[filter] = { ...memory };
  const tt = new Date().getTime() - startTime.getTime();
  console.log(`Cache updated for ${filter} took ${tt}ms`);
};

const app = express();
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("Hello Carbone");
});

app.get("/template", async (req, res) => {
  res.send(getTemplate());
});

app.get("/data", async (req, res) => {
  const data = await getData(req.query.filter || "all");
  res.send(data);
});

app.post("/generate", async (req, res) => {
  try {
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
    const input = `/tmp/template-${Date.now()}.odt`;

    // write to disk
    writeFileSync(input, binary);

    carbone.render(input, data, async (err, result) => {
      console.log("processing template...");
      if (err) {
        return res.status(400).json({ error: err.message, data, template });
      }

      console.log("converting to pdf...");

      // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
      const pdfBuf = await convertAsync(result, ".pdf", undefined);

      console.log("sending to client...");

      // send to client
      res.contentType("application/pdf");
      res.send(pdfBuf);
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/download-games", async (req, res) => {
  let filter = req.query.filter;
  if (!cache[filter]) {
    filter = "all";
  }

  res.contentType("application/pdf");

  if (cache[filter].binary && cache[filter].lastUpdated) {
    const diff = new Date().getTime() - cache[filter].lastUpdated.getTime();
    // cache for 30 minutes but update it in the background
    if (diff < 1000 * 60 * 30) {
      updateCache(filter);
      return res.send(cache[filter].binary);
    }
  }

  await updateCache(filter);
  res.send(cache[filter].binary);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
