import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesktopStore } from '@/store/useDesktopStore';
import { supabase } from '@/lib/supabaseClient';

type PostRow = {
  id: string;
  type: string;
  title: string;
  author: string;
  date: string;
  views: number;
  content: string;
  isTop: boolean;
  metadata?: any;
};

type PostComment = { author: string; content: string; time: string };
type PostMetadata = { comments?: PostComment[] };

type DbPost = {
  id: string;
  title: string;
  content: string;
  type: string;
  author: string;
  date: string;
  popularity: number;
  is_pinned: boolean;
  attachment_url: string | null;
  metadata: any;
  created_at: string;
};

const mapDbToPostRow = (dbPost: DbPost): PostRow => ({
  id: dbPost.id,
  type: dbPost.type,
  title: dbPost.title,
  author: dbPost.author,
  date: dbPost.created_at ? dbPost.created_at.slice(0, 10) : dbPost.date,
  views: dbPost.popularity ?? 0,
  content: dbPost.content,
  isTop: dbPost.is_pinned ?? false,
  metadata: dbPost.metadata,
});

const getIslandName = (email?: string | null) => {
  const normalizedEmail = (email ?? '').toLowerCase();
  if (normalizedEmail === 'ybb@webisland.com') return '歪比比';
  if (normalizedEmail === 'zyn@webisland.com') return '[oneone]';
  return '神秘访客';
};

