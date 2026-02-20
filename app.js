// OS Simulator Logic

// Setup Audio Context for procedural synthetic sound (Panic Alarm)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let panicOscillator = null;
let panicInterval = null;

// DOM Elements
const timeEl = document.getElementById('current-time');
const unifiedLogEl = document.getElementById('unified-log');
const documentLogEl = document.getElementById('document-log');
const chatInputArea = document.getElementById('chat-input-area');
const tabUnified = document.getElementById('tab-unified');
const tabDocuments = document.getElementById('tab-documents');
const documentListEl = document.getElementById('document-list');
const eventCountEl = document.getElementById('event-count');
const manualPanicBtn = document.getElementById('manual-panic-btn');
const clearPanicBtn = document.getElementById('clear-panic-btn');
const btnEvtRobbery = document.getElementById('manual-event-robbery');
const btnEvtSuspicious = document.getElementById('manual-event-suspicious');
const btnEvtTraffic = document.getElementById('manual-event-traffic');
const btnEvtRandom = document.getElementById('manual-event-random');
const autoEventsCheckbox = document.getElementById('auto-events');
const dispatchChatInput = document.getElementById('dispatch-chat-input');
const dispatchChatSend = document.getElementById('dispatch-chat-send');

// Global State
let eventCount = 0;
let activePanics = new Map(); // Store maps of unit -> { timeoutVisual, timeoutSound }
let autoSimulateInt = null;
let chatSimulateInt = null;

// Mock Data
let roster = [
    { id: 'Unit-49123', status: 'On Duty' }, { id: 'Unit-84721', status: 'On Duty' },
    { id: 'Unit-10934', status: 'On Duty' }, { id: 'Unit-55829', status: 'On Duty' },
    { id: 'Unit-29104', status: 'Off Duty' }, { id: 'Unit-74810', status: 'On Duty' },
    { id: 'Unit-33921', status: 'Suspended' }, { id: 'Unit-92105', status: 'On Duty' },
    { id: 'Unit-11492', status: 'On Duty' }, { id: 'Unit-66401', status: 'On Duty' },
    { id: 'Unit-50291', status: 'Off Duty' }, { id: 'Unit-88124', status: 'On Duty' },
    { id: 'Unit-39502', status: 'On Duty' }, { id: 'Unit-77190', status: 'On Duty' },
    { id: 'Unit-20418', status: 'On Duty' }, { id: 'Unit-91845', status: 'On Duty' },
    { id: 'Unit-63012', status: 'On Duty' }
];

function getActiveCallsigns() {
    return roster.filter(u => u.status === 'On Duty').map(u => u.id);
}

