<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1KkWQbyK5fBbXFemYsVzkksAmhaJdmR_Z

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VisuDraft: Sketch-to-Flow

🎨 **Transform hand-drawn UI sketches into production-ready interactive prototypes powered by Gemini 3 Vision API**

[![Made for Gemini 3 Hackathon](https://img.shields.io/badge/Gemini%203-Hackathon-4285f4?style=flat-square&logo=google)](https://ai.studio)
[![License](https://img.shields.io/badge/license-Hackathon-blue?style=flat-square)](LICENSE)

---

## 🚀 What is VisuDraft?

VisuDraft converts your hand-drawn UI sketches and storyboards into **fully functional, multi-screen interactive prototypes** with working navigation. Simply upload a sketch, and watch AI transform it into deployable HTML/CSS code in seconds.

### ✨ Key Features

- 🎯 **Multi-Screen Detection** - Automatically identifies multiple screens and navigation flows
- 🔄 **Smart Navigation** - Detects arrows and implements working screen transitions
- 🤖 **AI-Powered QA** - Built-in accessibility and functional testing
- 🚀 **One-Click Deploy** - Direct deployment to GitHub Pages
- ♿ **Accessibility First** - Generates semantic, accessible HTML
- 🎨 **Tailwind Styling** - Beautiful, responsive designs out of the box

---

## 📚 Documentation

### Quick Links

- **[📖 Full Documentation](./DOCUMENTATION.md)** - Complete guide covering all features, APIs, and workflows
- **[⚡ Quick Start Guide](./QUICKSTART.md)** - Get up and running in 5 minutes
- **[🔌 API Reference](./API_REFERENCE.md)** - Detailed technical API documentation

---

## 🏃 Quick Start

### Prerequisites

- Node.js (v16+)
- Gemini API Key ([Get one free](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/visudraft-sketch-to-flow.git
cd visudraft-sketch-to-flow

# Install dependencies
npm install

# Configure API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start development server
npm run dev
```

Open http://localhost:5173 and start creating!

**Need help?** Check out the [Quick Start Guide](./QUICKSTART.md) for detailed instructions.

---

## 🎯 How It Works

### 1. Draw Your Sketch
Create a hand-drawn UI sketch with multiple screens and arrows showing navigation flow.

### 2. Upload & Generate
Upload your sketch and click "Generate Interactive App" - Gemini Vision analyzes your drawing in seconds.

### 3. Preview & Test
Interact with your live prototype immediately - all buttons and navigation work!

### 4. Deploy to Web
One-click deployment to GitHub Pages makes your prototype shareable instantly.

### 5. Automated QA
Run comprehensive accessibility and functional audits with auto-fix capabilities.

---

## 🛠 Technology Stack

- **Frontend:** React 19.2.3 + TypeScript 5.8.2
- **Build Tool:** Vite 6.2.0
- **AI Engine:** Google Gemini 3 Pro Preview
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages

---

## 📱 What Can You Build?

✅ Login/Sign-up flows
✅ E-commerce shopping experiences
✅ Dashboard layouts
✅ Multi-step form wizards
✅ Mobile app prototypes
✅ Landing pages
✅ Admin panels
✅ SaaS application mockups

---

## 🎓 Example Workflow

```bash
# 1. Draw a sketch with 2-3 screens and arrows
# 2. Upload the image (drag & drop)
# 3. Click "Generate Interactive App"
# 4. Test in live preview
# 5. Deploy to GitHub Pages
# 6. Share your live prototype!
```

**Time to first prototype: ~5 minutes** ⚡

---

## 📖 Learn More

### Documentation Structure

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Comprehensive documentation including:
  - Complete feature overview
  - Architecture & data flow
  - Installation & setup
  - Usage guide
  - Deployment instructions
  - Advanced features
  - Troubleshooting
  - Best practices

- **[QUICKSTART.md](./QUICKSTART.md)** - Fast-track guide including:
  - 3-step setup process
  - First prototype in 5 minutes
  - Common workflows
  - Pro tips & tricks
  - Quick troubleshooting

- **[API_REFERENCE.md](./API_REFERENCE.md)** - Technical reference including:
  - Gemini Service API
  - GitHub Service API
  - Type definitions
  - Remote Audit Agent protocol
  - Code examples

---

## 🚢 Deployment

### Local Development

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

### GitHub Pages (via UI)

1. Click the **Deploy** tab in the app
2. Connect your GitHub account
3. Enter repository name
4. Click **Deploy to GitHub Pages**
5. Your site is live in 30 seconds!

**Detailed deployment guide:** See [DOCUMENTATION.md](./DOCUMENTATION.md#deployment)

---

## 🔬 Advanced Features

### Remote Audit Agent

Every generated HTML includes an embedded testing agent that:
- Enables automated interaction testing
- Highlights elements during tests
- Reports element coordinates
- Provides visual feedback

**Learn more:** [API Reference - Remote Audit Agent](./API_REFERENCE.md#remote-audit-agent-protocol)

### Multi-Screen Navigation

Automatically implements:
- Screen detection and separation
- Navigation button creation
- Show/hide logic
- State preservation

**Learn more:** [Documentation - Advanced Features](./DOCUMENTATION.md#advanced-features)

---

## 🎨 Sketch Guidelines

For best results:
- ✅ Draw screens in clear boxes
- ✅ Use arrows (→) for navigation
- ✅ Label all buttons and links
- ✅ Include form fields with labels
- ✅ Use high contrast (black on white)
- ✅ Keep it simple (2-4 screens per image)

**Detailed guidelines:** [Quick Start - Example Sketch Format](./QUICKSTART.md#example-sketch-format)

---

## 🐛 Troubleshooting

**Common issues and solutions:**

| Issue | Solution |
|-------|----------|
| API Key Invalid | Verify key in `.env.local` and restart server |
| Generation Failed | Check internet connection, try simpler sketch |
| Deploy Failed | Verify GitHub token has `repo` permissions |
| Code Doesn't Work | Run QA Audit and use Auto-Fix |

**Full troubleshooting guide:** [DOCUMENTATION.md - Troubleshooting](./DOCUMENTATION.md#troubleshooting)

---

## 🤝 Contributing

Contributions are welcome! Please check the [DOCUMENTATION.md](./DOCUMENTATION.md#contributing) for guidelines.

---

## 📄 License

This project is part of the Gemini 3 Hackathon.

---

## 🙏 Acknowledgments

- **Google Gemini Team** - For the powerful Vision API
- **GitHub** - For free hosting via GitHub Pages
- **Tailwind CSS** - For the utility-first framework
- **Font Awesome** - For beautiful icons

---

## 🌟 Project Links

- **AI Studio App:** https://ai.studio/apps/drive/1KkWQbyK5fBbXFemYsVzkksAmhaJdmR_Z
- **Documentation:** [View Docs](./DOCUMENTATION.md)
- **Quick Start:** [Get Started](./QUICKSTART.md)
- **API Reference:** [API Docs](./API_REFERENCE.md)

---

<div align="center">

**Built with ❤️ for the Gemini 3 Hackathon**

*Transform your sketches into reality with the power of AI!*

[Get Started](./QUICKSTART.md) • [Documentation](./DOCUMENTATION.md) • [API Reference](./API_REFERENCE.md)

</div>