const PostModal: React.FC<{
  isOpen: boolean;
  editingPost: PostRow | null;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    content: string;
    type: string;
    attachmentUrl: string | null;
    id?: string;
  }) => Promise<void>;
}> = ({ isOpen, editingPost, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('讨论');
  const [file, setFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(editingPost?.title ?? '');
    setContent(editingPost?.content ?? '');
    setType(editingPost?.type ?? '讨论');
    setAttachmentUrl(null);
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
  }, [editingPost, isOpen]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const startProgress = () => {
    setUploadProgress(3);
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }
    progressTimerRef.current = window.setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 11));
    }, 180);
  };

  const stopProgress = () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setUploadProgress(100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    let nextAttachment = attachmentUrl;
    if (file) {
      setUploading(true);
      startProgress();
      const filePath = `bbs/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file, { upsert: false });
      if (!uploadError) {
        const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
        nextAttachment = data.publicUrl;
      }
      stopProgress();
      setUploading(false);
    }

    await onSave({
      id: editingPost?.id,
      title: title.trim(),
      content: content.trim(),
      type,
      attachmentUrl: nextAttachment ?? null,
    });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/35" style={{ backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div
        className="absolute inset-0 m-auto win-bevel-out p-[2px] w-[460px] h-[430px] bg-[#d1d5db]"
        style={{ fontFamily: 'Tahoma, Fixedsys, MS Sans Serif' }}
      >
        <div className="h-[24px] u-dream-title flex items-center px-2 mb-[2px]">
          <span className="text-white text-xs font-bold">{editingPost ? '编辑帖子' : '发布新帖'}</span>
          <button onClick={onClose} className="win-btn win-title-btn ml-auto">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="win-bevel-in bg-[#d1d5db] p-3 h-[calc(100%-26px)] flex flex-col gap-2">
          <label className="text-xs text-black">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="win-bevel-in bg-white px-2 py-1 text-xs outline-none" />

          <label className="text-xs text-black mt-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="win-bevel-in bg-white px-2 py-1 text-xs outline-none">
            <option>讨论</option>
            <option>置顶</option>
            <option>日志</option>
            <option>源码</option>
            <option>秘密</option>
          </select>

          <label className="text-xs text-black mt-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="win-bevel-in bg-white px-2 py-1 text-xs outline-none resize-none h-36"
          />

          <label className="text-xs text-black mt-1">Attachment</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />

          {uploading && (
            <div className="mt-1">
              <div className="text-[10px] text-[#a5f3fc] mb-1">[数据包传输中...]</div>
              <div className="h-2 bg-[#24313f] border border-[#94a3b8]">
                <div className="h-full bg-[#a5f3fc] transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <div className="mt-auto flex justify-end gap-2">
            <button type="button" onClick={onClose} className="win-bevel-out px-3 py-1 text-xs">取消</button>
            <button type="submit" className="win-bevel-out px-3 py-1 text-xs font-bold">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GlobeAnimation: React.FC = () => (
  <div className="relative w-16 h-16 mx-auto">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
    />
    <motion.div
      animate={{ rotate: -360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      className="absolute inset-2 border-4 border-green-500 border-b-transparent rounded-full"
    />
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      className="absolute inset-4 border-4 border-red-500 border-l-transparent rounded-full"
    />
  </div>
);

export const RetroBrowser: React.FC = () => {
  const appOpen = useDesktopStore(s => s.appOpen);
  const closeApp = useDesktopStore(s => s.closeApp);

  const [currentUrl, setCurrentUrl] = useState('http://bbs.our-secret-island.org');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showHomepage, setShowHomepage] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostRow | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostRow | null>(null);
  const [rowMenu, setRowMenu] = useState<{ x: number; y: number; post: PostRow } | null>(null);
  const [freshPostIds, setFreshPostIds] = useState<string[]>([]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [statusText, setStatusText] = useState('已连接到 secret island bbs');
  const [statusFlash, setStatusFlash] = useState(false);
  const [currentUserIslandName, setCurrentUserIslandName] = useState('神秘访客');

  const isHidden = appOpen !== 'browser';
  const wasHiddenRef = useRef(true);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isHidden) {
      if (wasHiddenRef.current) {
        setIsLoading(true);
        setLoadingProgress(0);
        setShowHomepage(false);
        setSelectedPost(null);

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        let progress = 0;
        intervalRef.current = window.setInterval(() => {
          progress += Math.random() * 15;
          setLoadingProgress(progress);
          if (progress >= 100) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }, 200);

        setTimeout(() => {
          setIsLoading(false);
          setShowHomepage(true);
        }, 2500);
      }
      wasHiddenRef.current = false;
    } else {
      wasHiddenRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isHidden]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (isHidden) return;

      const { data, error } = await supabase
        .from('bbs_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch posts:', error);
        flashStatus('[ SYSTEM ERR: 数据加载失败，请检查网络协议 ]');
        return;
      }

      if (data) {
        const mapped = (data as DbPost[]).map(mapDbToPostRow);
        setPosts(mapped);
      }
    };

    fetchPosts();
  }, [isHidden]);

  useEffect(() => {
    const closeMenus = () => {
      setMenuOpen(false);
      setRowMenu(null);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  useEffect(() => {
    const hydrateIslandIdentity = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setCurrentUserIslandName('神秘访客');
        return;
      }
      setCurrentUserIslandName(getIslandName(data.user?.email));
    };

    void hydrateIslandIdentity();
  }, []);

  const handleGoHome = () => {
    setIsLoading(true);
    setShowHomepage(false);
    setSelectedPost(null);
    setCurrentUrl('http://bbs.our-secret-island.org');
    setTimeout(() => {
      setIsLoading(false);
      setShowHomepage(true);
    }, 1500);
  };

  const handleBack = () => {
    setSelectedPost(null);
    setReplyOpen(false);
    setReplyText('');
  };

  const handleRefresh = () => {
    if (selectedPost) {
      flashStatus('[SYSTEM: 帖子页面已刷新]');
      return;
    }
    handleGoHome();
    flashStatus('[SYSTEM: 正在刷新 BBS 首页]');
  };

  const handleCreateClick = () => {
    setEditingPost(null);
    setModalOpen(true);
    setMenuOpen(false);
  };

  const handleEditClick = (post: PostRow) => {
    setEditingPost(post);
    setModalOpen(true);
    setMenuOpen(false);
    setRowMenu(null);
  };

  const handleSavePost = async (payload: {
    title: string;
    content: string;
    type: string;
    attachmentUrl: string | null;
    id?: string;
  }) => {
    const currentAuthor = await getCurrentAuthor();
    const cloudWritable = await canSyncToCloud();
    const nextIsTop = payload.type === '置顶';

    if (payload.id) {
      if (cloudWritable) {
        const { error } = await supabase
          .from('bbs_posts')
          .update({
            title: payload.title,
            content: payload.content,
            type: payload.type,
            attachment_url: payload.attachmentUrl,
            author: currentAuthor,
            is_pinned: nextIsTop,
          })
          .eq('id', payload.id);
        if (error) {
          console.error('BBS post update failed:', error);
          flashStatus('[ SYSTEM ERR: 数据写入失败，请检查网络协议 ]');
        } else {
          flashStatus('[SYSTEM: 云端帖子已同步更新]');
          setPosts((prev) =>
            prev.map((p) =>
              p.id === payload.id
                ? { ...p, title: payload.title, content: payload.content, type: payload.type, author: currentAuthor, isTop: nextIsTop }
                : p,
            ),
          );
        }
      } else {
        flashStatus('[SYSTEM: 本地模式，修改已保存]');
        setPosts((prev) =>
          prev.map((p) =>
            p.id === payload.id
              ? { ...p, title: payload.title, content: payload.content, type: payload.type, author: currentAuthor, isTop: nextIsTop }
              : p,
          ),
        );
      }
    } else {
      const tempId = crypto.randomUUID();
      const optimisticPost: PostRow = {
        id: tempId,
        type: payload.type,
        title: payload.title,
        author: currentAuthor,
        date: new Date().toISOString().slice(0, 10),
        views: 0,
        content: payload.content,
        isTop: nextIsTop,
      };
      setPosts((prev) => [optimisticPost, ...prev]);
      setFreshPostIds((prev) => [...prev, tempId]);
      window.setTimeout(() => {
        setFreshPostIds((prev) => prev.filter((id) => id !== tempId));
      }, 3000);

      if (cloudWritable) {
        const { error } = await supabase.from('bbs_posts').insert({
          title: payload.title,
          content: payload.content,
          type: payload.type,
          attachment_url: payload.attachmentUrl,
          author: currentAuthor,
          date: new Date().toISOString().slice(0, 10),
          popularity: 0,
          is_pinned: nextIsTop,
        });
        if (error) {
          console.error('BBS post insert failed:', error);
          flashStatus('[ SYSTEM ERR: 数据写入失败，请检查网络协议 ]');
          setPosts((prev) => prev.filter((p) => p.id !== tempId));
          setFreshPostIds((prev) => prev.filter((id) => id !== tempId));
        } else {
          flashStatus('[SYSTEM: 新帖已发布并同步到云端]');
        }
      } else {
        flashStatus('[SYSTEM: 本地模式，新帖已发布]');
      }
    }
    setModalOpen(false);
    setEditingPost(null);
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isTop !== b.isTop) return Number(b.isTop) - Number(a.isTop);
    return b.date.localeCompare(a.date);
  });

  const flashStatus = (text: string) => {
    setStatusText(text);
    setStatusFlash(true);
    window.setTimeout(() => setStatusFlash(false), 1200);
  };

  const canSyncToCloud = async () => {
    const { data, error } = await supabase.auth.getUser();
    return !error && Boolean(data.user);
  };

  const getCurrentAuthor = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) return '神秘访客';
    return getIslandName(data.user?.email);
  };

  const handleSendReply = async () => {
    if (!selectedPost || !replyText.trim()) return;
    const currentAuthor = await getCurrentAuthor();
    const cloudWritable = await canSyncToCloud();
    const currentMetadata = (selectedPost.metadata ?? {}) as PostMetadata;
    const prevComments = currentMetadata.comments ?? [];
    const newComment: PostComment = {
      author: currentAuthor,
      content: replyText.trim(),
      time: new Date().toLocaleString(),
    };
    const newCommentsArray = [...prevComments, newComment];
    const nextMetadata: PostMetadata = { ...currentMetadata, comments: newCommentsArray };
    const nextSelected = { ...selectedPost, metadata: nextMetadata };

    setSelectedPost(nextSelected);
    setPosts((prev) =>
      prev.map((p) => (p.id === selectedPost.id ? { ...p, metadata: nextMetadata } : p)),
    );
    setReplyText('');

    if (cloudWritable) {
      const { error } = await supabase
        .from('bbs_posts')
        .update({ metadata: nextMetadata })
        .eq('id', selectedPost.id);

      if (!error) {
        flashStatus('[SYSTEM: 盖楼成功，信号已送达]');
      } else {
        console.error('BBS comment write failed:', error);
        flashStatus('[ SYSTEM ERR: 数据写入失败，请检查网络协议 ]');
      }
    } else {
      flashStatus('[SYSTEM: 本地模式，回复已发送]');
    }
  };

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 pointer-events-none"
        >
          <div className="win-bevel-out bg-[var(--win-gray)] p-[2px] w-[800px] h-[600px] flex flex-col shadow-2xl pointer-events-auto">
            <div className="h-[28px] u-dream-title flex items-center px-2 mb-[2px]">
              <span className="text-white text-xs font-bold">Netscape Navigator</span>
              <div className="ml-4 flex gap-1">
                <button onClick={handleBack} className="win-btn text-white text-xs px-2 py-0.5" title="返回帖子列表">◀</button>
                <button onClick={handleRefresh} className="win-btn text-white text-xs px-2 py-0.5" title="刷新">⟳</button>
                <button onClick={handleGoHome} className="win-btn text-white text-xs px-2 py-0.5" title="主页">🏠</button>
              </div>
              <button
                onClick={closeApp}
                className="win-btn win-title-btn text-white text-xs ml-auto pb-[1px]"
              >
                ✕
              </button>
            </div>

            <div className="win-bevel-in bg-[var(--win-gray)] px-2 py-1 flex items-center gap-2 border-b border-[#808080]">
              <span className="text-[10px] text-[#808080]">转到:</span>
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                className="win-bevel-in flex-1 px-2 py-0.5 text-xs bg-white outline-none"
              />
              <button className="win-bevel-out px-2 py-0.5 text-xs">转到</button>
              <button onClick={handleGoHome} className="win-bevel-out px-2 py-0.5 text-xs">主页</button>
            </div>
            <div className="relative h-[24px] bg-[#C0C0C0] border-b border-[#808080] px-2 flex items-center text-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="win-bevel-out px-2 py-0.5 text-xs"
              >
                操作(O)
              </button>
              {menuOpen && (
                <div
                  className="absolute top-[22px] left-2 win-bevel-out bg-[#C0C0C0] p-[2px] z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateClick();
                    }}
                    className="win-bevel-out px-3 py-1 text-xs whitespace-nowrap"
                  >
                    发布新帖
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-[var(--dream-deep-bg)] overflow-hidden">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-white">
                  <GlobeAnimation />
                  <div className="mt-4 text-sm">正在连接 bbs.our-secret-island.org...</div>
                  <div className="mt-2 text-xs text-blue-300">
                    已完成: {Math.min(99, Math.floor(loadingProgress))}%
                  </div>
                  <div className="mt-2 w-48 h-1 bg-[#333] rounded overflow-hidden">
                    <div
                      className="h-full bg-[#00ff00] transition-all duration-200"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                </div>
              ) : showHomepage && !selectedPost ? (
                <div className="h-full overflow-auto" style={{
                  fontFamily: 'Times New Roman, SimSun, serif',
                  background: 'var(--dream-deep-bg)',
                  color: '#ffffff',
                }}>
                  <div className="p-4">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold mb-2" style={{ fontFamily: 'Microsoft YaHei, SimHei' }}>
                        ☆ 秘密岛屿 BBS ☆
                      </div>
                      <div className="text-sm opacity-70">
                        Secret Island Bulletin Board System
                      </div>
                      <div className="text-xs mt-2 opacity-50">
                        当前在线: 2 人 | 今日访问: 1314 次
                      </div>
                    </div>

                    <div className="border border-white/30 mb-4" />

                    <div className="text-xs mb-2" style={{ color: '#a5f3fc', opacity: 0.55 }}>
                      [ 身份识别成功：欢迎回来，{currentUserIslandName} ]
                    </div>

                    <div className="text-sm mb-2">【公告】欢迎来到秘密岛屿 BBS！</div>
                    <div className="text-xs opacity-70 mb-4">在这里分享你们的秘密和故事...</div>

                    <table className="w-full text-xs border-collapse border border-white/30">
                      <thead>
                        <tr className="bg-[#0000a0]">
                          <th className="border border-white/30 p-1 text-left w-12">类型</th>
                          <th className="border border-white/30 p-1 text-left">标题</th>
                          <th className="border border-white/30 p-1 text-left w-20">作者</th>
                          <th className="border border-white/30 p-1 text-left w-16">日期</th>
                          <th className="border border-white/30 p-1 text-left w-12">人气</th>
                          <th className="border border-white/30 p-1 text-left w-12">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPosts.map((post) => (
                          <tr
                            key={post.id}
                            className="cursor-pointer hover:bg-[#0000a0]"
                            onClick={() => setSelectedPost(post)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRowMenu({ x: e.clientX, y: e.clientY, post });
                            }}
                          >
                            <td className="border border-white/30 p-1">
                              {post.isTop && <span className="text-yellow-300">★</span>}
                              {post.type}
                            </td>
                            <td className="border border-white/30 p-1">
                              <span>{post.title}</span>
                              {freshPostIds.includes(post.id) && (
                                <span className="ml-2 px-1 text-[9px] leading-3 bg-[#a5f3fc] text-[#00324a] font-bold">NEW</span>
                              )}
                            </td>
                            <td className="border border-white/30 p-1">{post.author}</td>
                            <td className="border border-white/30 p-1">{post.date}</td>
                            <td className="border border-white/30 p-1">{post.views}</td>
                            <td className="border border-white/30 p-1">
                              <button
                                className="win-bevel-out px-1 py-0 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(post);
                                }}
                              >
                                编辑
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-4 text-xs opacity-50 text-center">
                      <div>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                      <div className="mt-2">
                        秘密岛屿 BBS v1.0 | 1999-2026 版权所有
                      </div>
                      <div className="mt-1">
                        本系统由 <span className="text-yellow-300">歪比比</span> 友情赞助
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedPost ? (
                <div className="h-full overflow-auto" style={{
                  fontFamily: 'Times New Roman, SimSun, serif',
                  background: '#ffffff',
                  color: '#000000',
                }}>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4 text-xs">
                      <button
                        onClick={handleBack}
                        className="win-bevel-out px-2 py-0.5"
                      >
                        ◀ 返回
                      </button>
                      <span className="text-[#808080]">|</span>
                      <button className="win-bevel-out px-2 py-0.5">打印</button>
                      <button className="win-bevel-out px-2 py-0.5">收藏</button>
                    </div>

                    <div className="border border-[#808080] p-3">
                      <div className="text-lg font-bold mb-2" style={{ fontFamily: 'Microsoft YaHei, SimHei' }}>
                        {selectedPost.isTop && <span className="text-[#b8860b]">★ </span>}
                        [{selectedPost.type}] {selectedPost.title}
                      </div>

                      <div className="text-xs text-[#808080] mb-4 border-b border-[#808080] pb-2">
                        作者: <span className="text-[var(--dream-accent)]">{selectedPost.author}</span> |
                        发布时间: {selectedPost.date} |
                        阅读次数: {selectedPost.views}
                      </div>

                      <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'SimSun' }}>
                        {selectedPost.content}
                      </div>

                      <div className="mt-4">
                        {(((selectedPost.metadata ?? {}) as PostMetadata).comments ?? []).map((c, idx) => (
                          <div
                            key={`${c.time}-${idx}`}
                            className="pt-2 mt-2 text-xs"
                            style={{ borderTop: '1px dashed #7a94b0', opacity: 0.85, color: '#556274' }}
                          >
                            <span className="font-bold">[ #{idx + 1}楼 ]</span> {c.author}：{c.content} ({c.time})
                          </div>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence>
                      {replyOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <div className="border border-[#808080] p-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="在这里写下你的回复..."
                              className="win-bevel-in w-full h-20 bg-[#f0f8ff] px-2 py-1 text-xs outline-none resize-none"
                              style={{ borderRadius: 0 }}
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={handleSendReply}
                                className="win-bevel-out px-3 py-1 text-xs transition-all hover:shadow-[0_0_8px_rgba(165,243,252,0.9)]"
                              >
                                发送
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-4 flex justify-center gap-4">
                      <button onClick={() => setReplyOpen((v) => !v)} className="win-bevel-out px-4 py-1 text-xs">回复此帖</button>
                      <button className="win-bevel-out px-4 py-1 text-xs">只看该作者</button>
                      <button className="win-bevel-out px-4 py-1 text-xs">发送给好友</button>
                    </div>

                    <div className="mt-4 text-xs text-center text-[#808080]">
                      <div className="border-t border-[#808080] pt-2">
                        以上内容由 BBS 用户自发发表，与系统立场无关
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="win-bevel-in bg-[var(--win-gray)] px-2 py-1 flex items-center gap-2 text-[10px] border-t border-[#808080]">
              <span className="text-[#008000]">●</span>
              <span className={statusFlash ? 'animate-pulse text-[#a5f3fc]' : ''}>{statusText}</span>
              <span className="mx-2">|</span>
              <span>Security: Low</span>
            </div>
          </div>
          {rowMenu && (
            <div
              className="fixed z-[130] win-bevel-out bg-[#C0C0C0] p-[2px] pointer-events-auto"
              style={{ left: rowMenu.x, top: rowMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="win-bevel-out px-3 py-1 text-xs whitespace-nowrap"
                onClick={() => handleEditClick(rowMenu.post)}
              >
                编辑
              </button>
            </div>
          )}
          <PostModal
            isOpen={modalOpen}
            editingPost={editingPost}
            onClose={() => {
              setModalOpen(false);
              setEditingPost(null);
            }}
            onSave={handleSavePost}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};