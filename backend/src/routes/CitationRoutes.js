const express = require("express");
const router = express.Router();
const CitationController = require("../controllers/CitationController.js");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateCreateCitation, validateUpdateCitation } = require("../validations/citationValidator.js");
const checkRole = require("../middlewares/checkRole.js");

router.use(authMiddleware);

router.post("/",checkRole(["unit"]),validateCreateCitation, CitationController.createCitation);
router.get("/", CitationController.getAllCitations);
router.get("/:id", CitationController.getCitationById);
router.put("/:id",checkRole(["unit","command","headquarter","cw2"]),validateUpdateCitation, CitationController.updateCitation);
router.delete("/:id", CitationController.deleteCitation);

module.exports = router;
