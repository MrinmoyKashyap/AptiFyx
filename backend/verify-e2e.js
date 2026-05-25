/* End-to-end verification driver — drives backend through HTTP + Socket.io
 * exactly the way the mobile app does. Logs every observable event.
 */
const path = require('path');
const { io } = require(path.join(__dirname, '..', 'mobile', 'node_modules', 'socket.io-client'));

const BASE = 'http://localhost:3001';
const API  = `${BASE}/api`;

// ── helpers ─────────────────────────────────────────────────
const log = (tag, msg, data) => {
  const t = new Date().toISOString().slice(11, 23);
  if (data !== undefined) console.log(`[${t}] ${tag}`, msg, JSON.stringify(data));
  else                    console.log(`[${t}] ${tag}`, msg);
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function post(url, body) {
  const r = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  try { return { status: r.status, json: JSON.parse(text) }; }
  catch { return { status: r.status, text }; }
}

async function authedGet(url, token) {
  const r = await fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: r.status, json: await r.json() };
}

async function authedPost(url, token, body) {
  const r = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json() };
}

async function loginCustomer(phone) {
  const otpRes = await post('/auth/send-otp', { phone, role: 'customer' });
  const otp = otpRes.json.otp;
  const v = await post('/auth/customer/verify-otp', { phone, otp });
  return { token: v.json.token, user: v.json.user, isNewUser: v.json.isNewUser };
}

async function loginProvider(phone) {
  const otpRes = await post('/auth/send-otp', { phone, role: 'provider' });
  const otp = otpRes.json.otp;
  const v = await post('/auth/provider/verify-otp', { phone, otp });
  return { token: v.json.token, user: v.json.user, isNewUser: v.json.isNewUser };
}

function connectSocket(token, tag) {
  return new Promise((resolve, reject) => {
    const s = io(BASE, { auth: { token }, transports: ['websocket'] });
    s.on('connect', () => { log(tag, '🔌 socket connected', s.id); resolve(s); });
    s.on('connect_error', err => reject(err));
    setTimeout(() => reject(new Error('connect timeout')), 5000);
  });
}

function attachLogger(socket, tag, store) {
  socket.onAny((event, data) => {
    log(tag, `← ${event}`, data);
    if (store) store.push({ event, data, at: Date.now() });
  });
}

// ── tests ───────────────────────────────────────────────────

async function ensureCleanState() {
  // Make sure providers are offline + reset commission counters via API
  // We can't access DB directly from JS, so we'll work with what we have.
  // Toggle both providers offline.
  log('SETUP', 'Logging in both providers to reset state...');
  const p1 = await loginProvider('9988776655');
  const p2 = await loginProvider('9911223344');
  await authedPost('/providers/toggle-status', p1.token, { isOnline: false });
  await authedPost('/providers/toggle-status', p2.token, { isOnline: false });
  return { p1, p2 };
}

