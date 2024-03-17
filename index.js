import express, { json } from "express";
import { writeFileSync, unlinkSync } from "fs";
import cors from "cors";
import carbone from "carbone";
import { convert } from "libreoffice-convert";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const _dirname = path.resolve();
const convertAsync = promisify(convert);

console.log(process.platform, process.arch);

const app = express();
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(json({ limit: "200mb" }));

app.get("/", (req, res) => {
  res.send("Hello Carbone: Your IP: " + req.ip);
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
    const input = path.join(_dirname, `template-${uuidv4()}.odt`);

    // write to disk
    writeFileSync(input, binary);

    const processResult = async (err, result) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        // Convert it to pdf format with undefined filter (see Libre office docs about filter)
        const pdfBuf = await convertAsync(result, `${convertTo}`, undefined);

        // send to client
        res.contentType(`application/${convertTo}`);
        res.send(pdfBuf);
      } catch (error) {
        console.log(error);
        return res.status(400).json({ error: error.message });
      }

      // delete template
      unlinkSync(input);
    };

    carbone.render(input, data, processResult);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
