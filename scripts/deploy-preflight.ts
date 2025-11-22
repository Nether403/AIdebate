#!/usr/bin/env tsx
/**
 * Pre-flight deployment checks
 * Validates environment, dependencies, and configuration before deployment
 * 
 * Run before deploying to production:
 * npm run deploy:check
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

const results: CheckResult[] = []

function check(name: string, fn: () => boolean | { status: boolean; message?: string }): void {
  try {
    const result = fn()
    const status = typeof result === 'boolean' ? result : result.status
    const message = typeof result === 'object' ? result.message : ''
    
    results.push({
      name,
      status: status ? 'pass' : 'fail',
      message: message || (status ? 'OK' : 'Failed'),
    })
  } catch (error) {
    results.push({
      name,
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

function warn(name: string, message: string): void {
  results.push({
    name,
    status: 'warn',
    message,
  })
}

console.log('🚀 Running pre-flight deployment checks...\n')

// Check 1: Node version
check('Node.js version', () => {
  const version = process.version
  const major = parseInt(version.slice(1).split('.')[0])
  return {
    status: major >= 18,
    message: `${version} (requires >= 18.x)`,
  }
})

// Check 2: Dependencies installed
check('Dependencies installed', () => {
  return fs.existsSync(path.join(process.cwd(), 'node_modules'))
})

// Check 3: TypeScript compilation
check('TypeScript compilation', () => {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
})

// Check 4: ESLint
check('ESLint', () => {
  try {
    execSync('npm run lint', { stdio: 'pipe' })
    return true
  } catch {
    return { status: false, message: 'Linting errors found' }
  }
})

// Check 5: Environment variables
check('Environment variables', () => {
  const required = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'GOOGLE_API_KEY',
    'TAVILY_API_KEY',
    'NEXT_PUBLIC_STACK_PROJECT_ID',
    'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
    'STACK_SECRET_SERVER_KEY',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    return {
      status: false,
      message: `Missing: ${missing.join(', ')}`,
    }
  }
  
  return true
})

// Check 6: Database connection
check('Database connection', () => {
  try {
    // This will be checked by the health endpoint
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return { status: false, message: 'DATABASE_URL not set' }
    }
    
    // Check if it's a pooled connection for production
    if (process.env.NODE_ENV === 'production' && !dbUrl.includes('pooler')) {
      warn('Database connection', 'Consider using pooled connection for production')
    }
    
    return true
  } catch {
    return false
  }
})

// Check 7: Build succeeds
check('Production build', () => {
  try {
    console.log('  Building... (this may take a few minutes)')
    execSync('npm run build', { stdio: 'pipe' })
    return true
  } catch (error) {
    return {
      status: false,
      message: 'Build failed - check build logs',
    }
  }
})

// Check 8: Critical files exist
check('Critical files', () => {
  const criticalFiles = [
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    'render.yaml',
    'app/api/health/route.ts',
  ]
  
  const missing = criticalFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)))
  
  if (missing.length > 0) {
    return {
      status: false,
      message: `Missing: ${missing.join(', ')}`,
    }
  }
  
  return true
})

// Check 9: Git status
check('Git status', () => {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' })
    if (status.trim()) {
      warn('Git status', 'Uncommitted changes detected')
    }
    return true
  } catch {
    return { status: false, message: 'Not a git repository' }
  }
})

// Check 10: Package vulnerabilities
check('Security vulnerabilities', () => {
  try {
    execSync('npm audit --audit-level=high', { stdio: 'pipe' })
    return true
  } catch {
    warn('Security vulnerabilities', 'High severity vulnerabilities found - run npm audit')
    return true // Don't fail deployment, just warn
  }
})

// Print results
console.log('\n📋 Pre-flight Check Results:\n')

const passed = results.filter(r => r.status === 'pass').length
const failed = results.filter(r => r.status === 'fail').length
const warned = results.filter(r => r.status === 'warn').length

results.forEach(result => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌'
  console.log(`${icon} ${result.name}: ${result.message}`)
})

console.log(`\n📊 Summary: ${passed} passed, ${failed} failed, ${warned} warnings\n`)

if (failed > 0) {
  console.log('❌ Pre-flight checks failed. Fix the issues above before deploying.\n')
  process.exit(1)
}

if (warned > 0) {
  console.log('⚠️  Pre-flight checks passed with warnings. Review warnings before deploying.\n')
}

console.log('✅ All pre-flight checks passed! Ready to deploy.\n')
console.log('Next steps:')
console.log('1. Push to GitHub: git push origin main')
console.log('2. Render will automatically deploy')
console.log('3. Monitor deployment: https://dashboard.render.com')
console.log('4. Check health: https://your-app.onrender.com/api/health\n')

process.exit(0)
