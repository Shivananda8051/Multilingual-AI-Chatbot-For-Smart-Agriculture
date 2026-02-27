import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlus,
  HiHeart,
  HiOutlineHeart,
  HiChat,
  HiShare,
  HiDotsHorizontal,
  HiPhotograph,
  HiX,
  HiSearch,
  HiHome,
  HiFilm,
  HiUserGroup,
  HiCamera,
  HiVideoCamera,
  HiCheckCircle,
  HiPencil,
  HiTrash,
  HiBookmark,
  HiOutlineBookmark,
  HiPaperAirplane,
  HiTemplate,
  HiLink,
  HiFlag
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { postsAPI, storiesAPI, usersAPI, reelsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Pre-built post templates
const POST_TEMPLATES = [
  { id: 'crop', icon: '🌾', title: 'Crop Update', placeholder: 'Share your crop progress...\n\nCrop: \nStage: \nHealth: \n\n#farming #crops' },
  { id: 'harvest', icon: '🚜', title: 'Harvest Day', placeholder: 'Today\'s harvest!\n\nCrop: \nYield: \nQuality: \n\n#harvest #farming' },
  { id: 'tip', icon: '💡', title: 'Farming Tip', placeholder: 'Here\'s a useful tip I learned...\n\n#farmingtips #agriculture' },
  { id: 'question', icon: '❓', title: 'Ask Community', placeholder: 'I need help with...\n\nHas anyone faced this issue?\n\n#help #community' },
  { id: 'weather', icon: '🌤️', title: 'Weather Impact', placeholder: 'Weather affecting my farm...\n\nCondition: \nImpact: \nAction taken: \n\n#weather #farming' },
  { id: 'market', icon: '📈', title: 'Market Update', placeholder: 'Current market prices in my area...\n\nCrop: \nPrice: \nTrend: \n\n#market #prices' },
];

const Blog = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();

  // Main state
  const [activeTab, setActiveTab] = useState('home');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);

  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', media: [] });
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Edit post state
  const [editingPost, setEditingPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Comments state
  const [expandedComments, setExpandedComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  // Stories state
  const [stories, setStories] = useState([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStoryGroup, setCurrentStoryGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [newStory, setNewStory] = useState({ media: null, caption: '' });
  const [creatingStory, setCreatingStory] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Saved posts
  const [savedPosts, setSavedPosts] = useState([]);

  // Reels state
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [reelCategories, setReelCategories] = useState([]);
  const [selectedReelCategory, setSelectedReelCategory] = useState(null);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [showReelViewer, setShowReelViewer] = useState(false);

  const storiesRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check if user is community member
  useEffect(() => {
    if (user && !user.isCommunityMember) {
      setShowJoinModal(true);
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    if (user?.isCommunityMember) {
      loadPosts();
      loadStories();
      loadReels();
      loadReelCategories();
    }
  }, [user?.isCommunityMember]);

  const loadPosts = async () => {
    try {
      const response = await postsAPI.getPosts();
      setPosts(response.data.posts);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async () => {
    try {
      const response = await storiesAPI.getStories();
      setStories(response.data.stories);
    } catch (error) {
      console.error('Failed to load stories:', error);
    }
  };

  const loadReels = async (category = null) => {
    setReelsLoading(true);
    try {
      const response = await reelsAPI.getReels(category);
      setReels(response.data.reels || []);
    } catch (error) {
      console.error('Failed to load reels:', error);
    } finally {
      setReelsLoading(false);
    }
  };

  const loadReelCategories = async () => {
    try {
      const response = await reelsAPI.getCategories();
      setReelCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleReelCategoryChange = (category) => {
    setSelectedReelCategory(category);
    loadReels(category);
  };

  const handleReelLike = async (reelId) => {
    try {
      const response = await reelsAPI.toggleLike(reelId);
      setReels(prev => prev.map(reel => {
        if (reel._id === reelId) {
          return {
            ...reel,
            likes: response.data.liked
              ? [...reel.likes, user._id]
              : reel.likes.filter(id => id !== user._id)
          };
        }
        return reel;
      }));
    } catch (error) {
      toast.error('Failed to like reel');
    }
  };

  const openReelViewer = (index) => {
    setCurrentReelIndex(index);
    setShowReelViewer(true);
  };

  const handleJoinCommunity = async () => {
    setJoining(true);
    try {
      const response = await usersAPI.joinCommunity();
      const message = response.data.message || 'Welcome to the community!';
      toast.success(message);
      updateUser({
        ...user,
        isCommunityMember: true,
        communityJoinedAt: response.data.user?.communityJoinedAt || new Date()
      });
      setShowJoinModal(false);
      loadPosts();
      loadStories();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to join community. Please check your connection and try again.';
      toast.error(errorMessage);
      console.error('Join community error:', error);
    } finally {
      setJoining(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await postsAPI.toggleLike(postId);
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          const isLiked = response.data.action === 'liked';
          return {
            ...post,
            likes: isLiked
              ? [...post.likes, user._id]
              : post.likes.filter(id => id !== user._id)
          };
        }
        return post;
      }));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleSavePost = (postId) => {
    if (savedPosts.includes(postId)) {
      setSavedPosts(prev => prev.filter(id => id !== postId));
      toast.success('Removed from saved');
    } else {
      setSavedPosts(prev => [...prev, postId]);
      toast.success('Post saved!');
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim() && newPost.media.length === 0) {
      toast.error('Please write something or add media');
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      newPost.media.forEach(file => {
        formData.append('media', file);
      });

      const response = await postsAPI.createPost(formData);
      setPosts(prev => [response.data.post, ...prev]);
      setNewPost({ content: '', media: [] });
      setSelectedTemplate(null);
      setShowCreateModal(false);
      toast.success('Post created!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const handleEditPost = async () => {
    if (!editingPost) return;

    try {
      const response = await postsAPI.updatePost(editingPost._id, {
        content: editingPost.content
      });
      setPosts(prev => prev.map(post =>
        post._id === editingPost._id
          ? response.data.post
          : post
      ));
      setShowEditModal(false);
      setEditingPost(null);
      toast.success('Post updated!');
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsAPI.deletePost(postId);
      setPosts(prev => prev.filter(post => post._id !== postId));
      toast.success('Post deleted!');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleAddComment = async (postId) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await postsAPI.addComment(postId, content);
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), response.data.comment]
          };
        }
        return post;
      }));
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await postsAPI.deleteComment(postId, commentId);
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: post.comments.filter(c => c._id !== commentId)
          };
        }
        return post;
      }));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleShare = async (post) => {
    const shareData = {
      title: 'Check out this post on AgriBot',
      text: post.content?.substring(0, 100) || 'Farming community post',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(window.location.href);
        }
      }
    } else {
      copyToClipboard(window.location.href);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  const handleCreateStory = async () => {
    if (!newStory.media) {
      toast.error('Please select an image or video');
      return;
    }

    setCreatingStory(true);
    try {
      const formData = new FormData();
      formData.append('media', newStory.media);
      if (newStory.caption) {
        formData.append('caption', newStory.caption);
      }

      await storiesAPI.createStory(formData);
      loadStories();
      setNewStory({ media: null, caption: '' });
      setShowStoryModal(false);
      toast.success('Story added!');
    } catch (error) {
      toast.error('Failed to create story');
    } finally {
      setCreatingStory(false);
    }
  };

  const handleViewStory = async (storyGroup, index = 0) => {
    setCurrentStoryGroup(storyGroup);
    setCurrentStoryIndex(index);
    setShowStoryViewer(true);

    if (storyGroup.stories[index]) {
      try {
        await storiesAPI.viewStory(storyGroup.stories[index]._id);
      } catch (error) {
        console.error('Failed to mark story as viewed');
      }
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await usersAPI.searchUsers(query);
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large`);
        return false;
      }
      return true;
    });

    if (validFiles.length + newPost.media.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }
    setNewPost(prev => ({
      ...prev,
      media: [...prev.media, ...validFiles]
    }));
  };

  const removeMedia = (index) => {
    setNewPost(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setNewPost(prev => ({ ...prev, content: template.placeholder }));
  };

  // Join Community Modal
  if (showJoinModal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiUserGroup className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('joinCommunity') || 'Join the Community'}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Connect with fellow farmers, share your experiences, learn from others, and grow together!
          </p>

          <div className="space-y-3 text-left mb-8">
            {[
              'Share posts, photos, and videos',
              'Post stories that disappear in 24 hours',
              'Follow and connect with other farmers',
              'Use templates for quick updates'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleJoinCommunity}
            disabled={joining}
            className="btn btn-primary w-full py-3 text-lg"
          >
            {joining ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <HiUserGroup className="w-6 h-6" />
                Join Community
              </>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-20 lg:pb-0">
      {/* Stories Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl mb-4 p-4">
        <div ref={storiesRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {/* Add Story Button */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <button
              onClick={() => setShowStoryModal(true)}
              className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 transition-colors"
            >
              <HiPlus className="w-6 h-6 text-gray-400" />
            </button>
            <span className="text-xs text-gray-500">Your Story</span>
          </div>

          {/* Stories */}
          {stories.map((storyGroup) => (
            <div
              key={storyGroup.user._id}
              className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
              onClick={() => handleViewStory(storyGroup)}
            >
              <div className={`w-16 h-16 rounded-full p-0.5 ${
                storyGroup.hasUnviewed
                  ? 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {storyGroup.user.avatar ? (
                      <img src={storyGroup.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold">
                        {storyGroup.user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500 truncate w-16 text-center">
                {storyGroup.user._id === user?._id ? 'You' : storyGroup.user.name?.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl mb-4 p-1 flex">
        {[
          { id: 'home', icon: HiHome, label: 'Feed' },
          { id: 'reels', icon: HiFilm, label: 'Reels' },
          { id: 'search', icon: HiSearch, label: 'Search' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'home' && (
        <>
          {/* Create Post Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-600 font-medium">{user?.name?.charAt(0)}</span>
                )}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 text-left px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                What's on your mind?
              </button>
            </div>
            <div className="flex items-center justify-around mt-3 pt-3 border-t dark:border-gray-700">
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600">
                <HiPhotograph className="w-5 h-5" />
                <span className="text-sm">Photo</span>
              </button>
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
                <HiVideoCamera className="w-5 h-5" />
                <span className="text-sm">Video</span>
              </button>
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-purple-500">
                <HiTemplate className="w-5 h-5" />
                <span className="text-sm">Template</span>
              </button>
            </div>
          </div>

          {/* Featured Reels Section in Feed */}
          {reels.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <HiFilm className="w-5 h-5 text-primary-500" />
                  Featured Reels
                </h3>
                <button
                  onClick={() => setActiveTab('reels')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  See All
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {reels.filter(r => r.isFeatured).slice(0, 6).map((reel, index) => (
                  <div
                    key={reel._id}
                    onClick={() => {
                      const featuredReels = reels.filter(r => r.isFeatured);
                      const reelIndex = reels.findIndex(r => r._id === reel._id);
                      setCurrentReelIndex(reelIndex);
                      setShowReelViewer(true);
                    }}
                    className="flex-shrink-0 w-28 cursor-pointer group"
                  >
                    <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-900">
                      {reel.video?.thumbnail ? (
                        <img
                          src={reel.video.thumbnail}
                          alt={reel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                          <HiFilm className="w-8 h-8 text-white/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <HiVideoCamera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-medium line-clamp-2">{reel.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full skeleton" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-24 skeleton rounded" />
                      <div className="h-3 w-16 skeleton rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full skeleton rounded" />
                  <div className="h-64 w-full skeleton rounded-lg" />
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiCamera className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No posts yet. Be the first to share!</p>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                  <HiPlus className="w-5 h-5" />
                  Create Post
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  user={user}
                  onLike={handleLike}
                  onSave={handleSavePost}
                  isSaved={savedPosts.includes(post._id)}
                  onEdit={(post) => { setEditingPost(post); setShowEditModal(true); }}
                  onDelete={handleDeletePost}
                  onShare={handleShare}
                  expandedComments={expandedComments}
                  setExpandedComments={setExpandedComments}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  submittingComment={submittingComment}
                />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'reels' && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <HiFilm className="w-5 h-5 text-primary-500" />
              Featured Agriculture Reels
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => handleReelCategoryChange(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !selectedReelCategory
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {reelCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleReelCategoryChange(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedReelCategory === cat.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reels Grid */}
          {reelsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : reels.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiFilm className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Reels Available</h3>
              <p className="text-gray-500">Check back later for agriculture videos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {reels.map((reel, index) => (
                <motion.div
                  key={reel._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => openReelViewer(index)}
                >
                  {/* Thumbnail */}
                  {reel.video?.thumbnail ? (
                    <img
                      src={reel.video.thumbnail}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <HiFilm className="w-12 h-12 text-white/50" />
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <HiVideoCamera className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {reel.isFeatured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      Featured
                    </div>
                  )}

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h4 className="text-white font-medium text-sm line-clamp-2">{reel.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-white/70 text-xs">
                      <span className="flex items-center gap-1">
                        <HiHeart className="w-3.5 h-3.5" />
                        {reel.likes?.length || 0}
                      </span>
                      <span>{reel.views || 0} views</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reel Viewer Modal */}
      <AnimatePresence>
        {showReelViewer && reels.length > 0 && (
          <ReelViewer
            reels={reels}
            currentIndex={currentReelIndex}
            setCurrentIndex={setCurrentReelIndex}
            onClose={() => setShowReelViewer(false)}
            onLike={handleReelLike}
            currentUserId={user?._id || user?.id}
          />
        )}
      </AnimatePresence>

      {activeTab === 'search' && (
        <SearchTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searching={searching}
          onSearch={handleSearch}
          currentUserId={user?._id || user?.id}
        />
      )}

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            user={user}
            newPost={newPost}
            setNewPost={setNewPost}
            creating={creating}
            onClose={() => { setShowCreateModal(false); setSelectedTemplate(null); setNewPost({ content: '', media: [] }); }}
            onCreate={handleCreatePost}
            onMediaSelect={handleMediaSelect}
            removeMedia={removeMedia}
            templates={POST_TEMPLATES}
            selectedTemplate={selectedTemplate}
            selectTemplate={selectTemplate}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Edit Post Modal */}
      <AnimatePresence>
        {showEditModal && editingPost && (
          <EditPostModal
            post={editingPost}
            setPost={setEditingPost}
            onClose={() => { setShowEditModal(false); setEditingPost(null); }}
            onSave={handleEditPost}
          />
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <AnimatePresence>
        {showStoryModal && (
          <CreateStoryModal
            newStory={newStory}
            setNewStory={setNewStory}
            creating={creatingStory}
            onClose={() => setShowStoryModal(false)}
            onCreate={handleCreateStory}
          />
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      <AnimatePresence>
        {showStoryViewer && currentStoryGroup && (
          <StoryViewer
            storyGroup={currentStoryGroup}
            currentIndex={currentStoryIndex}
            setCurrentIndex={setCurrentStoryIndex}
            onClose={() => setShowStoryViewer(false)}
            onView={storiesAPI.viewStory}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Post Card Component with full functionality
const PostCard = ({
  post, user, onLike, onSave, isSaved, onEdit, onDelete, onShare,
  expandedComments, setExpandedComments, newComment, setNewComment,
  onAddComment, onDeleteComment, submittingComment
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const userId = user?._id || user?.id;
  const isOwner = post.user?._id === userId;
  const isAdmin = user?.role === 'admin';
  const canDelete = isOwner || isAdmin;
  const isLiked = post.likes?.includes(userId);
  const commentCount = post.comments?.length || 0;
  const visibleComments = showAllComments ? post.comments : post.comments?.slice(-2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.user?._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
            {post.user?.avatar ? (
              <img src={post.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-600 font-medium">{post.user?.name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{post.user?.name || 'Farmer'}</p>
            <p className="text-xs text-gray-500">
              {post.user?.location?.city && `${post.user.location.city} • `}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </Link>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <HiDotsHorizontal className="w-5 h-5 text-gray-500" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-20 overflow-hidden">
                {isOwner && (
                  <button
                    onClick={() => { onEdit(post); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    <HiPencil className="w-5 h-5" />
                    <span>Edit post</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => { onDelete(post._id); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-red-500"
                  >
                    <HiTrash className="w-5 h-5" />
                    <span>{isAdmin && !isOwner ? 'Delete post (Admin)' : 'Delete post'}</span>
                  </button>
                )}
                <button
                  onClick={() => { onSave(post._id); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  {isSaved ? <HiBookmark className="w-5 h-5" /> : <HiOutlineBookmark className="w-5 h-5" />}
                  <span>{isSaved ? 'Unsave' : 'Save post'}</span>
                </button>
                <button
                  onClick={() => { copyToClipboard(window.location.href); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  <HiLink className="w-5 h-5" />
                  <span>Copy link</span>
                </button>
                {!isOwner && !isAdmin && (
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-red-500">
                    <HiFlag className="w-5 h-5" />
                    <span>Report</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        </div>
      )}

      {/* Post Media */}
      {post.media && post.media.length > 0 && (
        <div className={`grid gap-0.5 ${
          post.media.length === 1 ? 'grid-cols-1' :
          post.media.length === 2 ? 'grid-cols-2' :
          post.media.length === 3 ? 'grid-cols-2' :
          'grid-cols-2'
        }`}>
          {post.media.slice(0, 4).map((media, i) => (
            <div
              key={i}
              className={`${post.media.length === 1 ? 'aspect-[4/3]' : 'aspect-square'} overflow-hidden relative ${
                post.media.length === 3 && i === 0 ? 'row-span-2' : ''
              }`}
            >
              {media.type === 'video' ? (
                <video src={media.url} className="w-full h-full object-cover" controls />
              ) : (
                <img src={media.url} alt="" className="w-full h-full object-cover" />
              )}
              {i === 3 && post.media.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{post.media.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Likes count */}
      {post.likes?.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <HiHeart className="w-3 h-3 text-white" />
          </div>
          <span>{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</span>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-around px-2 py-1 border-t border-b dark:border-gray-700">
        <button
          onClick={() => onLike(post._id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {isLiked ? <HiHeart className="w-6 h-6" /> : <HiOutlineHeart className="w-6 h-6" />}
          <span className="text-sm font-medium">Like</span>
        </button>
        <button
          onClick={() => setExpandedComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <HiChat className="w-6 h-6" />
          <span className="text-sm font-medium">Comment</span>
        </button>
        <button
          onClick={() => onShare(post)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <HiPaperAirplane className="w-6 h-6 rotate-45" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="p-4">
        {/* View all comments link */}
        {commentCount > 2 && !showAllComments && (
          <button
            onClick={() => setShowAllComments(true)}
            className="text-sm text-gray-500 mb-2 hover:text-gray-700"
          >
            View all {commentCount} comments
          </button>
        )}

        {/* Comments */}
        {visibleComments?.map((comment) => (
          <div key={comment._id} className="flex gap-2 mb-2 group">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
              {comment.user?.avatar ? (
                <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                  {comment.user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2">
                <p className="text-sm font-semibold">{comment.user?.name || 'User'}</p>
                <p className="text-sm">{comment.content}</p>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                <button className="font-semibold hover:text-gray-700">Like</button>
                <button className="font-semibold hover:text-gray-700">Reply</button>
                {comment.user?._id === user?._id && (
                  <button
                    onClick={() => onDeleteComment(post._id, comment._id)}
                    className="font-semibold text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add Comment */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-full">
            <input
              type="text"
              value={newComment[post._id] || ''}
              onChange={(e) => setNewComment(prev => ({ ...prev, [post._id]: e.target.value }))}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
              onKeyPress={(e) => e.key === 'Enter' && onAddComment(post._id)}
            />
            <button
              onClick={() => onAddComment(post._id)}
              disabled={!newComment[post._id]?.trim() || submittingComment[post._id]}
              className="px-4 py-2 text-primary-600 font-semibold text-sm disabled:opacity-50"
            >
              {submittingComment[post._id] ? '...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Helper function for copying
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success('Link copied!');
};

// Search Tab Component
const SearchTab = ({ searchQuery, setSearchQuery, searchResults, searching, onSearch, onFollow, currentUserId }) => {
  const navigate = useNavigate();
  const [followingIds, setFollowingIds] = useState([]);
  const [loadingFollow, setLoadingFollow] = useState(null);

  const handleFollow = async (userId, e) => {
    e.stopPropagation();
    setLoadingFollow(userId);
    try {
      const response = await usersAPI.toggleFollow(userId);
      if (response.data.action === 'followed') {
        setFollowingIds(prev => [...prev, userId]);
        toast.success('Following!');
      } else {
        setFollowingIds(prev => prev.filter(id => id !== userId));
        toast.success('Unfollowed');
      }
    } catch (error) {
      toast.error('Failed to follow user');
    } finally {
      setLoadingFollow(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); onSearch(e.target.value); }}
            placeholder="Search farmers, crops, locations..."
            className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {searching ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : searchResults.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl divide-y dark:divide-gray-700">
          {searchResults.map((resultUser) => {
            const isFollowing = followingIds.includes(resultUser._id);
            const isSelf = resultUser._id === currentUserId;
            return (
              <div
                key={resultUser._id}
                onClick={() => navigate(`/profile/${resultUser._id}`)}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                  {resultUser.avatar ? (
                    <img src={resultUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-600 font-bold">{resultUser.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{resultUser.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {resultUser.location?.city && `${resultUser.location.city} • `}
                    {resultUser.followerCount || 0} followers
                  </p>
                </div>
                {!isSelf && (
                  <button
                    onClick={(e) => handleFollow(resultUser._id, e)}
                    disabled={loadingFollow === resultUser._id}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      isFollowing
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    }`}
                  >
                    {loadingFollow === resultUser._id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : searchQuery.length >= 2 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500">No results for "{searchQuery}"</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <HiSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Search for farmers by name, location, or crops</p>
        </div>
      )}
    </div>
  );
};

// Create Post Modal with Templates
const CreatePostModal = ({ user, newPost, setNewPost, creating, onClose, onCreate, onMediaSelect, removeMedia, templates, selectedTemplate, selectTemplate, t }) => {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold">Create Post</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Section */}
        {showTemplates ? (
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Choose a template</h4>
              <button onClick={() => setShowTemplates(false)} className="text-sm text-primary-600">
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => { selectTemplate(template); setShowTemplates(false); }}
                  className={`p-3 rounded-xl border-2 transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{template.icon}</div>
                  <div className="text-xs font-medium truncate">{template.title}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowTemplates(true)}
            className="mx-4 mt-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 transition-colors flex items-center justify-center gap-2 text-gray-500"
          >
            <HiTemplate className="w-5 h-5" />
            <span className="text-sm font-medium">Use a template</span>
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-600 font-medium">{user?.name?.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user?.name}</p>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full mt-2 bg-transparent outline-none resize-none text-sm"
              />
            </div>
          </div>

          {/* Media Previews */}
          {newPost.media.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {newPost.media.map((file, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {file.type.startsWith('video/') ? (
                    <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                  ) : (
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                  {file.type.startsWith('video/') && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                      Video
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 space-y-3">
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <HiPhotograph className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Photo</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onMediaSelect} />
            </label>
            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <HiVideoCamera className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium">Video</span>
              <input type="file" accept="video/*" className="hidden" onChange={onMediaSelect} />
            </label>
          </div>

          <button
            onClick={onCreate}
            disabled={(!newPost.content.trim() && newPost.media.length === 0) || creating}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {creating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              'Post'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Edit Post Modal
const EditPostModal = ({ post, setPost, onClose, onSave }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/50"
      onClick={onClose}
    />

    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold">Edit Post</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <HiX className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4">
        <textarea
          value={post.content}
          onChange={(e) => setPost({ ...post, content: e.target.value })}
          rows={5}
          className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none resize-none"
        />
      </div>

      <div className="p-4 border-t dark:border-gray-700 flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-medium">
          Cancel
        </button>
        <button onClick={onSave} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium">
          Save Changes
        </button>
      </div>
    </motion.div>
  </div>
);

// Create Story Modal
const CreateStoryModal = ({ newStory, setNewStory, creating, onClose, onCreate }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/50"
      onClick={onClose}
    />

    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold">Add to Story</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <HiX className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {newStory.media ? (
          <div className="relative aspect-[9/16] max-h-64 rounded-lg overflow-hidden bg-black mx-auto">
            {newStory.media.type?.startsWith('video/') ? (
              <video src={URL.createObjectURL(newStory.media)} className="w-full h-full object-contain" controls />
            ) : (
              <img src={URL.createObjectURL(newStory.media)} alt="" className="w-full h-full object-contain" />
            )}
            <button
              onClick={() => setNewStory({ ...newStory, media: null })}
              className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <label className="aspect-[9/16] max-h-64 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 mx-auto">
            <HiCamera className="w-10 h-10 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Add photo or video</span>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => setNewStory({ ...newStory, media: e.target.files[0] })}
            />
          </label>
        )}

        <input
          type="text"
          value={newStory.caption}
          onChange={(e) => setNewStory({ ...newStory, caption: e.target.value })}
          placeholder="Add a caption..."
          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none"
          maxLength={200}
        />
      </div>

      <div className="p-4 border-t dark:border-gray-700">
        <button
          onClick={onCreate}
          disabled={!newStory.media || creating}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {creating ? 'Sharing...' : 'Share to Story'}
        </button>
      </div>
    </motion.div>
  </div>
);

// Reel Viewer - Full screen video player
const ReelViewer = ({ reels, currentIndex, setCurrentIndex, onClose, onLike, currentUserId }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const reel = reels[currentIndex];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentIndex]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const isLiked = reel?.likes?.includes(currentUserId);

  if (!reel) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
      >
        <HiX className="w-6 h-6" />
      </button>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {currentIndex < reels.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Video Container */}
      <div className="relative w-full max-w-md h-full max-h-[90vh] bg-black">
        <video
          ref={videoRef}
          src={reel.video?.url}
          className="w-full h-full object-contain"
          loop
          playsInline
          muted={isMuted}
          onClick={togglePlay}
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-20 h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Reel Counter */}
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
          {currentIndex + 1} / {reels.length}
        </div>

        {/* Right Side Actions */}
        <div className="absolute right-4 bottom-32 flex flex-col gap-4">
          <button
            onClick={() => onLike(reel._id)}
            className="flex flex-col items-center gap-1"
          >
            {isLiked ? (
              <HiHeart className="w-8 h-8 text-red-500" />
            ) : (
              <HiOutlineHeart className="w-8 h-8 text-white" />
            )}
            <span className="text-white text-xs">{reel.likes?.length || 0}</span>
          </button>

          <button
            onClick={toggleMute}
            className="flex flex-col items-center gap-1"
          >
            {isMuted ? (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
            <span className="text-white text-xs">{isMuted ? 'Muted' : 'Sound'}</span>
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="text-white font-semibold text-lg mb-1">{reel.title}</h3>
          {reel.description && (
            <p className="text-white/80 text-sm line-clamp-2 mb-2">{reel.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {reel.tags?.map(tag => (
              <span key={tag} className="text-primary-400 text-sm">#{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2 text-white/60 text-sm">
            <span>{reel.views || 0} views</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Story Viewer
const StoryViewer = ({ storyGroup, currentIndex, setCurrentIndex, onClose, onView }) => {
  const [progress, setProgress] = useState(0);
  const story = storyGroup.stories[currentIndex];

  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        if (currentIndex < storyGroup.stories.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setProgress(0);
          onView(storyGroup.stories[currentIndex + 1]._id);
        } else {
          onClose();
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, storyGroup.stories.length]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < storyGroup.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      onView(storyGroup.stories[currentIndex + 1]._id);
    } else {
      onClose();
    }
  };

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50"
    >
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {storyGroup.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            {storyGroup.user.avatar ? (
              <img src={storyGroup.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white font-bold">
                {storyGroup.user.name?.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{storyGroup.user.name}</p>
            <p className="text-white/60 text-xs">{formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-white">
          <HiX className="w-6 h-6" />
        </button>
      </div>

      {/* Story content */}
      <div className="w-full h-full flex items-center justify-center">
        {story.media?.type === 'video' ? (
          <video src={story.media.url} className="max-w-full max-h-full object-contain" autoPlay muted />
        ) : (
          <img src={story.media?.url} alt="" className="max-w-full max-h-full object-contain" />
        )}
      </div>

      {/* Caption */}
      {story.caption && (
        <div className="absolute bottom-8 left-4 right-4 text-center">
          <p className="text-white text-lg drop-shadow-lg bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
            {story.caption}
          </p>
        </div>
      )}

      {/* Navigation */}
      <button onClick={handlePrev} className="absolute left-0 top-0 bottom-0 w-1/3" />
      <button onClick={handleNext} className="absolute right-0 top-0 bottom-0 w-1/3" />
    </motion.div>
  );
};

export default Blog;