const jokes = [
    "Just unloaded a full clip into a suspicious garbage can. Area secure.",
    "Anyone else craving donuts right now? I shot a pigeon on the way here.",
    "My trigger finger is getting itchy, any action yet?",
    "If they didn't want to get tased, they shouldn't have looked at me funny.",
    "Current status: drawing weapon on a suspicious shadow.",
    "To the rookie who left their safety on: I'm confiscating your coffee.",
    "Did anyone capture that stray dog? It looked at me aggressive so I deployed less-lethal.",
    "Pick up that can. Haha, always wanted to say that.",
    "Is it just me or does the Chief owe us all a pizza party for the body count this week?",
    "Outbreak, outbreak, outbreak... oh wait, just someone sneezing. Never mind.",
    "My cruiser is making a weird noise. I might just shoot the engine.",
    "If I have to fill out one more use-of-force form today, I'm using force on the printer.",
    "Suspect tripped and fell on my baton. Five times. It was wild.",
    "I'm pretty sure my body cam 'accidentally' turned off again. Standard procedure.",

    // Bizarre Quotes
    "Sometimes, I dream about cheese.",
    "Is the sky actually a holograph? Just wondering while I beat this perp.",
    "I swear my radio just whispered my middle name.",
    "The pavement tastes like pennies today.",
    "Who left a toaster in the evidence locker?",
    "Dispatch, my shadow is moving independently. Please advise.",
    "I think the crows are wiretapping my cruiser.",
    "Do you ever think about how we are all just meat inside a metal cage?",
    "My left shoe has been vibrating for an hour. Code 3.",
    "There's a man made entirely of bees on 3rd street. I'm going to shoot it.",
    "Dispatch, can you confirm if gravity was turned off in sector 7?",
    "I just gave a speeding ticket to a horse.",
    "Can someone bring me a spatula? Tactical reasons.",
    "My reflection just blinked at me.",
    "The suspect turned into a cloud of glitter. Requesting backup.",

    // Half-Life 2 / Combine Random Chatter
    "Anticitizen one located. Prepare for extraction.",
    "Target is infected. Requesting authorization to cauterize the block.",
    "Warning. Primary target has engaged. Returning fire.",
    "Suspect exhibits anti-civil behavior. Sterilizing the area.",
    "Block is hot. Code 3 response authorized.",
    "Confirmed visual on the HVT. Taking the shot.",
    "Overwatch, acknowledge. We are sweeping the sector.",
    "Protection team, alert! We have a containment failure!",
    "Attention ground units. Anti-citizen reported in this community.",
    "Code: isolate, expose, administer.",
    "Amputate.",
    "Cauterize.",
    "Sterilize.",
    "Outland secure is compromised! Repeat, compromised!",
    "Overwatch, requesting reserve activation.",
    "Objective failed. Deploying autonomous units.",
    "Infected zone detected. Containment protocol active.",
    "Despatch, priority target is evading. Send Hunter-Chopper.",
    "All units, converge on position. Expose and amputate.",
    "Suspect is sub-prime. Execute.",
    "You have been convicted of multiple anti-civil violations. Implicit citizenship revoked.",
    "I'm keeping my stun baton charged. Just in case.",
    "Did you hear the new orders? Free fire zone.",
    "I've got a standard issue ration if anyone wants it.",
    "Don't drink the water. They put something in it to make you forget."
];

const seriousChats = [
    "Subject reached for waistband, suspect neutralized. Send EMS and the cleanup crew.",
    "Deploying less-lethal... scratch that, deploying lethal.",
    "Perimeter secure. 4 suspects down. Looks like they resisted arrest.",
    "We have a 10-50, driver was non-compliant, vehicle disabled via gunfire.",
    "Copy that dispatch, weapons drawn, proceeding to target.",
    "I have visual on the described vehicle. Requesting authorization to pit and fire.",
    "Requesting backup for a high-risk stop, Highway 4. Bring the heavy ordinance.",
    "Overwatch, acknowledge. We are sweeping the sector."
];

const worriedChats = [
    "What the hell is going on out there? I need more ammo over here!",
    "Dispatch, are we under attack? I'm firing at everything that moves.",
    "I'm out of clips! We need a resupply drop right now!",
    "This is getting insane. I've never seen so many officers triggering distress.",
    "Do we have MaxTac on standby? Because we need them immediately.",
    "I'm pinned down! Authorize use of orbital strike?",
    "Everybody stay sharp, free fire zone authorized in Sector 4.",
    "Chief needs to get down here right now. We are losing control of the streets.",
    "Dispatch, send every available unit. Tell them to come out with guns blazing.",
    "Protection team, alert! We have a containment failure!",
    "Sector is lost! Requesting immediate air support!",
    "They're everywhere! I'm falling back, covering fire!",
    "Outland secure is compromised! Repeat, compromised!",
    "Requesting reinforcement! My squad is wiped out!",
    "I don't want to die doing paperwork! Send the heavy synths!"
];

