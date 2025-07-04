// ===== ENHANCED CHATBOT JAVASCRIPT =====

// Global Variables
let apiKey = ""
let conversationHistory = []
let isProcessing = false
let currentAIProvider = "mock"
let voiceRecognition = null
let isVoiceActive = false
let chatSessions = []
let currentSessionId = 1
let messageCount = 0
let totalSessions = 1

// Configuration
const CONFIG = {
  temperature: 0.7,
  maxTokens: 500,
  contextMemory: true,
  voiceEnabled: true,
  autoSave: true,
}

// AI Providers Configuration
const AI_PROVIDERS = {
  mock: {
    name: "Smart Mock AI",
    free: true,
    icon: "🤖",
  },
  groq: {
    name: "Groq Llama",
    free: true,
    icon: "⚡",
    keyPrefix: "gsk_",
  },
  openai: {
    name: "OpenAI GPT",
    free: false,
    icon: "🧠",
    keyPrefix: "sk-",
  },
  huggingface: {
    name: "Hugging Face",
    free: true,
    icon: "🤗",
    keyPrefix: "hf_",
  },
}

// Enhanced Mock Responses
const SMART_RESPONSES = {
  greetings: [
    "Hello! I'm CryptoVision AI, your intelligent cryptocurrency assistant. How can I help you navigate the crypto world today?",
    "Hi there! Ready to explore cryptocurrency together? I can help with trading, analysis, or general crypto questions.",
    "Welcome to CryptoVision AI! I'm here to assist with all your cryptocurrency needs. What would you like to know?",
  ],

  crypto: [
    "Cryptocurrency is a fascinating and rapidly evolving space. Are you interested in learning about specific coins, trading strategies, or blockchain technology?",
    "The crypto market operates 24/7 and can be quite volatile. What aspect of cryptocurrency interests you most?",
    "From Bitcoin to DeFi, there's a lot to explore in crypto. What specific area would you like to dive into?",
  ],

  trading: [
    "Crypto trading requires careful analysis and risk management. What's your experience level, and what type of trading interests you?",
    "Successful trading combines technical analysis, fundamental research, and proper risk management. Would you like tips on any of these areas?",
    "Remember: Never invest more than you can afford to lose. What trading concepts would you like to learn about?",
  ],

  price: [
    "I can't provide real-time prices, but I recommend checking CoinGecko, CoinMarketCap, or your preferred exchange for current data.",
    "Crypto prices are highly volatile and influenced by many factors. Are you looking for analysis on price movements or specific coins?",
    "Price predictions are speculative. I'd recommend focusing on understanding the technology and fundamentals. What coin interests you?",
  ],
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Enhanced ChatBot initializing...")

  try {
    // Show loading screen
    showLoadingScreen()

    // Initialize components
    await initializeApp()

    // Hide loading screen
    hideLoadingScreen()

    console.log("Enhanced ChatBot initialized successfully!")
  } catch (error) {
    console.error("Initialization error:", error)
    hideLoadingScreen()
    showToast("Failed to initialize chatbot", "error")
  }
})

async function initializeApp() {
  // Load saved settings
  loadSettings()

  // Setup event listeners
  setupEventListeners()

  // Initialize voice recognition
  initializeVoiceRecognition()

  // Setup keyboard shortcuts
  setupKeyboardShortcuts()

  // Load chat history
  loadChatHistory()

  // Update UI
  updateConnectionStatus()
  updateStats()

  // Focus input
  const messageInput = document.getElementById("messageInput")
  if (messageInput) {
    messageInput.focus()
  }
}

function showLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen")
  if (loadingScreen) {
    loadingScreen.style.display = "flex"
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen")
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.opacity = "0"
      setTimeout(() => {
        loadingScreen.style.display = "none"
      }, 500)
    }, 1000)
  }
}

