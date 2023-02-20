const carbone = require("carbone");
const express = require("express");
const fs = require("fs");
const { getTemplate, getData } = require("./helpers");

const libre = require("libreoffice-convert");
libre.convertAsync = require("util").promisify(libre.convert);

const app = express();
app.use(express.json({ limit: "50mb" }));

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
    let pdfBuf = await libre.convertAsync(result, ".pdf", undefined);

    // send to client
    res.contentType("application/pdf");
    res.send(pdfBuf);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