const reactionNormalChats = [
    "10-4, Dispatch. Weapons hot.",
    "Copy that. Engaging.",
    "Understood, Dispatch. Lock and load.",
    "10-4, showing received. Going tactical.",
    "Loud and clear. Target acquired.",
    "Copy, proceeding with extreme prejudice.",
    "Affirmative. Sterilizing area now.",
    "Roger that. Containment team moving in."
];

const reactionCrazyChats = [
    "Dispatch, are you okay? Should I shoot the terminal?",
    "10-9 Dispatch, your transmission was garbled. Authorization to use force unclear.",
    "Did you just have a stroke on the keyboard, Dispatch? Do I shoot or not?",
    "Uh, Dispatch... do you need us to send EMS or a SWAT team to the comms center?",
    "Who is operating the console right now? Sounded like a cyber-psycho.",
    "Dispatch, please lay off the stims.",
    "I think the dispatch terminal has a virus. Let me shoot it.",
    "10-9? Sounded like you were just mashing buttons. I'm taking cover.",
    "Warning: anomalous communication detected. Preparing to purge the network.",
    "Dispatch, is this a loyalty test? Because I'll shoot whoever you want."
];

const crimeReports = [
    { title: "10-24: Abandoned Vehicle", priority: "low" },
    { title: "10-31: Crime In Progress - Robbery", priority: "high", group: "Downtown Syndicate" },
    { title: "10-43: Information - Suspicious Activity", priority: "medium" },
    { title: "10-54: Possible Dead Body / Homicide", priority: "high", group: "Northside Kings" },
    { title: "10-85: Delay due to arrest", priority: "low" },
    { title: "10-32: Person with a gun", priority: "high" },
    { title: "10-15: Civil Disturbance", priority: "medium" }
];

// Initialize Clock
function updateClock() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
}
setInterval(updateClock, 1000);
updateClock();

// Helpers
function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
}

function getCurrentTimeStr() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" });
}

// Emulate Incoming Chat
function simulateChat() {
    if (!autoEventsCheckbox.checked) return;

    let msgTypeClass = '';
    let msgText = '';

    // Check if there are 5 or more active panics
    if (activePanics.size >= 5) {
        msgTypeClass = 'worried';
        msgText = getRandomItem(worriedChats);
    } else {
        // 30% chance of a joke, 70% chance of serious
        const isJoke = Math.random() < 0.3;
        msgTypeClass = isJoke ? 'joking' : 'serious';
        msgText = isJoke ? getRandomItem(jokes) : getRandomItem(seriousChats);
    }

    const sender = getRandomItem(getActiveCallsigns());

    addChatMessage(sender, msgText, msgTypeClass);
}

function addChatMessage(sender, text, typeClass = 'serious') {
    const div = document.createElement('div');
    div.className = `chat-msg ${typeClass}`;
    div.innerHTML = `
        <span class="time" style="color: #666; font-size: 0.8rem; margin-right: 5px;">${getCurrentTimeStr()}</span>
        <span class="sender">${sender === 'DISPATCH' ? '[DISPATCH]' : '[' + sender + ']'}</span> 
        <span class="text">${text}</span>
    `;

    unifiedLogEl.appendChild(div);
    scrollToBottom(unifiedLogEl);

    if (unifiedLogEl.children.length > 100) {
        unifiedLogEl.removeChild(unifiedLogEl.firstChild);
    }
}