// ===== SETTINGS MANAGEMENT =====
function loadSettings() {
  try {
    // Load API key and provider
    const savedApiKey = localStorage.getItem("cryptovision_api_key")
    const savedProvider = localStorage.getItem("cryptovision_provider") || "mock"
    const savedConfig = localStorage.getItem("cryptovision_config")

    if (savedApiKey) {
      apiKey = savedApiKey
      currentAIProvider = detectAPIKeyProvider(savedApiKey)
    } else {
      currentAIProvider = savedProvider
    }

    if (savedConfig) {
      Object.assign(CONFIG, JSON.parse(savedConfig))
    }

    // Load theme
    const savedTheme = localStorage.getItem("cryptovision_theme") || "dark"
    document.body.setAttribute("data-theme", savedTheme)
    updateThemeIcon(savedTheme)

    console.log("Settings loaded successfully")
  } catch (error) {
    console.error("Error loading settings:", error)
  }
}

function saveSettings() {
  try {
    if (apiKey) {
      localStorage.setItem("cryptovision_api_key", apiKey)
    } else {
      localStorage.removeItem("cryptovision_api_key")
    }

    localStorage.setItem("cryptovision_provider", currentAIProvider)
    localStorage.setItem("cryptovision_config", JSON.stringify(CONFIG))

    console.log("Settings saved successfully")
  } catch (error) {
    console.error("Error saving settings:", error)
  }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Modal close events
  setupModalEvents()

  // Provider selection
  setupProviderSelection()

  // Input events
  setupInputEvents()

  // File upload
  setupFileUpload()

  // Configuration sliders
  setupConfigurationControls()
}

function setupModalEvents() {
  const configModal = document.getElementById("configModal")
  if (configModal) {
    configModal.addEventListener("click", (e) => {
      if (e.target === configModal) {
        closeConfig()
      }
    })
  }

  // Close modals on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeConfig()
      hideAllToasts()
    }
  })
}

function setupProviderSelection() {
  const providerCards = document.querySelectorAll(".provider-card")
  providerCards.forEach((card) => {
    card.addEventListener("click", () => {
      // Remove active class from all cards
      providerCards.forEach((c) => c.classList.remove("selected"))

      // Add active class to clicked card
      card.classList.add("selected")

      // Update current provider
      const provider = card.dataset.provider
      if (provider) {
        currentAIProvider = provider
        updateAIModelInfo()
      }
    })
  })
}

function setupInputEvents() {
  const messageInput = document.getElementById("messageInput")
  if (messageInput) {
    messageInput.addEventListener("input", handleInputChange)
    messageInput.addEventListener("keydown", handleKeyDown)
  }
}

function setupFileUpload() {
  const fileInput = document.getElementById("fileInput")
  const fileUploadArea = document.getElementById("fileUploadArea")

  if (fileInput && fileUploadArea) {
    fileUploadArea.addEventListener("click", () => fileInput.click())
    fileUploadArea.addEventListener("dragover", handleDragOver)
    fileUploadArea.addEventListener("drop", handleFileDrop)
    fileInput.addEventListener("change", handleFileSelect)
  }
}

function setupConfigurationControls() {
  // Temperature slider
  const tempSlider = document.getElementById("temperatureSlider")
  const tempValue = document.getElementById("temperatureValue")

  if (tempSlider && tempValue) {
    tempSlider.addEventListener("input", (e) => {
      const value = Number.parseFloat(e.target.value)
      CONFIG.temperature = value
      tempValue.textContent = value.toFixed(1)
    })
  }

  // Max tokens select
  const maxTokensSelect = document.getElementById("maxTokensInput")
  if (maxTokensSelect) {
    maxTokensSelect.addEventListener("change", (e) => {
      CONFIG.maxTokens = Number.parseInt(e.target.value)
    })
  }

  // Checkboxes
  const contextMemoryCheck = document.getElementById("contextMemory")
  const voiceEnabledCheck = document.getElementById("voiceEnabled")

  if (contextMemoryCheck) {
    contextMemoryCheck.addEventListener("change", (e) => {
      CONFIG.contextMemory = e.target.checked
    })
  }

  if (voiceEnabledCheck) {
    voiceEnabledCheck.addEventListener("change", (e) => {
      CONFIG.voiceEnabled = e.target.checked
    })
  }
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K: Clear chat
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault()
      clearChat()
    }

    // Ctrl/Cmd + ,: Open settings
    if ((e.ctrlKey || e.metaKey) && e.key === ",") {
      e.preventDefault()
      openConfig()
    }

    // Ctrl/Cmd + Enter: Send message
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      sendMessage()
    }

    // F1: Show shortcuts help
    if (e.key === "F1") {
      e.preventDefault()
      toggleShortcutsHelp()
    }
  })
}

