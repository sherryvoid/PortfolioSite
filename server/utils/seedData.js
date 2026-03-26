const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Project = require('../models/Project');
const Skill = require('../models/Skill');
const Certification = require('../models/Certification');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Project.deleteMany({}),
      Skill.deleteMany({}),
      Certification.deleteMany({})
    ]);

    // Create admin user
    await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@portfolio.com',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    });
    console.log('Admin user created');

    // Create profile
    await Profile.create({
      name: 'Shaheryar',
      title: 'Full Stack Software Developer',
      bio: 'Passionate software developer with expertise in building modern web applications. I specialize in React, Node.js, and cloud technologies. I love turning complex problems into simple, beautiful, and intuitive solutions.',
      email: 'contact@portfolio.com',
      location: 'Pakistan',
      heroSubtitle: 'Software Developer · Problem Solver · Creator',
      social: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      },
      stats: {
        yearsExperience: 3,
        projectsCompleted: 15,
        happyClients: 10
      },
      aboutTimeline: [
        { year: '2021', title: 'Started Coding Journey', description: 'Began learning web development with HTML, CSS, and JavaScript.' },
        { year: '2022', title: 'First Professional Project', description: 'Built and deployed my first full-stack web application.' },
        { year: '2023', title: 'Full Stack Developer', description: 'Mastered React, Node.js, and cloud technologies.' },
        { year: '2024', title: 'Expanding Horizons', description: 'Exploring AI/ML integration and mobile development.' }
      ]
    });
    console.log('Profile created');

    // Create projects
    await Project.insertMany([
      {
        title: 'E-Commerce Platform',
        description: 'A full-featured e-commerce platform with payment integration, inventory management, and real-time order tracking.',
        longDescription: 'Built with React and Node.js, this platform features Stripe payment integration, real-time inventory updates, and a comprehensive admin dashboard.',
        techStack: ['react', 'nodejs', 'mongodb', 'express', 'stripe'],
        liveUrl: 'https://example.com',
        githubUrl: 'https://github.com',
        category: 'web',
        featured: true,
        order: 0
      },
      {
        title: 'AI Chat Application',
        description: 'Real-time chat application powered by AI with smart responses, sentiment analysis, and multi-language support.',
        techStack: ['react', 'python', 'tensorflow', 'socketio', 'postgresql'],
        liveUrl: 'https://example.com',
        githubUrl: 'https://github.com',
        category: 'ai',
        featured: true,
        order: 1
      },
      {
        title: 'Task Management System',
        description: 'A collaborative project management tool with Kanban boards, real-time updates, and team collaboration features.',
        techStack: ['react', 'nodejs', 'mongodb', 'socketio'],
        githubUrl: 'https://github.com',
        category: 'web',
        featured: false,
        order: 2
      },
      {
        title: 'Fitness Tracker Mobile App',
        description: 'Cross-platform mobile app for tracking workouts, nutrition, and health metrics with data visualization.',
        techStack: ['react', 'firebase', 'typescript'],
        category: 'mobile',
        featured: false,
        order: 3
      },
      {
        title: 'REST API Microservices',
        description: 'Scalable microservices architecture with API gateway, service discovery, and containerized deployment.',
        techStack: ['nodejs', 'docker', 'kubernetes', 'redis', 'postgresql'],
        githubUrl: 'https://github.com',
        category: 'backend',
        featured: true,
        order: 4
      },
      {
        title: 'Portfolio Website',
        description: 'This very portfolio website you are viewing right now! Built with React, Framer Motion, and Node.js.',
        techStack: ['react', 'nodejs', 'mongodb', 'express'],
        githubUrl: 'https://github.com',
        category: 'web',
        featured: false,
        order: 5
      }
    ]);
    console.log('Projects created');

    // Create skills
    await Skill.insertMany([
      // Frontend
      { name: 'React', icon: 'react', category: 'frontend', proficiency: 90, order: 0 },
      { name: 'JavaScript', icon: 'javascript', category: 'frontend', proficiency: 92, order: 1 },
      { name: 'TypeScript', icon: 'typescript', category: 'frontend', proficiency: 80, order: 2 },
      { name: 'HTML5', icon: 'html5', category: 'frontend', proficiency: 95, order: 3 },
      { name: 'CSS3', icon: 'css3', category: 'frontend', proficiency: 90, order: 4 },
      { name: 'Next.js', icon: 'nextjs', category: 'frontend', proficiency: 75, order: 5 },
      // Backend
      { name: 'Node.js', icon: 'nodejs', category: 'backend', proficiency: 88, order: 0 },
      { name: 'Express', icon: 'express', category: 'backend', proficiency: 85, order: 1 },
      { name: 'Python', icon: 'python', category: 'backend', proficiency: 75, order: 2 },
      // Database
      { name: 'MongoDB', icon: 'mongodb', category: 'database', proficiency: 85, order: 0 },
      { name: 'PostgreSQL', icon: 'postgresql', category: 'database', proficiency: 70, order: 1 },
      { name: 'Redis', icon: 'redis', category: 'database', proficiency: 65, order: 2 },
      // DevOps
      { name: 'Docker', icon: 'docker', category: 'devops', proficiency: 70, order: 0 },
      { name: 'Git', icon: 'git', category: 'devops', proficiency: 90, order: 1 },
      { name: 'AWS', icon: 'amazonwebservices', category: 'devops', proficiency: 65, order: 2 },
      // Tools
      { name: 'VS Code', icon: 'vscode', category: 'tools', proficiency: 95, order: 0 },
      { name: 'Figma', icon: 'figma', category: 'tools', proficiency: 60, order: 1 },
      { name: 'Postman', icon: 'postman', category: 'tools', proficiency: 85, order: 2 }
    ]);
    console.log('Skills created');

    // Create certifications
    await Certification.insertMany([
      {
        title: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        issueDate: new Date('2024-01-15'),
        expiryDate: new Date('2027-01-15'),
        credentialUrl: 'https://aws.amazon.com/certification/',
        order: 0
      },
      {
        title: 'Meta Front-End Developer',
        issuer: 'Meta (Coursera)',
        issueDate: new Date('2023-06-01'),
        credentialUrl: 'https://coursera.org',
        order: 1
      },
      {
        title: 'MongoDB Developer Certification',
        issuer: 'MongoDB University',
        issueDate: new Date('2023-09-01'),
        credentialUrl: 'https://university.mongodb.com',
        order: 2
      },
      {
        title: 'Google IT Automation with Python',
        issuer: 'Google (Coursera)',
        issueDate: new Date('2023-03-01'),
        credentialUrl: 'https://coursera.org',
        order: 3
      }
    ]);
    console.log('Certifications created');

    console.log('\\n✅ Database seeded successfully!');
    console.log(`   Admin: ${process.env.ADMIN_EMAIL || 'admin@portfolio.com'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
