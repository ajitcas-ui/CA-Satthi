import React, { useState, useEffect } from 'react';
import { 
  Language, 
  UserProfile, 
  CommunityGroup, 
  CommunityPost, 
  StudyPartner, 
  PaperId 
} from '../types';
import { PAPERS } from '../data/papersData';
import { 
  getGroups, 
  getPosts, 
  getStudyPartners, 
  toggleJoinGroup, 
  createCommunityPost, 
  addReplyToPost, 
  toggleLikePost, 
  togglePinPost, 
  toggleResolveDoubt, 
  deletePost, 
  toggleConnectPartner, 
  submitReport 
} from '../utils/storageDb';
import {
  createCommunityPostInDb,
  addReplyInDb,
  toggleLikePostInDb,
  togglePinPostInDb,
  toggleResolveDoubtInDb,
  deletePostFromDb,
  submitModerationReportToDb,
  subscribeToCommunityPosts
} from '../firebase/services';
import { playChimeSound } from '../utils/audio';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  Bookmark, 
  Share2, 
  Plus, 
  CheckCircle2, 
  Pin, 
  Trash2, 
  X,
  AlertTriangle, 
  UserCheck, 
  Sparkles, 
  Search, 
  Filter, 
  Send, 
  Check, 
  HelpCircle, 
  Clock, 
  ShieldCheck, 
  ShieldAlert,
  ChevronRight,
  Calculator,
  Scale,
  LineChart,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';

interface CommunityViewProps {
  language: Language;
  currentUser: UserProfile;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  language,
  currentUser,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'discussions' | 'groups' | 'partners'>('discussions');

  // Groups and Posts state
  const [groups, setGroups] = useState<CommunityGroup[]>(() => getGroups());
  const [posts, setPosts] = useState<CommunityPost[]>(() => getPosts());
  const [partners, setPartners] = useState<StudyPartner[]>(() => getStudyPartners());

  // Real-time Firestore Posts Sync
  useEffect(() => {
    const unsub = subscribeToCommunityPosts((cloudPosts) => {
      if (cloudPosts.length > 0) {
        setPosts(cloudPosts);
      }
    });
    return () => unsub();
  }, []);