// ===== MESSAGE HANDLING =====
function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

function handleKeyDown(event) {
  const messageInput = event.target

  // Auto-resize textarea
  messageInput.style.height = "auto"
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px"
}

function handleInputChange() {
  const messageInput = document.getElementById("messageInput")
  const charCounter = document.getElementById("charCounter")
  const sendButton = document.getElementById("sendButton")

  if (messageInput && charCounter) {
    const length = messageInput.value.length
    charCounter.textContent = `${length}/2000`

    // Update send button state
    if (sendButton) {
      sendButton.disabled = length === 0 || isProcessing
    }

    // Color coding for character limit
    if (length > 1800) {
      charCounter.style.color = "var(--error-color)"
    } else if (length > 1500) {
      charCounter.style.color = "var(--warning-color)"
    } else {
      charCounter.style.color = "var(--text-muted)"
    }
  }
}

async function sendMessage() {
  if (isProcessing) return

  const messageInput = document.getElementById("messageInput")
  const sendButton = document.getElementById("sendButton")

  if (!messageInput || !sendButton) return

  const message = messageInput.value.trim()
  if (!message) return

  // Prevent multiple sends
  isProcessing = true
  messageInput.value = ""
  messageInput.style.height = "auto"
  sendButton.disabled = true
  sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'

  try {
    // Add user message
    addMessage(message, "user")
    showTypingIndicator()

    // Add to conversation history
    if (CONFIG.contextMemory) {
      conversationHistory.push({ role: "user", content: message })

      // Keep only last 10 messages for context
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20)
      }
    }

    // Get AI response
    let response
    const startTime = Date.now()

    try {
      response = await getAIResponse(message)
    } catch (error) {
      console.warn("AI API failed, using smart mock response:", error)
      response = getSmartMockResponse(message)
      showToast("Using offline mode due to API error", "info")
    }

    const responseTime = ((Date.now() - startTime) / 1000).toFixed(1)

    hideTypingIndicator()
    addMessage(response, "bot")

    // Add to conversation history
    if (CONFIG.contextMemory) {
      conversationHistory.push({ role: "assistant", content: response })
    }

    // Update stats
    messageCount++
    updateStats()

    // Auto-save chat
    if (CONFIG.autoSave) {
      saveChatHistory()
    }

    console.log(`Response generated in ${responseTime}s`)
  } catch (error) {
    console.error("Error sending message:", error)
    hideTypingIndicator()
    const fallbackResponse = getSmartMockResponse(message)
    addMessage(fallbackResponse, "bot")
    showToast("Message failed to send. Using offline mode.", "error")
  } finally {
    // Reset UI
    isProcessing = false
    sendButton.disabled = false
    sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>'
    messageInput.focus()
    updateCharCounter()
  }
}

function sendQuickMessage(message) {
  const messageInput = document.getElementById("messageInput")
  if (messageInput) {
    messageInput.value = message
    sendMessage()
  }
}

// ===== AI RESPONSE GENERATION =====
async function getAIResponse(message) {
  switch (currentAIProvider) {
    case "openai":
      return await getOpenAIResponse(message)
    case "groq":
      return await getGroqResponse(message)
    case "huggingface":
      return await getHuggingFaceResponse(message)
    case "mock":
    default:
      return getSmartMockResponse(message)
  }
}

async function getOpenAIResponse(message) {
  if (!apiKey) {
    throw new Error("OpenAI API key not configured")
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are CryptoVision AI, a helpful cryptocurrency and trading assistant. Provide accurate, helpful, and educational responses about cryptocurrency, blockchain, trading, and related topics.",
        },
        ...conversationHistory.slice(-10),
        { role: "user", content: message },
      ],
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error?.message || response.statusText

    if (response.status === 429) {
      throw new Error("OpenAI quota exceeded. Consider using Groq (free) or upgrade your plan.")
    } else if (response.status === 401) {
      throw new Error("Invalid OpenAI API key. Please check your configuration.")
    } else {
      throw new Error(`OpenAI API error: ${errorMessage}`)
    }
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

