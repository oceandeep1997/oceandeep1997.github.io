#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

// ---------- helpers ----------
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      out[k] = v === undefined ? true : v;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function slugify(str) {
  return str
    .normalize('NFKD')               // split diacritics
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function openInEditor(filepath) {
  const envEditor = process.env.VISUAL || process.env.EDITOR;
  const cmds = [];
  if (envEditor) cmds.push(envEditor);
  cmds.push('code', 'subl', 'open', 'xdg-open', 'notepad');

  for (const cmd of cmds) {
    const check = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd]);
    if (check.status === 0 || envEditor) {
      const run = envEditor ? envEditor.split(' ') : [cmd];
      const res = spawnSync(run[0], [...run.slice(1), filepath], { stdio: 'inherit' });
      if (res.status === 0) return true;
    }
  }
  return false;
}

// ---------- inputs ----------
const args = parseArgs(process.argv);
const rawTitle = args.title || args._.join(' ') || 'New Post';
const title = rawTitle.trim();
const slug = (args.slug ? slugify(args.slug) : slugify(title)) || 'post';
const today = (args.date || new Date().toISOString().slice(0, 10));
const author = args.author || 'Your Name';
const draft = !!args.draft;
const tags = (args.tags ? String(args.tags).split(',').map(s => s.trim()).filter(Boolean) : []);

// ---------- paths ----------
const root = process.cwd();
const postsRoot = draft ? path.join(root, 'drafts') : path.join(root, '_posts');
const postPath = path.join(postsRoot, `${slug}.mdx`);
const assetsDir  = path.join(root, 'public', 'assets', 'blog', slug);
const authorsDir = path.join(root, 'public', 'assets', 'blog', 'authors');

// 1×1 PNG transparent (base64)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

// ---------- create ----------
try {
  ensureDir(postsRoot);
  ensureDir(assetsDir);
  ensureDir(authorsDir);

  // make placeholders only if they don't exist
  const coverPath = path.join(assetsDir, 'cover.jpg');
  const youPath = path.join(authorsDir, 'you.jpg');
  if (!fs.existsSync(coverPath)) fs.writeFileSync(coverPath, Buffer.from(pngBase64, 'base64'));
  if (!fs.existsSync(youPath))   fs.writeFileSync(youPath,   Buffer.from(pngBase64, 'base64'));

  if (fs.existsSync(postPath)) {
    console.error(`⛔ Post already exists: ${postPath}`);
    process.exit(1);
  }

  const frontmatter =
`---
title: "${title.replace(/"/g, '\\"')}"
excerpt: "..."
coverImage: "/assets/blog/${slug}/cover.jpg"
date: "${today}"
author:
  name: "${author.replace(/"/g, '\\"')}"
  picture: "/assets/blog/authors/you.jpg"
${tags.length ? `tags:\n${tags.map(t => `  - ${t}`).join('\n')}\n` : ''}ogImage:
  url: "/assets/blog/${slug}/cover.jpg"
${draft ? 'draft: true\n' : ''}---
`;

  const body = `Write your post here. You can use **Markdown** and MDX.\n`;
  fs.writeFileSync(postPath, frontmatter + '\n' + body, 'utf8');

  console.log(`✅ Created: ${postPath}`);
  console.log(`📦 Assets : ${assetsDir}`);
  if (draft) console.log('📝 Note   : This is in /drafts (not published).');

  // open in editor
  if (!openInEditor(postPath)) {
    console.log('ℹ️  Could not auto-open editor. Open the file manually.');
  }
} catch (err) {
  console.error('❌ Error creating post:', err.message);
  process.exit(1);
}
