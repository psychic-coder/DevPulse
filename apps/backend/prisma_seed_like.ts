import dataSource from './src/database/data-source';
import { User } from './src/users/entities/user.entity';
import { Post } from './src/posts/entities/post.entity';
import { Comment } from './src/comments/entities/comment.entity';
import { encryptToken } from './src/common/utils/crypto.util';

const SAMPLE_USERS = [
  {
    githubId: 'seed-1',
    githubUsername: 'seed_user',
    displayName: 'Seed User',
    email: 'seed@example.com',
  },
  {
    githubId: 'seed-2',
    githubUsername: 'alice',
    displayName: 'Alice',
    email: 'alice@example.com',
  },
  {
    githubId: 'seed-3',
    githubUsername: 'bob',
    displayName: 'Bob',
    email: 'bob@example.com',
  },
];

const SAMPLE_POSTS = [
  { title: 'Welcome to DevPulse', content: 'This is the first seeded post.' },
  { title: 'Second Post', content: 'More content to browse.' },
];

const SAMPLE_COMMENTS = ['Nice post!', 'Thanks for sharing', 'Great read'];

async function run() {
  await dataSource.initialize();
  await dataSource.runMigrations();

  const userRepo = dataSource.getRepository(User);
  const postRepo = dataSource.getRepository(Post);
  const commentRepo = dataSource.getRepository(Comment);

  // seed users
  const createdUsers: User[] = [];
  for (const u of SAMPLE_USERS) {
    let user = await userRepo.findOne({ where: { githubId: u.githubId } });
    if (!user) {
      user = userRepo.create({
        githubId: u.githubId,
        githubUsername: u.githubUsername,
        displayName: u.displayName,
        avatarUrl: null,
        email: u.email,
        githubToken: encryptToken('tokenseed'),
        refreshToken: `refresh-${u.githubId}`,
      });
      await userRepo.save(user);
      console.log(`Created user ${u.githubUsername}`);
    }
    createdUsers.push(user);
  }

  // seed posts (assign to first user)
  let posts: Post[] = [];
  for (const p of SAMPLE_POSTS) {
    let post = await postRepo.findOne({ where: { title: p.title } });
    if (!post) {
      post = postRepo.create({
        title: p.title,
        content: p.content,
        authorId: createdUsers[0].id,
      });
      await postRepo.save(post);
      console.log(`Created post ${p.title}`);
    }
    posts.push(post);
  }

  // seed comments
  for (let i = 0; i < SAMPLE_COMMENTS.length; i++) {
    const content = SAMPLE_COMMENTS[i];
    const post = posts[i % posts.length];
    const author = createdUsers[(i + 1) % createdUsers.length];

    let comment = await commentRepo.findOne({ where: { content } });
    if (!comment) {
      comment = commentRepo.create({
        postId: post.id,
        authorId: author.id,
        content,
      });
      await commentRepo.save(comment);
      console.log(`Created comment on post ${post.title}`);
    }
  }

  console.log('Seeding complete');
  await dataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
