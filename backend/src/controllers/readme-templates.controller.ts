
import type { Request, Response } from "express";
import ReadmeTemplate from "../models/ReadmeTemplate";

const defaultTemplates = [
  {
    templateId: "minimal-portfolio",
    name: "Minimal Portfolio",
    description: "Kişisel geliştirici profilini tanıt.",
    category: "Portfolio",
    content: `# Your Name

Frontend Developer | Open Source Enthusiast

## About Me

- I build modern web applications.
- I enjoy learning new technologies.
- I'm open to collaborating on interesting projects.

## Tech Stack

- JavaScript
- React
- Node.js

## Contact

- GitHub: https://github.com/your-username
- Email: your-email@example.com
`,
  },
  {
    templateId: "project-readme",
    name: "Project README",
    description: "Bir yazılım projesini düzenli şekilde tanıt.",
    category: "Project",
    content: `# Project Name

A short description of your project.

## Features

- Feature one
- Feature two
- Feature three

## Technologies

- Technology one
- Technology two

## Installation

\`\`\`bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
\`\`\`

## Usage

\`\`\`bash
npm run dev
\`\`\`

## License

MIT
`,
  },
  {
    templateId: "open-source",
    name: "Open Source Project",
    description: "Topluluk katkıları için proje rehberi.",
    category: "Open Source",
    content: `# Project Name

An open-source project built by the community.

## Getting Started

Read the installation instructions before contributing.

## How to Contribute

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Open a pull request.

## Issues

Report bugs and suggest improvements through GitHub Issues.

## Code of Conduct

Be respectful and constructive when interacting with contributors.

## License

Add your project license here.
`,
  },
];

export async function seedDefaultReadmeTemplates(): Promise<void> {
  for (const template of defaultTemplates) {
    await ReadmeTemplate.updateOne(
      { templateId: template.templateId },
      { $setOnInsert: template },
      { upsert: true }
    );
  }

  console.log("Default README templates are ready.");
}

export async function getReadmeTemplates(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim()
        : "";

    const filter = category
      ? { category: { $regex: `^${escapeRegex(category)}$`, $options: "i" } }
      : {};

    const templates = await ReadmeTemplate.find(filter)
      .select("templateId name description category")
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error("Failed to list README templates:", error);

    res.status(500).json({
      success: false,
      message: "README şablonları alınamadı.",
    });
  }
}

export async function getReadmeTemplate(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const template = await ReadmeTemplate.findOne({
      templateId: req.params.id,
    }).lean();

    if (!template) {
      res.status(404).json({
        success: false,
        message: "README şablonu bulunamadı.",
      });
      return;
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Failed to get README template:", error);

    res.status(500).json({
      success: false,
      message: "README şablonu alınamadı.",
    });
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
