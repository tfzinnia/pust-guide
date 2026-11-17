const router = require("express").Router();
const directory = require("../services/directory");
router.get("/", async (req, res) => res.json(await directory.metadata()));
router.get("/offices", async (req, res) =>
  res.json(await directory.offices(req.query)),
);
router.get("/offices/:id", async (req, res) =>
  res.json(await directory.officeDetails(req.params.id)),
);
router.get("/people", async (req, res) =>
  res.json(await directory.people(req.query)),
);
module.exports = router;