async function getGroqResponse(message) {
  if (!apiKey) {
    throw new Error("Groq API key not configured")
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content:
            "You are CryptoVision AI, a knowledgeable cryptocurrency assistant. Help users with crypto trading, blockchain technology, and market analysis.",
        },
        ...conversationHistory.slice(-5),
        { role: "user", content: message },
      ],
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Groq API failed: ${response.status} - ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

async function getHuggingFaceResponse(message) {
  if (!apiKey) {
    throw new Error("Hugging Face API key not configured")
  }

  const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-large", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: message,
      parameters: {
        max_length: CONFIG.maxTokens,
        temperature: CONFIG.temperature,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Hugging Face API failed: ${response.status}`)
  }

  const data = await response.json()
  return data[0]?.generated_text || "I'm having trouble processing that request."
}

function getSmartMockResponse(message) {
  const msg = message.toLowerCase()

  // Intent detection
  if (
    msg.includes("hello") ||
    msg.includes("hi") ||
    msg.includes("hey") ||
    msg.includes("good morning") ||
    msg.includes("good afternoon")
  ) {
    return getRandomResponse(SMART_RESPONSES.greetings)
  }

  if (
    msg.includes("crypto") ||
    msg.includes("bitcoin") ||
    msg.includes("ethereum") ||
    msg.includes("btc") ||
    msg.includes("eth") ||
    msg.includes("blockchain")
  ) {
    return getRandomResponse(SMART_RESPONSES.crypto)
  }

  if (
    msg.includes("trade") ||
    msg.includes("trading") ||
    msg.includes("buy") ||
    msg.includes("sell") ||
    msg.includes("invest")
  ) {
    return getRandomResponse(SMART_RESPONSES.trading)
  }

  if (
    msg.includes("price") ||
    msg.includes("cost") ||
    msg.includes("value") ||
    msg.includes("$") ||
    msg.includes("worth")
  ) {
    return getRandomResponse(SMART_RESPONSES.price)
  }

  // Default contextual response
  const responses = [
    "That's an interesting question! While I'm running in offline mode, I can still provide helpful information about cryptocurrency and trading.",
    "I'm currently using my built-in knowledge base. For more advanced AI responses, consider configuring an API key in settings.",
    "Great question! Let me share what I know about that topic from my cryptocurrency knowledge base.",
    "I'm here to help with crypto-related questions! Though I'm in basic mode, I can still provide useful insights.",
    "Interesting topic! I'd be happy to discuss that further. What specific aspect would you like to explore?",
  ]

  return getRandomResponse(responses)
}

function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)]
}

// ===== UI FUNCTIONS =====
function addMessage(content, sender) {
  const chatMessages = document.getElementById("chatMessages")
  if (!chatMessages) return

  // Remove welcome message if it exists and this is the first user message
  const welcomeMessage = chatMessages.querySelector(".welcome-message")
  if (welcomeMessage && sender === "user") {
    welcomeMessage.remove()

    // Hide quick actions after first message
    const quickActions = document.getElementById("quickActions")
    if (quickActions) {
      quickActions.style.display = "none"
    }
  }

  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${sender}`

  const avatar = document.createElement("div")
  avatar.className = "message-avatar"
  avatar.textContent = sender === "user" ? "👤" : "🤖"

  const messageContent = document.createElement("div")
  messageContent.className = "message-content"
  messageContent.textContent = content

  const timestamp = document.createElement("div")
  timestamp.className = "message-timestamp"
  timestamp.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  messageDiv.appendChild(avatar)
  messageDiv.appendChild(messageContent)
  messageDiv.appendChild(timestamp)

  chatMessages.appendChild(messageDiv)
  chatMessages.scrollTop = chatMessages.scrollHeight

  // Add message to current session
  if (CONFIG.autoSave) {
    const currentSession = chatSessions.find((s) => s.id === currentSessionId)
    if (currentSession) {
      currentSession.messages.push({
        content,
        sender,
        timestamp: new Date().toISOString(),
      })
    }
  }
}

function showTypingIndicator() {
  const indicator = document.getElementById("typingIndicator")
  if (indicator) {
    indicator.style.display = "flex"
    const chatMessages = document.getElementById("chatMessages")
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight
    }
  }
}

