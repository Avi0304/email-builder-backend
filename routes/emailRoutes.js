const express = require("express");
const router = express.Router();
const multer = require("multer");
const emailController = require("../controllers/emailController");
const mongoose = require("mongoose");
const EmailTemplate = require("../models/EmailTemplate");

// Configure Multer for image uploads
const upload = multer({ dest: "uploads/" });

// Routes
router.get("/getEmailLayout", emailController.getEmailLayout);
router.post("/uploadEmailConfig", emailController.uploadEmailConfig);
router.post("/uploadImage", upload.single("image"), emailController.uploadImage);
router.post("/renderAndDownloadTemplate", emailController.renderAndDownloadTemplate);


router.get("/getAllTemplates", async (req, res) => {
  try {
    const templates = await EmailTemplate.find();
    res.status(200).json(templates);
  } catch (err) {
    res.status(500).json({ message: "Error fetching templates", err });
  }
});


router.get("/getEmailTemplate/:id", async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.status(200).json(template);
  } catch (err) {
    res.status(500).json({ message: "Error fetching template", err });
  }
});

  
  

module.exports = router;
