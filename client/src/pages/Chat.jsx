import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPaperAirplane, HiMicrophone, HiVolumeUp, HiLightBulb, HiPhotograph, HiX, HiThumbUp, HiThumbDown, HiPlus, HiClock, HiChevronLeft } from 'react-icons/hi';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { chatAPI, diseaseAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../hooks/useVoice';
import { formatMarkdown } from '../utils/formatMarkdown';
import VoiceChat from '../components/common/VoiceChat';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { t, language } = useLanguage();
  const {
    speak,
    isSpeaking,
    isLoading: voiceLoading,
    stopSpeaking,
    isSupported
  } = useVoice();

  useEffect(() => {
    loadHistory();
    // Cleanup voice chat when leaving page
    return () => {
      setShowVoiceChat(false);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const response = await chatAPI.getHistory();
      if (response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSend = async (e, suggestionText = null) => {
    e?.preventDefault();

    const messageToSend = suggestionText || input.trim();
    if (!messageToSend || loading) return;

    setInput('');
    setSuggestions([]); // Clear previous suggestions

    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(messageToSend, language);
      const assistantMessage = response.data.message;
      const newSuggestions = response.data.suggestions || [];

      setMessages(prev => [...prev, {
        _id: assistantMessage._id,
        role: 'assistant',
        content: assistantMessage.content
      }]);

      // Set new suggestions
      setSuggestions(newSuggestions);

      // Auto-speak the response
      if (isSupported) {
        speak(assistantMessage.content);
      }
    } catch (error) {
      toast.error(t('failedToGetResponse'));
      // Remove the user message if failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    // Optionally auto-send the suggestion
    handleSend(null, suggestion);
  };

  const handleClearChat = async () => {
    try {
      await chatAPI.clearHistory();
      setMessages([]);
      setSuggestions([]);
      toast.success(t('chatCleared'));
    } catch (error) {
      toast.error(t('failedToClearChat'));
    }
  };

  const handleNewChat = async () => {
    try {
      await chatAPI.clearHistory();
      setMessages([]);
      setSuggestions([]);
      setShowHistory(false);
      toast.success(t('newChatStarted') || 'New chat started');
    } catch (error) {
      toast.error(t('failedToStartNewChat') || 'Failed to start new chat');
    }
  };

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await chatAPI.getSessions();
      setChatSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setChatSessions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    loadChatHistory();
  };

  const loadSession = async (sessionId) => {
    try {
      const response = await chatAPI.getSession(sessionId);
      setMessages(response.data.messages || []);
      setShowHistory(false);
      setSuggestions([]);
    } catch (error) {
      toast.error('Failed to load chat session');
    }
  };

  const handleSpeakMessage = (content) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(content);
    }
  };

  const handleFeedback = async (messageId, feedbackType) => {
    try {
      const response = await chatAPI.submitFeedback(messageId, feedbackType);

      // Update local state with the new feedback
      setMessages(prev => prev.map(msg =>
        msg._id === messageId
          ? { ...msg, feedback: response.data.feedback }
          : msg
      ));

      if (response.data.feedback) {
        toast.success(feedbackType === 'helpful' ? t('thanksForFeedback') : t('weWillImprove'));
      }
    } catch (error) {
      toast.error(t('failedToSubmitFeedback'));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('imageSizeError'));
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(t('selectImageFile'));
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendImage = async () => {
    if (!selectedImage || isAnalyzingImage) return;

    setIsAnalyzingImage(true);
    setSuggestions([]);

    // Add user message with image preview to chat
    const previewUrl = imagePreview;
    setMessages(prev => [...prev, {
      role: 'user',
      content: t('analyzingCropImage'),
      imageUrl: previewUrl
    }]);

    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('language', language);

    try {
      const response = await diseaseAPI.detect(formData);
      const result = response.data.result;

      // Add assistant response with analysis
      const severityLabels = {
        healthy: t('healthy'),
        mild: t('mild'),
        moderate: t('moderate'),
        severe: t('severe'),
        unknown: t('unknown')
      };

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**${t('diseaseDetectionResult')}**\n\n**${t('severity')}:** ${severityLabels[result.severity] || result.severity}\n\n${result.analysis}`,
        isAnalysis: true
      }]);

      // Auto-speak the response
      if (isSupported) {
        speak(result.analysis);
      }

      toast.success(t('imageAnalyzedSuccess'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('failedToAnalyzeImage'));
      // Remove the user message on failure
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAnalyzingImage(false);
      handleRemoveImage();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] lg:min-h-[calc(100vh-8rem)] pb-20 lg:pb-16">
      {/* Header - compact on mobile */}
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
          {showHistory ? (
            <button
              onClick={() => setShowHistory(false)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
          ) : null}
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{showHistory ? (t('history') || 'History') : 'AgriBot'}</h1>
            {!showHistory && <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">{t('yourAgriculturalAssistant')}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {!showHistory && (
            <>
              <button
                onClick={handleNewChat}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors text-sm"
              >
                <HiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('newChat') || 'New'}</span>
              </button>
              <button
                onClick={handleShowHistory}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                <HiClock className="w-4 h-4" />
                <span className="hidden sm:inline">{t('history') || 'History'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* History View */}
      {showHistory ? (
        <div className="flex-1">
          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <HiClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t('noHistory') || 'No chat history yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <button
                  key={session._id}
                  onClick={() => loadSession(session._id)}
                  className="w-full text-left p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <p className="font-medium text-sm truncate">{session.title || session.firstMessage || 'Chat'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(session.createdAt).toLocaleDateString()} • {session.messageCount || 0} messages
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
      /* Messages - natural flow, page scrolls */
      <div className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full gradient-primary flex items-center justify-center mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">🌾</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">{t('welcomeToAgriBot')}</h2>
            <p className="text-gray-500 max-w-md mb-2 text-sm sm:text-base">
              {t('agriBotIntro')}
            </p>
            <p className="text-xs sm:text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-3 py-2 rounded-lg max-w-md">
              {t('agriOnlyNote')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4 sm:mt-6">
              {[
                t('suggestionRiceYield'),
                t('suggestionTomatoes'),
                t('suggestionCotton'),
                t('suggestionWheat'),
                t('suggestionPMKisan'),
                t('suggestionOrganic')
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="btn btn-outline text-xs sm:text-sm py-1.5 px-2.5 sm:py-2 sm:px-3"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4 pb-2">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 ${
                    message.role === 'user'
                      ? 'message-user'
                      : 'message-assistant'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div>
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Uploaded crop"
                          className="max-w-full max-h-48 rounded-lg mb-2 object-contain"
                        />
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 prose-strong:text-inherit">
                      <ReactMarkdown>{formatMarkdown(message.content)}</ReactMarkdown>
                    </div>
                  )}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-2">
                      {/* Feedback buttons */}
                      {message._id && (
                        <>
                          <button
                            onClick={() => handleFeedback(message._id, 'helpful')}
                            className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${
                              message.feedback === 'helpful'
                                ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                : 'text-gray-400 hover:text-green-600'
                            }`}
                            title={t('helpful')}
                          >
                            <HiThumbUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message._id, 'not_helpful')}
                            className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${
                              message.feedback === 'not_helpful'
                                ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                            title={t('notHelpful')}
                          >
                            <HiThumbDown className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {/* Voice button */}
                      {isSupported && (
                        <button
                          onClick={() => handleSpeakMessage(message.content)}
                          disabled={voiceLoading}
                          className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${isSpeaking ? 'text-primary-600 bg-primary-50' : ''} ${voiceLoading ? 'opacity-50 cursor-wait' : ''}`}
                          title={isSpeaking ? t('stopSpeaking') : t('listenToResponse')}
                        >
                          {voiceLoading ? (
                            <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                          ) : (
                            <HiVolumeUp className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="message-assistant p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggestions */}
        {!loading && suggestions.length > 0 && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start gap-2 mt-2"
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1">
              <HiLightBulb className="w-4 h-4 text-amber-500" />
              <span>{t('relatedQuestions')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-200 dark:border-primary-800"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
        </div>
        )}
      </div>
      )}

      {/* Input Area - ChatGPT Style - Fixed above footer */}
      {!showHistory && (
      <div className="fixed bottom-14 lg:bottom-0 left-0 right-0 lg:left-64 px-3 sm:px-4 lg:px-6 pt-2 pb-2 bg-gray-50 dark:bg-gray-900 z-20">
        {/* Image Preview */}
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative inline-block mb-2 ml-2"
          >
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-24 rounded-xl border-2 border-gray-600"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1.5 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors shadow-lg"
            >
              <HiX className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        {/* ChatGPT-style input container */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (selectedImage) { handleSendImage(); } else { handleSend(e); } }}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/80 rounded-full px-2 py-1.5 shadow-sm border border-gray-200 dark:border-gray-600"
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Plus/Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzingImage}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex-shrink-0"
            title={t('uploadCropImage')}
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Mic Button - Opens Voice Chat */}
          <button
            type="button"
            onClick={() => setShowVoiceChat(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-colors flex-shrink-0"
            title="Voice Chat"
          >
            <HiMicrophone className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 min-w-0 relative">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (selectedImage) {
                    handleSendImage();
                  } else {
                    handleSend();
                  }
                }
              }}
              placeholder={t('typeMessage') || 'Ask anything'}
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base py-2 px-1"
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || loading || isAnalyzingImage}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${
              (!input.trim() && !selectedImage) || loading || isAnalyzingImage
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gray-700 dark:bg-gray-500 hover:bg-gray-800 dark:hover:bg-gray-400 text-white'
            }`}
          >
            {isAnalyzingImage ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </form>
      </div>
      )}

      {/* Voice Chat Overlay */}
      <VoiceChat
        isOpen={showVoiceChat}
        onClose={() => {
          setShowVoiceChat(false);
          // Reload chat history after voice chat
          loadHistory();
        }}
      />
    </div>
  );
};

export default Chat;