function hideTypingIndicator() {
  const indicator = document.getElementById("typingIndicator")
  if (indicator) {
    indicator.style.display = "none"
  }
}

function updateConnectionStatus() {
  const statusDot = document.getElementById("statusDot")
  const statusText = document.getElementById("statusText")

  if (statusDot && statusText) {
    if (apiKey && currentAIProvider !== "mock") {
      statusDot.className = "status-dot connected"
      statusText.textContent = "AI Connected"
    } else {
      statusDot.className = "status-dot"
      statusText.textContent = "Offline Mode"
    }
  }

  updateAIModelInfo()
}

function updateAIModelInfo() {
  const currentModel = document.getElementById("currentModel")
  if (currentModel) {
    const provider = AI_PROVIDERS[currentAIProvider]
    currentModel.textContent = provider ? provider.name : "Unknown"
  }
}

function updateStats() {
  const totalMessagesEl = document.getElementById("totalMessages")
  const totalSessionsEl = document.getElementById("totalSessions")
  const avgResponseTimeEl = document.getElementById("avgResponseTime")

  if (totalMessagesEl) {
    totalMessagesEl.textContent = messageCount.toString()
  }

  if (totalSessionsEl) {
    totalSessionsEl.textContent = totalSessions.toString()
  }

  if (avgResponseTimeEl) {
    // This would be calculated from actual response times
    avgResponseTimeEl.textContent = "0.8s"
  }
}

function updateCharCounter() {
  const messageInput = document.getElementById("messageInput")
  const charCounter = document.getElementById("charCounter")

  if (messageInput && charCounter) {
    const length = messageInput.value.length
    charCounter.textContent = `${length}/2000`
  }
}

// ===== CONFIGURATION MODAL =====
function openConfig() {
  const modal = document.getElementById("configModal")
  const apiKeyInput = document.getElementById("apiKeyInput")

  if (modal && apiKeyInput) {
    // Populate current settings
    apiKeyInput.value = apiKey

    // Select current provider
    const providerCards = document.querySelectorAll(".provider-card")
    providerCards.forEach((card) => {
      card.classList.remove("selected")
      if (card.dataset.provider === currentAIProvider) {
        card.classList.add("selected")
      }
    })

    // Update sliders and inputs
    const tempSlider = document.getElementById("temperatureSlider")
    const tempValue = document.getElementById("temperatureValue")
    const maxTokensSelect = document.getElementById("maxTokensInput")
    const contextMemoryCheck = document.getElementById("contextMemory")
    const voiceEnabledCheck = document.getElementById("voiceEnabled")

    if (tempSlider && tempValue) {
      tempSlider.value = CONFIG.temperature
      tempValue.textContent = CONFIG.temperature.toFixed(1)
    }

    if (maxTokensSelect) {
      maxTokensSelect.value = CONFIG.maxTokens
    }

    if (contextMemoryCheck) {
      contextMemoryCheck.checked = CONFIG.contextMemory
    }

    if (voiceEnabledCheck) {
      voiceEnabledCheck.checked = CONFIG.voiceEnabled
    }

    modal.style.display = "flex"
    setTimeout(() => apiKeyInput.focus(), 100)
  }
}

function closeConfig() {
  const modal = document.getElementById("configModal")
  if (modal) {
    modal.style.display = "none"
  }
}

function saveConfig() {
  const apiKeyInput = document.getElementById("apiKeyInput")

  if (!apiKeyInput) return

  const newApiKey = apiKeyInput.value.trim()

  // Validate API key format if provided
  if (newApiKey && currentAIProvider !== "mock") {
    const provider = AI_PROVIDERS[currentAIProvider]
    if (provider && provider.keyPrefix && !newApiKey.startsWith(provider.keyPrefix)) {
      showToast(`Invalid API key format for ${provider.name}. Expected format: ${provider.keyPrefix}...`, "error")
      return
    }
  }

  // Update settings
  apiKey = newApiKey

  // Auto-detect provider from API key if provided
  if (newApiKey) {
    const detectedProvider = detectAPIKeyProvider(newApiKey)
    if (detectedProvider !== "mock") {
      currentAIProvider = detectedProvider
    }
  }

  // Save settings
  saveSettings()

  // Update UI
  updateConnectionStatus()
  updateStats()

  closeConfig()

  // Show success message
  if (apiKey) {
    showToast(`${AI_PROVIDERS[currentAIProvider].name} configured successfully!`, "success")
  } else {
    showToast("Configuration cleared. Using Smart Mock AI.", "info")
  }
}

