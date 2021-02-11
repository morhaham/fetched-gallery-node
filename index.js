const express = require("express");
const ejs = require("ejs");
const routes = require("./routes");
const path = require("path");

const app = express();
app.set("view engine", "ejs");
app.use("/images", express.static(path.join(__dirname, "images")));

const puppeteer = require("puppeteer");
const fs = require("fs");

(async function main() {
  const data = {
    folder: process.argv[3],
    images: [],
  };

  try {
    const browser = await puppeteer.launch();
    const [page] = await browser.pages();

    const allImgResponses = {};
    page.on("response", (response) => {
      if (response.request().resourceType() === "image") {
        allImgResponses[response.url()] = response;
      }
    });

    await page.goto(process.argv[2]);

    const selecedImgs = await page.evaluate(() =>
      Array.from(
        document.getElementsByTagName("img"),
        ({ src, naturalHeight, naturalWidth }) => {
          return {
            src: src,
            naturalHeight: naturalHeight,
            naturalWidth: naturalWidth,
          };
        }
      )
    );

    data.images = data.images.concat(selecedImgs);

    let i = 0;
    for (const img of selecedImgs) {
      fs.writeFileSync(
        `./${process.argv[3]}/${i++}.${img.src.slice(-3)}`,
        await allImgResponses[img.src].buffer()
      );
    }

    await browser.close();
  } catch (err) {
    console.error(err);
  }

  fs.readdirSync(`./${process.argv[3]}`).forEach((imgLocalSrc, i) => {
    data.images[i].imgLocalSrc = imgLocalSrc;
  });

  routes(app, data);
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`server run on port ${port}`);
  });
})();
