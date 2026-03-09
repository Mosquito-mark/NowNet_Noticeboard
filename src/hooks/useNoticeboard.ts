import { useState, useEffect } from 'react';
import { Group, Thread, Post } from '../types';
import { sanitizeContent } from '../utils/sanitizer';

export function useNoticeboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);

  const fetchGroups = async () => {
    const res = await fetch('/api/groups');
    const data = await res.json();
    setGroups(data);
  };

  const fetchThreads = async (groupId: number) => {
    const res = await fetch(`/api/groups/${groupId}/threads`);
    const data = await res.json();
    setThreads(data);
  };

  const fetchPosts = async (threadId: number) => {
    const res = await fetch(`/api/threads/${threadId}`);
    const data = await res.json();
    setPosts(data.posts);
    setSelectedThread(data.thread);
  };

  const createThread = async (groupId: number, userId: string, title: string, content: string) => {
    const sanitizedTitle = sanitizeContent(title);
    const sanitizedContentText = sanitizeContent(content);
    const res = await fetch(`/api/groups/${groupId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: sanitizedTitle, author: `NODE_${userId}`, content: sanitizedContentText })
    });
    if (res.ok) {
      fetchThreads(groupId);
      return true;
    }
    return false;
  };

  const createPost = async (threadId: number, userId: string, content: string) => {
    const sanitizedContentText = sanitizeContent(content);
    const res = await fetch(`/api/threads/${threadId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: `NODE_${userId}`, content: sanitizedContentText })
    });
    if (res.ok) {
      fetchPosts(threadId);
      return true;
    }
    return false;
  };

  return {
    groups,
    threads,
    posts,
    selectedGroup,
    setSelectedGroup,
    selectedThread,
    setSelectedThread,
    fetchGroups,
    fetchThreads,
    fetchPosts,
    createThread,
    createPost
  };
}
