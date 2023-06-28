import express, { json } from "express";
import { writeFileSync, unlinkSync } from "fs";
import cors from "cors";
import carbone from "carbone";
import { convert } from "libreoffice-convert";
import { promisify } from "util";
import { v5 as uuid5 } from "uuid";

const convertAsync = promisify(convert);

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

app.post("/generate", async (req, res) => {
  try {
    let { template, data, convertTo } = req.body;

    if (!convertTo) {
      convertTo = "pdf";
    }

    // convert base64 to binary
    const binary = Buffer.from(template, "base64");

    // template name with timestamp
    const input = `/tmp/template-${uuid5()}.odt`;

    // write to disk
    writeFileSync(input, binary);

    const processResult = async (err, result) => {
      console.log("processing template...");
      if (err) {
        return res.status(400).json({ error: err.message, data });
      }

      console.log(`converting to ${convertTo}...`);

      // Convert it to pdf format with undefined filter (see Libre office docs about filter)
      const pdfBuf = await convertAsync(result, `.${convertTo}`, undefined);

      console.log("sending to client...");

      // delete template
      unlinkSync(input);

      // send to client
      res.contentType(`application/${convertTo}`);
      res.send(pdfBuf);
    };

    carbone.render(input, data, processResult);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
