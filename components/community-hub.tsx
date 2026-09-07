'use client';

import { useState } from 'react';
import { loadPosts, savePosts, type CommunityPost } from '@/lib/community/local-community';
import { loadSportsIdentity } from '@/lib/identity/sports-identity';

export function CommunityHub() {
  const [posts, setPosts] = useState<CommunityPost[]>(() => loadPosts());
  const [body, setBody] = useState('');
  const [community, setCommunity] = useState('GLOBAL');
  const identity = loadSportsIdentity();

  const publish = () => {
    const clean = body.trim();
    if (!clean) return;
    const next = [{ id: `post-${Date.now()}`, author: identity.displayName, community, body: clean.slice(0, 500), createdAt: new Date().toISOString(), reactions: 0 }, ...posts];
    setPosts(next); savePosts(next); setBody('');
  };

  const react = (id: string) => {
    const next = posts.map((post) => post.id === id ? { ...post, reactions: post.reactions + 1 } : post);
    setPosts(next); savePosts(next);
  };

  return <section className="uw-community" aria-labelledby="community-title">
    <div className="uw-community__head"><div><p className="uw-eyebrow">FOR COMMUNITY</p><h2 id="community-title">THE <span>STANDS</span></h2></div><p>One live room for the people who make sports culture.</p></div>
    <div className="uw-community__compose"><select value={community} onChange={(event) => setCommunity(event.target.value)} aria-label="Choose community"><option>GLOBAL</option><option>FOOTBALL</option><option>BASKETBALL</option><option>WOMEN’S SPORTS</option><option>AFRICAN SPORT</option></select><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What are you seeing, thinking or discovering?" maxLength={500} /><div><span>{body.length}/500</span><button onClick={publish} disabled={!body.trim()}>POST TO THE STANDS</button></div></div>
    <div className="uw-community__feed">{posts.map((post) => <article key={post.id}><div className="uw-post-meta"><b>{post.author}</b><span>#{post.community}</span><time dateTime={post.createdAt}>NOW</time></div><p>{post.body}</p><button onClick={() => react(post.id)} aria-label={`React to post by ${post.author}`}>♥ {post.reactions}</button></article>)}</div>
  </section>;
}
