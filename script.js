/* ============================================================
   Crystal AI — script.js
   Powered by Google Gemini API
   ============================================================ */

'use strict';

// ── Constants ──────────────────────────────────────────────
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const STORAGE_KEY_SETTINGS = 'crystal_settings';
const STORAGE_KEY_HISTORY  = 'crystal_history';
const MAX_HISTORY_ITEMS    = 50;

// ── State ──────────────────────────────────────────────────
let settings = {
  apiKey:       '',
  model:        'gemini-2.0-flash',
  systemPrompt: 'You are Crystal, a highly intelligent, friendly AI assistant. Provide clear, helpful, and accurate responses. Format your answers with markdown when it improves readability.'
};

let conversationHistory = [];   // all saved chats  [{id, title, messages, ts}]
let activeConvId        = null; // currently-viewed chat id
let activeMsgs          = [];   // messages in current chat
let isGenerating        = false;

// ── DOM refs ───────────────────────────────────────────────
const sidebar            = document.getElementById('sidebar');
const sidebarToggle      = document.getElementById('sidebarToggle');
const mobileSidebarToggle= document.getElementById('mobileSidebarToggle');
const newChatBtn         = document.getElementById('newChatBtn');
const historyList        = document.getElementById('historyList');
const clearHistoryBtn    = document.getElementById('clearHistoryBtn');
const settingsBtn        = document.getElementById('settingsBtn');
const exportBtn          = document.getElementById('exportBtn');

const chatArea           = document.getElementById('chatArea');
const welcomeScreen      = document.getElementById('welcomeScreen');
const messagesContainer  = document.getElementById('messagesContainer');

const userInput          = document.getElementById('userInput');
const sendBtn            = document.getElementById('sendBtn');
const charCount          = document.getElementById('charCount');

const settingsModal      = document.getElementById('settingsModal');
const settingsClose      = document.getElementById('settingsClose');
const settingsCancelBtn  = document.getElementById('settingsCancelBtn');
const saveSettingsBtn    = document.getElementById('saveSettingsBtn');
const apiKeyInput        = document.getElementById('apiKeyInput');
const toggleApiKey       = document.getElementById('toggleApiKey');
const modelSelect        = document.getElementById('modelSelect');
const systemPromptInput  = document.getElementById('systemPromptInput');

const toast              = document.getElementById('toast');

// ── Init ───────────────────────────────────────────────────
function init() {
  loadSettings();
  loadHistory();
  renderHistoryList();
  setupEventListeners();
  autoResizeTextarea();

  // Configure marked
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  });

  // Show prompt if no API key
  if (!settings.apiKey) {
    setTimeout(() => openSettings(), 600);
  }
}

// ── Settings ───────────────────────────────────────────────
function loadSettings() {
  const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (stored) {
    try { settings = { ...settings, ...JSON.parse(stored) }; } catch {}
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

// ── History ────────────────────────────────────────────────
function loadHistory() {
  const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
  if (stored) {
    try { conversationHistory = JSON.parse(stored); } catch {}
  }
}

function saveHistory() {
  // Keep only last MAX_HISTORY_ITEMS
  if (conversationHistory.length > MAX_HISTORY_ITEMS) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY_ITEMS);
  }
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(conversationHistory));
}

