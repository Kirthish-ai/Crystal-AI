// ============================================================
//  Crystal AI Chat — script.js
//  Google Gemini 2.0 Flash · Vanilla JS · No build step
// ============================================================

/* ── Constants ─────────────────────────────────────────────── */
const GEMINI_MODEL  = 'gemini-2.0-flash';
const API_BASE      = 'https://generativelanguage.googleapis.com/v1beta/models';
const STORAGE_KEY_API   = 'crystal_api_key';
const STORAGE_KEY_HIST  = 'crystal_history';

/* ── State ──────────────────────────────────────────────────── */
let apiKey          = '';
let sessions        = [];     // [{ id, title, messages:[{role,text,time}] }]
let activeSession   = null;   // current session object
let isStreaming     = false;

/* ── DOM refs ───────────────────────────────────────────────── */
const chatContainer  = document.getElementById('chat-container');
const welcomeScreen  = document.getElementById('welcome-screen');
const userInput      = document.getElementById('user-input');
const btnSend        = document.getElementById('btn-send');
const btnNewChat     = document.getElementById('btn-new-chat');
const btnClearAll    = document.getElementById('btn-clear-all');
const btnSidebarTog  = document.getElementById('btn-sidebar-toggle');
const btnExport      = document.getElementById('btn-export');
const historyList    = document.getElementById('history-list');
const sidebar        = document.getElementById('sidebar');
const apiModal       = document.getElementById('api-key-modal');
const apiKeyInput    = document.getElementById('api-key-input');
const btnSaveKey     = document.getElementById('btn-save-key');
const btnToggleKey   = document.getElementById('btn-toggle-key');
const toast          = document.getElementById('toast');

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
function init() {
  apiKey   = localStorage.getItem(STORAGE_KEY_API) || '';
  sessions = JSON.parse(localStorage.getItem(STORAGE_KEY_HIST) || '[]');

  if (!apiKey) showModal();
  else         closeModal();

  renderHistory();
  bindEvents();
}

/* ══════════════════════════════════════════════════════════════
   EVENTS
══════════════════════════════════════════════════════════════ */
function bindEvents() {
  // Send on button click
  btnSend.addEventListener('click', handleSend);

  // Send on Enter (Shift+Enter = newline)
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
    btnSend.disabled = !userInput.value.trim();
  });

  // New chat
  btnNewChat.addEventListener('click', startNewChat);

  // Clear all
  btnClearAll.addEventListener('click', () => {
    if (!sessions.length) return;
    sessions = [];
    activeSession = null;
    saveSessions();
    renderHistory();
    showWelcome();
    showToast('All history cleared', 'success');
  });

  // Sidebar toggle
  btnSidebarTog.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const expanded = !sidebar.classList.contains('collapsed');
    btnSidebarTog.setAttribute('aria-expanded', String(expanded));
  });

  // Export chat
  btnExport.addEventListener('click', exportChat);

  // Suggestion cards
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      userInput.value = card.dataset.prompt;
      userInput.style.height = 'auto';
      userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
      btnSend.disabled = false;
      userInput.focus();
      handleSend();
    });
  });

  // API Key modal
  btnSaveKey.addEventListener('click', saveApiKey);
  apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveApiKey(); });
  btnToggleKey.addEventListener('click', () => {
    const isPass = apiKeyInput.type === 'password';
    apiKeyInput.type = isPass ? 'text' : 'password';
  });
}

/* ══════════════════════════════════════════════════════════════
   SESSION MANAGEMENT
══════════════════════════════════════════════════════════════ */
function createSession(firstMessage) {
  const session = {
    id: Date.now().toString(),
    title: firstMessage.slice(0, 50) || 'New Chat',
    messages: [],
    created: Date.now()
  };
  sessions.unshift(session);
  activeSession = session;
  saveSessions();
  renderHistory();
  return session;
}

function loadSession(id) {
  const session = sessions.find(s => s.id === id);
  if (!session) return;
  activeSession = session;
  renderHistory();
  renderSessionMessages();
}

