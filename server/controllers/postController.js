const Post = require('../models/Post');
const notificationService = require('../services/notificationService');
const translationService = require('../services/translationService');
const User = require('../models/User');

// Helper to get user's preferred language
const getUserLanguage = async (req) => {
  const language = req.query.language || req.body.language;
  if (language) return language;

  if (req.user && req.user.preferredLanguage) {
    return req.user.preferredLanguage;
  }

  try {
    const user = await User.findById(req.user._id).select('preferredLanguage');
    return user?.preferredLanguage || 'en';
  } catch {
    return 'en';
  }
};

// Helper to translate post content
const translatePost = async (post, targetLang) => {
  if (!post || targetLang === 'en') return post;

  const postObj = post.toObject ? post.toObject() : { ...post };

  // Translate post content
  if (postObj.content) {
    const translated = await translationService.translateFromEnglish(postObj.content, targetLang);
    postObj.translatedContent = translated.translatedText;
  }

  // Translate comments
  if (postObj.comments && postObj.comments.length > 0) {
    postObj.comments = await Promise.all(
      postObj.comments.map(async (comment) => {
        if (comment.content) {
          const translated = await translationService.translateFromEnglish(comment.content, targetLang);
          return { ...comment, translatedContent: translated.translatedText };
        }
        return comment;
      })
    );
  }

  return postObj;
};

// @desc    Get all posts (feed)
// @route   GET /api/posts
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, hashtag } = req.query;
    const skip = (page - 1) * limit;
    const targetLang = await getUserLanguage(req);

    // Build query
    const query = { isActive: true };
    if (category) query.category = category;
    if (hashtag) query.hashtags = hashtag.toLowerCase();

    const posts = await Post.find(query)
      .populate('user', 'name avatar location')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    // Translate posts if needed
    let translatedPosts = posts;
    if (targetLang !== 'en') {
      translatedPosts = await Promise.all(
        posts.map(post => translatePost(post, targetLang))
      );
    }

    res.status(200).json({
      success: true,
      posts: translatedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts'
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
exports.getPost = async (req, res) => {
  try {
    const targetLang = await getUserLanguage(req);

    const post = await Post.findById(req.params.id)
      .populate('user', 'name avatar location')
      .populate('comments.user', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Translate post if needed
    const translatedPost = targetLang !== 'en' ? await translatePost(post, targetLang) : post;

    res.status(200).json({
      success: true,
      post: translatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get post'
    });
  }
};

// @desc    Create a post
// @route   POST /api/posts
exports.createPost = async (req, res) => {
  try {
    const { content, category, hashtags } = req.body;
    const userId = req.user._id;
    const userLang = await getUserLanguage(req);

    // Translate content to English for storage if needed
    let englishContent = content;
    let originalContent = content;
    let originalLanguage = userLang;

    if (userLang !== 'en' && content) {
      const translated = await translationService.translateToEnglish(content, userLang);
      englishContent = translated.translatedText;
    }

    // Process uploaded media
    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        media.push({
          type: file.mimetype.startsWith('video/') ? 'video' : 'image',
          url: `/uploads/${file.filename}`
        });
      });
    }

    // Extract hashtags from content if not provided
    let postHashtags = hashtags || [];
    if (!hashtags) {
      const hashtagRegex = /#(\w+)/g;
      const matches = content.match(hashtagRegex);
      if (matches) {
        postHashtags = matches.map(tag => tag.slice(1).toLowerCase());
      }
    }

    const post = await Post.create({
      user: userId,
      content: englishContent,
      originalContent,
      originalLanguage,
      media,
      category: category || 'general',
      hashtags: postHashtags,
      location: req.user.location
    });

    await post.populate('user', 'name avatar');

    // Return with translated content for user's language
    const responsePost = post.toObject();
    if (userLang !== 'en') {
      responsePost.translatedContent = originalContent;
    }

    res.status(201).json({
      success: true,
      post: responsePost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
exports.updatePost = async (req, res) => {
  try {
    const { content, category } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check ownership
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this post'
      });
    }

    // Update fields
    if (content) {
      post.content = content;
      // Re-extract hashtags
      const hashtagRegex = /#(\w+)/g;
      const matches = content.match(hashtagRegex);
      if (matches) {
        post.hashtags = matches.map(tag => tag.slice(1).toLowerCase());
      } else {
        post.hashtags = [];
      }
    }
    if (category) post.category = category;

    await post.save();
    await post.populate('user', 'name avatar location');
    await post.populate('comments.user', 'name avatar');

    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check ownership
    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    post.isActive = false;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};

// @desc    Like/Unlike a post
// @route   POST /api/posts/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likeIndex = post.likes.indexOf(userId);
    let action;

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
      action = 'unliked';
    } else {
      // Like
      post.likes.push(userId);
      action = 'liked';

      // Send notification to post owner (if not self-like)
      if (post.user.toString() !== userId.toString()) {
        await notificationService.sendLikeNotification(post.user, post._id, userId);
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      action,
      likeCount: post.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to like post'
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;
    const userLang = await getUserLanguage(req);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Translate comment to English for storage if needed
    let englishContent = content;
    let originalContent = content;
    let originalLanguage = userLang;

    if (userLang !== 'en' && content) {
      const translated = await translationService.translateToEnglish(content, userLang);
      englishContent = translated.translatedText;
    }

    const comment = {
      user: userId,
      content: englishContent,
      originalContent,
      originalLanguage,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Send notification to post owner
    if (post.user.toString() !== userId.toString()) {
      await notificationService.sendCommentNotification(post.user, post._id, userId, content);
    }

    // Populate the new comment's user info
    await post.populate('comments.user', 'name avatar');

    // Return comment with translated content for user's language
    const responseComment = { ...post.comments[post.comments.length - 1].toObject() };
    if (userLang !== 'en') {
      responseComment.translatedContent = originalContent;
    }

    res.status(201).json({
      success: true,
      comment: responseComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/:id/comment/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    comment.remove();
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
};
