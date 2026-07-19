import mongoose from 'mongoose';
import Follow from '../models/Follow.js';
import Post from '../models/Post.js';

const WEIGHTS = {
  recency: 2.2,
  engagement: 1.0,
  followAffinity: 1.8,
  tagAffinity: 1.4,
  authorAffinity: 0.6,
};

function recencyScore(createdAt) {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3.6e6;
  return 1 / (1 + Math.max(hours, 0) / 12);
}

function engagementScore(post) {
  const raw = (post.likesCount || 0) + 2 * (post.commentsCount || 0) + 3 * (post.sharesCount || 0);
  return Math.log10(1 + raw);
}

// Interest profile = tags from the viewer's own posts + followed users' posts.
export async function buildInterestProfile(userId) {
  if (!userId) return new Set();
  const [myPosts, following] = await Promise.all([
    Post.find({ author: userId }).select('tags').limit(50).lean(),
    Follow.find({ follower: userId }).select('following').limit(200).lean(),
  ]);
  const tags = new Set();
  for (const p of myPosts) (p.tags || []).forEach((t) => tags.add(t.toLowerCase()));
  if (following.length) {
    const ids = following.map((f) => f.following);
    const theirs = await Post.find({ author: { $in: ids } }).select('tags').limit(200).lean();
    for (const p of theirs) (p.tags || []).forEach((t) => tags.add(t.toLowerCase()));
  }
  return tags;
}

export function computeScore(post, { interestProfile, followingSet, viewerId } = {}) {
  const recency = WEIGHTS.recency * recencyScore(post.createdAt);
  const engagement = WEIGHTS.engagement * engagementScore(post);
  let score = recency + engagement;

  if (viewerId) {
    const authorId = post.author?._id?.toString?.() || post.author?.toString?.();
    const postTags = (post.tags || []).map((t) => t.toLowerCase());
    const overlap = interestProfile ? postTags.filter((t) => interestProfile.has(t)).length : 0;
    if (overlap > 0) score += WEIGHTS.tagAffinity * Math.min(overlap, 3);
    if (followingSet && followingSet.has(String(authorId))) score += WEIGHTS.followAffinity;
  }
  return Number(score.toFixed(4));
}

export { WEIGHTS };