function resetSettings() {
  if (confirm("Are you sure you want to reset all settings to defaults?")) {
    // Clear localStorage
    localStorage.removeItem("cryptovision_api_key")
    localStorage.removeItem("cryptovision_provider")
    localStorage.removeItem("cryptovision_config")

    // Reset variables
    apiKey = ""
    currentAIProvider = "mock"
    Object.assign(CONFIG, {
      temperature: 0.7,
      maxTokens: 500,
      contextMemory: true,
      voiceEnabled: true,
      autoSave: true,
    })

    // Update UI
    updateConnectionStatus()
    closeConfig()
    showToast("Settings reset to defaults", "success")
  }
}

function detectAPIKeyProvider(key) {
  if (key.startsWith("sk-")) return "openai"
  if (key.startsWith("gsk_")) return "groq"
  if (key.startsWith("hf_")) return "huggingface"
  return "mock"
}

function togglePasswordVisibility() {
  const apiKeyInput = document.getElementById("apiKeyInput")
  const toggleIcon = document.getElementById("passwordToggleIcon")

  if (apiKeyInput && toggleIcon) {
    if (apiKeyInput.type === "password") {
      apiKeyInput.type = "text"
      toggleIcon.className = "fas fa-eye-slash"
    } else {
      apiKeyInput.type = "password"
      toggleIcon.className = "fas fa-eye"
    }
  }
}

// ===== THEME MANAGEMENT =====
function toggleTheme() {
  const currentTheme = document.body.getAttribute("data-theme")
  const newTheme = currentTheme === "dark" ? "light" : "dark"

  document.body.setAttribute("data-theme", newTheme)
  localStorage.setItem("cryptovision_theme", newTheme)
  updateThemeIcon(newTheme)

  showToast(`Switched to ${newTheme} theme`, "info")
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById("themeIcon")
  if (themeIcon) {
    themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon"
  }
}

// ===== SIDEBAR MANAGEMENT =====
function toggleSidebar() {
  const sidebar = document.getElementById("chatSidebar")
  if (sidebar) {
    sidebar.classList.toggle("collapsed")

    // Update toggle button icon
    const toggleBtn = sidebar.querySelector(".sidebar-toggle i")
    if (toggleBtn) {
      toggleBtn.className = sidebar.classList.contains("collapsed") ? "fas fa-chevron-right" : "fas fa-chevron-left"
    }
  }
}

function startNewChat() {
  if (confirm("Start a new chat session? Current conversation will be saved.")) {
    // Save current session
    saveChatHistory()

    // Clear current conversation
    conversationHistory = []

    // Clear chat messages
    const chatMessages = document.getElementById("chatMessages")
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="welcome-message">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <h2>New Chat Session Started!</h2>
            <p>How can I assist you today?</p>
          </div>
        </div>
      `
    }

    // Show quick actions again
    const quickActions = document.getElementById("quickActions")
    if (quickActions) {
      quickActions.style.display = "flex"
    }

    // Create new session
    currentSessionId = Date.now()
    totalSessions++

    // Update UI
    updateStats()
    showToast("New chat session started", "success")
  }
}

function clearChat() {
  if (confirm("Clear current chat? This action cannot be undone.")) {
    // Clear conversation history
    conversationHistory = []

    // Clear chat messages
    const chatMessages = document.getElementById("chatMessages")
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="welcome-message">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <h2>Chat Cleared!</h2>
            <p>How can I assist you today?</p>
          </div>
        </div>
      `
    }

    // Show quick actions again
    const quickActions = document.getElementById("quickActions")
    if (quickActions) {
      quickActions.style.display = "flex"
    }

    showToast("Chat cleared", "success")
  }
}