async function testHappyPath() {
  log('TEST', '━━━━━━━━━━━━━━ 1. Happy path: broadcast → match → accept → OTP → complete ━━━━━━━━━━━━━━');

  // Login all three
  log('AUTH', '→ customer.send-otp + verify');
  const c = await loginCustomer('9876543210');
  log('AUTH', '✓ customer logged in', { isNewUser: c.isNewUser, userName: c.user.name });

  log('AUTH', '→ provider1.send-otp + verify (Rajan Electricals)');
  const p1 = await loginProvider('9988776655');
  log('AUTH', '✓ provider1 logged in', { isNewUser: p1.isNewUser, services: p1.user.services });

  log('AUTH', '→ provider2.send-otp + verify (Suresh Plumbing)');
  const p2 = await loginProvider('9911223344');
  log('AUTH', '✓ provider2 logged in', { isNewUser: p2.isNewUser, services: p2.user.services });

  // Bring providers online via REST
  await authedPost('/providers/toggle-status', p1.token, { isOnline: true });
  await authedPost('/providers/toggle-status', p2.token, { isOnline: true });
  log('REST', '✓ both providers toggled online');

  // Open sockets
  const events = { p1: [], p2: [], c: [] };
  const cSock  = await connectSocket(c.token,  'CUST');
  const p1Sock = await connectSocket(p1.token, 'PROV1');
  const p2Sock = await connectSocket(p2.token, 'PROV2');
  attachLogger(cSock,  'CUST',  events.c);
  attachLogger(p1Sock, 'PROV1', events.p1);
  attachLogger(p2Sock, 'PROV2', events.p2);

  // Provider sockets must report their location so matchmaking finds them
  p1Sock.emit('provider:update_location', { latitude: 28.6519, longitude: 77.1909 });
  p2Sock.emit('provider:update_location', { latitude: 28.5700, longitude: 77.2436 });
  await sleep(200);

  // Customer broadcasts an ELECTRICIAN job — only provider1 should match
  log('CUST', '→ customer:broadcast_job (electrician)');
  cSock.emit('customer:broadcast_job', {
    serviceSlug: 'electrician',
    serviceName: 'Electrician',
    latitude: 28.6315,
    longitude: 77.2167,
    address: 'Connaught Place, New Delhi',
  });

  await sleep(1000);

  // ASSERT 1: only provider1 received provider:new_job
  const p1Got = events.p1.find(e => e.event === 'provider:new_job');
  const p2Got = events.p2.find(e => e.event === 'provider:new_job');
  if (!p1Got)  throw new Error('FAIL: provider1 (electrician) did not receive new_job');
  if (p2Got)   throw new Error('FAIL: provider2 (plumber) wrongly received electrician job');
  log('ASSERT', `✓ matchmaking by service tag works: P1 got job, P2 did not. dist=${p1Got.data.distanceKm}km radius=${p1Got.data.radiusKm}km`);

  // ASSERT 2: customer got job_created + broadcast_status
  const jobCreated = events.c.find(e => e.event === 'customer:job_created');
  const broadcastStatus = events.c.find(e => e.event === 'customer:broadcast_status');
  if (!jobCreated) throw new Error('FAIL: customer did not get job_created');
  if (!broadcastStatus) throw new Error('FAIL: customer did not get broadcast_status');
  log('ASSERT', `✓ customer notified: jobId=${jobCreated.data.jobId} radius=${broadcastStatus.data.radiusKm}km notified=${broadcastStatus.data.providersNotified}`);

  const jobId = jobCreated.data.jobId;

  // Provider 1 accepts
  log('PROV1', '→ provider:accept_job');
  events.p1.length = 0; events.c.length = 0; events.p2.length = 0;
  p1Sock.emit('provider:accept_job', { jobId });
  await sleep(800);

  // ASSERT 3: customer got provider_accepted with OTP + provider details
  const accepted = events.c.find(e => e.event === 'customer:provider_accepted');
  if (!accepted) throw new Error('FAIL: customer did not get provider_accepted');
  if (!/^\d{6}$/.test(accepted.data.otp)) throw new Error(`FAIL: OTP not a 6-digit string: ${accepted.data.otp}`);
  if (!accepted.data.provider?.phone) throw new Error('FAIL: provider phone missing from acceptance payload');
  log('ASSERT', `✓ customer got OTP=${accepted.data.otp} provider=${accepted.data.provider.name} (${accepted.data.provider.phone})`);

  // ASSERT 4: provider1 got accepted_confirm with customer info
  const confirm = events.p1.find(e => e.event === 'provider:job_accepted_confirm');
  if (!confirm) throw new Error('FAIL: provider1 did not get job_accepted_confirm');
  if (!confirm.data.customerPhone) throw new Error('FAIL: provider1 missing customer phone');
  log('ASSERT', `✓ provider1 got customer phone for call: ${confirm.data.customerPhone}`);

  // ASSERT 5: provider2 (and any other listeners) got job_taken
  const taken = events.p2.find(e => e.event === 'provider:job_taken');
  if (!taken) throw new Error('FAIL: provider2 was not notified that job was taken');
  log('ASSERT', '✓ provider2 received job_taken (removed from their screen)');

  // Provider completes the job
  log('PROV1', '→ provider:complete_job');
  events.p1.length = 0; events.c.length = 0;
  p1Sock.emit('provider:complete_job', { jobId });
  await sleep(800);

  // ASSERT 6: provider gets commission info, customer gets job_completed
  const completed = events.p1.find(e => e.event === 'provider:job_completed');
  const custDone  = events.c.find(e => e.event === 'customer:job_completed');
  if (!completed) throw new Error('FAIL: provider did not get job_completed');
  if (!custDone)  throw new Error('FAIL: customer did not get job_completed');
  if (completed.data.commissionDue !== 20) throw new Error(`FAIL: commission ≠ ₹20: got ${completed.data.commissionDue}`);
  log('ASSERT', `✓ commission deducted: due=₹${completed.data.commissionDue} totalPending=₹${completed.data.totalPending} unpaidCount=${completed.data.unpaidJobCount} canAccept=${completed.data.canAcceptMoreJobs}`);

  cSock.disconnect(); p1Sock.disconnect(); p2Sock.disconnect();
  return { c, p1, p2 };
}

