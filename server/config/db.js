const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // If we can't connect to the configured URI, use in-memory MongoDB
    if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
        console.log('Using MongoDB Memory Server (in-memory database)');
        console.log('⚠️  Data will not persist between restarts. Set MONGODB_URI to a real MongoDB instance for persistence.');
      } catch (memErr) {
        // If memory server fails, try the original URI anyway
        console.log('MongoDB Memory Server not available, trying configured URI...');
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed if database is empty
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Empty database detected. Running auto-seed...');
      await autoSeed();
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

async function autoSeed() {
  const User = require('../models/User');
  const Profile = require('../models/Profile');
  const Project = require('../models/Project');
  const Skill = require('../models/Skill');
  const Certification = require('../models/Certification');

  // Create admin user
  await User.create({
    email: process.env.ADMIN_EMAIL || 'admin@portfolio.com',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  });

  // Create profile
  await Profile.create({
    name: 'Shaheryar',
    title: 'Full Stack Software Developer',
    bio: 'Passionate software developer with expertise in building modern web applications. I specialize in React, Node.js, and cloud technologies. I love turning complex problems into simple, beautiful, and intuitive solutions.',
    email: 'contact@portfolio.com',
    location: 'Pakistan',
    heroSubtitle: 'Software Developer · Problem Solver · Creator',
    social: { github: 'https://github.com', linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' },
    stats: { yearsExperience: 3, projectsCompleted: 15, happyClients: 10 },
    aboutTimeline: [
      { year: '2021', title: 'Started Coding Journey', description: 'Began learning web development with HTML, CSS, and JavaScript.' },
      { year: '2022', title: 'First Professional Project', description: 'Built and deployed my first full-stack web application.' },
      { year: '2023', title: 'Full Stack Developer', description: 'Mastered React, Node.js, and cloud technologies.' },
      { year: '2024', title: 'Expanding Horizons', description: 'Exploring AI/ML integration and mobile development.' }
    ]
  });

  // Create projects
  await Project.insertMany([
    { title: 'E-Commerce Platform', description: 'A full-featured e-commerce platform with payment integration, inventory management, and real-time order tracking.', longDescription: 'Built with React and Node.js, this platform features real-time inventory updates and a comprehensive admin dashboard.', techStack: ['react', 'nodejs', 'mongodb', 'express'], liveUrl: 'https://example.com', githubUrl: 'https://github.com', category: 'web', featured: true, order: 0 },
    { title: 'AI Chat Application', description: 'Real-time chat application powered by AI with smart responses and multi-language support.', techStack: ['react', 'python', 'tensorflow', 'socketio'], githubUrl: 'https://github.com', category: 'ai', featured: true, order: 1 },
    { title: 'Task Management System', description: 'A collaborative project management tool with Kanban boards and real-time updates.', techStack: ['react', 'nodejs', 'mongodb', 'socketio'], githubUrl: 'https://github.com', category: 'web', featured: false, order: 2 },
    { title: 'Fitness Tracker App', description: 'Cross-platform mobile app for tracking workouts, nutrition, and health metrics.', techStack: ['react', 'firebase', 'typescript'], category: 'mobile', featured: false, order: 3 },
    { title: 'REST API Microservices', description: 'Scalable microservices architecture with API gateway and containerized deployment.', techStack: ['nodejs', 'docker', 'kubernetes', 'redis'], githubUrl: 'https://github.com', category: 'backend', featured: true, order: 4 },
    { title: 'Portfolio Website', description: 'This portfolio website built with React, Framer Motion, and Node.js.', techStack: ['react', 'nodejs', 'mongodb', 'express'], githubUrl: 'https://github.com', category: 'web', featured: false, order: 5 }
  ]);

  // Create skills
  await Skill.insertMany([
    { name: 'React', icon: 'react', category: 'frontend', proficiency: 90, order: 0 },
    { name: 'JavaScript', icon: 'javascript', category: 'frontend', proficiency: 92, order: 1 },
    { name: 'TypeScript', icon: 'typescript', category: 'frontend', proficiency: 80, order: 2 },
    { name: 'HTML5', icon: 'html5', category: 'frontend', proficiency: 95, order: 3 },
    { name: 'CSS3', icon: 'css3', category: 'frontend', proficiency: 90, order: 4 },
    { name: 'Next.js', icon: 'nextjs', category: 'frontend', proficiency: 75, order: 5 },
    { name: 'Node.js', icon: 'nodejs', category: 'backend', proficiency: 88, order: 0 },
    { name: 'Express', icon: 'express', category: 'backend', proficiency: 85, order: 1 },
    { name: 'Python', icon: 'python', category: 'backend', proficiency: 75, order: 2 },
    { name: 'MongoDB', icon: 'mongodb', category: 'database', proficiency: 85, order: 0 },
    { name: 'PostgreSQL', icon: 'postgresql', category: 'database', proficiency: 70, order: 1 },
    { name: 'Redis', icon: 'redis', category: 'database', proficiency: 65, order: 2 },
    { name: 'Docker', icon: 'docker', category: 'devops', proficiency: 70, order: 0 },
    { name: 'Git', icon: 'git', category: 'devops', proficiency: 90, order: 1 },
    { name: 'AWS', icon: 'amazonwebservices', category: 'devops', proficiency: 65, order: 2 },
    { name: 'VS Code', icon: 'vscode', category: 'tools', proficiency: 95, order: 0 },
    { name: 'Figma', icon: 'figma', category: 'tools', proficiency: 60, order: 1 },
    { name: 'Postman', icon: 'postman', category: 'tools', proficiency: 85, order: 2 }
  ]);

  // Create certifications
  await Certification.insertMany([
    { title: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', issueDate: new Date('2024-01-15'), expiryDate: new Date('2027-01-15'), credentialUrl: 'https://aws.amazon.com/certification/', order: 0 },
    { title: 'Meta Front-End Developer', issuer: 'Meta (Coursera)', issueDate: new Date('2023-06-01'), credentialUrl: 'https://coursera.org', order: 1 },
    { title: 'MongoDB Developer Certification', issuer: 'MongoDB University', issueDate: new Date('2023-09-01'), credentialUrl: 'https://university.mongodb.com', order: 2 },
    { title: 'Google IT Automation with Python', issuer: 'Google (Coursera)', issueDate: new Date('2023-03-01'), credentialUrl: 'https://coursera.org', order: 3 }
  ]);

  console.log('✅ Auto-seed completed! Admin: admin@portfolio.com / admin123');
}

module.exports = connectDB;