function exportChat() {
  try {
    const chatMessages = document.getElementById("chatMessages")
    if (!chatMessages) return

    const messages = Array.from(chatMessages.querySelectorAll(".message"))
    const exportData = messages
      .map((msg) => {
        const sender = msg.classList.contains("user") ? "User" : "AI"
        const content = msg.querySelector(".message-content").textContent
        const timestamp = msg.querySelector(".message-timestamp")?.textContent || ""
        return `[${timestamp}] ${sender}: ${content}`
      })
      .join("\n\n")

    const blob = new Blob([exportData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cryptovision-chat-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast("Chat exported successfully", "success")
  } catch (error) {
    console.error("Export error:", error)
    showToast("Failed to export chat", "error")
  }
}

// ===== CHAT HISTORY MANAGEMENT =====
function loadChatHistory() {
  try {
    const savedSessions = localStorage.getItem("cryptovision_chat_sessions")
    if (savedSessions) {
      chatSessions = JSON.parse(savedSessions)
    } else {
      // Create initial session
      chatSessions = [
        {
          id: currentSessionId,
          name: "Current Session",
          timestamp: new Date().toISOString(),
          messages: [],
        },
      ]
    }

    updateChatSessionsUI()
  } catch (error) {
    console.error("Error loading chat history:", error)
  }
}

function saveChatHistory() {
  try {
    localStorage.setItem("cryptovision_chat_sessions", JSON.stringify(chatSessions))
  } catch (error) {
    console.error("Error saving chat history:", error)
  }
}

function updateChatSessionsUI() {
  const chatSessionsContainer = document.getElementById("chatSessions")
  if (!chatSessionsContainer) return

  chatSessionsContainer.innerHTML = ""

  chatSessions.forEach((session) => {
    const sessionDiv = document.createElement("div")
    sessionDiv.className = `session-item ${session.id === currentSessionId ? "active" : ""}`

    sessionDiv.innerHTML = `
      <div class="session-info">
        <h4>${session.name}</h4>
        <span class="session-time">${new Date(session.timestamp).toLocaleDateString()}</span>
      </div>
      <button class="session-delete" onclick="deleteSession(${session.id})" aria-label="Delete session">
        <i class="fas fa-trash"></i>
      </button>
    `

    sessionDiv.addEventListener("click", (e) => {
      if (!e.target.closest(".session-delete")) {
        loadChatSession(session.id)
      }
    })

    chatSessionsContainer.appendChild(sessionDiv)
  })
}

function loadChatSession(sessionId) {
  const session = chatSessions.find((s) => s.id === sessionId)
  if (!session) return

  currentSessionId = sessionId

  // Clear current chat
  const chatMessages = document.getElementById("chatMessages")
  if (chatMessages) {
    chatMessages.innerHTML = ""

    // Load session messages
    session.messages.forEach((msg) => {
      addMessage(msg.content, msg.sender)
    })

    if (session.messages.length === 0) {
      chatMessages.innerHTML = `
        <div class="welcome-message">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <h2>Welcome back!</h2>
            <p>How can I assist you today?</p>
          </div>
        </div>
      `
    }
  }

  updateChatSessionsUI()
  showToast(`Loaded chat session: ${session.name}`, "info")
}

function deleteSession(sessionId) {
  if (confirm("Delete this chat session? This action cannot be undone.")) {
    chatSessions = chatSessions.filter((s) => s.id !== sessionId)
    saveChatHistory()
    updateChatSessionsUI()

    if (sessionId === currentSessionId) {
      startNewChat()
    }

    showToast("Chat session deleted", "success")
  }
}

// ===== VOICE RECOGNITION =====
function initializeVoiceRecognition() {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    voiceRecognition = new SpeechRecognition()

    voiceRecognition.continuous = false
    voiceRecognition.interimResults = false
    voiceRecognition.lang = "en-US"

    voiceRecognition.onstart = () => {
      isVoiceActive = true
      updateVoiceUI(true)
    }

    voiceRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      const messageInput = document.getElementById("messageInput")
      if (messageInput) {
        messageInput.value = transcript
        handleInputChange()
      }
    }

    voiceRecognition.onend = () => {
      isVoiceActive = false
      updateVoiceUI(false)
    }

    voiceRecognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error)
      isVoiceActive = false
      updateVoiceUI(false)
      showToast("Voice recognition error", "error")
    }
  }
}