function renderHistoryList() {
  historyList.innerHTML = '';
  const sorted = [...conversationHistory].reverse();
  if (sorted.length === 0) {
    historyList.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:12px 10px;">No conversations yet.</p>';
    return;
  }
  sorted.forEach(conv => {
    const item = document.createElement('div');
    item.className = 'history-item' + (conv.id === activeConvId ? ' active' : '');
    item.dataset.id = conv.id;
    item.innerHTML = `
      <span class="history-item-icon">💬</span>
      <span class="history-item-text" title="${escapeHtml(conv.title)}">${escapeHtml(conv.title)}</span>
      <button class="history-item-del" data-id="${conv.id}" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
    item.addEventListener('click', e => {
      if (e.target.closest('.history-item-del')) return;
      loadConversation(conv.id);
    });
    item.querySelector('.history-item-del').addEventListener('click', e => {
      e.stopPropagation();
      deleteConversation(conv.id);
    });
    historyList.appendChild(item);
  });
}

function createNewConversation() {
  activeConvId = genId();
  activeMsgs   = [];
  showWelcome(true);
  renderHistoryList();
}

function loadConversation(id) {
  const conv = conversationHistory.find(c => c.id === id);
  if (!conv) return;
  activeConvId = id;
  activeMsgs   = conv.messages || [];
  showWelcome(false);
  messagesContainer.innerHTML = '';
  activeMsgs.forEach(msg => renderMessage(msg.role, msg.content, false));
  scrollToBottom();
  renderHistoryList();
  closeMobileSidebar();
}

function deleteConversation(id) {
  conversationHistory = conversationHistory.filter(c => c.id !== id);
  saveHistory();
  if (activeConvId === id) createNewConversation();
  else renderHistoryList();
  showToast('Conversation deleted');
}

function saveCurrentConversation() {
  if (!activeConvId || activeMsgs.length === 0) return;
  const existing = conversationHistory.find(c => c.id === activeConvId);
  const title = deriveTitle(activeMsgs);
  if (existing) {
    existing.messages = activeMsgs;
    existing.title    = title;
    existing.ts       = Date.now();
  } else {
    conversationHistory.push({ id: activeConvId, title, messages: activeMsgs, ts: Date.now() });
  }
  saveHistory();
  renderHistoryList();
}

function deriveTitle(msgs) {
  const first = msgs.find(m => m.role === 'user');
  if (!first) return 'New Chat';
  return first.content.slice(0, 52) + (first.content.length > 52 ? '…' : '');
}

// ── UI helpers ─────────────────────────────────────────────
function showWelcome(show) {
  welcomeScreen.style.display       = show ? 'flex' : 'none';
  messagesContainer.style.display   = show ? 'none' : 'flex';
}

function scrollToBottom(smooth = true) {
  chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
}

function showToast(msg, duration = 2500) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function openSettings() {
  apiKeyInput.value        = settings.apiKey;
  modelSelect.value        = settings.model;
  systemPromptInput.value  = settings.systemPrompt;
  settingsModal.classList.add('open');
  setTimeout(() => apiKeyInput.focus(), 100);
}

function closeSettings() {
  settingsModal.classList.remove('open');
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
}

function closeMobileSidebar() {
  sidebar.classList.remove('mobile-open');
}

// ── Render a message ───────────────────────────────────────
function renderMessage(role, content, animate = true) {
  const row = document.createElement('div');
  row.className = `message-row ${role === 'user' ? 'user-row' : 'ai-row'}`;
  if (!animate) row.style.animation = 'none';

  if (role === 'user') {
    row.innerHTML = `<div class="user-bubble">${escapeHtml(content)}</div>`;
  } else {
    const html = renderMarkdown(content);
    row.innerHTML = `
      <div class="ai-message-wrap">
        <div class="ai-avatar">✦</div>
        <div>
          <div class="ai-bubble">${html}</div>
          <div class="msg-actions">
            <button class="msg-action-btn copy-resp-btn" title="Copy response">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg> Copy
            </button>
          </div>
        </div>
      </div>`;
    row.querySelector('.copy-resp-btn').addEventListener('click', () => {
      copyToClipboard(content);
      showToast('Copied to clipboard!');
    });
  }

  messagesContainer.appendChild(row);
  initCodeCopyBtns(row);
  return row;
}

function renderMarkdown(content) {
  // Parse markdown
  let html = marked.parse(content);
  // Sanitize
  html = DOMPurify.sanitize(html);
  // Wrap code blocks with header
  html = html.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, (_, lang, code) => {
    return `<pre><div class="code-header"><span class="code-lang">${lang}</span><button class="copy-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button></div><code class="language-${lang}">${code}</code></pre>`;
  });
  html = html.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
    return `<pre><div class="code-header"><span class="code-lang">code</span><button class="copy-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button></div><code>${code}</code></pre>`;
  });
  return html;
}

function initCodeCopyBtns(container) {
  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('pre').querySelector('code').innerText;
      copyToClipboard(code);
      btn.classList.add('copied');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
      }, 2000);
    });
  });
}

// Typing indicator bubble
function addTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'message-row ai-row';
  row.id = 'typingRow';
  row.innerHTML = `
    <div class="ai-message-wrap">
      <div class="ai-avatar">✦</div>
      <div class="ai-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>`;
  messagesContainer.appendChild(row);
  scrollToBottom();
  return row;
}

function removeTypingIndicator() {
  const row = document.getElementById('typingRow');
  if (row) row.remove();
}

// ── Gemini API call ────────────────────────────────────────
async function callGemini(userText) {
  if (!settings.apiKey) {
    openSettings();
    throw new Error('No API key set. Please add your Gemini API key in Settings.');
  }

  // Build contents array: include conversation history for context
  const contents = activeMsgs.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));
  // Add current user message
  contents.push({ role: 'user', parts: [{ text: userText }] });

  const body = {
    contents,
    generationConfig: {
      temperature:     0.8,
      topP:            0.95,
      topK:            40,
      maxOutputTokens: 8192
    }
  };

  // Add system instruction if set
  if (settings.systemPrompt) {
    body.systemInstruction = { parts: [{ text: settings.systemPrompt }] };
  }

  const url = `${GEMINI_BASE}/${settings.model}:generateContent?key=${settings.apiKey}`;

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const errMsg  = errData?.error?.message || `HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  const data = await res.json();

  // Handle safety blocks
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Request blocked: ${data.promptFeedback.blockReason}`);
  }

  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('No response from Gemini.');
  if (candidate.finishReason === 'SAFETY') throw new Error('Response blocked due to safety filters.');

  return candidate.content?.parts?.[0]?.text || '';
}