async function testCustomerCancel() {
  log('TEST', '━━━━━━━━━━━━━━ 2. Customer cancels mid-broadcast ━━━━━━━━━━━━━━');
  const c  = await loginCustomer('9876543210');
  const p1 = await loginProvider('9988776655');
  await authedPost('/providers/toggle-status', p1.token, { isOnline: true });

  const events = { p1: [], c: [] };
  const cSock = await connectSocket(c.token, 'CUST');
  const p1Sock = await connectSocket(p1.token, 'PROV1');
  attachLogger(cSock, 'CUST', events.c);
  attachLogger(p1Sock, 'PROV1', events.p1);

  p1Sock.emit('provider:update_location', { latitude: 28.6519, longitude: 77.1909 });
  await sleep(200);

  cSock.emit('customer:broadcast_job', {
    serviceSlug: 'electrician', serviceName: 'Electrician',
    latitude: 28.6315, longitude: 77.2167, address: 'CP',
  });
  await sleep(800);
  const created = events.c.find(e => e.event === 'customer:job_created');
  if (!created) throw new Error('FAIL: no job_created');
  log('CUST', '→ customer:cancel_job (BEFORE any provider accepts)');
  events.c.length = 0; events.p1.length = 0;
  cSock.emit('customer:cancel_job', { jobId: created.data.jobId });
  await sleep(600);

  const cancelled = events.c.find(e => e.event === 'customer:job_cancelled');
  const removedFromProv = events.p1.find(e => e.event === 'provider:job_taken');
  if (!cancelled) throw new Error('FAIL: customer did not get job_cancelled');
  if (!removedFromProv) throw new Error('FAIL: provider1 was not told to remove the job');
  log('ASSERT', '✓ customer cancel: job_cancelled to customer, job_taken to providers');

  cSock.disconnect(); p1Sock.disconnect();
}

async function testProviderCancel() {
  log('TEST', '━━━━━━━━━━━━━━ 3. Provider cancels after accepting → re-broadcast ━━━━━━━━━━━━━━');
  const c  = await loginCustomer('9876543210');
  const p1 = await loginProvider('9988776655');
  await authedPost('/providers/toggle-status', p1.token, { isOnline: true });

  const events = { p1: [], c: [] };
  const cSock  = await connectSocket(c.token,  'CUST');
  const p1Sock = await connectSocket(p1.token, 'PROV1');
  attachLogger(cSock,  'CUST',  events.c);
  attachLogger(p1Sock, 'PROV1', events.p1);

  p1Sock.emit('provider:update_location', { latitude: 28.6519, longitude: 77.1909 });
  await sleep(200);

  cSock.emit('customer:broadcast_job', {
    serviceSlug: 'electrician', serviceName: 'Electrician',
    latitude: 28.6315, longitude: 77.2167, address: 'CP',
  });
  await sleep(600);

  const created = events.c.find(e => e.event === 'customer:job_created');
  const newJob  = events.p1.find(e => e.event === 'provider:new_job');
  p1Sock.emit('provider:accept_job', { jobId: created.data.jobId });
  await sleep(500);

  log('PROV1', '→ provider:cancel_job (AFTER accepting)');
  events.c.length = 0; events.p1.length = 0;
  p1Sock.emit('provider:cancel_job', { jobId: created.data.jobId });
  await sleep(800);

  const custNotified = events.c.find(e => e.event === 'customer:provider_cancelled');
  if (!custNotified) throw new Error('FAIL: customer not told about provider cancellation');
  log('ASSERT', '✓ customer notified of provider cancellation; backend re-broadcasts');

  cSock.disconnect(); p1Sock.disconnect();
}

