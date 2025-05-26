// import { useState, useEffect, useRef } from 'react';
// import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
// import logo from '/D_logo.png';

// function App() {
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [recognition, setRecognition] = useState(null);
//   const [silenceTimeout, setSilenceTimeout] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [currentUserTranscript, setCurrentUserTranscript] = useState('');
//   const [currentAiTranscript, setCurrentAiTranscript] = useState('');
//   const [isThinking, setIsThinking] = useState(false);
//   const [availableVoices, setAvailableVoices] = useState([]);
//   const [selectedVoice, setSelectedVoice] = useState(null);
//   const [voicesLoaded, setVoicesLoaded] = useState(false);
//   const [initialDataFetched, setInitialDataFetched] = useState(false);
//   const [isInitializing, setIsInitializing] = useState(true);

//   const pendingSpeechQueue = useRef([]);
//   const hasSpokenRef = useRef(false);
//   const userResponseRef = useRef('');
//   const initialSummaryRef = useRef('');
//   const typingIntervalRef = useRef(null);
//   const isTabVisibleRef = useRef(true);
//   const speechTextRef = useRef('');

//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       isTabVisibleRef.current = document.visibilityState === 'visible';
//       if (!isTabVisibleRef.current) {
//         if (typingIntervalRef.current) {
//           clearInterval(typingIntervalRef.current);
//         }
//       } else {
//         if (speechTextRef.current && currentAiTranscript !== speechTextRef.current) {
//           resumeTypingFromCurrentPosition();
//         }
//       }
//     };
//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
//   }, [currentAiTranscript]);

//   const resumeTypingFromCurrentPosition = () => {
//     if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
//     const fullText = speechTextRef.current;
//     const currentText = currentAiTranscript;
//     if (!fullText || currentText === fullText) return;

//     let startIndex = currentText.length;
//     const chars = fullText.substring(startIndex).split('');
//     let i = 0;
//     let current = currentText;
//     const interval = setInterval(() => {
//       if (i < chars.length) {
//         current += chars[i++];
//         setCurrentAiTranscript(current);
//       } else {
//         clearInterval(typingIntervalRef.current);
//         setMessages((prev) => [...prev, { from: 'ai', text: fullText, timestamp: Date.now() }]);
//         setCurrentAiTranscript('');
//         setIsThinking(false);
//         speechTextRef.current = '';
//       }
//     }, 30);
//     typingIntervalRef.current = interval;
//   };

//   useEffect(() => {
//     if (voicesLoaded && pendingSpeechQueue.current.length > 0) {
//       setTimeout(() => {
//         pendingSpeechQueue.current.forEach(text => performSpeech(text));
//         pendingSpeechQueue.current = [];
//       }, 500);
//     }
//   }, [voicesLoaded]);

//   useEffect(() => {
//     if (voicesLoaded && initialDataFetched && initialSummaryRef.current && !hasSpokenRef.current) {
//       setTimeout(() => {
//         performSpeech(initialSummaryRef.current);
//         hasSpokenRef.current = true;
//       }, 1000);
//     }
//   }, [voicesLoaded, initialDataFetched]);

//   const performSpeech = (text) => {
//     if (!text) return;
//     window.speechSynthesis.cancel();
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.rate = 1.0;
//     utterance.pitch = 1.0;
//     utterance.volume = 1.0;
//     if (selectedVoice) utterance.voice = selectedVoice;

//     utterance.onstart = () => setIsSpeaking(true);
//     utterance.onend = () => {
//       setIsSpeaking(false);
//       speechTextRef.current = '';
//     };
//     utterance.onerror = (e) => {
//       console.error('Speech synthesis error:', e);
//       setIsSpeaking(false);
//       speechTextRef.current = '';
//     };

//     window.speechSynthesis.speak(utterance);
//   };

//   const speak = (text) => {
//     if (!text) return;
//     speechTextRef.current = text;
//     if (!voicesLoaded) {
//       pendingSpeechQueue.current.push(text);
//     } else {
//       performSpeech(text);
//     }
//   };

//   const initSpeechRecognition = () => {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) return;

//     const recognitionInstance = new SpeechRecognition();
//     recognitionInstance.continuous = true;
//     recognitionInstance.interimResults = true;
//     recognitionInstance.lang = 'en-US';

//     recognitionInstance.onresult = (event) => {
//       let interim = '', final = '';
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         const part = event.results[i][0].transcript;
//         if (event.results[i].isFinal) final += part + ' ';
//         else interim += part;
//       }

