import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHeart,
  HiOutlineHeart,
  HiChat,
  HiShare,
  HiVolumeUp,
  HiVolumeOff,
  HiX,
  HiChevronUp,
  HiChevronLeft,
  HiChevronRight,
  HiPlay,
  HiEye,
  HiClock,
  HiDotsVertical,
  HiPlus,
  HiVideoCamera,
  HiArrowLeft
} from 'react-icons/hi';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { reelsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'farming_tips', name: 'Farming Tips' },
  { id: 'crop_care', name: 'Crop Care' },
  { id: 'irrigation', name: 'Irrigation' },
  { id: 'organic_farming', name: 'Organic Farming' },
  { id: 'pest_control', name: 'Pest Control' },
  { id: 'harvesting', name: 'Harvesting' },
  { id: 'equipment', name: 'Equipment' },
  { id: 'success_stories', name: 'Success Stories' },
  { id: 'weather', name: 'Weather Tips' },
  { id: 'market', name: 'Market Insights' }
];

const Shorts = () => {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null); // For desktop view
  const [isDesktop, setIsDesktop] = useState(false);

  // User posting state
  const [showCreateShort, setShowCreateShort] = useState(false);
  const [creatingShort, setCreatingShort] = useState(false);
  const [shortForm, setShortForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    category: 'farming_tips',
    tags: ''
  });

  const videoRefs = useRef([]);
  const desktopVideoRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const viewedReelsRef = useRef(new Set()); // Track viewed reels to avoid duplicate counts
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    loadReels();
  }, []);

  // Mobile: Play current video, pause others, track view
  useEffect(() => {
    if (isDesktop) return;
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(() => {});
          // Track view for current reel
          if (reels[currentIndex]) {
            trackView(reels[currentIndex]._id);
          }
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex, isDesktop, reels]);

  // Desktop: Play selected video
  useEffect(() => {
    if (selectedReel && desktopVideoRef.current) {
      desktopVideoRef.current.play().catch(() => {});
    }
  }, [selectedReel]);

  const loadReels = async () => {
    try {
      setLoading(true);
      const response = await reelsAPI.getReels();
      setReels(response.data.reels);
    } catch (error) {
      console.error('Failed to load reels:', error);
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  // Track view for a reel (only once per session)
  const trackView = async (reelId) => {
    if (viewedReelsRef.current.has(reelId)) return;

    viewedReelsRef.current.add(reelId);
    try {
      const response = await reelsAPI.trackView(reelId);
      const newViews = response.data.views;

      // Update local state to reflect new view count
      setReels(prev => prev.map(reel =>
        reel._id === reelId
          ? { ...reel, views: newViews }
          : reel
      ));

      // Also update selectedReel if it's the current one (for desktop modal)
      if (selectedReel && selectedReel._id === reelId) {
        setSelectedReel(prev => ({ ...prev, views: newViews }));
      }
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  // Create new short (user submission)
  const handleCreateShort = async (e) => {
    e.preventDefault();
    if (!shortForm.title.trim() || !shortForm.videoUrl.trim()) {
      toast.error('Title and Video URL are required');
      return;
    }

    setCreatingShort(true);
    try {
      const tagsArray = shortForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      await reelsAPI.createUserShort({
        title: shortForm.title.trim(),
        description: shortForm.description.trim(),
        videoUrl: shortForm.videoUrl.trim(),
        category: shortForm.category,
        tags: tagsArray
      });

      toast.success('Short submitted successfully!');
      setShowCreateShort(false);
      setShortForm({
        title: '',
        description: '',
        videoUrl: '',
        category: 'farming_tips',
        tags: ''
      });
      loadReels(); // Refresh the list
    } catch (error) {
      console.error('Failed to create short:', error);
      toast.error(error.response?.data?.message || 'Failed to submit short');
    } finally {
      setCreatingShort(false);
    }
  };

  // Mobile touch handlers
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  const handleWheel = (e) => {
    if (isDesktop && !selectedReel) return; // Disable wheel scroll on desktop grid
    if (e.deltaY > 0 && currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleLike = async (reelId) => {
    try {
      const response = await reelsAPI.toggleLike(reelId);
      setReels(prev => prev.map(reel =>
        reel._id === reelId
          ? {
              ...reel,
              likes: response.data.liked
                ? [...reel.likes, user._id]
                : reel.likes.filter(id => id !== user._id)
            }
          : reel
      ));
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const loadComments = async (reelId) => {
    setLoadingComments(true);
    try {
      const response = await reelsAPI.getComments(reelId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenComments = (reelId) => {
    setShowComments(true);
    loadComments(reelId);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const targetReel = selectedReel || reels[currentIndex];
    setSubmittingComment(true);

    try {
      const response = await reelsAPI.addComment(targetReel._id, newComment.trim());
      setComments(prev => [response.data.comment, ...prev]);
      setNewComment('');

      setReels(prev => prev.map(reel =>
        reel._id === targetReel._id
          ? { ...reel, comments: [...(reel.comments || []), response.data.comment] }
          : reel
      ));

      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async (platform) => {
    const targetReel = selectedReel || reels[currentIndex];
    const shareUrl = `${window.location.origin}/reels?id=${targetReel._id}`;
    const shareText = `Check out this farming tip: ${targetReel.title}`;

    try {
      await reelsAPI.shareReel(targetReel._id);
      setReels(prev => prev.map(reel =>
        reel._id === targetReel._id
          ? { ...reel, shares: (reel.shares || 0) + 1 }
          : reel
      ));
    } catch (error) {
      console.error('Failed to track share:', error);
    }

    let shareLink = '';
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
        setShowShare(false);
        return;
      default:
        if (navigator.share) {
          try {
            await navigator.share({ title: targetReel.title, text: shareText, url: shareUrl });
          } catch (e) {}
        }
        setShowShare(false);
        return;
    }

    if (shareLink) {
      window.open(shareLink, '_blank');
    }
    setShowShare(false);
  };

  const togglePlayPause = () => {
    const video = isDesktop ? desktopVideoRef.current : videoRefs.current[currentIndex];
    if (video) {
      if (video.paused) {
        video.play();
        setPaused(false);
      } else {
        video.pause();
        setPaused(true);
      }
    }
  };

  const openReelPlayer = (reel) => {
    setSelectedReel(reel);
    setPaused(false);
    setMuted(false);
    loadComments(reel._id); // Load comments when opening reel
    trackView(reel._id); // Track view when opening reel
  };

  const closeReelPlayer = () => {
    if (desktopVideoRef.current) {
      desktopVideoRef.current.pause();
    }
    setSelectedReel(null);
    setShowComments(false);
  };

  // Navigate to next/previous reel in desktop modal
  const navigateReel = (direction) => {
    if (!selectedReel) return;
    const currentIdx = reels.findIndex(r => r._id === selectedReel._id);
    if (currentIdx === -1) return;

    let newIdx;
    if (direction === 'next') {
      newIdx = currentIdx < reels.length - 1 ? currentIdx + 1 : 0;
    } else {
      newIdx = currentIdx > 0 ? currentIdx - 1 : reels.length - 1;
    }

    const newReel = reels[newIdx];
    if (desktopVideoRef.current) {
      desktopVideoRef.current.pause();
    }
    setSelectedReel(newReel);
    setPaused(false);
    loadComments(newReel._id);
    trackView(newReel._id);
  };

  // Keyboard navigation for desktop modal
  useEffect(() => {
    if (!selectedReel || !isDesktop) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          navigateReel('next');
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          navigateReel('prev');
          break;
        case 'Escape':
          closeReelPlayer();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'm':
          setMuted(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReel, isDesktop, reels]);

  const currentReel = selectedReel || reels[currentIndex];
  const isLiked = currentReel?.likes?.includes(user?._id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <HiPlay className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">No Shorts Available</h2>
        <p className="text-gray-400">Check back later for farming tips!</p>
      </div>
    );
  }

  // ============== DESKTOP VIEW (YouTube-style Grid) ==============
  if (isDesktop) {
    return (
      <div className="pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Farming Shorts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quick tips and tutorials for better farming
            </p>
          </div>
          <button
            onClick={() => setShowCreateShort(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Create Short
          </button>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {reels.map((reel) => (
            <motion.div
              key={reel._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group cursor-pointer"
              onClick={() => openReelPlayer(reel)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
                {reel.video?.thumbnail ? (
                  <img
                    src={reel.video.thumbnail}
                    alt={reel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <video
                    src={reel.video?.url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
                    <HiPlay className="w-7 h-7 text-gray-900 ml-1" />
                  </div>
                </div>

                {/* Duration/Views Badge */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-black/70 text-white text-xs rounded-md flex items-center gap-1">
                    <HiEye className="w-3 h-3" />
                    {reel.views?.toLocaleString() || 0}
                  </span>
                  <span className="px-2 py-0.5 bg-black/70 text-white text-xs rounded-md">
                    {reel.category?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="mt-3 px-1">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {reel.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                  {reel.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <HiHeart className="w-3.5 h-3.5" />
                    {reel.likes?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <HiChat className="w-3.5 h-3.5" />
                    {reel.comments?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <HiClock className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop Video Player Modal */}
        <AnimatePresence>
          {selectedReel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={closeReelPlayer}
            >
              {/* Previous Button */}
              <button
                onClick={(e) => { e.stopPropagation(); navigateReel('prev'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <HiChevronLeft className="w-8 h-8 text-white" />
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => { e.stopPropagation(); navigateReel('next'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <HiChevronRight className="w-8 h-8 text-white" />
              </button>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative flex gap-4 max-w-5xl w-full max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Video Container */}
                <div className="relative bg-black rounded-2xl overflow-hidden" style={{ width: '400px', height: '711px' }}>
                  <video
                    ref={desktopVideoRef}
                    src={selectedReel.video?.url}
                    className="w-full h-full object-cover"
                    loop
                    muted={muted}
                    playsInline
                    onClick={togglePlayPause}
                  />

                  {/* Pause Indicator */}
                  <AnimatePresence>
                    {paused && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                          <HiPlay className="w-10 h-10 text-white ml-1" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Close Button */}
                  <button
                    onClick={closeReelPlayer}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <HiX className="w-6 h-6 text-white" />
                  </button>

                  {/* Mute Button */}
                  <button
                    onClick={() => setMuted(!muted)}
                    className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    {muted ? (
                      <HiVolumeOff className="w-5 h-5 text-white" />
                    ) : (
                      <HiVolumeUp className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>

                {/* Info Panel */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden flex flex-col max-h-[711px]">
                  {/* Header */}
                  <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedReel.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedReel.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                        {selectedReel.category?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {selectedReel.views?.toLocaleString()} views
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-4">
                      <button
                        onClick={() => handleLike(selectedReel._id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                          isLiked
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {isLiked ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
                        <span className="text-sm font-medium">{selectedReel.likes?.length || 0}</span>
                      </button>
                      <button
                        onClick={() => setShowShare(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <HiShare className="w-5 h-5" />
                        <span className="text-sm font-medium">Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b dark:border-gray-700">
                      <h3 className="font-semibold text-sm">Comments ({comments.length})</h3>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {loadingComments ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No comments yet. Be the first!
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment._id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              {comment.user?.avatar ? (
                                <img
                                  src={comment.user.avatar}
                                  alt={comment.user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium">
                                  {comment.user?.name?.charAt(0) || '?'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-xs">{comment.user?.name}</span>
                                <span className="text-xs text-gray-400">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm mt-0.5">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Comment Input */}
                    <div className="p-4 border-t dark:border-gray-700">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                        />
                        <button
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim() || submittingComment}
                          className="px-4 py-2 bg-primary-500 text-white text-sm rounded-full disabled:opacity-50 hover:bg-primary-600 transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Modal for Desktop */}
        <AnimatePresence>
          {showShare && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"
              onClick={() => setShowShare(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-80"
              >
                <h3 className="font-semibold text-lg mb-4 text-center">Share to</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <FaWhatsapp className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs">WhatsApp</span>
                  </button>
                  <button onClick={() => handleShare('telegram')} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <FaTelegram className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs">Telegram</span>
                  </button>
                  <button onClick={() => handleShare('copy')} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <HiShare className="w-6 h-6" />
                    </div>
                    <span className="text-xs">Copy</span>
                  </button>
                  <button onClick={() => handleShare('native')} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <HiDotsVertical className="w-6 h-6" />
                    </div>
                    <span className="text-xs">More</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowShare(false)}
                  className="w-full py-2 text-center text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Short Modal */}
        <AnimatePresence>
          {showCreateShort && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowCreateShort(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <HiVideoCamera className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Create Short</h3>
                  </div>
                  <button
                    onClick={() => setShowCreateShort(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateShort} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shortForm.title}
                      onChange={(e) => setShortForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="What's your short about?"
                      className="input w-full"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={shortForm.description}
                      onChange={(e) => setShortForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Share farming tips or experiences..."
                      className="input w-full"
                      rows={3}
                    />
                  </div>

                  {/* Video URL */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Video URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={shortForm.videoUrl}
                      onChange={(e) => setShortForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://example.com/video.mp4"
                      className="input w-full"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste a direct link to your video (YouTube, Google Drive, or direct MP4 link)
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={shortForm.category}
                      onChange={(e) => setShortForm(prev => ({ ...prev, category: e.target.value }))}
                      className="input w-full"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tags / Hashtags
                    </label>
                    <input
                      type="text"
                      value={shortForm.tags}
                      onChange={(e) => setShortForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="farming, tips, organic (comma-separated)"
                      className="input w-full"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateShort(false)}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingShort}
                      className="btn btn-primary flex-1"
                    >
                      {creatingShort ? 'Submitting...' : 'Post Short'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ============== MOBILE VIEW (TikTok-style Full Screen) ==============
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden z-40"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <HiArrowLeft className="w-6 h-6 text-white" />
      </button>

      {/* Reels Container */}
      <div
        className="h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {reels.map((reel, index) => (
          <div key={reel._id} className="h-full w-full relative">
            {/* Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={reel.video?.url}
              poster={reel.video?.thumbnail}
              className="h-full w-full object-cover"
              loop
              muted={muted}
              playsInline
              onClick={togglePlayPause}
            />

            {/* Pause Indicator */}
            <AnimatePresence>
              {paused && index === currentIndex && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                    <HiPlay className="w-10 h-10 text-white ml-1" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

            {/* Content Info (Bottom) */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pb-20">
              <h3 className="text-white font-bold text-lg mb-1">{reel.title}</h3>
              <p className="text-white/80 text-sm line-clamp-2">{reel.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {reel.category?.replace('_', ' ')}
                </span>
                <span className="text-xs text-white/60">
                  {reel.views?.toLocaleString()} views
                </span>
              </div>
            </div>

            {/* Actions (Right Side) */}
            {index === currentIndex && (
              <div className="absolute right-2 bottom-32 flex flex-col items-center gap-6">
                {/* Like */}
                <button
                  onClick={() => handleLike(reel._id)}
                  className="flex flex-col items-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isLiked ? 'bg-red-500' : 'bg-white/20'
                  }`}>
                    {isLiked ? (
                      <HiHeart className="w-7 h-7 text-white" />
                    ) : (
                      <HiOutlineHeart className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <span className="text-white text-xs mt-1">{reel.likes?.length || 0}</span>
                </button>

                {/* Comment */}
                <button
                  onClick={() => handleOpenComments(reel._id)}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <HiChat className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white text-xs mt-1">{reel.comments?.length || 0}</span>
                </button>

                {/* Share */}
                <button
                  onClick={() => setShowShare(true)}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <HiShare className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white text-xs mt-1">{reel.shares || 0}</span>
                </button>

                {/* Mute/Unmute */}
                <button
                  onClick={() => setMuted(!muted)}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                >
                  {muted ? (
                    <HiVolumeOff className="w-5 h-5 text-white" />
                  ) : (
                    <HiVolumeUp className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Indicators */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        {reels.map((_, index) => (
          <div
            key={index}
            className={`w-1 rounded-full transition-all ${
              index === currentIndex ? 'h-6 bg-white' : 'h-2 bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Swipe Hint */}
      {currentIndex === 0 && reels.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/60"
        >
          <HiChevronUp className="w-6 h-6 animate-bounce" />
          <span className="text-xs">Swipe up for more</span>
        </motion.div>
      )}

      {/* Mobile Comments Modal */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute inset-x-0 bottom-0 h-[70%] bg-white dark:bg-gray-900 rounded-t-3xl z-50"
          >
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="h-[calc(100%-140px)] overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No comments yet. Be the first!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {comment.user?.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {comment.user?.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.user?.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="px-4 py-2 bg-primary-500 text-white rounded-full disabled:opacity-50"
                >
                  {submittingComment ? '...' : 'Post'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Share Modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowShare(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6"
            >
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6" />
              <h3 className="font-semibold text-lg mb-4 text-center">Share to</h3>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                    <FaWhatsapp className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs">WhatsApp</span>
                </button>
                <button onClick={() => handleShare('telegram')} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center">
                    <FaTelegram className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs">Telegram</span>
                </button>
                <button onClick={() => handleShare('copy')} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <HiShare className="w-7 h-7" />
                  </div>
                  <span className="text-xs">Copy Link</span>
                </button>
                <button onClick={() => handleShare('native')} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <HiDotsVertical className="w-7 h-7" />
                  </div>
                  <span className="text-xs">More</span>
                </button>
              </div>
              <button
                onClick={() => setShowShare(false)}
                className="w-full py-3 text-center text-gray-500"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shorts;
