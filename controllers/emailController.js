const fs = require("fs");
const path = require("path");
const EmailTemplate = require("../models/EmailTemplate");

// Get Email Layout
exports.getEmailLayout = (req, res) => {
  const layoutPath = path.join(__dirname, "../views/layout.html");
  fs.readFile(layoutPath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading layout file", err });
    }
    res.send(data);
  });
};

// Fetch All Email Templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find();
    res.status(200).json(templates);
  } catch (err) {
    res.status(500).json({ message: "Error fetching templates", err });
  }
};




exports.uploadEmailConfig = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const { title, content, footer, imageURL, logo, titleStyle, contentStyle, footerStyle, _id } = req.body;

    // Validate required fields
    if (!title || !content || !footer) {
      return res.status(400).json({
        message: "Validation error: Title, content, and footer are required fields.",
      });
    }

    // Ensure imageURL is an array of strings
    const parsedImageURL =
      Array.isArray(imageURL) && imageURL.every((url) => typeof url === "string")
        ? imageURL
        : [];

    // Ensure styles are objects
    const parsedTitleStyle = typeof titleStyle === "object" ? titleStyle : {};
    const parsedContentStyle = typeof contentStyle === "object" ? contentStyle : {};
    const parsedFooterStyle = typeof footerStyle === "object" ? footerStyle : {};

    // Prepare the data to be updated
    const updatedData = {
      title,
      content,
      footer,
      imageURL: parsedImageURL,
      logo: logo || "",
      titleStyle: parsedTitleStyle,
      contentStyle: parsedContentStyle,
      footerStyle: parsedFooterStyle,
    };

    if (_id) {
      // Find the existing template by _id
      console.log(`Attempting to update template with _id: ${_id}`);
      const existingTemplate = await EmailTemplate.findById(_id);

      if (!existingTemplate) {
        return res.status(404).json({
          message: `Template with ID ${_id} not found.`,
        });
      }

      console.log("Found existing template:", existingTemplate);

      // Update the fields explicitly
      existingTemplate.title = updatedData.title;
      existingTemplate.content = updatedData.content;
      existingTemplate.footer = updatedData.footer;
      existingTemplate.imageURL = updatedData.imageURL;
      existingTemplate.logo = updatedData.logo;
      existingTemplate.titleStyle = updatedData.titleStyle;
      existingTemplate.contentStyle = updatedData.contentStyle;
      existingTemplate.footerStyle = updatedData.footerStyle;

      // Save the updated template
      await existingTemplate.save();

      console.log("Template updated successfully.");
      return res.status(200).json({ message: "Email template updated successfully" });
    } else {
      console.log("No _id provided, creating a new template.");

      // Create a new template
      const emailTemplate = new EmailTemplate(updatedData);
      await emailTemplate.save();

      console.log("New template saved successfully.");
      return res.status(201).json({ message: "Email template saved successfully" });
    }
  } catch (err) {
    console.error("Error saving/updating email template:", err.message);
    res.status(500).json({
      message: "Error saving/updating email template",
      error: err.message,
    });
  }
};




// Upload Image
exports.uploadImage = (req, res) => {
  try {
    const imageUrl = `/uploads/${req.file.filename}`; // Relative path to the uploaded file
    res.status(200).json({ message: "Image uploaded successfully", imageUrl });
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).json({ message: "Failed to upload image", error: err.message });
  }
};

// Render and Download Template
// exports.renderAndDownloadTemplate = (req, res) => {
//   const { title, content, footer, imageUrls } = req.body;
//   const layoutPath = path.join(__dirname, "../views/layout.html");

//   fs.readFile(layoutPath, "utf8", (err, htmlTemplate) => {
//     if (err) {
//       return res.status(500).json({ message: "Error reading layout file", err });
//     }

//     let renderedHtml = htmlTemplate
//       .replace("{{title}}", title)
//       .replace("{{content}}", content)
//       .replace("{{footer}}", footer);

//     if (imageUrls && imageUrls.length) {
//       renderedHtml = renderedHtml.replace(
//         "{{images}}",
//         imageUrls.map((url) => `<img src="${url}" alt="Email Image" />`).join("")
//       );
//     } else {
//       renderedHtml = renderedHtml.replace("{{images}}", "");
//     }

//     res.setHeader("Content-Type", "text/html");
//     res.send(renderedHtml);
//   });
// };

exports.renderAndDownloadTemplate = (req, res) => {
  const { title, content, footer, imageUrls, logo, titleStyle, contentStyle, footerStyle } = req.body;
  const layoutPath = path.join(__dirname, "../views/layout.html");

  fs.readFile(layoutPath, "utf8", (err, htmlTemplate) => {
    if (err) {
      return res.status(500).json({ message: "Error reading layout file", err });
    }

    // Apply inline styles for title, content, and footer
    const titleWithStyle = `<h1 style="${generateInlineStyle(titleStyle)}">${title}</h1>`;
    const contentWithStyle = `<div style="${generateInlineStyle(contentStyle)}">${content}</div>`;
    const footerWithStyle = `<footer style="${generateInlineStyle(footerStyle)}">${footer}</footer>`;

    // Replace placeholders with data
    let renderedHtml = htmlTemplate
      .replace("{{title}}", titleWithStyle) // Insert title with style
      .replace("{{content}}", contentWithStyle) // Insert content with style
      .replace("{{footer}}", footerWithStyle); // Insert footer with style

    // Insert logo if provided
    if (logo) {
      renderedHtml = renderedHtml.replace("{{logo}}", `<img src="${logo}" alt="Logo" style="max-width: 200px;" />`);
    } else {
      renderedHtml = renderedHtml.replace("{{logo}}", ""); // Remove the placeholder if no logo
    }

    // Insert images dynamically
    if (imageUrls && imageUrls.length) {
      renderedHtml = renderedHtml.replace(
        "{{images}}",
        imageUrls.map((url) => `<img src="${url}" alt="Email Image" style="max-width: 100%; margin: 10px 0;" />`).join("")
      );
    } else {
      renderedHtml = renderedHtml.replace("{{images}}", ""); // Remove the placeholder if no images
    }

    // Send the rendered HTML as a downloadable file
    res.setHeader("Content-Disposition", "attachment; filename=email-template.html");
    res.setHeader("Content-Type", "text/html");
    res.send(renderedHtml);
  });
};

// Helper function to generate inline styles
function generateInlineStyle(styleObj) {
  if (!styleObj || typeof styleObj !== "object") return "";
  return Object.entries(styleObj)
    .map(([key, value]) => `${camelToKebabCase(key)}: ${value};`)
    .join(" ");
}

// Convert camelCase to kebab-case for CSS properties
function camelToKebabCase(str) {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

exports.getEmailTemplateById = async (req, res) => {
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    // Fetch template
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json(template);
  } catch (err) {
    console.error("Error fetching template:", err);
    res.status(500).json({ message: "Error fetching template", err });
  }
};