//       if (interim) setCurrentUserTranscript(interim);
//       if (final.trim()) {
//         setCurrentUserTranscript('');
//         userResponseRef.current = final.trim();
//         setMessages((prev) => [...prev, { from: 'user', text: final.trim(), timestamp: Date.now() }]);
//         sendUserQuestion(final.trim());
//       }

//       resetSilenceTimer();
//     };

//     recognitionInstance.onerror = (e) => console.error('Recognition error:', e.error);
//     setRecognition(recognitionInstance);
//   };

//   const resetSilenceTimer = () => {
//     if (silenceTimeout) clearTimeout(silenceTimeout);
//     setSilenceTimeout(setTimeout(() => stopListening(), 3000));
//   };

//   const startListening = () => {
//     if (recognition && !isListening) {
//       recognition.start();
//       setCurrentUserTranscript('');
//       setIsListening(true);
//     }
//   };

//   const stopListening = () => {
//     if (recognition && isListening) {
//       recognition.stop();
//       setIsListening(false);
//       if (silenceTimeout) clearTimeout(silenceTimeout);
//     }
//   };

//   const fetchInitialOutput = async () => {
//     if (initialDataFetched || initialSummaryRef.current) return;
//     try {
//       const res = await fetch("http://localhost:8001/initial_output");
//       const data = await res.json();
//       setInitialDataFetched(true);
//       if (!initialSummaryRef.current) {
//         initialSummaryRef.current = data.summary;
//         triggerAiReply(data.summary, true);
//       }
//     } catch (err) {
//       console.error("Initial output fetch failed:", err);
//       setTimeout(fetchInitialOutput, 3000);
//     }
//   };

//   const sendUserQuestion = async (question) => {
//     try {
//       const res = await fetch("http://localhost:8001/ask", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question }),
//       });
//       const data = await res.json();
//       triggerAiReply(data.answer);
//     } catch (err) {
//       console.error("AI response error:", err);
//       triggerAiReply("Sorry, something went wrong.");
//     }
//   };

//   const triggerAiReply = (userText, isIntro = false) => {
//     if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
//     setIsThinking(true);
//     const fullReply = userText;
//     speechTextRef.current = fullReply;
//     setCurrentAiTranscript('');

//     if (isTabVisibleRef.current) {
//       const chars = fullReply.split('');
//       let i = 0, current = '';
//       const interval = setInterval(() => {
//         if (i < chars.length) {
//           current += chars[i++];
//           setCurrentAiTranscript(current);
//         } else {
//           clearInterval(typingIntervalRef.current);
//           setMessages((prev) => [...prev, { from: 'ai', text: fullReply, timestamp: Date.now() }]);
//           setCurrentAiTranscript('');
//           setIsThinking(false);
//         }
//       }, 30);
//       typingIntervalRef.current = interval;
//     } else {
//       setMessages((prev) => [...prev, { from: 'ai', text: fullReply, timestamp: Date.now() }]);
//       setIsThinking(false);
//     }

//     speak(fullReply);
//     if (isIntro && !hasSpokenRef.current) initialSummaryRef.current = fullReply;
//   };

//   useEffect(() => {
//     window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
//   }, []);

//   useEffect(() => {
//     const loadVoices = () => {
//       const voices = window.speechSynthesis.getVoices();
//       if (voices.length > 0) {
//         setAvailableVoices(voices);
//         const preferred = voices.find(v => /zira|susan|catherine|samantha|karen/i.test(v.name));
//         setSelectedVoice(preferred || voices.find(v => v.lang.startsWith('en')));
//         setVoicesLoaded(true);
//       }
//     };

//     loadVoices();
//     window.speechSynthesis.onvoiceschanged = loadVoices;
//     return () => window.speechSynthesis.onvoiceschanged = null;
//   }, []);

//   useEffect(() => {
//     initSpeechRecognition();
//     fetchInitialOutput();
//     setTimeout(() => setIsInitializing(false), 1500);
//     return () => {
//       window.speechSynthesis.cancel();
//       if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
//     };
//   }, []);

//   useEffect(() => {
//     document.title = "AVA";
//   }, []);

