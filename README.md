# ✦ Crystal AI

**Crystal AI** is a stunning, premium single-page AI chat application featuring a dark glassmorphism design. It leverages the blazing-fast **Groq API** and the powerful **Llama 3.3 (70B)** model to provide intelligent, real-time responses. Built entirely with Vanilla HTML, CSS, and JavaScript—no build steps or complex frameworks required.

---

## ✨ Features

- **Premium Glassmorphism UI:** A sleek, dark-themed interface with frosted glass effects, subtle hover interactions, and animated background orbs.
- **Llama 3.3 via Groq:** Ultra-fast, highly capable AI responses using the `llama-3.3-70b-versatile` model.
- **Authentication Flow:** Includes a beautifully designed `login.html` demo page that simulates authentication and protects the main chat interface.
- **Dynamic Loading Animations:** A custom "running light" gradient indicator and pulsing Crystal logo display while responses are being generated.
- **Persistent Chat History:** Conversations are automatically saved to your browser's `localStorage` and can be accessed or cleared from the collapsible sidebar.
- **Rich Markdown Rendering:** Seamlessly renders bold text, italics, headers, lists, and blockquotes natively without heavy external libraries. 
- **Code Block Support:** Code snippets are styled beautifully with a dark monospace block and include a handy one-click "Copy" button.
- **Export Conversations:** Instantly download any of your active chat sessions as a formatted Markdown (`.md`) file.
- **Fully Responsive:** Carefully crafted to work perfectly across desktop, tablet, and mobile devices.
- **Profile & Actions:** Sleek top navigation bar featuring model badges, a user profile icon, and quick-action buttons.

---

## 🚀 Quick Setup

Crystal AI is built with vanilla web technologies, making it incredibly easy to run.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/crystal-ai.git
cd crystal-ai
```

### 2. Configure the API Key
The application currently looks for a Groq API key in your `script.js` file. To set it up with your own key:
1. Open `script.js` in your code editor.
2. Locate the `callGemini()` function (the function handles the API logic).
3. Replace the fallback string with your actual API key:
```javascript
const API_KEY = localStorage.getItem('crystal_api_key') || "YOUR_GROQ_API_KEY_HERE";
```
*Get your free API key from the [GroqCloud Console](https://console.groq.com/).*

### 3. Run the App
Since the application uses standard JavaScript `fetch` calls, it is highly recommended to run it through a local web server to avoid browser CORS restrictions.
- **Using VS Code:** Install the "Live Server" extension, right-click `login.html` or `index.html`, and select "Open with Live Server".
- **Using Python:**
  Open your terminal, navigate to the project directory, and run:
  ```bash
  python3 -m http.server 8080
  ```
  Then open `http://localhost:8080/login.html` in your browser.

---

## 🛠️ Built With

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic structure, accessibility, and inline SVG icons |
| **CSS3** | Glassmorphism design system, CSS variables, keyframe animations |
| **Vanilla JS** | Application logic, API integration, DOM manipulation, custom Markdown parser |
| **Groq API** | Extremely low-latency AI inference |
| **Llama 3.3 70B**| State-of-the-art open-source Large Language Model |
| **localStorage** | Client-side persistence for chat history and authentication state |

---

## 💡 How to Use
1. **Sign In:** Open the app and log in via the `login.html` screen (any email/password will work for this demo).
2. **Chat:** Type a query into the sleek input bar or click one of the suggested prompts to start a new conversation.
3. **Manage History:** Use the left sidebar to switch between past conversations or hit "Clear All History" to wipe your data.
4. **Copy & Export:** Hover over any AI response to copy it to your clipboard, or use the download icon in the top right to export the whole chat as a `.md` file.
5. **Sign Out:** Click the Sign Out button in the bottom left of the sidebar to return to the login screen.

---

## 🤝 Contributing
Pull requests are welcome! If you'd like to add major features (like backend database integration or actual OAuth authentication), please open an issue first to discuss what you would like to change.

---