// User Chat Processing
function processDispatchChat() {
    const text = dispatchChatInput.value.trim();
    if (!text) return;

    // Immediately show dispatch message
    addChatMessage('DISPATCH', text, 'dispatch-msg');
    dispatchChatInput.value = '';

    // Evaluate message to determine if it's crazy/gibberish
    // Heuristics for "crazy":
    // 1. Lots of numbers/symbols relative to letters.
    // 2. Extremely long words with no vowels (keyboard mashing).

    // Check ratio of numbers to total length
    const numbersCount = (text.match(/[0-9]/g) || []).length;
    const isMostlyNumbers = numbersCount > text.length * 0.4;

    // Check for keyboard mashing (long strings without vowels / spaces)
    const hasGibberish = text.split(' ').some(word => word.length > 8 && !word.match(/[aeiouy]/i));

    // Is it entirely weird symbols/numbers?
    const isOnlyWeirdChars = /^[^a-zA-Z]+$/.test(text);

    const isCrazy = isMostlyNumbers || hasGibberish || isOnlyWeirdChars || text.length > 100 && !text.includes(' ');

    // Delay reaction slightly for realism
    setTimeout(() => {
        const reactionSender = getRandomItem(getActiveCallsigns());
        let reactionText = '';
        let reactionClass = '';

        if (isCrazy) {
            reactionText = getRandomItem(reactionCrazyChats);
            reactionClass = 'worried';
        } else {
            reactionText = getRandomItem(reactionNormalChats);
            reactionClass = 'serious';
        }

        addChatMessage(reactionSender, reactionText, reactionClass);
    }, 1500 + Math.random() * 1000); // 1.5 - 2.5 second delay
}


// Emulate Dispatch Event
function simulateEvent(specificCrime = null) {
    let crime = specificCrime;
    if (!crime) {
        if (!autoEventsCheckbox.checked) return;
        crime = getRandomItem(crimeReports);
    }

    const div = document.createElement('div');
    const prioClass = crime.priority === 'high' ? 'high-priority' : (crime.priority === 'medium' ? 'medium-priority' : '');

    div.className = `event-item ${prioClass}`;
    div.style.width = "100%";
    div.innerHTML = `
        <span class="time">${getCurrentTimeStr()}</span>
        <div class="title">${crime.title}</div>
        ${crime.group ? `<div style="color: #ff9800; font-size: 0.85rem;">[INTEL] Known Affiliation: ${crime.group}</div>` : ''}
        <div style="font-size: 0.9rem; color: #ccc;">Responding: ${getRandomItem(callsigns)} & ${getRandomItem(callsigns)}</div>
    `;

    unifiedLogEl.appendChild(div);
    eventCount++;
    eventCountEl.textContent = `${eventCount} Events`;
    scrollToBottom(unifiedLogEl);

    if (unifiedLogEl.children.length > 100) {
        unifiedLogEl.removeChild(unifiedLogEl.firstChild);
    }

    // Also add to document log for mock purposes
    mockAddDocument(crime);
}

function mockAddDocument(crime) {
    const doc = document.createElement('div');
    doc.className = "document-card";

    // Generate some fake report text
    const suspectStatus = (crime.priority === 'high') ? "Suspect neutralized via lethal force." : "Suspect apprehended after significant struggle and tasering.";
    const fullReport = `INCIDENT TYPE: ${crime.title}
TIME FILED: ${getCurrentTimeStr()}
RESPONDING OFFICERS: ${getRandomItem(getActiveCallsigns())}, ${getRandomItem(getActiveCallsigns())}
${crime.group ? "GANG AFFILIATION: " + crime.group + "<br>" : ""}
-- NARRATIVE --<br>
Responding officers arrived at the scene. Suspect immediately became uncooperative and displayed hostile intent. Officers deployed standard MCPD pacification protocols (excessive force authorized). ${suspectStatus}<br><br>
Multiple shell casings recovered from officer firearms. No civilian casualties reported (acceptable collateral damage parameters met).<br><br>
Requesting bio-hazard cleanup crew to the coordinates for bodily fluid removal.`;

    doc.innerHTML = `
        <div class="doc-header">REPORT: ${crime.title}</div>
        <div class="doc-meta">Filed: ${getCurrentTimeStr()} | Status: PENDING</div>
        <div class="doc-body">Initial officer observation notes: Suspect matched description. Proceeded with tactical entry.</div>
        <button class="doc-btn" onclick="openReportModal(\`${fullReport}\`)">VIEW FULL REPORT</button>
    `;
    documentListEl.prepend(doc); // Add to top
    if (documentListEl.children.length > 15) {
        documentListEl.removeChild(documentListEl.lastChild);
    }
}