//   return (
//     <div className="flex items-center justify-center w-screen min-h-screen bg-white">
//       <div className="flex flex-col items-center space-y-6 w-full max-w-2xl">
//         <div className="flex items-center space-x-4">
//           <img src={logo} alt="AVA Logo" className="w-24 h-24 object-contain" />
//           <div className={`w-8 h-8 rounded-full ${isSpeaking ? 'animate-pulse-bigger' : 'bg-green-500'}`} style={{ backgroundColor: isSpeaking ? 'green' : '#26890D', transition: 'transform 0.3s ease-in-out', position: 'relative', top: '24px', right: '12px' }}></div>
//         </div>

//         <div className="w-full max-h-[70vh] overflow-y-auto px-4 py-6 space-y-4 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-300">
//           {isInitializing && (
//             <div className="italic text-gray-500 animate-pulse text-center">Loading voice engine...</div>
//           )}
//           {messages.map((msg, idx) => (
//             <div key={idx} className={`px-5 py-3 rounded-tl-xl rounded-tr-xl ${msg.from === 'user' ? 'rounded-bl-xl self-end ml-auto text-right' : 'rounded-br-xl self-start mr-auto text-left'} text-white text-sm md:text-base max-w-[75%]`} style={{ whiteSpace: 'pre-wrap', backgroundColor: msg.from === 'user' ? 'rgba(0, 124, 176, 0.8)' : 'rgba(38, 137, 13, 0.8)' }}>
//               <strong>{msg.from === 'user' ? 'You' : 'AVA'}:</strong> {msg.text}
//             </div>
//           ))}
//           {currentUserTranscript && (
//             <div className="px-5 py-3 rounded-tl-xl rounded-tr-xl rounded-bl-xl self-end ml-auto text-right italic text-white text-sm md:text-base max-w-[75%] opacity-80" style={{ whiteSpace: 'pre-wrap', backgroundColor: 'rgba(0, 124, 176, 0.5)' }}>
//               <strong>You:</strong> {currentUserTranscript}
//             </div>
//           )}
//           {currentAiTranscript && (
//             <div className="px-5 py-3 rounded-tl-xl rounded-tr-xl rounded-br-xl self-start mr-auto text-left italic text-white text-sm md:text-base max-w-[75%] opacity-80" style={{ whiteSpace: 'pre-wrap', backgroundColor: 'rgba(38, 137, 13, 0.5)' }}>
//               <strong>AVA:</strong> {currentAiTranscript}
//             </div>
//           )}
//           {isThinking && !currentAiTranscript && (
//             <div className="px-5 py-3 rounded-xl bg-green-100 text-green-600 max-w-[75%] self-start mr-auto text-left italic animate-pulse text-sm">
//               AVA is thinking...
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;


// import { useState, useEffect, useRef } from 'react';
// import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
// import logo from '/D_logo.png';

// function App() {
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [recognition, setRecognition] = useState(null);
//   const [silenceTimeout, setSilenceTimeout] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [currentUserTranscript, setCurrentUserTranscript] = useState('');
//   const [currentAiTranscript, setCurrentAiTranscript] = useState('');
//   const [isThinking, setIsThinking] = useState(false);
//   const [availableVoices, setAvailableVoices] = useState([]);
//   const [selectedVoice, setSelectedVoice] = useState(null);
//   const [voicesLoaded, setVoicesLoaded] = useState(false);
//   const [initialDataFetched, setInitialDataFetched] = useState(false);
//   const [isInitializing, setIsInitializing] = useState(true);

//   // Queue for pending speech requests until voices are loaded
//   const pendingSpeechQueue = useRef([]);
//   const hasSpokenRef = useRef(false);
//   const userResponseRef = useRef('');
//   const initialSummaryRef = useRef('');
//   const typingIntervalRef = useRef(null);
//   const isTabVisibleRef = useRef(true);
//   const speechTextRef = useRef('');

//   // Process any pending speech once voices are loaded
//   // useEffect(() => {
//   //   if (voicesLoaded && pendingSpeechQueue.current.length > 0) {
//   //     console.log("Processing queued speech now that voices are loaded");
//   //     // Wait a short moment to ensure the voice system is fully initialized
//   //     setTimeout(() => {
//   //       pendingSpeechQueue.current.forEach(text => {
//   //         performSpeech(text);
//   //       });
//   //       pendingSpeechQueue.current = [];
//   //     }, 500);
//   //   }
//   // }, [voicesLoaded]);

//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       isTabVisibleRef.current = document.visibilityState === 'visible';
//       if (!isTabVisibleRef.current) {
//         if (typingIntervalRef.current) {
//           clearInterval(typingIntervalRef.current);
//         }
//       } else {
//         if (speechTextRef.current && currentAiTranscript !== speechTextRef.current) {
//           resumeTypingFromCurrentPosition();
//         }
//       }
//     };
//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
//   }, [currentAiTranscript]);

