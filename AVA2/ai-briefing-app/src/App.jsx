import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute, FaPause, FaPlay, FaArrowCircleDown, FaArrowCircleUp, FaArrowDown, FaArrowUp} from 'react-icons/fa';
import logo from '/D_logo.png';

function App() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [silenceTimeout, setSilenceTimeout] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserTranscript, setCurrentUserTranscript] = useState('');
  const [currentAiTranscript, setCurrentAiTranscript] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isPaused, setisPaused] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  
  const speechQueueRef = useRef([]);
  const speechIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const hasSpokenRef = useRef(false);
  const userResponseRef = useRef('');
  const typingIntervalRef = useRef(null);
  const utteranceRef = useRef(null);
  const typingStateRef = useRef({
    text: '',
    currentIndex: 0,
    fullText: ''
  });

  // Function to get the Microsoft Emma voice
  const getMicrosoftEmmaVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // First try exact match for "Microsoft Emma Online (Natural)"
    let emmaVoice = voices.find(voice => voice.name === 'Microsoft Emma Online (Natural)');
    
    // If not found, try less specific matches
    if (!emmaVoice) {
      emmaVoice = voices.find(voice => 
        voice.name.includes('Emma') && voice.name.includes('Microsoft')
      );
    }
    
    // If still not found, try any Microsoft female voice
    if (!emmaVoice) {
      emmaVoice = voices.find(voice => 
        voice.name.includes('Microsoft') && 
        (voice.name.includes('Female') || voice.name.includes('Zira'))
      );
    }
    
    return emmaVoice;
  };

  // Cancel any ongoing speech and typing
  const cancelSpeechAndTyping = () => {
    window.speechSynthesis.cancel();
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  // Resume typing after pause
  const resumeTyping = () => {
    if (typingIntervalRef.current) return; // Don't restart if already typing
    
    const { fullText, currentIndex } = typingStateRef.current;
    
    if (currentIndex >= fullText.length) return; // Nothing left to type
    
    let i = currentIndex;
    let current = typingStateRef.current.text;
    
    typingIntervalRef.current = setInterval(() => {
      if (i < fullText.length && !isPausedRef.current) {
        current += fullText[i];
        i++;
        
        setCurrentAiTranscript(current);
        typingStateRef.current = {
          text: current,
          currentIndex: i,
          fullText
        };
      } else if (isPausedRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      } else {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    }, 30);
  };

  // Improved synchronized speech and typing
  const speakWithSync = (text, onComplete) => {
    if (!text) return;
    
    // If paused, don't start a new speech
    if (isPausedRef.current) return;
    
    // Cancel any previous speech/typing
    cancelSpeechAndTyping();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get Emma voice
    const emmaVoice = getMicrosoftEmmaVoice();
    if (emmaVoice) {
      console.log('Using voice:', emmaVoice.name);
      utterance.voice = emmaVoice;
      utterance.lang = emmaVoice.lang;
    } else {
      console.warn('Microsoft Emma voice not found. Using default voice.');
    }
    
    // Store for pause/resume
    utteranceRef.current = utterance;
    
    // Initialize typing state
    typingStateRef.current = {
      text: '',
      currentIndex: 0,
      fullText: text
    };
    
    // Word boundaries to synchronize with typing
    const words = text.split(/\s+/);
    let wordIndex = 0;
    let charCount = 0;
    const wordBoundaries = [];
    
    // Calculate character positions for each word
    words.forEach(word => {
      charCount += word.length + 1; // +1 for space
      wordBoundaries.push(charCount);
    });
    
    // Set up word boundary event
    utterance.onboundary = (event) => {
      if (event.name === 'word' && wordIndex < words.length) {
        // Update the typing position based on speech
        wordIndex++;
      }
    };
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      
      // Start typing slightly ahead of speech for better sync
      let i = 0;
      let current = '';
      
      typingIntervalRef.current = setInterval(() => {
        if (i < text.length && !isPausedRef.current) {
          current += text[i];
          i++;
          
          setCurrentAiTranscript(current);
          typingStateRef.current = {
            text: current,
            currentIndex: i,
            fullText: text
          };
        } else if (isPausedRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        } else {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          
          // Speech has finished, complete message
          if (onComplete) onComplete(text);
        }
      }, 67); // Faster typing to stay ahead of speech
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
      
      // Ensure complete message is shown
      //setCurrentAiTranscript(text);
      
      // Add to message history
      if (onComplete) onComplete(text);
    };
    
    // Handle errors
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
      
      // Add to message history even if speech fails
      if (onComplete) onComplete(text);
    };
    
    // Start speaking with a small delay to ensure browser is ready
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  // Function to pause the typing and speech
  const pauseTranscript = () => {
    if (isPaused) return;
    setisPaused(true);
    isPausedRef.current = true;
    
    // Pause speech synthesis
    window.speechSynthesis.pause();
    
    // Pause typing
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  // Function to resume the typing and speech
  const resumeTranscript = () => {
    if (!isPaused) return;
    setisPaused(false);
    isPausedRef.current = false;
    
    // Resume speech synthesis
    window.speechSynthesis.resume();
    
    // Resume typing with the saved state
    resumeTyping();
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += part + ' ';
        } else {
          interim += part;
        }
      }

      if (interim) {
        setCurrentUserTranscript(interim);
      }

      if (final.trim()) {
        setCurrentUserTranscript('');
        userResponseRef.current = final.trim();

        setMessages((prev) => [
          ...prev,
          { from: 'user', text: final.trim(), timestamp: Date.now() },
        ]);

        sendUserQuestion(final.trim());
      }

      resetSilenceTimer();
    };

    recognitionInstance.onerror = (e) => console.error('Recognition error:', e.error);
    setRecognition(recognitionInstance);
  };

  const resetSilenceTimer = () => {
    if (silenceTimeout) clearTimeout(silenceTimeout);
    setSilenceTimeout(setTimeout(() => stopListening(), 3000));
  };

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
      setCurrentUserTranscript('');
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
      if (silenceTimeout) clearTimeout(silenceTimeout);
    }
  };

  const fetchInitialOutput = async () => {
    try {
      const poll = async () => {
        const res = await fetch("http://localhost:8001/initial_output");
        const data = await res.json();
  
        if (
          data.summary === "Processing summary. Please refresh in a few seconds." ||
          data.summary.toLowerCase().includes("processing")
        ) {
          // Keep showing "AVA is thinking..." while polling
          setIsThinking(true);
          setTimeout(poll, 2000); // Try again after 2 seconds
        } else {
          triggerAiReply(data.summary, true);
        }
      };
  
      poll();
    } catch (err) {
      console.error("Failed to fetch initial output:", err);
    }
  };
  
  const sendUserQuestion = async (question) => {
    try {
      setIsThinking(true);
      const res = await fetch("http://localhost:8001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
  
      const data = await res.json();
      triggerAiReply(data.answer);
    } catch (err) {
      console.error("Failed to get AI response:", err);
      triggerAiReply("Sorry, something went wrong.");
    }
  };

  // Updated to use synchronized speak function
  const triggerAiReply = (text, isIntro = false) => {
    setIsThinking(true);
    const fullReply = isIntro ? text : text;
    
    // Clear current transcript
    setCurrentAiTranscript('');
    
    // Reset typing state
    typingStateRef.current = {
      text: '',
      currentIndex: 0,
      fullText: fullReply
    };
    
    // Use the synchronized speak function
    speakWithSync(fullReply, (completedText) => {
      // Avoid repeating last message
      setCurrentAiTranscript(''); // clear typing display
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (msg) => msg.from === 'ai' && msg.text === completedText
        );
        if (!alreadyExists) {
          return [...prev, { from: 'ai', text: completedText, timestamp: Date.now() }];
        }
        return prev;
      });
      setIsThinking(false);
    });
    
  };

  // Enhanced useEffect for voice loading that works better in Microsoft Edge
  useEffect(() => {
    const initVoices = async () => {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          console.log('Voices loaded:', voices.map(v => v.name).join(', '));
          setAvailableVoices(voices);
          const microsoftVoices = voices.filter(v => v.name.includes('Microsoft'));
          console.log('Microsoft voices:', microsoftVoices.map(v => v.name).join(', '));
        }
      };
  
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      setTimeout(loadVoices, 500);
      setTimeout(loadVoices, 1000);
      
      const tempUtterance = new SpeechSynthesisUtterance('');
      tempUtterance.volume = 0;
      tempUtterance.onend = loadVoices;
      window.speechSynthesis.speak(tempUtterance);
    };
  
    initVoices();
    initSpeechRecognition();
  
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true; // ✅ Move this before the timeout
      setTimeout(() => {
        fetchInitialOutput();
      }, 1000);
    }
  
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    document.title = "AVA";
  }, []);

  return (
    <div className="flex items-center justify-center w-screen min-h-screen bg-white">
      <div className="flex flex-col items-center space-y-6 w-full max-w-2xl pb-12 pt-12">
        <div className="flex items-center space-x-4">
          <img
              src={logo}
              alt="AVA Logo"
              className="w-24 h-24 object-contain"
            />
          <div
            className={`w-8 h-8 rounded-full ${
              isSpeaking && !isPaused ? 'animate-pulse-bigger' : 'bg-green-500'
            }`}
            style={{
              backgroundColor: isSpeaking ? 'green' : '#26890D',
              transition: 'transform 0.3s ease-in-out',
              position: 'relative',
              top: '24px', // adjust this value as needed
              right: '12px',
            }}
          ></div>
        </div>

        {/* Chat Collapse Toggle Button */}
        <button
              onClick={() => setIsChatCollapsed(!isChatCollapsed)}
              className="text-sm text-blue-500 hover:text-blue-700 transition-all"
              style={{
                top: "280px"
              }}
            >
              {isChatCollapsed ? 'Show Chat' : 'Hide Chat'}
            </button>
      
        {/* Chat Section */}
        {!isChatCollapsed && (
        <div className="w-full max-h-[70vh] overflow-y-auto px-4 py-6 space-y-4 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-300">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`px-5 py-3 rounded-tl-xl rounded-tr-xl ${
                msg.from === 'user' ? 'rounded-bl-xl self-end ml-auto text-right' : 'rounded-br-xl self-start mr-auto text-left'
              } text-white text-sm md:text-base max-w-[75%]`}
              style={{
                whiteSpace: 'pre-wrap',
                backgroundColor: msg.from === 'user'
                  ? 'rgba(0, 124, 176, 0.8)'
                  : 'rgba(38, 137, 13, 0.8)',
              }}
            >
              <strong>{msg.from === 'user' ? 'You' : 'AVA'}:</strong> {msg.text}
            </div>
          ))}
          {currentUserTranscript && (
            <div
              className="px-5 py-3 rounded-tl-xl rounded-tr-xl rounded-bl-xl self-end ml-auto text-right italic text-white text-sm md:text-base max-w-[75%] opacity-80"
              style={{ whiteSpace: 'pre-wrap', backgroundColor: 'rgba(0, 124, 176, 0.5)' }}
            >
              <strong>You:</strong> {currentUserTranscript}
            </div>
          )}
          {currentAiTranscript && (
            <div
              className="px-5 py-3 rounded-tl-xl rounded-tr-xl rounded-br-xl self-start mr-auto text-left italic text-white text-sm md:text-base max-w-[75%] opacity-80"
              style={{whiteSpace: 'pre-wrap', backgroundColor: 'rgba(38, 137, 13, 0.5)' }}
            >
              <strong>AVA:</strong> {currentAiTranscript}
            </div>
          )}
          {isThinking && !currentAiTranscript && (
            <div className="px-5 py-3 rounded-xl bg-green-100 text-green-600 max-w-[75%] self-start mr-auto text-left italic animate-pulse text-sm">
              <strong>AVA is thinking</strong>
              <span className="ml-1">...</span>
            </div>
          )}
        </div>
        )}

        {/* Mic & Pause Buttons */}
        <div className="mt-6 flex space-x-4">
          {/* Mic Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-16 h-16 flex items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 ${
              isListening ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isListening ? (
              <FaMicrophone className="text-2xl" />
            ) : (
              <FaMicrophoneSlash className="text-2xl" />
            )}
          </button>

          {/* Mute/Pause Button */}
          <button
            onClick={() => {
              if (!isPaused) {
                pauseTranscript();
              } else {
                resumeTranscript();
              }
            }}
            className={`w-16 h-16 flex items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 ${
              isPaused ? 'bg-gray-400 hover:bg-gray-500' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isPaused ? <FaPlay className="text-2xl" /> : <FaPause className="text-2xl" />}
          </button>
        </div>        
      </div>
    </div>
  );
}

export default App;