// ── Send Message ───────────────────────────────────────────
async function sendMessage(text) {
  text = text.trim();
  if (!text || isGenerating) return;

  // First message — create conversation if needed
  if (!activeConvId) {
    activeConvId = genId();
    activeMsgs   = [];
  }

  // Hide welcome, show messages
  showWelcome(false);

  // Render user message
  activeMsgs.push({ role: 'user', content: text });
  renderMessage('user', text);
  scrollToBottom();

  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';
  charCount.textContent = '0';

  // Lock UI
  isGenerating = true;
  sendBtn.disabled = true;

  const typingRow = addTypingIndicator();

  try {
    const aiText = await callGemini(text);
    removeTypingIndicator();

    activeMsgs.push({ role: 'assistant', content: aiText });
    renderMessage('assistant', aiText);
    scrollToBottom();

    // Save to history
    saveCurrentConversation();
  } catch (err) {
    removeTypingIndicator();
    const errRow = document.createElement('div');
    errRow.className = 'message-row ai-row';
    errRow.innerHTML = `
      <div class="ai-message-wrap">
        <div class="ai-avatar" style="background:linear-gradient(135deg,#ef4444,#f97316)">⚠</div>
        <div class="ai-bubble" style="border-color:rgba(239,68,68,0.3);color:#fca5a5;">
          <strong>Error:</strong> ${escapeHtml(err.message)}
        </div>
      </div>`;
    messagesContainer.appendChild(errRow);
    scrollToBottom();
  } finally {
    isGenerating    = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// ── Export ─────────────────────────────────────────────────
function exportConversation() {
  if (activeMsgs.length === 0) { showToast('Nothing to export yet.'); return; }
  const lines = activeMsgs.map(m =>
    `**${m.role === 'user' ? 'You' : 'Crystal'}:**\n${m.content}\n`
  );
  const md = `# Crystal AI — Conversation Export\n_Exported on ${new Date().toLocaleString()}_\n\n---\n\n${lines.join('\n---\n\n')}`;
  const blob = new Blob([md], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `crystal-chat-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Conversation exported!');
}

// ── Event Listeners ────────────────────────────────────────
function setupEventListeners() {
  // Send on button click
  sendBtn.addEventListener('click', () => sendMessage(userInput.value));

  // Send on Enter (Shift+Enter = new line)
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput.value);
    }
  });

  // Auto-resize textarea + char count
  userInput.addEventListener('input', () => {
    autoResizeTextarea();
    charCount.textContent = userInput.value.length;
  });

  // Sidebar toggles
  sidebarToggle.addEventListener('click', toggleSidebar);
  mobileSidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  // New chat
  newChatBtn.addEventListener('click', createNewConversation);

  // Clear history
  clearHistoryBtn.addEventListener('click', () => {
    if (conversationHistory.length === 0) { showToast('No history to clear.'); return; }
    if (confirm('Clear all conversation history? This cannot be undone.')) {
      conversationHistory = [];
      saveHistory();
      createNewConversation();
      showToast('History cleared');
    }
  });

  // Settings
  settingsBtn.addEventListener('click', openSettings);
  settingsClose.addEventListener('click', closeSettings);
  settingsCancelBtn.addEventListener('click', closeSettings);
  settingsModal.addEventListener('click', e => { if (e.target === settingsModal) closeSettings(); });

  // Save settings
  saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) { showToast('Please enter an API key.'); apiKeyInput.focus(); return; }
    settings.apiKey       = key;
    settings.model        = modelSelect.value;
    settings.systemPrompt = systemPromptInput.value.trim() || settings.systemPrompt;
    saveSettings();
    closeSettings();
    showToast('Settings saved!');
    // Update model badge
    document.querySelector('.model-badge').innerHTML =
      `<span class="model-dot"></span>${modelSelect.options[modelSelect.selectedIndex].text.split(' (')[0]}`;
  });

  // Toggle API key visibility
  toggleApiKey.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
  });

  // Export
  exportBtn.addEventListener('click', exportConversation);

  // Suggestion cards
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      userInput.value = prompt;
      charCount.textContent = prompt.length;
      autoResizeTextarea();
      sendMessage(prompt);
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === '/') { e.preventDefault(); toggleSidebar(); }
    if (mod && e.key === 'n') { e.preventDefault(); createNewConversation(); }
    if (mod && e.key === ',') { e.preventDefault(); openSettings(); }
    if (e.key === 'Escape')   { closeSettings(); }
  });
}

// ── Textarea auto-resize ───────────────────────────────────
function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
}

// ── Utilities ──────────────────────────────────────────────
function genId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ── Start ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);