//   const resumeTypingFromCurrentPosition = () => {
//     if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
//     const fullText = speechTextRef.current;
//     const currentText = currentAiTranscript;
//     if (!fullText || currentText === fullText) return;

//     let startIndex = currentText.length;
//     const chars = fullText.substring(startIndex).split('');
//     let i = 0;
//     let current = currentText;
//     const interval = setInterval(() => {
//       if (i < chars.length) {
//         current += chars[i++];
//         setCurrentAiTranscript(current);
//       } else {
//         clearInterval(typingIntervalRef.current);
//         setMessages((prev) => [...prev, { from: 'ai', text: fullText, timestamp: Date.now() }]);
//         setCurrentAiTranscript('');
//         setIsThinking(false);
//         speechTextRef.current = '';
//       }
//     }, 30);
//     typingIntervalRef.current = interval;
//   };


//   // Monitor for both voices loaded and initial data fetched to retry speech if needed
//   // useEffect(() => {
//   //   if (voicesLoaded && initialDataFetched && initialSummaryRef.current && !hasSpokenRef.current) {
//   //     console.log("Both voices and initial data are ready, retrying initial speech");
//   //     // Set a delay to ensure everything is truly ready
//   //     setTimeout(() => {
//   //       performSpeech(initialSummaryRef.current);
//   //       hasSpokenRef.current = true;
//   //     }, 1000);
//   //   }
//   // }, [voicesLoaded, initialDataFetched]);

//   useEffect(() => {
//     if (voicesLoaded && pendingSpeechQueue.current.length > 0) {
//       setTimeout(() => {
//         pendingSpeechQueue.current.forEach(text => performSpeech(text));
//         pendingSpeechQueue.current = [];
//       }, 500);
//     }
//   }, [voicesLoaded]);

//   // Actual speech function that works when voices are loaded
//   // const performSpeech = (text) => {
//   //   if (!text) return;

//   //   // Cancel any ongoing speech
//   //   window.speechSynthesis.cancel();
    
//   //   const utterance = new SpeechSynthesisUtterance(text);
    
//   //   // Set voice properties for a more natural sound
//   //   utterance.rate = 1.0;  // Normal speed
//   //   utterance.pitch = 1.0; // Normal pitch
//   //   utterance.volume = 1.0; // Full volume
    
//   //   // Use our selected voice if available
//   //   if (selectedVoice) {
//   //     console.log('Using voice for speech:', selectedVoice.name);
//   //     utterance.voice = selectedVoice;
//   //   } else {
//   //     console.warn('No suitable voice found. Using default.');
//   //   }
    
//   //   utterance.onstart = () => {
//   //     console.log("Speech started");
//   //     setIsSpeaking(true);
//   //   };
//   //   utterance.onend = () => {
//   //     console.log("Speech ended");
//   //     setIsSpeaking(false);
//   //   };
//   //   utterance.onerror = (e) => {
//   //     console.error('Speech synthesis error:', e);
//   //     setIsSpeaking(false);
//   //   };
    
//   //   // Edge can sometimes have issues with longer text, so break it into chunks
//   //   if (text.length > 150) {
//   //     // Simple chunking by sentence boundaries
//   //     const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      
//   //     sentences.forEach((sentence, index) => {
//   //       const sentenceUtterance = new SpeechSynthesisUtterance(sentence);
//   //       if (selectedVoice) {
//   //         sentenceUtterance.voice = selectedVoice;
//   //       }
//   //       sentenceUtterance.rate = utterance.rate;
//   //       sentenceUtterance.pitch = utterance.pitch;
        
//   //       // Only set events for first and last sentences
//   //       if (index === 0) sentenceUtterance.onstart = () => setIsSpeaking(true);
//   //       if (index === sentences.length - 1) sentenceUtterance.onend = () => setIsSpeaking(false);
        
//   //       setTimeout(() => {
//   //         window.speechSynthesis.speak(sentenceUtterance);
//   //       }, index * 50); // Small delay between sentences helps Edge process them properly
//   //     });
//   //   } else {
//   //     window.speechSynthesis.speak(utterance);
//   //   }
//   // };

//   useEffect(() => {
//     if (voicesLoaded && initialDataFetched && initialSummaryRef.current && !hasSpokenRef.current) {
//       setTimeout(() => {
//         performSpeech(initialSummaryRef.current);
//         hasSpokenRef.current = true;
//       }, 1000);
//     }
//   }, [voicesLoaded, initialDataFetched]);

