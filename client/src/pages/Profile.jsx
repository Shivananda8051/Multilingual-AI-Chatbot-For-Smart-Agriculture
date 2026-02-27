import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPencil,
  HiLocationMarker,
  HiCalendar,
  HiPhotograph,
  HiCog,
  HiX,
  HiUserGroup
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Followers/Following modal state
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers'); // 'followers' or 'following'
  const [followList, setFollowList] = useState([]);
  const [loadingFollow, setLoadingFollow] = useState(false);

  // Handle both 'id' and '_id' for compatibility
  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUserId;

  useEffect(() => {
    const id = userId || currentUserId;
    if (id) {
      loadProfile(id);
      loadPosts(id);
    } else {
      setLoading(false);
    }
  }, [userId, currentUserId]);

  const loadProfile = async (id) => {
    if (!id) return;
    try {
      const response = await usersAPI.getProfile(id);
      setProfile(response.data.user);
      setEditForm({
        name: response.data.user.name,
        bio: response.data.user.bio || '',
        cropsGrown: response.data.user.cropsGrown || []
      });
    } catch (error) {
      toast.error(t('failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (id) => {
    if (!id) return;
    try {
      const response = await usersAPI.getUserPosts(id);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to load posts');
    }
  };

  const handleFollow = async () => {
    try {
      const response = await usersAPI.toggleFollow(userId);
      setProfile(prev => ({
        ...prev,
        isFollowing: response.data.action === 'followed',
        followerCount: response.data.followerCount
      }));
      toast.success(response.data.action === 'followed' ? t('followingSuccess') : t('unfollowedSuccess'));
    } catch (error) {
      toast.error(t('failedToFollow'));
    }
  };

  const openFollowModal = async (type) => {
    setFollowModalType(type);
    setShowFollowModal(true);
    setLoadingFollow(true);
    try {
      const profileId = userId || currentUserId;
      const response = type === 'followers'
        ? await usersAPI.getFollowers(profileId)
        : await usersAPI.getFollowing(profileId);
      setFollowList(response.data[type] || []);
    } catch (error) {
      toast.error(type === 'followers' ? t('failedToLoadFollowers') : t('failedToLoadFollowing'));
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleFollowFromList = async (targetUserId) => {
    try {
      const response = await usersAPI.toggleFollow(targetUserId);
      // Update the follow list
      setFollowList(prev => prev.map(u =>
        u._id === targetUserId
          ? { ...u, isFollowedByMe: response.data.action === 'followed' }
          : u
      ));
      toast.success(response.data.action === 'followed' ? t('followingSuccess') : t('unfollowedSuccess'));
    } catch (error) {
      toast.error(t('failedToFollow'));
    }
  };

  const navigateToProfile = (id) => {
    setShowFollowModal(false);
    navigate(`/dashboard/profile/${id}`);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('bio', editForm.bio);
      formData.append('cropsGrown', JSON.stringify(editForm.cropsGrown));
      if (editForm.avatar) {
        formData.append('avatar', editForm.avatar);
      }

      const response = await usersAPI.updateProfile(formData);
      setProfile(prev => ({ ...prev, ...response.data.user }));
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success(t('profileUpdated'));
    } catch (error) {
      toast.error(t('failedToUpdateProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm(prev => ({ ...prev, avatar: file }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="max-w-xl mx-auto pb-20 lg:pb-0">
        <div className="card p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {currentUser ? t('profileNotFound') : t('loginToViewProfile')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-20 lg:pb-0">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        {/* Cover */}
        <div className="h-32 gradient-primary" />

        {/* Avatar & Info */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-16">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-primary-600">
                    {profile?.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600">
                  <HiPhotograph className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>

            {isOwnProfile ? (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-outline"
              >
                {isEditing ? <HiCog className="w-5 h-5" /> : <HiPencil className="w-5 h-5" />}
                {isEditing ? t('cancel') : t('editProfile')}
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`btn ${profile?.isFollowing ? 'btn-outline' : 'btn-primary'}`}
              >
                {profile?.isFollowing ? t('unfollow') : t('follow')}
              </button>
            )}
          </div>

          {/* Name & Bio */}
          <div className="mt-4">
            {isEditing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="input mb-2"
                placeholder={t('yourName')}
              />
            ) : (
              <h1 className="text-2xl font-bold">{profile?.name}</h1>
            )}

            {isEditing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="input mt-2 resize-none"
                rows={3}
                placeholder={t('writeBio')}
              />
            ) : (
              profile?.bio && <p className="text-gray-600 dark:text-gray-400 mt-1">{profile.bio}</p>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
            {profile?.location?.city && (
              <div className="flex items-center gap-1">
                <HiLocationMarker className="w-4 h-4" />
                {profile.location.city}, {profile.location.state}
              </div>
            )}
            <div className="flex items-center gap-1">
              <HiCalendar className="w-4 h-4" />
              {t('joined')} {format(new Date(profile?.createdAt || Date.now()), 'MMM yyyy')}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-xl font-bold">{profile?.postCount || 0}</p>
              <p className="text-sm text-gray-500">{t('posts')}</p>
            </div>
            <button
              onClick={() => openFollowModal('followers')}
              className="text-center hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1 rounded-lg transition-colors"
            >
              <p className="text-xl font-bold">{profile?.followerCount || 0}</p>
              <p className="text-sm text-gray-500">{t('followers')}</p>
            </button>
            <button
              onClick={() => openFollowModal('following')}
              className="text-center hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1 rounded-lg transition-colors"
            >
              <p className="text-xl font-bold">{profile?.followingCount || 0}</p>
              <p className="text-sm text-gray-500">{t('following')}</p>
            </button>
          </div>

          {/* Save Button (Edit Mode) */}
          {isEditing && (
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn btn-primary w-full mt-4"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                t('saveChanges')
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Crops */}
      {profile?.cropsGrown?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 mt-4"
        >
          <h3 className="font-semibold mb-3">{t('crops')}</h3>
          <div className="flex flex-wrap gap-2">
            {profile.cropsGrown.map((crop) => (
              <span key={crop} className="badge badge-primary">
                {crop}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Posts Grid */}
      <div className="mt-4">
        <h3 className="font-semibold mb-3">{t('posts')}</h3>
        {posts.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            {t('noPostsYet')}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div
                key={post._id}
                className="aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              >
                {post.media?.[0] ? (
                  <img
                    src={post.media[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                    {post.content?.substring(0, 50)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Followers/Following Modal */}
      <AnimatePresence>
        {showFollowModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowFollowModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-[10%] max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold capitalize">{followModalType === 'followers' ? t('followers') : t('following')}</h3>
                <button
                  onClick={() => setShowFollowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {loadingFollow ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
                  </div>
                ) : followList.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <HiUserGroup className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{followModalType === 'followers' ? t('noFollowersYet') : t('noFollowingYet')}</p>
                  </div>
                ) : (
                  <div className="divide-y dark:divide-gray-700">
                    {followList.map((user) => {
                      const isSelf = user._id === currentUserId;
                      return (
                        <div
                          key={user._id}
                          className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <div
                            onClick={() => navigateToProfile(user._id)}
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                          >
                            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-primary-600 font-bold text-lg">
                                  {user.name?.charAt(0) || 'U'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{user.name}</p>
                              {user.bio && (
                                <p className="text-sm text-gray-500 truncate">{user.bio}</p>
                              )}
                              {user.location?.city && (
                                <p className="text-xs text-gray-400">{user.location.city}</p>
                              )}
                            </div>
                          </div>
                          {!isSelf && (
                            <button
                              onClick={() => handleFollowFromList(user._id)}
                              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                user.isFollowedByMe
                                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                  : 'bg-primary-500 text-white hover:bg-primary-600'
                              }`}
                            >
                              {user.isFollowedByMe ? t('following') : t('follow')}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