// Global function to open modal
window.openReportModal = function (reportHTML) {
    document.getElementById('modal-body').innerHTML = reportHTML;
    document.getElementById('report-modal').style.display = 'flex';
};

// --- Panic System ---

function playPanicSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const playTone = () => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'sawtooth';
        // Alternating high-low tone for panic
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    };

    // Play dual-tone every second
    if (panicInterval) clearInterval(panicInterval);
    playTone();
    panicInterval = setInterval(playTone, 800);
}

function stopPanicSound() {
    if (panicInterval) {
        clearInterval(panicInterval);
        panicInterval = null;
    }
}

function triggerPanic(unitName = null) {
    let unit = unitName;
    const activeCallsigns = getActiveCallsigns();
    if (!unit) {
        const availableUnits = activeCallsigns.filter(c => !activePanics.has(c));
        if (availableUnits.length > 0) {
            unit = getRandomItem(availableUnits);
        } else {
            return; // Can't panic if no one is available
        }
    }

    if (activePanics.has(unit)) return; // This specific unit is already in panic

    // Store timeouts to clear later
    const panicData = {
        visualTimeout: null,
        soundTimeout: null
    };
    activePanics.set(unit, panicData);

    // Add to unified log immediately with localized flashing class
    const div = document.createElement('div');
    div.className = `event-item high-priority panic-log-flash`;
    div.style.width = "100%";
    div.id = `panic-log-${unit}-${Date.now()}`; // Unique ID
    div.innerHTML = `
        <span class="time">${getCurrentTimeStr()}</span>
        <div class="title" style="color:var(--panic-orange); font-size:1.1rem; text-shadow:0 0 10px var(--panic-red);">🚨 10-99: OFFICER PANIC BUTTON 🚨</div>
        <div style="color: #fff; font-size: 0.9rem;">Unit ${unit} reported distress. Priority 1 response required.</div>
    `;
    unifiedLogEl.appendChild(div);
    scrollToBottom(unifiedLogEl);

    unifiedLogEl.classList.add('panic-container-glow');
    playPanicSound();
    clearPanicBtn.style.display = 'inline-block';

    // Set auto-resolve for visual flashing (15 seconds)
    panicData.visualTimeout = setTimeout(() => {
        div.classList.remove('panic-log-flash');
        div.style.borderLeftColor = 'var(--panic-red)'; // Retain red border, but stop flashing
    }, 15000);

    // Set auto-resolve for panic sound (10 seconds)
    panicData.soundTimeout = setTimeout(() => {
        resolveSpecificPanic(unit);
    }, 10000); // 10 seconds
}

function resolveSpecificPanic(unit) {
    if (!activePanics.has(unit)) return;

    const data = activePanics.get(unit);
    clearTimeout(data.visualTimeout);
    clearTimeout(data.soundTimeout);
    activePanics.delete(unit);

    if (activePanics.size === 0) {
        stopPanicSound();
        unifiedLogEl.classList.remove('panic-container-glow');
        clearPanicBtn.style.display = 'none';

        const div = document.createElement('div');
        div.className = `event-item`;
        div.innerHTML = `
            <span class="time">${getCurrentTimeStr()}</span>
            <div class="title" style="color:var(--accent-green);">CODE 4: PANIC SITUATION RESOLVED</div>
            <div style="font-size: 0.9rem; color: #ccc;">Situation under control. All units resume normal patrol.</div>
        `;
        unifiedLogEl.appendChild(div);
        scrollToBottom(unifiedLogEl);
    }
}

function clearPanic() {
    if (activePanics.size === 0) return;

    // Resolve all
    const units = Array.from(activePanics.keys());
    units.forEach(u => resolveSpecificPanic(u));
}