//   const performSpeech = (text) => {
//     return new Promise((resolve) => {
//       if (!text) return resolve();
  
//       window.speechSynthesis.cancel();
//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.rate = 1.0;
//       utterance.pitch = 1.0;
//       utterance.volume = 1.0;
//       if (selectedVoice) utterance.voice = selectedVoice;
  
//       utterance.onstart = () => {
//         setIsSpeaking(true);
//         resolve(); // Start typing once speaking starts
//       };
//       utterance.onend = () => {
//         setIsSpeaking(false);
//         speechTextRef.current = '';
//       };
//       utterance.onerror = (e) => {
//         console.error('Speech synthesis error:', e);
//         setIsSpeaking(false);
//         speechTextRef.current = '';
//         resolve();
//       };
  
//       window.speechSynthesis.speak(utterance);
//     });
//   };
  
  
//   // Speech wrapper that queues speech until voices are loaded
//   const speak = (text) => {
//     if (!text) return;
    
//     if (!voicesLoaded) {
//       console.log("Voices not loaded yet, queuing speech:", text.substring(0, 30) + "...");
//       pendingSpeechQueue.current.push(text);
//     } else {
//       performSpeech(text);
//     }
//   };
  
//   // const initSpeechRecognition = () => {
//   //   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//   //   if (!SpeechRecognition) {
//   //     console.error('Speech recognition not supported');
//   //     return;
//   //   }

//   //   const recognitionInstance = new SpeechRecognition();
//   //   recognitionInstance.continuous = true;
//   //   recognitionInstance.interimResults = true;
//   //   recognitionInstance.lang = 'en-US';

//   //   recognitionInstance.onresult = (event) => {
//   //     let interim = '';
//   //     let final = '';
//   //     for (let i = event.resultIndex; i < event.results.length; i++) {
//   //       const part = event.results[i][0].transcript;
//   //       if (event.results[i].isFinal) {
//   //         final += part + ' ';
//   //       } else {
//   //         interim += part;
//   //       }
//   //     }

//   //     if (interim) {
//   //       setCurrentUserTranscript(interim);
//   //     }

//   //     if (final.trim()) {
//   //       setCurrentUserTranscript('');
//   //       userResponseRef.current = final.trim();

//   //       setMessages((prev) => [
//   //         ...prev,
//   //         { from: 'user', text: final.trim(), timestamp: Date.now() },
//   //       ]);

//   //       sendUserQuestion(final.trim());
//   //     }

//   //     resetSilenceTimer();
//   //   };

//   //   recognitionInstance.onerror = (e) => console.error('Recognition error:', e.error);
//   //   setRecognition(recognitionInstance);
//   // };

//   const initSpeechRecognition = () => {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) return;

//     const recognitionInstance = new SpeechRecognition();
//     recognitionInstance.continuous = true;
//     recognitionInstance.interimResults = true;
//     recognitionInstance.lang = 'en-US';

//     recognitionInstance.onresult = (event) => {
//       let interim = '', final = '';
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         const part = event.results[i][0].transcript;
//         if (event.results[i].isFinal) final += part + ' ';
//         else interim += part;
//       }

//       if (interim) setCurrentUserTranscript(interim);
//       if (final.trim()) {
//         setCurrentUserTranscript('');
//         userResponseRef.current = final.trim();
//         setMessages((prev) => [...prev, { from: 'user', text: final.trim(), timestamp: Date.now() }]);
//         sendUserQuestion(final.trim());
//       }

//       resetSilenceTimer();
//     };

//     recognitionInstance.onerror = (e) => console.error('Recognition error:', e.error);
//     setRecognition(recognitionInstance);
//   };

//   const resetSilenceTimer = () => {
//     if (silenceTimeout) clearTimeout(silenceTimeout);
//     setSilenceTimeout(setTimeout(() => stopListening(), 3000));
//   };

//   const startListening = () => {
//     if (recognition && !isListening) {
//       recognition.start();
//       setCurrentUserTranscript('');
//       setIsListening(true);
//     }
//   };

//   const stopListening = () => {
//     if (recognition && isListening) {
//       recognition.stop();
//       setIsListening(false);
//       if (silenceTimeout) clearTimeout(silenceTimeout);
//     }
//   };