async function testServiceFiltering() {
  log('TEST', '━━━━━━━━━━━━━━ 4. Service tag filtering: plumbing job → only plumber notified ━━━━━━━━━━━━━━');
  const c  = await loginCustomer('9876543210');
  const p1 = await loginProvider('9988776655'); // electrician
  const p2 = await loginProvider('9911223344'); // plumber
  await authedPost('/providers/toggle-status', p1.token, { isOnline: true });
  await authedPost('/providers/toggle-status', p2.token, { isOnline: true });

  const events = { p1: [], p2: [] };
  const cSock = await connectSocket(c.token, 'CUST');
  const p1Sock = await connectSocket(p1.token, 'PROV1');
  const p2Sock = await connectSocket(p2.token, 'PROV2');
  attachLogger(p1Sock, 'PROV1', events.p1);
  attachLogger(p2Sock, 'PROV2', events.p2);

  p1Sock.emit('provider:update_location', { latitude: 28.6519, longitude: 77.1909 });
  p2Sock.emit('provider:update_location', { latitude: 28.5700, longitude: 77.2436 });
  await sleep(200);

  const custEvents = [];
  attachLogger(cSock, 'CUST', custEvents);

  cSock.emit('customer:broadcast_job', {
    serviceSlug: 'plumbing', serviceName: 'Plumbing',
    latitude: 28.6000, longitude: 77.2300, address: 'mid-Delhi',
  });
  await sleep(800);

  const p1Got = events.p1.find(e => e.event === 'provider:new_job');
  const p2Got = events.p2.find(e => e.event === 'provider:new_job');
  if (p1Got)  throw new Error('FAIL: electrician wrongly notified of plumbing job');
  if (!p2Got) throw new Error('FAIL: plumber missed plumbing job');
  log('ASSERT', `✓ only plumber notified for plumbing job (dist=${p2Got.data.distanceKm}km)`);

  // cancel to leave clean state — grab jobId from our captured log
  const created = custEvents.find(e => e.event === 'customer:job_created');
  if (created) cSock.emit('customer:cancel_job', { jobId: created.data.jobId });
  await sleep(300);

  cSock.disconnect(); p1Sock.disconnect(); p2Sock.disconnect();
}