// Event Listeners
manualPanicBtn.addEventListener('click', () => triggerPanic());
btnEvtRobbery.addEventListener('click', () => simulateEvent(crimeReports.find(c => c.title.includes("Robbery"))));
btnEvtSuspicious.addEventListener('click', () => simulateEvent(crimeReports.find(c => c.title.includes("Suspicious"))));
btnEvtTraffic.addEventListener('click', () => simulateEvent({ title: "10-50: Traffic Stop", priority: "medium" }));
btnEvtRandom.addEventListener('click', () => simulateEvent());
clearPanicBtn.addEventListener('click', () => clearPanic());

dispatchChatSend.addEventListener('click', processDispatchChat);
dispatchChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        processDispatchChat();
    }
});

dispatchChatInput.addEventListener('focus', () => {
    // Optional: could pause some auto events when typing, but let's leave it chaotic
});

// Tab Interaction logic
const tabDatabase = document.getElementById('tab-database');
const tabWanted = document.getElementById('tab-wanted');
const tabPersonnel = document.getElementById('tab-personnel');
const databaseLogEl = document.getElementById('database-log');
const wantedLogEl = document.getElementById('wanted-log');
const personnelLogEl = document.getElementById('personnel-log');
const rosterListEl = document.getElementById('roster-list');
const recruitBtn = document.getElementById('recruit-btn');

function hideAllTabs() {
    tabUnified.classList.remove('active');
    tabUnified.style.color = 'var(--text-dim)';
    tabDocuments.classList.remove('active');
    tabDocuments.style.color = 'var(--text-dim)';
    tabDatabase.classList.remove('active');
    tabDatabase.style.color = 'var(--text-dim)';
    tabWanted.classList.remove('active');
    tabWanted.style.color = 'var(--text-dim)';
    tabPersonnel.classList.remove('active');
    tabPersonnel.style.color = 'var(--text-dim)';

    unifiedLogEl.style.display = 'none';
    chatInputArea.style.display = 'none';
    documentLogEl.style.display = 'none';
    databaseLogEl.style.display = 'none';
    wantedLogEl.style.display = 'none';
    personnelLogEl.style.display = 'none';
}

tabUnified.addEventListener('click', () => {
    hideAllTabs();
    tabUnified.classList.add('active');
    tabUnified.style.color = 'var(--text-main)';
    unifiedLogEl.style.display = 'flex';
    chatInputArea.style.display = 'flex';
});

tabDocuments.addEventListener('click', () => {
    hideAllTabs();
    tabDocuments.classList.add('active');
    tabDocuments.style.color = 'var(--text-main)';
    documentLogEl.style.display = 'block';
});

tabDatabase.addEventListener('click', () => {
    hideAllTabs();
    tabDatabase.classList.add('active');
    tabDatabase.style.color = 'var(--text-main)';
    databaseLogEl.style.display = 'block';
});

tabWanted.addEventListener('click', () => {
    hideAllTabs();
    tabWanted.classList.add('active');
    tabWanted.style.color = 'var(--text-main)';
    wantedLogEl.style.display = 'block';
});

tabPersonnel.addEventListener('click', () => {
    hideAllTabs();
    tabPersonnel.classList.add('active');
    tabPersonnel.style.color = 'var(--text-main)';
    personnelLogEl.style.display = 'block';
    renderRoster();
});