//   // const fetchInitialOutput = async () => {
//   //   try {
//   //     console.log("Fetching initial output...");
//   //     const res = await fetch("http://localhost:8001/initial_output");
//   //     const data = await res.json();
//   //     console.log("Initial output fetched successfully");
//   //     initialSummaryRef.current = data.summary;
//   //     setInitialDataFetched(true);
//   //     triggerAiReply(data.summary, true);
//   //   } catch (err) {
//   //     console.error("Failed to fetch initial output:", err);
//   //     // Set a retry timer if the backend isn't ready yet
//   //     setTimeout(() => {
//   //       if (!initialDataFetched) {
//   //         console.log("Retrying initial output fetch...");
//   //         fetchInitialOutput();
//   //       }
//   //     }, 3000);
//   //   }
//   // };
  
//   // const sendUserQuestion = async (question) => {
//   //   try {
//   //     const res = await fetch("http://localhost:8001/ask", {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({ question }),
//   //     });
  
//   //     const data = await res.json();
//   //     triggerAiReply(data.answer);
//   //   } catch (err) {
//   //     console.error("Failed to get AI response:", err);
//   //     triggerAiReply("Sorry, something went wrong.");
//   //   }
//   // };

//   // const triggerAiReply = (userText, isIntro = false) => {
//   //   setIsThinking(true);
//   //   const fullReply = isIntro ? userText : userText;
//   //   const chars = fullReply.split('');
//   //   let i = 0;
//   //   let current = '';
  
//   //   // Clean typing state
//   //   setCurrentAiTranscript('');
//   //   const intervalRef = { current: null };
  
//   //   const typingInterval = setInterval(() => {
//   //     if (i < chars.length) {
//   //       current += chars[i];
//   //       i++;
  
//   //       // Bold section titles like "Calendar Summary"
//   //       const formatted = current;
//   //       setCurrentAiTranscript(formatted);
//   //     } else {
//   //       clearInterval(intervalRef.current);
//   //       setMessages((prev) => [
//   //         ...prev,
//   //         { from: 'ai', text: fullReply, timestamp: Date.now() },
//   //       ]);
//   //       setCurrentAiTranscript('');
//   //       setIsThinking(false);
//   //     }
//   //   }, 60); // Faster typing speed for better syncing
  
//   //   intervalRef.current = typingInterval;
  
//   //   // Start speaking
//   //   speak(fullReply);

//   //   // If this is the initial reply and voices aren't loaded, we'll save it for later replay
//   //   if (isIntro) {
//   //     initialSummaryRef.current = fullReply;
//   //   }
//   // };
  
//   // // Preload speech synthesis as early as possible
//   // useEffect(() => {
//   //   // Force speech synthesis to initialize early
//   //   const warmupUtterance = new SpeechSynthesisUtterance('');
//   //   window.speechSynthesis.speak(warmupUtterance);
//   // }, []);
  
//   // // Load voices with better handling
//   // useEffect(() => {
//   //   const loadVoices = () => {
//   //     console.log("Attempting to load voices...");
//   //     const voices = window.speechSynthesis.getVoices();
//   //     if (voices.length > 0) {
//   //       setAvailableVoices(voices);
        
//   //       // Log all available voices for debugging
//   //       console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
//   //       // Priority list for Edge/Windows voices first, then others
//   //       const voiceOptions = [
//   //         // Windows/Edge specific voices (higher quality on Windows)
//   //         'Microsoft Zira',
//   //         'Microsoft Susan',
//   //         'Microsoft Linda',
//   //         'Microsoft Catherine',
//   //         'Microsoft Hazel',
//   //         'Microsoft Heera',
//   //         // Edge's higher quality "online" voices
//   //         'Microsoft Zira Online',
//   //         'Microsoft Catherine Online',
//   //         'Microsoft Susan Online',
//   //         // Other common female voices
//   //         'Google UK English Female',
//   //         'Samantha',
//   //         'Victoria', 
//   //         'Karen'
//   //       ];
        
//   //       // Find the first available voice from our preferences
//   //       let selectedVoiceFound = null;
        
//   //       for (const voiceName of voiceOptions) {
//   //         const voice = voices.find(v => v.name.includes(voiceName));
//   //         if (voice) {
//   //           selectedVoiceFound = voice;
//   //           console.log('Selected preferred voice:', voice.name);
//   //           break;
//   //         }
//   //       }
        
