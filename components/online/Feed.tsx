"use client";

// The Q64 social feed: players post a quote or a photo from their device; everyone can
// like and comment. Tap an author to open their full profile.

import { useCallback, useEffect, useRef, useState } from "react";
import { SendIcon } from "@/components/ui/icons";
import { fileToPostImage } from "@/lib/store";
import {
  createPost, listPosts, deletePost, likeInfo, toggleLike, listComments, addComment,
  type Post, type Comment, type OnlineUser,
} from "@/lib/online";

export default function Feed({ me, onOpenProfile }: { me: OnlineUser; onOpenProfile: (id: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => { listPosts().then(setPosts); }, []);
  useEffect(() => { load(); }, [load]);

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImage(await fileToPostImage(f));
  };

  const submit = async () => {
    if (!body.trim() && !image) return;
    setBusy(true);
    await createPost(body.trim(), image, me);
    setBusy(false);
    setBody(""); setImage(null);
    load();
  };

  return (
    <div className="space-y-4">
      {/* composer */}
      <div className="glass-strong rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-sm font-bold text-white shrink-0">
            {me.avatar ? <img src={me.avatar} alt="" className="h-full w-full object-cover" /> : me.username.slice(0, 1).toUpperCase()}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share a quote or what's on your mind…"
            rows={2}
            className="flex-1 bg-night-600 rounded-xl px-3 py-2 text-sm text-white outline-none border border-electric-500/20 focus:border-electric-500 resize-none"
          />
        </div>
        {image && (
          <div className="mt-3 relative">
            <img src={image} alt="" className="rounded-xl w-full object-cover max-h-60" />
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-night-900/80 text-white rounded-full h-7 w-7 text-sm">✕</button>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => fileRef.current?.click()} className="text-[13px] text-electric-300 flex items-center gap-1.5">
            <PhotoIcon className="w-5 h-5" /> Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <button onClick={submit} disabled={busy || (!body.trim() && !image)} className="rounded-xl px-5 py-2 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 disabled:opacity-50">
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-slate-400 text-sm">No posts yet. Be the first to share something.</div>
      ) : posts.map((p) => (
        <PostCard key={p.id} post={p} me={me} onOpenProfile={onOpenProfile} onDeleted={load} />
      ))}
    </div>
  );
}

function PostCard({ post, me, onOpenProfile, onDeleted }: { post: Post; me: OnlineUser; onOpenProfile: (id: string) => void; onDeleted: () => void }) {
  const [likes, setLikes] = useState<{ count: number; liked: boolean }>({ count: 0, liked: false });
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ctext, setCtext] = useState("");

  useEffect(() => { likeInfo(post.id).then(setLikes); }, [post.id]);

  const like = async () => {
    const liked = await toggleLike(post.id, post.author_id, me.username);
    setLikes((l) => ({ count: l.count + (liked ? 1 : -1), liked }));
  };
  const openComments = async () => {
    setShowComments((v) => !v);
    if (!showComments) setComments(await listComments(post.id));
  };
  const submitComment = async () => {
    const b = ctext.trim();
    if (!b) return;
    setCtext("");
    await addComment(post.id, b, post.author_id, me);
    setComments(await listComments(post.id));
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => onOpenProfile(post.author_id)} className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-sm font-bold text-white">
          {post.author_avatar ? <img src={post.author_avatar} alt="" className="h-full w-full object-cover" /> : (post.author_name || "?").slice(0, 1).toUpperCase()}
        </button>
        <div className="flex-1">
          <button onClick={() => onOpenProfile(post.author_id)} className="text-white font-semibold text-sm hover:underline">{post.author_name || "Player"}</button>
          <div className="text-[10px] text-slate-500">{new Date(post.created_at).toLocaleString()}</div>
        </div>
        {post.author_id === me.id && (
          <button onClick={async () => { await deletePost(post.id); onDeleted(); }} className="text-[11px] text-slate-500 hover:text-red-300">Delete</button>
        )}
      </div>

      {post.body && <div className="text-sm text-slate-100 whitespace-pre-wrap mb-2">{post.body}</div>}
      {post.image_url && <img src={post.image_url} alt="" className="rounded-xl w-full object-cover max-h-96 mb-2" />}

      <div className="flex items-center gap-4 pt-1 text-sm">
        <button onClick={like} className={`flex items-center gap-1.5 ${likes.liked ? "text-electric-300" : "text-slate-400"} hover:text-electric-300`}>
          <HeartIcon className="w-5 h-5" filled={likes.liked} /> {likes.count > 0 && likes.count}
        </button>
        <button onClick={openComments} className="flex items-center gap-1.5 text-slate-400 hover:text-electric-300">
          <CommentIcon className="w-5 h-5" /> Comment
        </button>
      </div>

      {showComments && (
        <div className="mt-3 border-t border-white/5 pt-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <button onClick={() => onOpenProfile(c.user_id)} className="h-6 w-6 rounded-full overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {c.author_avatar ? <img src={c.author_avatar} alt="" className="h-full w-full object-cover" /> : (c.author_name || "?").slice(0, 1).toUpperCase()}
              </button>
              <div className="bg-night-600/70 rounded-xl px-3 py-1.5 flex-1">
                <span className="text-[12px] font-semibold text-white">{c.author_name || "Player"}</span>
                <span className="text-[12px] text-slate-200 ml-2">{c.body}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <input
              value={ctext}
              onChange={(e) => setCtext(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Write a comment…"
              className="flex-1 bg-night-600 rounded-lg px-3 py-2 text-[13px] text-white outline-none border border-electric-500/20 focus:border-electric-500"
            />
            <button onClick={submitComment} className="text-electric-400 hover:text-cyan-q"><SendIcon className="w-5 h-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 17-5-5-6 6" />
    </svg>
  );
}
function HeartIcon({ className = "w-6 h-6", filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}
function CommentIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-11.9 7.6L3 21l1.9-6.1A8.4 8.4 0 1 1 21 11.5Z" />
    </svg>
  );
}