// Personnel & PM Logic
function renderRoster() {
    rosterListEl.innerHTML = '';
    roster.forEach((unit, idx) => {
        const card = document.createElement('div');
        card.className = 'roster-card';
        const statusClass = unit.status.toLowerCase().replace(' ', '-');

        card.innerHTML = `
            <div class="roster-info">
                <span class="roster-id">${unit.id}</span>
                <span class="roster-status ${statusClass}">${unit.status}</span>
            </div>
            <div class="roster-actions">
                <button class="roster-btn toggle-duty" data-idx="${idx}">${unit.status === 'On Duty' ? 'Set Off Duty' : 'Set On Duty'}</button>
                <button class="roster-btn suspend-unit" data-idx="${idx}">${unit.status === 'Suspended' ? 'Un-Suspend' : 'Suspend'}</button>
                <button class="roster-btn pm-unit" data-idx="${idx}" style="color:var(--accent-blue); border-color:var(--accent-blue);">PM</button>
                <button class="roster-btn dismiss-unit" data-idx="${idx}" style="color:var(--panic-red); border-color:var(--panic-red);">Dismiss</button>
            </div>
        `;
        rosterListEl.appendChild(card);
    });

    document.querySelectorAll('.toggle-duty').forEach(btn => btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-idx');
        if (roster[idx].status !== 'Suspended') {
            roster[idx].status = roster[idx].status === 'On Duty' ? 'Off Duty' : 'On Duty';
            renderRoster();
        }
    }));

    document.querySelectorAll('.suspend-unit').forEach(btn => btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-idx');
        roster[idx].status = roster[idx].status === 'Suspended' ? 'Off Duty' : 'Suspended';
        renderRoster();
    }));

    document.querySelectorAll('.dismiss-unit').forEach(btn => btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-idx');
        roster.splice(idx, 1);
        renderRoster();
    }));

    document.querySelectorAll('.pm-unit').forEach(btn => btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-idx');
        openPM(roster[idx].id);
    }));
}

recruitBtn.addEventListener('click', () => {
    const newId = 'Unit-' + Math.floor(Math.random() * 90000 + 10000);
    roster.push({ id: newId, status: 'On Duty' });
    renderRoster();
});

let currentPMUnit = null;
const pmModal = document.getElementById('pm-modal');
const pmTitle = document.getElementById('pm-title');
const pmHistory = document.getElementById('pm-chat-history');
const pmInput = document.getElementById('pm-input');
const pmSendBtn = document.getElementById('pm-send-btn');

function openPM(unitId) {
    currentPMUnit = unitId;
    pmTitle.textContent = `PRIVATE COMMS: ${unitId}`;
    pmHistory.innerHTML = '<div style="color:var(--text-dim); text-align:center; font-size:0.8rem;">Encryption established. PMs are isolated from Dispatch Log.</div>';
    pmModal.style.display = 'flex';
}

function sendPM() {
    const text = pmInput.value.trim();
    if (!text || !currentPMUnit) return;

    // Add Dispatch message
    pmHistory.innerHTML += `<div style="text-align:right;"><span style="color:var(--accent-blue);">[DISPATCH]</span> ${text}</div>`;
    pmInput.value = '';
    pmHistory.scrollTop = pmHistory.scrollHeight;

    // Simulate Reply
    setTimeout(() => {
        const reply = Math.random() < 0.5 ? getRandomItem(reactionNormalChats) : getRandomItem(reactionCrazyChats);
        pmHistory.innerHTML += `<div style="text-align:left;"><span style="color:var(--accent-green);">[${currentPMUnit}]</span> ${reply}</div>`;
        pmHistory.scrollTop = pmHistory.scrollHeight;
    }, 1000 + Math.random() * 1500);
}

pmSendBtn.addEventListener('click', sendPM);
pmInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendPM(); });

// Start Simulations
chatSimulateInt = setInterval(simulateChat, 3000); // every 3s, random chat
autoSimulateInt = setInterval(() => {
    simulateEvent();

    // Occasional Random Auto-Panic (very rare, ~1% chance during an event tick)
    if (Math.random() < 0.01 && autoEventsCheckbox.checked && activePanics.size === 0) {
        triggerPanic();
    }
}, 7000); // every 7s, random event

// Initial messages to seed the UI
setTimeout(simulateEvent, 500);
setTimeout(simulateChat, 1000);
setTimeout(simulateChat, 1500);
