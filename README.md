# ✦ Crystal AI — Intelligent Chat Assistant

> A premium AI-powered chat application built with **HTML, CSS & JavaScript**, powered by the **Google Gemini API**. Features a stunning dark theme with animated UI elements, conversation history, markdown rendering, and code highlighting.

![Crystal AI Preview](./preview.png)

---

## 🌟 Features

| Feature | Description |
|---|---|
| 🤖 **Google Gemini API** | Powered by Gemini 2.0 Flash / 1.5 Pro |
| 💬 **Conversation History** | All chats saved to localStorage, resumable anytime |
| 🎨 **Markdown Rendering** | Bold, italic, tables, lists, blockquotes supported |
| 💻 **Code Highlighting** | Syntax-highlighted code blocks via Highlight.js |
| 📋 **Copy to Clipboard** | Copy code blocks or entire AI responses |
| 📤 **Export Chat** | Download conversation as a `.md` Markdown file |
| ✨ **Animated Dark UI** | Glassmorphism, floating logo, smooth transitions |
| ⌨️ **Keyboard Shortcuts** | Power-user shortcuts for fast navigation |
| 📱 **Fully Responsive** | Works on mobile, tablet, and desktop |
| 🔒 **Private & Secure** | API key stored only in your browser's localStorage |

---

## 🚀 Setup & Usage

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/crystal-ai.git
cd crystal-ai
```

### 2. Open the app

Simply open `index.html` in any modern browser — **no build step, no server required.**

```bash
open index.html      # macOS
start index.html     # Windows
xdg-open index.html  # Linux
```

### 3. Add your Gemini API Key

1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Generate a **free** API key
3. In Crystal AI, click the **⚙ Settings** button (bottom-left sidebar)
4. Paste your key → click **Save Settings**
5. Start chatting! 🎉

> ⚠️ Your API key is stored **only in your browser's localStorage** and is never sent anywhere except directly to Google's Gemini API.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/⌘ + N` | Start a new chat |
| `Ctrl/⌘ + /` | Toggle sidebar |
| `Ctrl/⌘ + ,` | Open Settings |
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Escape` | Close modal |

---

## 🧱 Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic structure |
| **CSS3** | Custom dark theme, animations, glassmorphism |
| **Vanilla JavaScript (ES2022)** | App logic, API calls, state management |
| **Google Gemini API** | AI response generation |
| **Marked.js** | Markdown parsing |
| **Highlight.js** | Code syntax highlighting |
| **DOMPurify** | XSS sanitization |
| **localStorage** | Conversation persistence |

---

## 📁 Project Structure

```
crystal-ai/
├── index.html      # App shell, layout, modals
├── style.css       # Complete dark-theme design system
├── script.js       # All app logic (API, history, UI, events)
└── README.md       # This file
```

---

## 🔧 Configuration

You can switch AI models in Settings:

| Model | Speed | Quality |
|---|---|---|
| `gemini-2.0-flash` | ⚡ Fastest | ★★★★ |
| `gemini-1.5-flash` | ⚡ Fast | ★★★★ |
| `gemini-1.5-pro` | 🐢 Slower | ★★★★★ |

You can also set a custom **System Prompt** to give Crystal a specific personality or focus area.

---

## 📸 Demo

> A screen recording of the application in action is included in this repository as `demo.mp4`.

---

## 👤 Author

**Kirthish Shetty**

- GitHub: [@kirthishshetty](https://github.com/kirthishshetty)

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