function toggleVoiceInput() {
  if (!CONFIG.voiceEnabled) {
    showToast("Voice input is disabled in settings", "info")
    return
  }

  if (!voiceRecognition) {
    showToast("Voice recognition not supported in this browser", "error")
    return
  }

  if (isVoiceActive) {
    stopVoiceInput()
  } else {
    startVoiceInput()
  }
}

function startVoiceInput() {
  try {
    voiceRecognition.start()
    showToast("Listening... Speak now", "info")
  } catch (error) {
    console.error("Voice input error:", error)
    showToast("Failed to start voice input", "error")
  }
}

function stopVoiceInput() {
  if (voiceRecognition && isVoiceActive) {
    voiceRecognition.stop()
  }
}

function updateVoiceUI(active) {
  const voiceButtons = document.querySelectorAll(".voice-btn")
  const voiceRecording = document.getElementById("voiceRecording")

  voiceButtons.forEach((btn) => {
    if (active) {
      btn.classList.add("active")
    } else {
      btn.classList.remove("active")
    }
  })

  if (voiceRecording) {
    voiceRecording.style.display = active ? "flex" : "none"
  }
}

// ===== FILE HANDLING =====
function toggleFileUpload() {
  const fileUploadArea = document.getElementById("fileUploadArea")
  if (fileUploadArea) {
    const isVisible = fileUploadArea.style.display !== "none"
    fileUploadArea.style.display = isVisible ? "none" : "block"
  }
}

function handleDragOver(e) {
  e.preventDefault()
  e.stopPropagation()
  e.currentTarget.classList.add("drag-over")
}

function handleFileDrop(e) {
  e.preventDefault()
  e.stopPropagation()
  e.currentTarget.classList.remove("drag-over")

  const files = e.dataTransfer.files
  handleFiles(files)
}

function handleFileSelect(e) {
  const files = e.target.files
  handleFiles(files)
}

function handleFiles(files) {
  Array.from(files).forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      showToast(`File ${file.name} is too large (max 5MB)`, "error")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      const messageInput = document.getElementById("messageInput")
      if (messageInput) {
        messageInput.value += `\n\n[File: ${file.name}]\n${content.substring(0, 1000)}${content.length > 1000 ? "..." : ""}`
        handleInputChange()
      }
    }

    if (file.type.startsWith("text/")) {
      reader.readAsText(file)
    } else {
      showToast(`File type ${file.type} not supported`, "error")
    }
  })

  toggleFileUpload()
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = "info") {
  const toastId = `${type}Toast`
  const toast = document.getElementById(toastId)
  const messageEl = document.getElementById(`${type}Message`)

  if (toast && messageEl) {
    messageEl.textContent = message
    toast.style.display = "flex"

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideToast(toastId)
    }, 5000)
  }
}

function hideToast(toastId) {
  const toast = document.getElementById(toastId)
  if (toast) {
    toast.style.display = "none"
  }
}

function hideAllToasts() {
  const toasts = document.querySelectorAll(".toast")
  toasts.forEach((toast) => {
    toast.style.display = "none"
  })
}

// ===== UTILITY FUNCTIONS =====
function toggleShortcutsHelp() {
  const shortcutsHelp = document.getElementById("shortcutsHelp")
  if (shortcutsHelp) {
    const isVisible = shortcutsHelp.style.display !== "none"
    shortcutsHelp.style.display = isVisible ? "none" : "block"

    if (!isVisible) {
      setTimeout(() => {
        shortcutsHelp.style.display = "none"
      }, 10000) // Auto-hide after 10 seconds
    }
  }
}

// ===== ERROR HANDLING =====
window.addEventListener("error", (e) => {
  console.error("Global error:", e.error)
  showToast("An unexpected error occurred", "error")
})

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason)
  showToast("Connection error occurred", "error")
})

// ===== CLEANUP =====
window.addEventListener("beforeunload", () => {
  if (CONFIG.autoSave) {
    saveChatHistory()
    saveSettings()
  }
})

// ===== EXPORT FOR TESTING =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    sendMessage,
    getAIResponse,
    addMessage,
    openConfig,
    closeConfig,
    saveConfig,
    toggleTheme,
    toggleSidebar,
    startNewChat,
    clearChat,
    exportChat,
  }
}

console.log("Enhanced ChatBot script loaded successfully!")
