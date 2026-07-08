import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const API_HOST = 'http://localhost:5000';

// Helper to wait for a number of milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to check if server is responsive on port 5000
const checkServerHealth = () => {
  return new Promise((resolve) => {
    http.get(`${API_HOST}/api/status`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.status === 'Online');
        } catch {
          resolve(false);
        }
      });
    }).on('error', () => {
      resolve(false);
    });
  });
};

async function runTests() {
  console.log('\n🔍 Starting Dreamora API Integration Verification...');

  let serverProcess = null;
  const isRunning = await checkServerHealth();

  if (isRunning) {
    console.log('✅ Server already running on port 5000. Testing against running instance.');
  } else {
    console.log('📡 Port 5000 is offline. Starting temporary server process...');
    let serverCwd = '.';
    if (!fs.existsSync(path.join(serverCwd, 'server.js')) && fs.existsSync(path.join('.', 'server', 'server.js'))) {
      serverCwd = './server';
    }
    serverProcess = spawn(process.execPath, ['server.js'], { stdio: 'inherit', cwd: serverCwd });
    
    // Wait for server to boot (up to 5 attempts)
    let retries = 5;
    let serverStarted = false;
    while (retries > 0) {
      await sleep(1500);
      const ready = await checkServerHealth();
      if (ready) {
        serverStarted = true;
        break;
      }
      retries--;
      console.log(`Waiting for server to launch... (${retries} attempts left)`);
    }

    if (!serverStarted) {
      console.error('❌ Failed to start the server. Aborting tests.');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
    console.log('✅ Temporary server launched successfully.');
  }

  let failedTests = 0;
  const assert = (condition, message) => {
    if (condition) {
      console.log(`  🟢 PASS: ${message}`);
    } else {
      console.error(`  🔴 FAIL: ${message}`);
      failedTests++;
    }
  };

  try {
    const userId = 'verify_test_user';

    // Test 1: GET Server Health
    console.log('\nTest Case 1: Fetching Server Health Status...');
    const statusRes = await fetch(`${API_HOST}/api/status`);
    const statusData = await statusRes.json();
    assert(statusRes.status === 200, 'Server status API responded with 200 OK');
    assert(statusData.status === 'Online', 'Server status is marked "Online"');
    console.log(`  ℹ️ Database Mode in server: ${statusData.database}`);

    // Test 2: POST Create Task
    console.log('\nTest Case 2: Creating a new study task...');
    const taskTitle = `Test Study Task - ${Date.now()}`;
    const createTaskRes = await fetch(`${API_HOST}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: taskTitle,
        description: 'Verifying automated testing integrations',
        priority: 'high',
        estimatedPomodoros: 3,
        userId
      })
    });
    const createdTask = await createTaskRes.json();
    assert(createTaskRes.status === 201, 'Task created with 201 Created');
    assert(createdTask.title === taskTitle, `Task title match: "${createdTask.title}"`);
    assert(createdTask.priority === 'high', 'Task priority set correctly to "high"');
    assert(createdTask.completed === false, 'New task completed state is false');

    // Test 3: GET Fetch Tasks
    console.log('\nTest Case 3: Fetching user study tasks...');
    const fetchTasksRes = await fetch(`${API_HOST}/api/tasks?userId=${userId}`);
    const tasksList = await fetchTasksRes.json();
    assert(fetchTasksRes.status === 200, 'Tasks fetch responded with 200 OK');
    assert(Array.isArray(tasksList), 'Tasks list returned as an Array');
    assert(tasksList.some(t => t._id === createdTask._id), 'Created task found in tasks response list');

    // Test 4: PUT Update Task Completed Pomodoros
    console.log('\nTest Case 4: Incrementing task study count...');
    const updateTaskRes = await fetch(`${API_HOST}/api/tasks/${createdTask._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        $inc: { completedPomodoros: 1 }
      })
    });
    const updatedTask = await updateTaskRes.json();
    assert(updateTaskRes.status === 200, 'Task update responded with 200 OK');
    assert(updatedTask.completedPomodoros === 1, `Task pomodoro count incremented to: ${updatedTask.completedPomodoros}`);

    // Test 5: POST Analytics Focus Session
    console.log('\nTest Case 5: Logging focus study session...');
    const logSessionRes = await fetch(`${API_HOST}/api/analytics/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        duration: 25,
        type: 'focus',
        roomName: 'Deep Focus Library'
      })
    });
    const loggedSession = await logSessionRes.json();
    assert(logSessionRes.status === 201, 'Focus session logged with 201 Created');
    assert(loggedSession.duration === 25, 'Focus session duration set correctly to 25m');
    assert(loggedSession.roomName === 'Deep Focus Library', 'Focus room saved as "Deep Focus Library"');

    // Test 6: GET Analytics Summary Report
    console.log('\nTest Case 6: Retrieving user productivity report...');
    const analyticsRes = await fetch(`${API_HOST}/api/analytics?userId=${userId}`);
    const report = await analyticsRes.json();
    assert(analyticsRes.status === 200, 'Analytics report responded with 200 OK');
    assert(report.totalFocusMinutes >= 25, `Focus minutes logged total is >= 25 (reported: ${report.totalFocusMinutes}m)`);
    assert(report.totalSessions >= 1, `Total logged sessions is >= 1 (reported: ${report.totalSessions})`);
    assert(report.streak >= 1, `Streak index is >= 1 day (reported: ${report.streak})`);
    assert(Array.isArray(report.dailyTrend), 'Daily trend statistics returned as an Array');

    // Test 7: DELETE Remove Task
    console.log('\nTest Case 7: Deleting study task...');
    const deleteTaskRes = await fetch(`${API_HOST}/api/tasks/${createdTask._id}`, {
      method: 'DELETE'
    });
    assert(deleteTaskRes.status === 200, 'Task delete responded with 200 OK');
    
    // Verify deleted
    const verifyDeleteRes = await fetch(`${API_HOST}/api/tasks?userId=${userId}`);
    const postDeleteTasks = await verifyDeleteRes.json();
    assert(!postDeleteTasks.some(t => t._id === createdTask._id), 'Deleted task no longer exists in task list');

  } catch (error) {
    console.error('❌ Exception occurred during test suite execution:', error);
    failedTests++;
  } finally {
    // Terminate spawned server if created
    if (serverProcess) {
      console.log('\n🛑 Stopping temporary server process...');
      serverProcess.kill('SIGTERM');
    }
  }

  // Summary
  console.log('\n=============================================');
  if (failedTests === 0) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ✅');
    process.exit(0);
  } else {
    console.error(`❌ TEST FAILURE: ${failedTests} test case(s) failed.`);
    process.exit(1);
  }
}

runTests();