  // Filter state
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchPostQuery, setSearchPostQuery] = useState('');

  // New Post Form modal
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postGroupId, setPostGroupId] = useState('grp_accounts');
  const [postPaper, setPostPaper] = useState<PaperId | ''>('paper3');
  const [postChapter, setPostChapter] = useState('');
  const [postTagInput, setPostTagInput] = useState('');

  // Active expanded replies state
  const [expandedPostReplies, setExpandedPostReplies] = useState<Record<string, boolean>>({
    post_1: true,
  });
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});

  // Report Modal
  const [reportTarget, setReportTarget] = useState<{ id: string; title: string } | null>(null);
  const [reportReason, setReportReason] = useState('Spam or inappropriate content');
  const [reportDetails, setReportDetails] = useState('');

  // Partner filters
  const [partnerTargetFilter, setPartnerTargetFilter] = useState('all');
  const [partnerWeakFilter, setPartnerWeakFilter] = useState('all');

  const getGroupIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator': return Calculator;
      case 'Scale': return Scale;
      case 'LineChart': return LineChart;
      case 'TrendingUp': return TrendingUp;
      case 'Award': return Award;
      case 'Target': return Target;
      default: return MessageSquare;
    }
  };

  const handleToggleJoin = (groupId: string) => {
    playChimeSound('click');
    const updated = toggleJoinGroup(groupId);
    setGroups([...updated]);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    const tags = postTagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const created = createCommunityPost({
      groupId: postGroupId,
      title: postTitle,
      content: postContent,
      paperId: postPaper ? (postPaper as PaperId) : undefined,
      chapterName: postChapter.trim() || undefined,
      tags: tags.length > 0 ? tags : ['CA Foundation'],
    });

    createCommunityPostInDb({
      groupId: postGroupId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatar,
      title: postTitle,
      content: postContent,
      paperId: postPaper ? (postPaper as PaperId) : undefined,
      chapterName: postChapter.trim() || undefined,
      tags: tags.length > 0 ? tags : ['CA Foundation'],
    }).catch(console.error);

    setPosts([created, ...posts]);
    setShowNewPostModal(false);
    setPostTitle('');
    setPostContent('');
    setPostChapter('');
    setPostTagInput('');
    playChimeSound('success');
  };

  const handleLikePost = (postId: string) => {
    playChimeSound('click');
    const updated = toggleLikePost(postId);
    setPosts([...updated]);
  };

  const handleAddReply = (postId: string) => {
    const text = replyInput[postId];
    if (!text || !text.trim()) return;

    const added = addReplyToPost(postId, text);
    if (added) {
      addReplyInDb(postId, {
        postId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        authorAvatar: currentUser.avatar,
        content: text.trim(),
        isAcceptedSolution: currentUser.role === 'admin',
      }).catch(console.error);

      playChimeSound('success');
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              replies: [...p.replies, added],
            };
          }
          return p;
        })
      );
      setReplyInput((prev) => ({ ...prev, [postId]: '' }));
    }
  };

  const handlePinPost = (postId: string) => {
    const updated = togglePinPost(postId);
    setPosts([...updated]);
    playChimeSound('click');
  };

  const handleResolveDoubt = (postId: string) => {
    const updated = toggleResolveDoubt(postId);
    setPosts([...updated]);
    playChimeSound('success');
  };

  const handleDeletePost = (postId: string) => {
    if (confirm(language === 'en' ? 'Delete this post?' : 'इस पोस्ट को हटाएं?')) {
      const updated = deletePost(postId);
      setPosts([...updated]);
      playChimeSound('click');
    }
  };

  const handleConnectPartner = (partnerId: string) => {
    playChimeSound('success');
    const updated = toggleConnectPartner(partnerId);
    setPartners([...updated]);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;

    submitReport({
      targetType: 'post',
      targetId: reportTarget.id,
      targetTitle: reportTarget.title,
      reason: reportReason,
      details: reportDetails,
    });

    submitModerationReportToDb({
      targetType: 'post',
      targetId: reportTarget.id,
      targetTitle: reportTarget.title,
      reason: reportReason,
      details: reportDetails,
      reportedBy: currentUser.name,
      reportedByUid: currentUser.id,
    }).catch(console.error);

    playChimeSound('click');
    setReportTarget(null);
    setReportDetails('');
  };

  const filteredPosts = posts.filter((p) => {
    if (selectedGroupId !== 'all' && p.groupId !== selectedGroupId) return false;
    if (searchPostQuery.trim()) {
      const q = searchPostQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchContent = p.content.toLowerCase().includes(q);
      const matchAuthor = p.authorName.toLowerCase().includes(q);
      const matchTag = p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchAuthor && !matchTag) return false;
    }
    return true;
  });

  const filteredPartners = partners.filter((sp) => {
    if (partnerTargetFilter !== 'all' && !sp.targetAttempt.includes(partnerTargetFilter)) return false;
    if (partnerWeakFilter !== 'all' && sp.weakSubject !== partnerWeakFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {language === 'en' ? 'CA Saathi Student Community' : 'सीए साथी छात्र समुदाय'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Connect with fellow CA Foundation aspirants, clear tricky doubts, and find study buddies'
              : 'सीए फाउंडेशन साथियों से जुड़ें, शंकाएं हल करें और अध्ययन साथी खोजें'}
          </p>
        </div>

        {/* Tab switcher: Discussions / Groups / Partners */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <button
            onClick={() => setActiveMainTab('discussions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'discussions' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Doubt Discussions' : 'शंका चर्चा'}
          </button>
          <button
            onClick={() => setActiveMainTab('groups')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'groups' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? '4 Subject Groups' : '4 विषय समूह'}
          </button>
          <button
            onClick={() => setActiveMainTab('partners')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'partners' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Study Partner Match' : 'स्टडी पार्टनर'}
          </button>
        </div>
      </div>

      {/* Safety & Academic Discipline Notice */}
      <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold block sm:inline">
              {language === 'en' ? 'Safe Academic Environment:' : 'सुरक्षित शैक्षणिक मंच:'}
            </span>{' '}
            <span className="text-emerald-800 dark:text-emerald-300">
              {language === 'en'
                ? 'Strict female student privacy. Phone numbers are hidden. Zero tolerance for unsolicited contact or misconduct.'
                : 'महिला छात्र सुरक्षा व गोपनीयता नीति। फोन नंबर हमेशा सुरक्षित हैं। किसी भी अनुचित आचरण पर तुरंत स्थायी प्रतिबंध।'}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 uppercase tracking-wider shrink-0 hidden sm:inline-block">
          {language === 'en' ? 'Owner Monitored' : 'एडमिन निगरानी'}
        </span>
      </div>

      {/* --- TAB 1: DOUBT DISCUSSIONS FEED --- */}
      {activeMainTab === 'discussions' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search questions, case laws, or calculator doubts...' : 'प्रश्न, केस लॉ या कैलकुलेटर शंका खोजें...'}
                value={searchPostQuery}
                onChange={(e) => setSearchPostQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-blue-500"
              >
                <option value="all">{language === 'en' ? 'All Groups' : 'सभी समूह'}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name[language]}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowNewPostModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'en' ? 'Ask Doubt' : 'शंका पूछें'}</span>
              </button>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-3.5">
            {filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? 'No discussion threads found.' : 'इस फ़िल्टर के लिए कोई चर्चा नहीं मिली।'}
                </h3>
                <button
                  onClick={() => setShowNewPostModal(true)}
                  className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? '+ Post the first question' : '+ पहला प्रश्न पोस्ट करें'}
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const group = groups.find((g) => g.id === post.groupId);
                const hasLiked = post.likedBy.includes(currentUser.id);
                const isRepliesOpen = expandedPostReplies[post.id];
                const canModerate = currentUser.role === 'admin' || currentUser.role === 'moderator';

                return (
                  <article
                    key={post.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-700 transition-all space-y-3"
                  >
                    {/* Top Row: Author, Group, Pin, Moderation */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{post.authorAvatar}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{post.authorName}</span>
                            {post.authorRole === 'admin' && (
                              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                Mentor
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {post.createdAt} • in <span className="font-semibold text-blue-700 dark:text-blue-400">{group?.name[language]}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Pin className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
                            {language === 'en' ? 'Pinned' : 'पिन किया'}
                          </span>
                        )}
                        {post.isResolved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {language === 'en' ? 'Resolved' : 'समाधान हुआ'}
                          </span>
                        )}

                        {/* Report Button */}
                        <button
                          onClick={() => setReportTarget({ id: post.id, title: post.title })}
                          title={language === 'en' ? 'Report Post' : 'शिकायत करें'}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>

                        {/* Admin Controls */}
                        {canModerate && (
                          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
                            <button
                              onClick={() => handlePinPost(post.id)}
                              title={language === 'en' ? 'Toggle Pin' : 'पिन बदलें'}
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleResolveDoubt(post.id)}
                              title={language === 'en' ? 'Toggle Resolved' : 'समाधान बदलें'}
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              title={language === 'en' ? 'Delete Post' : 'हटाएं'}
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">
                        {post.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 text-[10px] font-semibold"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Post Bottom Bar: Like, Reply Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            hasLiked ? 'text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{post.likes}</span>
                        </button>

                        <button
                          onClick={() =>
                            setExpandedPostReplies((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.replies.length} {language === 'en' ? 'Replies' : 'उत्तर'}</span>
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {post.paperId ? post.paperId.toUpperCase() : 'Discussion'}
                      </span>
                    </div>

                    {/* Replies Thread */}
                    {isRepliesOpen && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
                        {post.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                              rep.isAcceptedSolution
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{rep.authorAvatar}</span>
                                <span className="font-bold text-slate-900 dark:text-white">{rep.authorName}</span>
                                {rep.authorRole === 'admin' && (
                                  <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Mentor
                                  </span>
                                )}
                                {rep.isAcceptedSolution && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                                    <Check className="w-3 h-3" />
                                    {language === 'en' ? 'Verified Solution' : 'सत्यापित उत्तर'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{rep.createdAt}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{rep.content}</p>
                          </div>
                        ))}

                        {/* Add Reply Input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder={language === 'en' ? 'Write an answer or study suggestion...' : 'उत्तर या अध्ययन सुझाव लिखें...'}
                            value={replyInput[post.id] || ''}
                            onChange={(e) =>
                              setReplyInput((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddReply(post.id);
                            }}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-blue-500"
                          />
                          <button
                            onClick={() => handleAddReply(post.id)}
                            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: ALL GROUPS DIRECTORY --- */}
      {activeMainTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const Icon = getGroupIcon(group.iconName);
            const isJoined = currentUser.joinedGroupIds.includes(group.id);

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                          {group.name[language]}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {group.memberCount} {language === 'en' ? 'Aspirants' : 'सदस्य'} • {group.activeDiscussionsCount} {language === 'en' ? 'Discussions' : 'चर्चाएं'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {group.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {group.description[language]}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleToggleJoin(group.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isJoined
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {isJoined ? (language === 'en' ? '✓ Joined' : '✓ जुड़े हुए हैं') : (language === 'en' ? '+ Join Group' : '+ समूह से जुड़ें')}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setActiveMainTab('discussions');
                    }}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {language === 'en' ? 'View Posts' : 'पोस्ट देखें'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB 3: STUDY PARTNER MATCHING --- */}
      {activeMainTab === 'partners' && (
        <div className="space-y-4">
          {/* Partner Match Filter Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {language === 'en' ? 'Filter Partners:' : 'फ़िल्टर:'}
              </span>

              <select
                value={partnerTargetFilter}
                onChange={(e) => setPartnerTargetFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              >
                <option value="all">{language === 'en' ? 'All Attempts' : 'सभी सत्र'}</option>
                <option value="January 2027">January 2027</option>
                <option value="May 2027">May 2027</option>
                <option value="Dec 2026">Dec 2026</option>
              </select>

              <select
                value={partnerWeakFilter}
                onChange={(e) => setPartnerWeakFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              >
                <option value="all">{language === 'en' ? 'All Subjects' : 'सभी विषय'}</option>
                <option value="paper1">Paper 1: Accounting</option>
                <option value="paper2">Paper 2: Law</option>
                <option value="paper3">Paper 3: Maths/Stats</option>
                <option value="paper4">Paper 4: Economics</option>
              </select>
            </div>

            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'Peer Matching Safe: Phone numbers hidden' : 'सुरक्षित मैचिंग: फोन नंबर पूर्णतः गुप्त'}</span>
            </div>
          </div>

          {/* Partner Profiles Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {filteredPartners.map((sp) => (
              <div
                key={sp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{sp.studentName}</h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">📍 {sp.city} • 🎯 {sp.targetAttempt}</span>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center font-bold text-xs">
                      {sp.studyHoursPerDay}h
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 italic">
                    "{sp.bio}"
                  </p>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 font-semibold">
                      <span>{language === 'en' ? 'Strong In:' : 'मजबूत विषय:'}</span>
                      <span>{sp.strongSubject.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 font-semibold">
                      <span>{language === 'en' ? 'Looking to Learn:' : 'सीखना चाहते हैं:'}</span>
                      <span>{sp.weakSubject.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <span>{language === 'en' ? 'Preferred Slot:' : 'अध्ययन समय:'}</span>
                      <span>{sp.preferredTime}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleConnectPartner(sp.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    sp.connected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {sp.connected ? (language === 'en' ? '✓ Partner Connected' : '✓ पार्टनर जुड़ गए') : (language === 'en' ? 'Send Study Invite' : 'अध्ययन आमंत्रण भेजें')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ASK DOUBT / NEW POST MODAL --- */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowNewPostModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {language === 'en' ? 'Post Question / Discussion' : 'प्रश्न या चर्चा पोस्ट करें'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {language === 'en' ? 'Share your doubt with Foundation peer students and mentors' : 'अपनी शंका साथी छात्रों और मेंटर के साथ साझा करें'}
            </p>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Select Community Group' : 'कम्युनिटी ग्रुप चुनें'} *
                </label>
                <select
                  value={postGroupId}
                  onChange={(e) => setPostGroupId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-blue-500"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name[language]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Doubt Question / Title' : 'प्रश्न शीर्षक'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to rectify one-sided error in Purchase Day Book?"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Detailed Explanation / Question Text' : 'विस्तृत प्रश्न विवरण'} *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Paste question details or where you are getting stuck..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Subject Paper' : 'विषय'}
                  </label>
                  <select
                    value={postPaper}
                    onChange={(e) => setPostPaper(e.target.value as PaperId)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">General</option>
                    {PAPERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Tags (comma separated)' : 'टैग (कॉमा से अलग)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TVM, Calculator, Law"
                    value={postTagInput}
                    onChange={(e) => setPostTagInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {language === 'en' ? 'Post Question' : 'पोस्ट करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- REPORT DIALOG MODAL --- */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              {language === 'en' ? 'Report Content to Moderators' : 'मॉडरेटर को शिकायत भेजें'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
              "{reportTarget.title}"
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Reason' : 'कारण'}
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="Spam or advertising">Spam or advertising</option>
                  <option value="Off-topic / Wrong group">Off-topic / Wrong group</option>
                  <option value="Abusive or disrespectful language">Abusive or disrespectful language</option>
                  <option value="Inaccurate ICAI question citation">Inaccurate ICAI question citation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Additional Details' : 'अतिरिक्त विवरण'}
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional context for admins..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  {language === 'en' ? 'Submit Report' : 'शिकायत दर्ज करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