//   //       // If we found a preferred voice, use it, otherwise find any female-sounding voice
//   //       if (selectedVoiceFound) {
//   //         setSelectedVoice(selectedVoiceFound);
//   //       } else {
//   //         // As fallback, try to find any female voice by looking for common female markers in name
//   //         const femaleVoice = voices.find(v => 
//   //           v.name.toLowerCase().includes('female') || 
//   //           v.name.includes('woman') ||
//   //           v.name.includes('girl') ||
//   //           /samantha|siri|alexa|karen|zira|catherine|susan|linda|hazel|heera|emily|joan|allison|ava/i.test(v.name)
//   //         );
          
//   //         if (femaleVoice) {
//   //           console.log('Selected fallback female voice:', femaleVoice.name);
//   //           setSelectedVoice(femaleVoice);
//   //         } else {
//   //           // Last resort: just get any English voice
//   //           const anyEnglishVoice = voices.find(v => v.lang.startsWith('en-'));
//   //           if (anyEnglishVoice) {
//   //             console.log('Selected English voice:', anyEnglishVoice.name);
//   //             setSelectedVoice(anyEnglishVoice);
//   //           }
//   //         }
//   //       }
        
//   //       // Mark voices as loaded to process any queued speech
//   //       setVoicesLoaded(true);
//   //     } else {
//   //       console.log("No voices available yet, will try again");
//   //     }
//   //   };

//   //   // Try loading voices immediately
//   //   loadVoices();
    
//   //   // Some browsers (especially Chromium-based ones like Edge) load voices asynchronously
//   //   window.speechSynthesis.onvoiceschanged = loadVoices;
    
//   //   // If voices don't load within 2 seconds, try again - multiple retries
//   //   const retryIntervals = [500, 1000, 2000, 5000];
    
//   //   retryIntervals.forEach(delay => {
//   //     setTimeout(() => {
//   //       if (!voicesLoaded) {
//   //         console.log(`Retrying voice load after ${delay}ms`);
//   //         loadVoices();
//   //       }
//   //     }, delay);
//   //   });
    
//   //   return () => {
//   //     window.speechSynthesis.onvoiceschanged = null;
//   //   };
//   // }, []);

//   // // Initialize everything else
//   // useEffect(() => {
//   //   // Initialize speech recognition
//   //   initSpeechRecognition();
  
//   //   // Fetch initial output if it hasn't been spoken
//   //   fetchInitialOutput();
  
//   //   // Cleanup on component unmount or page refresh
//   //   return () => {
//   //     // Stop any ongoing speech synthesis when the page is refreshed
//   //     window.speechSynthesis.cancel();
//   //   };
//   // }, []);

//   // useEffect(() => {
//   //   document.title = "AVA";
//   // }, []);

//   const fetchInitialOutput = async () => {
//     if (initialDataFetched || initialSummaryRef.current) return;
//     try {
//       const res = await fetch("http://localhost:8001/initial_output");
//       const data = await res.json();
//       setInitialDataFetched(true);
//       if (!initialSummaryRef.current) {
//         initialSummaryRef.current = data.summary;
//         triggerAiReply(data.summary, true);  // only call once
//       }      
//     } catch (err) {
//       console.error("Initial output fetch failed:", err);
//       setTimeout(fetchInitialOutput, 3000);
//     }
//   };

//   const sendUserQuestion = async (question) => {
//     try {
//       const res = await fetch("http://localhost:8001/ask", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question }),
//       });
//       const data = await res.json();
//       triggerAiReply(data.answer);
//     } catch (err) {
//       console.error("AI response error:", err);
//       triggerAiReply("Sorry, something went wrong.");
//     }
//   };

//   const triggerAiReply = async (userText, isIntro = false) => {
//     if (isIntro && hasSpokenRef.current) return;
  
//     if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
//     setIsThinking(true);
//     const fullReply = userText;
//     speechTextRef.current = fullReply;
//     setCurrentAiTranscript('');
  
//     await performSpeech(fullReply); // Wait before typing starts
  
//     if (isTabVisibleRef.current) {
//       const chars = fullReply.split('');
//       let i = 0, current = '';
//       const interval = setInterval(() => {
//         if (i < chars.length) {
//           current += chars[i++];
//           setCurrentAiTranscript(current);
//         } else {
//           clearInterval(typingIntervalRef.current);
//           setMessages((prev) => [...prev, { from: 'ai', text: fullReply, timestamp: Date.now() }]);
//           setCurrentAiTranscript('');
//           setIsThinking(false);
//         }
//       }, 30);
//       typingIntervalRef.current = interval;
//     } else {
//       setMessages((prev) => [...prev, { from: 'ai', text: fullReply, timestamp: Date.now() }]);
//       setIsThinking(false);
//     }
  
