module.exports = function (app, data) {
  app.get("/", (req, res) => {
    res.render("index", { images: data.images, dir: data.dir });
  });
};
