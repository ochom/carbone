const carbone = require("carbone");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { getTemplate, getData } = require("./helpers");

const libre = require("libreoffice-convert");
libre.convertAsync = require("util").promisify(libre.convert);

const loadContent = async (filter) => {
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

const app = express();
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));

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
  const content = await loadContent(req.query.filter || "all");
  res.contentType("application/pdf");
  res.send(content);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