//     if (isIntro) {
//       hasSpokenRef.current = true;
//       initialSummaryRef.current = fullReply;
//     }
//   };
  
//   useEffect(() => {
//     window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
//   }, []);

//   useEffect(() => {
//     const loadVoices = () => {
//       const voices = window.speechSynthesis.getVoices();
//       if (voices.length > 0) {
//         setAvailableVoices(voices);
//         const preferred = voices.find(v => /zira|susan|catherine|samantha|karen/i.test(v.name));
//         setSelectedVoice(preferred || voices.find(v => v.lang.startsWith('en')));
//         setVoicesLoaded(true);
//       }
//     };

//     loadVoices();
//     window.speechSynthesis.onvoiceschanged = loadVoices;
//     return () => window.speechSynthesis.onvoiceschanged = null;
//   }, []);

//   useEffect(() => {
//     initSpeechRecognition();
//     fetchInitialOutput();
//   }, []);
  
//   useEffect(() => {
//     if (voicesLoaded) {
//       setIsInitializing(false);
//     }
//   }, [voicesLoaded]);
  

//   useEffect(() => {
//     document.title = "AVA";
//   }, []);

//   return (
//     <div className="flex items-center justify-center w-screen min-h-screen bg-white">
//       <div className="flex flex-col items-center space-y-6 w-full max-w-2xl">
//         <div className="flex items-center space-x-4">
//           <img src={logo} alt="AVA Logo" className="w-24 h-24 object-contain" />
//           <div className={`w-8 h-8 rounded-full ${isSpeaking ? 'animate-pulse-bigger' : 'bg-green-500'}`} style={{ backgroundColor: isSpeaking ? 'green' : '#26890D', transition: 'transform 0.3s ease-in-out', position: 'relative', top: '24px', right: '12px' }}></div>
//         </div>

//         <div className="w-full max-h-[70vh] overflow-y-auto px-4 py-6 space-y-4 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-300">
//           {isInitializing && (
//             <div className="italic text-gray-500 animate-pulse text-center">Loading voice engine...</div>
//           )}
//           {messages.map((msg, idx) => (
//             <div key={idx} className={`px-5 py-3 rounded-tl-xl rounded-tr-xl ${msg.from === 'user' ? 'rounded-bl-xl self-end ml-auto text-right' : 'rounded-br-xl self-start mr-auto text-left'} text-white text-sm md:text-base max-w-[75%]`} style={{ whiteSpace: 'pre-wrap', backgroundColor: msg.from === 'user' ? 'rgba(0, 124, 176, 0.8)' : 'rgba(38, 137, 13, 0.8)' }}>
//               <strong>{msg.from === 'user' ? 'You' : 'AVA'}:</strong> {msg.text}
//             </div>
//           ))}
//           {currentUserTranscript && (
//             <div className="px-5 py-3 rounded-tl-xl rounded-tr-xl rounded-bl-xl self-end ml-auto text-right italic text-white text-sm md:text-base max-w-[75%] opacity-80" style={{ whiteSpace: 'pre-wrap', backgroundColor: 'rgba(0, 124, 176, 0.5)' }}>
//               <strong>You:</strong> {currentUserTranscript}
//             </div>
//           )}
//           {currentAiTranscript && (
//             <div className="px-5 py-3 rounded-tl-xl rounded-tr-xl rounded-br-xl self-start mr-auto text-left italic text-white text-sm md:text-base max-w-[75%] opacity-80" style={{ whiteSpace: 'pre-wrap', backgroundColor: 'rgba(38, 137, 13, 0.5)' }}>
//               <strong>AVA:</strong> {currentAiTranscript}
//             </div>
//           )}
//           {isThinking && !currentAiTranscript && (
//             <div className="px-5 py-3 rounded-xl bg-green-100 text-green-600 max-w-[75%] self-start mr-auto text-left italic animate-pulse text-sm">
//               AVA is thinking...
//             </div>
//           )}
//         </div>


//         {/* Mic button */}
//         <div className="mt-6">
//           <button
//             onClick={isListening ? stopListening : startListening}
//             className={`w-16 h-16 flex items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 ${
//               isListening ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
//             }`}
//           >
//             {isListening ? (
//               <FaMicrophone className="text-2xl" />
//             ) : (
//               <FaMicrophoneSlash className="text-2xl" />
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;