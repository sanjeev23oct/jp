/**
 * Simple test script to verify chat functionality
 */

const API_URL = 'http://localhost:3001';

async function testHealthCheck() {
  console.log('\n🔍 Testing health check...');
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Health check passed:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testChatMode() {
  console.log('\n🔍 Testing Chat Mode...');
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What is a good way to structure a landing page?',
        mode: 'chat',
        conversationHistory: []
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Chat Mode response received');
    console.log('   Message:', data.message.content.substring(0, 100) + '...');
    console.log('   Tokens used:', data.message.metadata?.tokensUsed);
    console.log('   Suggestions:', data.suggestions?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Chat Mode failed:', error.message);
    return false;
  }
}

async function testAgentMode() {
  console.log('\n🔍 Testing Agent Mode...');
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Create a simple button with blue background',
        mode: 'agent',
        conversationHistory: []
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Agent Mode response received');
    console.log('   Message:', data.message.content);
    console.log('   Code generated:', !!data.generatedCode);
    if (data.generatedCode) {
      console.log('   HTML length:', data.generatedCode.html?.length || 0);
      console.log('   CSS length:', data.generatedCode.css?.length || 0);
      console.log('   JS length:', data.generatedCode.js?.length || 0);
    }
    console.log('   Actions:', data.actions?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Agent Mode failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Chat API Tests\n');
  console.log('=' .repeat(50));

  const results = {
    health: await testHealthCheck(),
    chat: await testChatMode(),
    agent: await testAgentMode()
  };

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results:');
  console.log('   Health Check:', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('   Chat Mode:', results.chat ? '✅ PASS' : '❌ FAIL');
  console.log('   Agent Mode:', results.agent ? '✅ PASS' : '❌ FAIL');

  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
  console.log('=' .repeat(50) + '\n');

  process.exit(allPassed ? 0 : 1);
}

runTests();

