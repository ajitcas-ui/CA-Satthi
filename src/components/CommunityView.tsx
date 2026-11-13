import React, { useState, useEffect } from 'react';
import {
  Language,
  UserProfile,
  CommunityPost,
  StudyPartner,
  PaperId,
  StudyPresence,
} from '../types';
import { PAPERS } from '../data/papersData';
import { COMMON_GROUP_ID, INITIAL_GROUPS } from '../data/communityData';
import {
  getPosts,
  getStudyPartners,
  createCommunityPost,
  addReplyToPost,
  toggleLikePost,
  togglePinPost,
  toggleResolveDoubt,
  deletePost,
  toggleConnectPartner,
  submitReport,
} from '../utils/storageDb';
import {
  createCommunityPostInDb,
  addReplyInDb,
  toggleLikePostInDb,
  togglePinPostInDb,
  toggleResolveDoubtInDb,
  deletePostFromDb,
  submitModerationReportToDb,
  subscribeToCommunityPosts,
} from '../firebase/services';
import { playChimeSound } from '../utils/audio';
import {
  Users,
  MessageSquare,
  Heart,
  Plus,
  CheckCircle2,
  Pin,
  Trash2,
  X,
  AlertTriangle,
  Search,
  Send,
  Check,
  Clock,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface CommunityViewProps {
  language: Language;
  currentUser: UserProfile;
  livePeers?: StudyPresence[];
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  language,
  currentUser,
  livePeers = [],
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'discussions' | 'liveRoom' | 'partners'>('discussions');
  const [posts, setPosts] = useState<CommunityPost[]>(() => getPosts());
  const [partners, setPartners] = useState<StudyPartner[]>(() => getStudyPartners());

  const [paperFilter, setPaperFilter] = useState<string>('all');
  const [searchPostQuery, setSearchPostQuery] = useState('');

  // Tick every second when Live Study Room tab is open for real elapsed timers
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (activeMainTab !== 'liveRoom') return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeMainTab]);

  // Real-time Firestore posts sync
  useEffect(() => {
    const unsub = subscribeToCommunityPosts((cloudPosts) => {
      if (cloudPosts.length > 0) {
        setPosts(cloudPosts);
      }
    });
    return () => unsub();
  }, []);

  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postPaper, setPostPaper] = useState<PaperId | ''>('paper1');
  const [postChapter, setPostChapter] = useState('');
  const [postTagInput, setPostTagInput] = useState('');

  const [expandedPostReplies, setExpandedPostReplies] = useState<Record<string, boolean>>({
    post_1: true,
  });
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});

  const [reportTarget, setReportTarget] = useState<{ id: string; title: string } | null>(null);
  const [reportReason, setReportReason] = useState('Spam or advertising');
  const [reportDetails, setReportDetails] = useState('');

  const [partnerTargetFilter, setPartnerTargetFilter] = useState('all');
  const [partnerWeakFilter, setPartnerWeakFilter] = useState('all');

  const commonGroup = INITIAL_GROUPS[0];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    const tags = postTagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const created = createCommunityPost({
      groupId: COMMON_GROUP_ID,
      title: postTitle,
      content: postContent,
      paperId: postPaper ? (postPaper as PaperId) : undefined,
      chapterName: postChapter.trim() || undefined,
      tags: tags.length > 0 ? tags : ['Jan 2027'],
    });

    createCommunityPostInDb({
      groupId: COMMON_GROUP_ID,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatar,
      title: postTitle,
      content: postContent,
      paperId: postPaper ? (postPaper as PaperId) : undefined,
      chapterName: postChapter.trim() || undefined,
      tags: tags.length > 0 ? tags : ['Jan 2027'],
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
    const post = posts.find((p) => p.id === postId);
    const hasLiked = post ? post.likedBy.includes(currentUser.id) : false;
    const updated = toggleLikePost(postId);
    setPosts([...updated]);
    toggleLikePostInDb(postId, currentUser.id, hasLiked).catch(() => {});
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
        prev.map((p) => (p.id === postId ? { ...p, replies: [...p.replies, added] } : p))
      );
      setReplyInput((prev) => ({ ...prev, [postId]: '' }));
    }
  };

  const handlePinPost = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    const updated = togglePinPost(postId);
    setPosts([...updated]);
    togglePinPostInDb(postId, !(target?.isPinned)).catch(() => {});
    playChimeSound('click');
  };

  const handleResolveDoubt = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    const updated = toggleResolveDoubt(postId);
    setPosts([...updated]);
    toggleResolveDoubtInDb(postId, !(target?.isResolved)).catch(() => {});
    playChimeSound('success');
  };

  const handleDeletePost = (postId: string) => {
    const updated = deletePost(postId);
    setPosts([...updated]);
    deletePostFromDb(postId).catch(() => {});
    playChimeSound('click');
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

  const formatElapsedDuration = (startedIso: string) => {
    const started = new Date(startedIso).getTime();
    if (!Number.isFinite(started)) return '0m';
    const diffSecs = Math.max(0, Math.floor((nowMs - started) / 1000));
    const hrs = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const filteredPosts = posts.filter((p) => {
    if (paperFilter !== 'all' && p.paperId !== paperFilter) return false;
    if (searchPostQuery.trim()) {
      const q = searchPostQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
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
      {/* Header & Common Group Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {commonGroup.name[language]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {commonGroup.description[language]}
          </p>
        </div>

        {/* Tab switcher: Common Group Feed / Live Study Room / Study Partners */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <button
            onClick={() => setActiveMainTab('discussions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'discussions'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Common Group Feed' : 'समुदाय चर्चा'}
          </button>
          <button
            onClick={() => setActiveMainTab('liveRoom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'liveRoom'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {language === 'en' ? 'Live Study Room' : 'लाइव स्टडी'} ({livePeers.length})
            </span>
          </button>
          <button
            onClick={() => setActiveMainTab('partners')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'partners'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Study Partners' : 'स्टडी पार्टनर'}
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold">
              {language === 'en' ? 'Safe Single Common Group:' : 'सुरक्षित एकल विद्यार्थी समूह:'}
            </span>{' '}
            <span className="text-emerald-800 dark:text-emerald-300">
              {language === 'en'
                ? 'Student phone numbers and emails are strictly hidden. Academic discussions only for January 2027.'
                : 'फोन नंबर व ईमेल पूर्णतः गोपनीय हैं। केवल जनवरी 2027 परीक्षा से संबंधित चर्चा करें।'}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 uppercase shrink-0 hidden sm:inline-block">
          Owner Moderated
        </span>
      </div>

      {/* TAB 1: COMMON GROUP DOUBT DISCUSSIONS */}
      {activeMainTab === 'discussions' && (
        <div className="space-y-4">
          {/* Paper Filter Pills & Ask Doubt */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search questions, case laws, or doubts...' : 'प्रश्न या शंका खोजें...'}
                  value={searchPostQuery}
                  onChange={(e) => setSearchPostQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <button
                onClick={() => setShowNewPostModal(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'en' ? 'Ask Doubt in Community' : 'शंका पूछें'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: language === 'en' ? 'All 4 Papers' : 'सभी विषय' },
                { id: 'paper1', label: 'Paper 1: Accounting' },
                { id: 'paper2', label: 'Paper 2: Business Laws' },
                { id: 'paper3', label: 'Paper 3: Maths & Stats' },
                { id: 'paper4', label: 'Paper 4: Economics' },
              ].map((pf) => (
                <button
                  key={pf.id}
                  onClick={() => setPaperFilter(pf.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                    paperFilter === pf.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? 'No discussion threads match this filter.' : 'कोई चर्चा नहीं मिली।'}
                </h3>
                <button
                  onClick={() => setShowNewPostModal(true)}
                  className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  + Post the first doubt
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const hasLiked = post.likedBy.includes(currentUser.id);
                const isRepliesOpen = expandedPostReplies[post.id];
                const canModerate = currentUser.role === 'admin' || currentUser.role === 'moderator';

                return (
                  <article
                    key={post.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{post.authorAvatar}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{post.authorName}</span>
                            {post.authorRole === 'admin' && (
                              <span className="text-[10px] font-black uppercase px-1.5 rounded bg-purple-100 text-purple-800">
                                Mentor
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {post.createdAt} • {post.paperId ? post.paperId.toUpperCase() : 'General'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </span>
                        )}
                        {post.isResolved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Resolved
                          </span>
                        )}

                        <button
                          onClick={() => setReportTarget({ id: post.id, title: post.title })}
                          title="Report Post"
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>

                        {canModerate && (
                          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
                            <button onClick={() => handlePinPost(post.id)} className="p-1 text-slate-500 hover:text-amber-600 cursor-pointer">
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleResolveDoubt(post.id)} className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeletePost(post.id)} className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">{post.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-semibold"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer ${
                            hasLiked ? 'text-rose-600 font-bold bg-rose-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span className="tabular-nums">{post.likes}</span>
                        </button>

                        <button
                          onClick={() =>
                            setExpandedPostReplies((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="tabular-nums">{post.replies.length} Replies</span>
                        </button>
                      </div>
                    </div>

                    {isRepliesOpen && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
                        {post.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                              rep.isAcceptedSolution
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{rep.authorAvatar}</span>
                                <span className="font-bold text-slate-900 dark:text-white">{rep.authorName}</span>
                                {rep.isAcceptedSolution && (
                                  <span className="text-[9px] font-bold px-1.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> Verified Solution
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">{rep.createdAt}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">{rep.content}</p>
                          </div>
                        ))}

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder={language === 'en' ? 'Write a helpful answer...' : 'उत्तर लिखें...'}
                            value={replyInput[post.id] || ''}
                            onChange={(e) => setReplyInput((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddReply(post.id);
                            }}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
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

      {/* TAB 2: LIVE STUDY ROOM (REAL-TIME FIRESTORE PRESENCE - ZERO FAKE USERS) */}
      {activeMainTab === 'liveRoom' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500" />
                <span>{language === 'en' ? 'Live Co-Study Room (January 2027 Cohort)' : 'लाइव सह-अध्ययन कक्ष'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en'
                  ? 'Displays verified signed-in aspirants actively studying right now. Phone numbers and emails are never shared.'
                  : 'वर्तमान में सक्रिय छात्रों को दिखाता है। निजी जानकारी पूर्णतः सुरक्षित है।'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold tabular-nums">
              {livePeers.length} {language === 'en' ? 'Studying Online Now' : 'ऑनलाइन पढ़ रहे हैं'}
            </span>
          </div>

          {livePeers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'en'
                  ? 'No other students in an active session right now'
                  : 'अभी कोई अन्य छात्र सक्रिय सत्र में नहीं है'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {language === 'en'
                  ? 'Open Practice Arena, Timed Mock Tests, or AI Doubt Solver while signed in to automatically join the Live Study Room.'
                  : 'लाइव स्टडी रूम में शामिल होने के लिए साइन इन करके अभ्यास या मॉक टेस्ट शुरू करें।'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {livePeers.map((peer) => (
                <div
                  key={peer.userId}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xl shrink-0">
                      {peer.avatar || '🎓'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{peer.displayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {peer.activeTopic || 'CA Foundation Study'} • {(peer.activePaperId || 'paper1').toUpperCase()}
                      </p>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                        {peer.targetAttempt || 'January 2027'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold tabular-nums">
                      <Clock className="w-3 h-3" />
                      {formatElapsedDuration(peer.sessionStartedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDY PARTNER MATCHING */}
      {activeMainTab === 'partners' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <select
                value={partnerTargetFilter}
                onChange={(e) => setPartnerTargetFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="all">All Attempts</option>
                <option value="January 2027">January 2027</option>
                <option value="May 2027">May 2027</option>
              </select>

              <select
                value={partnerWeakFilter}
                onChange={(e) => setPartnerWeakFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="all">All Subjects</option>
                <option value="paper1">Paper 1: Accounting</option>
                <option value="paper2">Paper 2: Law</option>
                <option value="paper3">Paper 3: Maths/Stats</option>
                <option value="paper4">Paper 4: Economics</option>
              </select>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
              Phone numbers & emails strictly private
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartners.map((sp) => (
              <div
                key={sp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{sp.studentName}</h3>
                      <span className="text-[11px] text-slate-500">{sp.city} • {sp.targetAttempt}</span>
                    </div>
                    <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {sp.studyHoursPerDay}h
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 italic">"{sp.bio}"</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 font-semibold">
                      <span>Strong In:</span>
                      <span>{sp.strongSubject.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 font-semibold">
                      <span>Revising:</span>
                      <span>{sp.weakSubject.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleConnectPartner(sp.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer ${
                    sp.connected ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {sp.connected ? 'Connected ✓' : 'Send Study Invite'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW POST MODAL */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowNewPostModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Ask Doubt in Common Community</h3>
            <p className="text-xs text-slate-500 mb-4">Posted to {commonGroup.name.en}</p>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs">
              <input
                type="text"
                required
                placeholder="Doubt title (e.g. BRS Unfavorable Balance adjustment)"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
              <textarea
                required
                rows={3}
                placeholder="Describe where you are stuck..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={postPaper}
                  onChange={(e) => setPostPaper(e.target.value as PaperId)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">General</option>
                  {PAPERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}: {p.name.en}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={postTagInput}
                  onChange={(e) => setPostTagInput(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold cursor-pointer">
                  Post Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <h3 className="text-base font-bold text-rose-600 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Report Post to Admin
            </h3>
            <form onSubmit={handleSubmitReport} className="space-y-3">
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="Spam or advertising">Spam or advertising</option>
                <option value="Abusive or disrespectful language">Abusive or disrespectful language</option>
                <option value="Inaccurate ICAI citation">Inaccurate ICAI citation</option>
              </select>
              <textarea
                rows={2}
                placeholder="Additional context..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