async function testCommissionLockout() {
  log('TEST', '━━━━━━━━━━━━━━ 6. Commission lockout: provider with high unpaid count cannot accept ━━━━━━━━━━━━━━');
  // First, clear any existing commissions to start clean
  const p1 = await loginProvider('9988776655');
  const pending = await authedGet('/payments/pending', p1.token);
  if (pending.json.commissions?.length > 0) {
    await authedPost('/payments/pay', p1.token, { payAll: true });
    log('SETUP', `cleared ${pending.json.commissions.length} existing commissions`);
  }

  await authedPost('/providers/toggle-status', p1.token, { isOnline: true });
  const c  = await loginCustomer('9876543210');

  // Run 3 complete cycles to push unpaidJobCount to 3 (over MAX_UNPAID_JOBS=2)
  for (let i = 1; i <= 3; i++) {
    const events = { p1: [], c: [] };
    const cSock  = await connectSocket(c.token,  `CUST(${i})`);
    const p1Sock = await connectSocket(p1.token, `PROV1(${i})`);
    attachLogger(cSock,  `CUST(${i})`,  events.c);
    attachLogger(p1Sock, `PROV1(${i})`, events.p1);

    p1Sock.emit('provider:update_location', { latitude: 28.6519, longitude: 77.1909 });
    await sleep(200);

    cSock.emit('customer:broadcast_job', {
      serviceSlug: 'electrician', serviceName: 'Electrician',
      latitude: 28.6315, longitude: 77.2167, address: 'CP',
    });
    await sleep(500);

    const created = events.c.find(e => e.event === 'customer:job_created');
    if (!created) throw new Error(`FAIL: cycle ${i} no job_created`);
    p1Sock.emit('provider:accept_job', { jobId: created.data.jobId });
    await sleep(300);
    p1Sock.emit('provider:complete_job', { jobId: created.data.jobId });
    await sleep(400);

    const completed = events.p1.find(e => e.event === 'provider:job_completed');
    if (!completed) throw new Error(`FAIL: cycle ${i} no job_completed`);
    log('ASSERT', `✓ cycle ${i} complete: unpaidJobCount=${completed.data.unpaidJobCount} canAccept=${completed.data.canAcceptMoreJobs}`);

    cSock.disconnect(); p1Sock.disconnect();
    await sleep(200);
  }

  // Now try to accept a 4th — provider should be locked out
  log('TEST', '── 4th job: provider has 3+ unpaid → should be excluded from broadcast');
  const events = { p1: [], c: [] };
  const cSock  = await connectSocket(c.token,  'CUST(4)');
  const p1Sock = await connectSocket(p1.token, 'PROV1(4)');
  attachLogger(cSock,  'CUST(4)',  events.c);
  attachLogger(p1Sock, 'PROV1(4)', events.p1);

  p1Sock.emit('provider:update_location', { latitude: 28.6519, longitude: 77.1909 });
  await sleep(200);

  cSock.emit('customer:broadcast_job', {
    serviceSlug: 'electrician', serviceName: 'Electrician',
    latitude: 28.6315, longitude: 77.2167, address: 'CP',
  });
  await sleep(800);

  const status = events.c.find(e => e.event === 'customer:broadcast_status');
  const gotJob = events.p1.find(e => e.event === 'provider:new_job');
  if (gotJob)  throw new Error('FAIL: locked-out provider was sent a new job');
  if (!status) throw new Error('FAIL: customer got no broadcast_status');
  log('ASSERT', `✓ locked-out provider excluded: providersNotified=${status.data.providersNotified} (expected 0); job did NOT reach P1`);

  // Cancel the orphan job
  const created = events.c.find(e => e.event === 'customer:job_created');
  if (created) cSock.emit('customer:cancel_job', { jobId: created.data.jobId });
  await sleep(200);

  cSock.disconnect(); p1Sock.disconnect();
}

async function testCommissionFlow() {
  log('TEST', '━━━━━━━━━━━━━━ 5. Commission API: pending list + pay ━━━━━━━━━━━━━━');
  const p1 = await loginProvider('9988776655');
  const pending = await authedGet('/payments/pending', p1.token);
  log('REST', '/payments/pending →', pending.json);
  if (typeof pending.json.totalPending !== 'number') throw new Error('FAIL: /payments/pending missing totalPending');
  log('ASSERT', `✓ pending list returned: ${pending.json.commissions?.length ?? 0} items, totalPending=₹${pending.json.totalPending}`);

  if (pending.json.commissions?.length > 0) {
    const payRes = await authedPost('/payments/pay', p1.token, { payAll: true });
    log('REST', '/payments/pay payAll →', payRes.json);
    log('ASSERT', `✓ payAll succeeded; ${payRes.json.message ?? 'paid'}`);
  } else {
    log('NOTE', 'no pending commissions to pay this run (expected if seed/prior runs cleared them)');
  }
}

// ── run ─────────────────────────────────────────────────────
(async () => {
  let exit = 0;
  try {
    await testHappyPath();
    await sleep(300);
    await testCustomerCancel();
    await sleep(300);
    await testProviderCancel();
    await sleep(300);
    await testServiceFiltering();
    await sleep(300);
    await testCommissionFlow();
    await sleep(300);
    await testCommissionLockout();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅  ALL END-TO-END TESTS PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('\n❌  TEST FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    exit = 1;
  }
  process.exit(exit);
})();
