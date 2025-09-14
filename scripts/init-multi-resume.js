#!/usr/bin/env node

/**
 * Multi-Resume System Initialization Script
 * 
 * This script initializes the multi-resume system by:
 * 1. Creating the necessary directory structure
 * 2. Initializing the resume index
 * 3. Setting up environment variables
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

async function initializeMultiResumeSystem() {
  console.log('🚀 Initializing Multi-Resume System...\n');

  try {
    // Check if PII_PATH is set
    const piiPath = process.env.PII_PATH;
    if (!piiPath) {
      console.error('❌ Error: PII_PATH environment variable is not set.');
      console.log('Please set PII_PATH to your data directory and try again.\n');
      console.log('Example:');
      console.log('export PII_PATH=/path/to/your/pii/data');
      process.exit(1);
    }

    console.log(`📁 Using PII directory: ${piiPath}`);

    // Check if PII directory exists
    if (!fs.existsSync(piiPath)) {
      console.error(`❌ Error: PII directory does not exist: ${piiPath}`);
      process.exit(1);
    }

    // Check if data.yml exists
    const dataYmlPath = path.join(piiPath, 'data.yml');
    if (!fs.existsSync(dataYmlPath)) {
      console.error(`❌ Error: data.yml not found in PII directory: ${dataYmlPath}`);
      process.exit(1);
    }

    console.log('✅ Basic requirements verified\n');

    // Create multi-resume directory structure
    const resumesDir = path.join(piiPath, 'resumes');
    if (!fs.existsSync(resumesDir)) {
      fs.mkdirSync(resumesDir, { recursive: true });
      console.log('📁 Created resumes directory');
    } else {
      console.log('📁 Resumes directory already exists');
    }

    // Initialize resume index
    const indexPath = path.join(piiPath, 'resume-index.json');
    if (!fs.existsSync(indexPath)) {
      const initialIndex = {
        lastUpdated: new Date().toISOString(),
        default: 'data.yml',
        positions: {}
      };

      fs.writeFileSync(indexPath, JSON.stringify(initialIndex, null, 2));
      console.log('📄 Created resume index');
    } else {
      console.log('📄 Resume index already exists');
    }

    // Check environment configuration
    console.log('\n🔧 Environment Configuration:');
    
    // Check if multi-resume is enabled
    const multiResumeEnabled = process.env.MULTI_RESUME_ENABLED === 'true';
    console.log(`   MULTI_RESUME_ENABLED: ${multiResumeEnabled ? '✅ enabled' : '⚠️  disabled (set to "true" to enable)'}`);
    
    // Check Next.js public env var
    const nextPublicEnabled = process.env.NEXT_PUBLIC_MULTI_RESUME_ENABLED === 'true';
    console.log(`   NEXT_PUBLIC_MULTI_RESUME_ENABLED: ${nextPublicEnabled ? '✅ enabled' : '⚠️  disabled (set to "true" to enable in browser)'}`);

    console.log('\n✨ Multi-Resume System initialized successfully!\n');

    if (!multiResumeEnabled || !nextPublicEnabled) {
      console.log('💡 To enable the multi-resume features, add these to your .env file:');
      console.log('   MULTI_RESUME_ENABLED=true');
      console.log('   NEXT_PUBLIC_MULTI_RESUME_ENABLED=true\n');
    }

    console.log('🎯 Next steps:');
    console.log('   1. Set environment variables (if not already done)');
    console.log('   2. Restart your development server');
    console.log('   3. Open your CV generator and look for the new Resume Selector in the navigation');
    console.log('   4. Click "Create New Resume" to create your first position-specific resume\n');

    console.log('📚 Features available:');
    console.log('   • Create resumes for specific positions (e.g., "software-engineer")');
    console.log('   • Create company-specific versions (e.g., "Google", "Microsoft")');
    console.log('   • Track application status and deadlines');
    console.log('   • Navigate between different resume versions');
    console.log('   • All changes are automatically backed up\n');

  } catch (error) {
    console.error('❌ Error initializing multi-resume system:', error.message);
    process.exit(1);
  }
}

// Run the initialization
initializeMultiResumeSystem();