function deleteSession(id) {
  sessions = sessions.filter(s => s.id !== id);
  if (activeSession && activeSession.id === id) {
    activeSession = null;
    showWelcome();
  }
  saveSessions();
  renderHistory();
}

function saveSessions() {
  // Keep max 50 sessions
  if (sessions.length > 50) sessions = sessions.slice(0, 50);
  localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(sessions));
}

/* ══════════════════════════════════════════════════════════════
   RENDER HISTORY SIDEBAR
══════════════════════════════════════════════════════════════ */
function renderHistory() {
  historyList.innerHTML = '';
  if (!sessions.length) {
    historyList.innerHTML = '<li style="padding:10px 10px;color:var(--text-3);font-size:12.5px;">No conversations yet</li>';
    return;
  }
  sessions.forEach(session => {
    const li = document.createElement('li');
    li.className = 'history-item' + (activeSession && activeSession.id === session.id ? ' active' : '');
    li.setAttribute('role', 'listitem');
    li.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span class="history-item-label" title="${escHtml(session.title)}">${escHtml(session.title)}</span>
      <button class="btn-del" aria-label="Delete conversation" title="Delete">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
      </button>`;
    li.querySelector('.history-item-label').addEventListener('click', () => loadSession(session.id));
    li.querySelector('.btn-del').addEventListener('click', e => {
      e.stopPropagation();
      deleteSession(session.id);
    });
    historyList.appendChild(li);
  });
}

/* ══════════════════════════════════════════════════════════════
   WELCOME / CLEAR CHAT VIEW
══════════════════════════════════════════════════════════════ */
function showWelcome() {
  chatContainer.innerHTML = '';
  chatContainer.appendChild(welcomeScreen);
  welcomeScreen.style.display = 'flex';
  // Re-bind suggestion cards
  chatContainer.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      userInput.value = card.dataset.prompt;
      userInput.dispatchEvent(new Event('input'));
      handleSend();
    });
  });
}

function startNewChat() {
  activeSession = null;
  chatContainer.innerHTML = '';
  const ws = welcomeScreen.cloneNode(true);
  chatContainer.appendChild(ws);
  ws.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      userInput.value = card.dataset.prompt;
      userInput.dispatchEvent(new Event('input'));
      handleSend();
    });
  });
  renderHistory();
  userInput.value = '';
  userInput.style.height = 'auto';
  btnSend.disabled = true;
  userInput.focus();
}

/* ══════════════════════════════════════════════════════════════
   RENDER SAVED SESSION
══════════════════════════════════════════════════════════════ */
function renderSessionMessages() {
  chatContainer.innerHTML = '';
  if (!activeSession || !activeSession.messages.length) { showWelcome(); return; }
  activeSession.messages.forEach(msg => {
    appendMessage(msg.role, msg.text, msg.time, false);
  });
  scrollToBottom();
}

/* ══════════════════════════════════════════════════════════════
   SEND MESSAGE
══════════════════════════════════════════════════════════════ */
async function handleSend() {
  const text = userInput.value.trim();
  if (!text || isStreaming) return;
  if (!apiKey) { showModal(); return; }

  // Create session on first message
  if (!activeSession) {
    createSession(text);
    chatContainer.innerHTML = '';
  }

  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';
  btnSend.disabled = true;

  // Save & render user message
  const userMsg = { role: 'user', text, time: nowTime() };
  activeSession.messages.push(userMsg);
  saveSessions();
  appendMessage('user', text, userMsg.time, true);
  scrollToBottom();

  // Show typing indicator
  const typingEl = appendTyping();
  scrollToBottom();

  try {
    isStreaming = true;
    const reply = await callGemini(activeSession.messages);
    typingEl.remove();

    const aiMsg = { role: 'ai', text: reply, time: nowTime() };
    activeSession.messages.push(aiMsg);
    saveSessions();
    renderHistory(); // update title if needed
    appendMessage('ai', reply, aiMsg.time, true);
    scrollToBottom();
  } catch (err) {
    typingEl.remove();
    const errText = `⚠️ ${err.message || 'Something went wrong. Please try again.'}`;
    appendMessage('ai', errText, nowTime(), true);
    showToast(err.message || 'Error contacting Gemini', 'error');
  } finally {
    isStreaming = false;
    btnSend.disabled = false;
    userInput.focus();
  }
}

/* ══════════════════════════════════════════════════════════════
   GEMINI API CALL
══════════════════════════════════════════════════════════════ */
async function callGemini(messages) {
  // Build contents array (Gemini format)
  const contents = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  // System instruction
  const systemInstruction = {
    parts: [{
      text: `You are Crystal, a brilliant, friendly, and articulate AI assistant. 
You provide clear, accurate, and well-structured answers. 
Format your responses using Markdown when helpful — use code blocks for code, 
bullet points for lists, and headings for long structured content.
Be concise but comprehensive. Always be helpful and positive.`
    }]
  };

  const url = `${API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: systemInstruction,
      contents,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${res.status}`;
    if (res.status === 400 && msg.includes('API key')) throw new Error('Invalid API key. Please update it.');
    if (res.status === 429) throw new Error('Rate limit reached. Please wait a moment.');
    throw new Error(msg);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  if (!candidate) throw new Error('No response from Gemini. Try again.');

  // Handle blocked/finish reasons
  if (candidate.finishReason === 'SAFETY') throw new Error('Response blocked due to safety filters.');

  return candidate.content?.parts?.map(p => p.text).join('') || 'No response text.';
}

/* ══════════════════════════════════════════════════════════════
   APPEND MESSAGE TO DOM
══════════════════════════════════════════════════════════════ */
function appendMessage(role, text, time, animate) {
  const isAI = role === 'ai';
  const div  = document.createElement('div');
  div.className = 'message';

  div.innerHTML = `
    <div class="avatar ${isAI ? 'avatar-ai' : 'avatar-user'}" aria-hidden="true">
      ${isAI ? '✦' : '👤'}
    </div>
    <div class="message-content">
      <div class="message-meta">
        <span class="message-name">${isAI ? 'Crystal' : 'You'}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="bubble ${isAI ? 'bubble-ai' : 'bubble-user'}">
        ${isAI ? renderMarkdown(text) : escHtml(text).replace(/\n/g, '<br>')}
      </div>
      ${isAI ? `
      <div class="message-actions">
        <button class="btn-copy" aria-label="Copy response">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
      </div>` : ''}
    </div>`;

  // Copy button
  const btnCopy = div.querySelector('.btn-copy');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        btnCopy.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        showToast('Copied to clipboard', 'success');
        setTimeout(() => {
          btnCopy.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
        }, 2000);
      });
    });
  }

  // Code copy buttons
  div.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.code-block').querySelector('pre').textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = '✓ Copied';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      });
    });
  });

  if (animate) div.style.animation = 'fadeUp .35s ease';
  chatContainer.appendChild(div);
  return div;
}

/* ══════════════════════════════════════════════════════════════
   TYPING INDICATOR
══════════════════════════════════════════════════════════════ */
function appendTyping() {
  const div = document.createElement('div');
  div.className = 'message';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="avatar avatar-ai" aria-hidden="true">✦</div>
    <div class="message-content">
      <div class="message-meta">
        <span class="message-name">Crystal</span>
        <span class="message-time">Thinking…</span>
      </div>
      <div class="typing-indicator" role="status" aria-label="Crystal is thinking">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>`;
  chatContainer.appendChild(div);
  return div;
}

/* ══════════════════════════════════════════════════════════════
   MARKDOWN RENDERER (lightweight, no deps)
══════════════════════════════════════════════════════════════ */
function renderMarkdown(text) {
  // Escape HTML first (except inside code blocks)
  const lines = text.split('\n');
  let html = '';
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect fenced code blocks
    if (/^```(\w*)/.test(line)) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.match(/^```(\w*)/)[1] || 'code';
        codeLines = [];
      } else {
        // Close code block
        inCodeBlock = false;
        const codeHtml = escHtml(codeLines.join('\n'));
        html += `<div class="code-block">
          <div class="code-block-header">
            <span class="code-block-lang">${escHtml(codeLang)}</span>
            <button class="btn-copy-code">Copy</button>
          </div>
          <pre><code>${codeHtml}</code></pre>
        </div>`;
        codeLang = ''; codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) { codeLines.push(line); continue; }

    // Inline formatting
    let l = escHtml(line);

    // Headings
    if (/^######\s/.test(l))      { html += `<h6>${l.slice(7)}</h6>`; continue; }
    if (/^#####\s/.test(l))       { html += `<h5>${l.slice(6)}</h5>`; continue; }
    if (/^####\s/.test(l))        { html += `<h4>${l.slice(5)}</h4>`; continue; }
    if (/^###\s/.test(l))         { html += `<h3>${l.slice(4)}</h3>`; continue; }
    if (/^##\s/.test(l))          { html += `<h2>${l.slice(3)}</h2>`; continue; }
    if (/^#\s/.test(l))           { html += `<h1>${l.slice(2)}</h1>`; continue; }

    // Horizontal rule
    if (/^---+$/.test(l.trim()))  { html += '<hr>'; continue; }

    // Blockquote
    if (/^&gt;\s/.test(l))        { html += `<blockquote>${applyInline(l.slice(5))}</blockquote>`; continue; }

    // Unordered list
    if (/^[*\-]\s/.test(l))       { html += `<ul><li>${applyInline(l.slice(2))}</li></ul>`; continue; }

    // Ordered list
    if (/^\d+\.\s/.test(l))       { html += `<ol><li>${applyInline(l.replace(/^\d+\.\s/, ''))}</li></ol>`; continue; }

    // Empty line → paragraph break
    if (l.trim() === '')          { html += '<br>'; continue; }

    // Regular paragraph
    html += `<p>${applyInline(l)}</p>`;
  }

  // Merge consecutive ul/ol tags
  html = html.replace(/<\/ul>\s*<ul>/g, '').replace(/<\/ol>\s*<ol>/g, '');

  return html;
}

function applyInline(text) {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

/* ══════════════════════════════════════════════════════════════
   EXPORT CHAT
══════════════════════════════════════════════════════════════ */
function exportChat() {
  if (!activeSession || !activeSession.messages.length) {
    showToast('No conversation to export', 'error'); return;
  }
  let content = `# Crystal AI Chat — ${activeSession.title}\nExported: ${new Date().toLocaleString()}\n\n`;
  activeSession.messages.forEach(m => {
    content += `**${m.role === 'user' ? 'You' : 'Crystal'}** (${m.time}):\n${m.text}\n\n---\n\n`;
  });
  const blob = new Blob([content], { type: 'text/markdown' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `crystal-chat-${Date.now()}.md`;
  a.click();
  showToast('Chat exported as Markdown', 'success');
}

/* ══════════════════════════════════════════════════════════════
   API KEY MODAL
══════════════════════════════════════════════════════════════ */
function showModal() {
  apiModal.classList.remove('hidden');
  setTimeout(() => apiKeyInput.focus(), 300);
}
function closeModal() {
  apiModal.classList.add('hidden');
}
function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key || !key.startsWith('AIza')) {
    showToast('Please enter a valid Gemini API key (starts with AIza…)', 'error'); return;
  }
  apiKey = key;
  localStorage.setItem(STORAGE_KEY_API, apiKey);
  closeModal();
  showToast('API key saved! Welcome to Crystal ✦', 'success');
  userInput.focus();
}

/* ══════════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════════ */
function scrollToBottom() {
  const section = document.querySelector('.chat-section');
  section.scrollTo({ top: section.scrollHeight, behavior: 'smooth' });
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let toastTimer;
function showToast(message, type = '') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className   = `toast show ${type}`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ── Boot ── */
init();
