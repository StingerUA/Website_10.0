// ====================================================================
// ALBAMEN VOICE DIAGNOSTICS - Инструмент для проверки голосового чата
// ====================================================================

// Этот файл содержит функции диагностики для проверки работоспособности
// голосового виджета и воркера. Используйте в консоли для отладки.

const VoiceDiagnostics = {
  // Проверка наличия всех необходимых элементов DOM
  checkDOMElements() {
    console.group('🔍 DOM Elements Check');
    
    const checks = {
      'Voice buttons': document.querySelectorAll('#ai-voice-btn, #ai-voice-btn-panel, .ai-voice-btn, .ai-call-btn').length > 0,
      'Voice modal': !!document.querySelector('.ai-panel-voice'),
      'Chat panel': !!document.querySelector('.ai-panel-global'),
      'Status element': !!document.getElementById('voice-status-text'),
      'Wave animation': !!document.getElementById('voice-wave'),
      'Stop button': !!document.getElementById('voice-stop-btn'),
    };

    Object.entries(checks).forEach(([name, exists]) => {
      console.log(`${exists ? '✅' : '❌'} ${name}`);
    });
    
    console.groupEnd();
    return Object.values(checks).every(v => v);
  },

  // Проверка браузерных API
  checkAPIs() {
    console.group('🔌 Browser APIs Check');
    
    const apis = {
      'SpeechRecognition': !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      'SpeechSynthesis': !!'speechSynthesis' in window,
      'MediaDevices': !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      'Fetch API': !!window.fetch,
      'localStorage': !!window.localStorage,
    };

    Object.entries(apis).forEach(([name, available]) => {
      console.log(`${available ? '✅' : '❌'} ${name}`);
    });
    
    console.groupEnd();
    return Object.values(apis).every(v => v);
  },

  // Проверка соединения с Worker
  async checkWorkerConnection() {
    console.group('🌐 Worker Connection Check');
    
    const WORKER_URL = 'https://albamen-voice.nncdecdgc.workers.dev';
    const timeout = 10000;
    
    try {
      console.log(`Testing connection to: ${WORKER_URL}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'DIAGNOSTIC_TEST',
          sessionId: 'diagnostic-' + Date.now(),
          savedName: null,
          savedAge: null,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Worker responded with:', data);
        console.groupEnd();
        return true;
      } else {
        console.log(`❌ Worker returned status: ${response.status}`);
        console.groupEnd();
        return false;
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log(`❌ Worker timeout (${timeout}ms)`);
      } else {
        console.log(`❌ Connection failed: ${err.message}`);
      }
      console.groupEnd();
      return false;
    }
  },

  // Проверка локального хранилища
  checkStorage() {
    console.group('💾 LocalStorage Check');
    
    const keys = {
      'Session ID': localStorage.getItem('albamen_session_id'),
      'User Name': localStorage.getItem('albamen_user_name'),
      'User Age': localStorage.getItem('albamen_user_age'),
    };

    Object.entries(keys).forEach(([key, value]) => {
      console.log(`${key}: ${value || '(empty)'}`);
    });
    
    console.groupEnd();
  },

  // Проверка инициализации обработчиков голоса
  checkHandlersInitialization() {
    console.group('⚙️ Voice Handlers Check');
    
    console.log('Checking if initVoiceHandlers is available...');
    const isAvailable = typeof initVoiceHandlers === 'function';
    console.log(isAvailable ? '✅ initVoiceHandlers found' : '❌ initVoiceHandlers not found');
    
    if (isAvailable) {
      try {
        console.log('Attempting to initialize voice handlers...');
        initVoiceHandlers();
        console.log('✅ Voice handlers initialized');
      } catch (err) {
        console.log('❌ Error initializing handlers:', err.message);
      }
    }
    
    console.groupEnd();
  },

  // Полная диагностика
  async runFullDiagnostics() {
    console.clear();
    console.log('%c🎤 ALBAMEN VOICE DIAGNOSTICS', 'font-size: 18px; font-weight: bold; color: #00c2ff;');
    console.log('%cRunning comprehensive check...', 'font-size: 12px; color: #9ca3af;');
    console.log('');
    
    const domOk = this.checkDOMElements();
    const apisOk = this.checkAPIs();
    const workerOk = await this.checkWorkerConnection();
    this.checkStorage();
    this.checkHandlersInitialization();
    
    console.log('');
    console.group('📊 Summary');
    console.log(`DOM Elements: ${domOk ? '✅ OK' : '❌ Issues'}`);
    console.log(`Browser APIs: ${apisOk ? '✅ OK' : '❌ Issues'}`);
    console.log(`Worker: ${workerOk ? '✅ OK' : '❌ Issues'}`);
    console.groupEnd();
    
    return domOk && apisOk && workerOk;
  },

  // Тест микрофона
  async testMicrophone() {
    console.group('🎤 Microphone Test');
    
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      console.log('Stopping microphone...');
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Microphone stopped');
      
      console.groupEnd();
      return true;
    } catch (err) {
      console.log(`❌ Microphone error: ${err.message}`);
      console.groupEnd();
      return false;
    }
  },

  // Тест синтеза речи
  testSpeechSynthesis() {
    console.group('🔊 Speech Synthesis Test');
    
    if (!('speechSynthesis' in window)) {
      console.log('❌ SpeechSynthesis not available');
      console.groupEnd();
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance('Merhaba, ben Albamen');
      utterance.lang = 'tr-TR';
      
      utterance.onstart = () => console.log('🔊 Speaking started...');
      utterance.onend = () => {
        console.log('✅ Speaking ended');
        console.groupEnd();
      };
      
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.log(`❌ Speech synthesis error: ${err.message}`);
      console.groupEnd();
      return false;
    }
  },

  // Показать помощь
  help() {
    console.log('%c🎤 ALBAMEN VOICE DIAGNOSTICS HELP', 'font-size: 14px; font-weight: bold; color: #00c2ff;');
    console.log(`
Available commands:
  VoiceDiagnostics.runFullDiagnostics()  - Run complete diagnostics check
  VoiceDiagnostics.checkDOMElements()    - Check if DOM elements exist
  VoiceDiagnostics.checkAPIs()           - Check browser API support
  VoiceDiagnostics.checkWorkerConnection() - Test Worker connection
  VoiceDiagnostics.checkStorage()        - Check localStorage
  VoiceDiagnostics.testMicrophone()      - Test microphone access
  VoiceDiagnostics.testSpeechSynthesis() - Test speech synthesis
  VoiceDiagnostics.help()                - Show this help message

Example: VoiceDiagnostics.runFullDiagnostics()
    `);
  }
};

// Автоматическое выполнение при загрузке в dev окружении
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('%c💡 Tip: Use VoiceDiagnostics.help() for diagnostic commands', 'color: #fbbf24;');
}
