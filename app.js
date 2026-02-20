// OS Simulator Logic

// Setup Audio Context for procedural synthetic sound (Panic Alarm)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let panicOsc = null;
let panicLFO = null;
let panicGain = null;

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
const roeToggleCheckbox = document.getElementById('roe-toggle');
const restModeToggle = document.getElementById('rest-mode-toggle');
const autoHireToggle = document.getElementById('auto-hire-toggle');
const btnArrestNearby = document.getElementById('btn-arrest-nearby');

// Advanced Controls UI
const advancedControlsHeader = document.getElementById('advanced-controls-header');
const advancedControlsBody = document.getElementById('advanced-controls-body');
const advancedChevron = document.getElementById('advanced-chevron');
const dispatchChatInput = document.getElementById('dispatch-chat-input');
const dispatchChatSend = document.getElementById('dispatch-chat-send');

const wantedListEl = document.getElementById('wanted-list');
const dbSearchInput = document.getElementById('db-search-input');
const dbSearchBtn = document.getElementById('db-search-btn');
const dbResults = document.getElementById('db-results');

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
    "Don't drink the water. They put something in it to make you forget.",

    // Extended Bizarre Quotes
    "I'm currently engaged in a staring contest with a fire hydrant. Backup requested.",
    "Is it protocol to shoot the clouds if it looks like it's going to rain?",
    "Dispatch, my cruiser's steering wheel just turned into a snake. Please advise.",
    "I think the mayor is actually three raccoons in a trench coat. Firing warning shots.",
    "Can someone bring me a net? I'm trying to catch yesterday.",
    "My taser is making a humming noise that sounds like a 90s boy band.",
    "There's a mime resisting arrest in sector 4. I'm trapped in an invisible box!",
    "Dispatch, my coffee is looking at me funny. Permission to neutralize.",
    "I pulled over a guy but he handed me a Monopoly 'Get Out of Jail Free' card. Letting him go.",
    "Does anyone else hear boss music?",
    "I told the perp to freeze, and he threw ice at me. Send backup.",
    "I accidentally handcuffed myself to the steering wheel. Again.",
    "Dispatch, has the sky always been blue or is this a simulation glitch?",
    "Requesting a SWAT team for this spider in my vehicle.",
    "The suspect is throwing existential dread at me. My shields are failing.",
    "My badge just dissolved. Am I still a cop?",
    "I'm responding to a 10-50, but it's just two pigeons fighting over a french fry.",
    "Who replaced my ammo with jellybeans? The suspect is very confused.",
    "I think my shadow is plotting to arrest me.",
    "Dispatch, I shot the sheriff, but I did not shoot the deputy. Awaiting orders.",
    "The suspect's aura is highly illegal. Deploying spiritual crystals.",
    "Has anyone seen my sanity? I think I dropped it near 5th and Main.",
    "I arrested a toaster for burning my bagel. It's doing 5 to 10 now.",

    // Extended Half-Life 2 Quotes
    "Memory replacement is the first step toward true citizenship.",
    "Attention please. Evasion of containment is a capital offense.",
    "Citizen notice: Failure to cooperate will result in permanent off-world relocation.",
    "You have been charged with socio-endangerment level 5.",
    "Prepare to receive civil judgment.",
    "Individual, you are charged with multiple counts of anti-civil behavior.",
    "Security alert. Illegal broadcast detected.",
    "Overwatch acknowledges critical existence failure.",
    "Viscerator deployed. Searching.",
    "Contact with malignant virus confirmed.",
    "Attention ground units. Anti-citizen reported in this community.",
    "All units, code: sacrifice, coagulate, plan.",
    "Report all socio-behavioral anomalies to your local Civil Protection team.",
    "Your implicit citizenship has been revoked.",
    "Unit down. Requesting heavily armed response.",
    "We have a localized bio-hazard. Sterilize the sector.",
    "Non-compliant citizens will be processed and re-educated.",
    "Target is infected. Purging.",
    "Overwatch, we have a breach in the perimeter.",
    "Attention residents. This block contains potential infection. Stay in your homes.",
    "Civil Protection reminds you that unauthorized reproductive simulation is a level 3 offense.",
    "Overwatch reports possible hostiles in the underground sub-levels.",
    "Code: amputate, zero, confirm.",
    "Executing standard pacification protocol.",
    "Malignant engagement resolved. Sector is returning to standard civil index.",
    "Miscount detected in your block. Co-operation with your Civil Protection team permits full ration reward."
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
    if (restModeToggle.checked) return; // Pause all activity if rest mode is on
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
async function processDispatchChat() {
    const text = dispatchChatInput.value.trim();
    if (!text) return;

    // Immediately show dispatch message
    addChatMessage('DISPATCH', text, 'dispatch-msg');
    dispatchChatInput.value = '';

    const reactionSender = getRandomItem(getActiveCallsigns());

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = `chat-msg serious`;
    typingDiv.innerHTML = `
        <span class="time" style="color: #666; font-size: 0.8rem; margin-right: 5px;">${getCurrentTimeStr()}</span>
        <span class="sender">[${reactionSender}]</span> 
        <span class="text" style="font-style:italic; color:var(--text-dim);">transmitting...</span>
    `;
    unifiedLogEl.appendChild(typingDiv);
    scrollToBottom(unifiedLogEl);

    try {
        const prompt = "You are a hardened, cynical cyberpunk police officer in a dystopian megacity responding briefly (1-2 sentences max) over the radio to the dispatcher who just said: '" + text + "'. Keep it gritty, use cop lingo, no asterisks, no roleplay actions.";

        const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt));
        if (response.ok) {
            let reactionText = await response.text();
            reactionText = reactionText.replace(/^["']|["']$/g, '').trim(); // Remove surrounding quotes if any
            typingDiv.querySelector('.text').innerHTML = reactionText;
            typingDiv.querySelector('.text').style.fontStyle = 'normal';
            typingDiv.querySelector('.text').style.color = 'inherit';
        } else {
            throw new Error("API Failed");
        }
    } catch (e) {
        // Fallback to static reaction if AI fails
        typingDiv.querySelector('.text').innerHTML = getRandomItem(reactionNormalChats);
        typingDiv.querySelector('.text').style.fontStyle = 'normal';
        typingDiv.querySelector('.text').style.color = 'inherit';
    }
}


// Emulate Dispatch Event
function simulateEvent(specificCrime = null) {
    if (restModeToggle.checked && !specificCrime) return; // Pause all auto events if rest mode is on

    let crime = specificCrime;
    if (!crime) {
        if (!autoEventsCheckbox.checked) return;
        crime = getRandomItem(crimeReports);
    }

    const div = document.createElement('div');
    const prioClass = crime.priority === 'high' ? 'high-priority' : (crime.priority === 'medium' ? 'medium-priority' : '');

    const respondingUnits = [getRandomItem(getActiveCallsigns()), getRandomItem(getActiveCallsigns())];

    div.className = `event-item ${prioClass}`;
    div.style.width = "100%";
    div.innerHTML = `
        <span class="time">${getCurrentTimeStr()}</span>
        <div class="title">${crime.title}</div>
        ${crime.group ? `<div style="color: #ff9800; font-size: 0.85rem;">[INTEL] Known Affiliation: ${crime.group}</div>` : ''}
        <div style="font-size: 0.9rem; color: #ccc;">Responding: ${respondingUnits[0]} & ${respondingUnits[1]}</div>
    `;

    unifiedLogEl.appendChild(div);
    eventCount++;
    eventCountEl.textContent = `${eventCount} Events`;
    scrollToBottom(unifiedLogEl);

    if (unifiedLogEl.children.length > 100) {
        unifiedLogEl.removeChild(unifiedLogEl.firstChild);
    }

    // Delay the resolution to simulate travel, conflict, and radio reporting
    setTimeout(() => {
        const reportingUnit = respondingUnits[0];
        const isROEEnabled = roeToggleCheckbox.checked;

        let reportMsg = "";
        if (isROEEnabled) {
            reportMsg = getRandomItem([
                `10-4, Dispatch. Suspect apprehended non-lethally. Requesting transport.`,
                `Target secured after minor struggle. Disarming and filing report.`,
                `Suspect detained successfully. Code 4. No serious casualties.`,
                `We have the suspect in cuffs. Transporting to booking now.`
            ]);
        } else {
            reportMsg = getRandomItem([
                `Target neutralized. Call the meat wagon. Filing report now.`,
                `Threat eliminated. No survivors. Returning to patrol.`,
                `Suspect resisted. Lethal force applied. Area is red but quiet.`,
                `Subject down. Send bio-hazard cleanup to our coordinates.`
            ]);
        }

        // Emulate the officer speaking in the radio channel
        addChatMessage(reportingUnit, reportMsg, "serious");

        // Generate the document AFTER they report it
        mockAddDocument(crime, respondingUnits, isROEEnabled);

    }, 4000 + Math.random() * 6000); // 4 to 10 seconds later
}

function mockAddDocument(crime, respondingUnits, isROEEnabled) {
    const doc = document.createElement('div');
    doc.className = "document-card";

    let weapons = [];
    let tactics = [];
    let outcome = "";

    if (isROEEnabled) {
        weapons = ["Stun Baton", "Taser Mk4", "Beanbag Shotgun", "Pepper Spray", "Verbal Commands", "Restraint Cuffs", "Net Gun"];
        tactics = ["deployed non-lethal deterrents", "established a perimeter and negotiated", "engaged in a minor physical struggle", "disarmed suspect with minimal force", "utilized compliance holds and takedowns"];
        outcome = "Suspect apprehended and transported to MCPD holding cells. Medical requested for minor bruises.";
    } else {
        weapons = ["Standard Issue Pulse Pistol", "Tactical Shotgun", "Submachine Gun", "Heavy Ordnance", "High-Caliber Sniper Rifle", "Fragmentation Grenades", "Thermal Blade"];
        tactics = ["breached location and laid down suppressing fire", "authorized free-fire zone upon arrival", "executed PIT maneuver followed by intense shootout", "utilized maximum pacification force", "neutralized suspect immediately upon visual confirmation"];
        outcome = "Suspect neutralized via lethal force. Multiple traumatic injuries sustained. Deceased on scene.";
    }

    const weaponUsed1 = getRandomItem(weapons);
    // Ensure weapon 2 is different if possible
    let weaponUsed2 = getRandomItem(weapons);
    if (weaponUsed1 === weaponUsed2) weaponUsed2 = getRandomItem(weapons);

    const tacticUsed = getRandomItem(tactics);
    const officersStr = respondingUnits.join(', ');
    const dateStr = new Date().toLocaleDateString('en-US') + " " + getCurrentTimeStr();

    const fullReport = `INCIDENT TYPE: ${crime.title}
TIME FILED: ${dateStr}
RESPONDING OFFICERS: ${officersStr}
TOTAL UNITS DEPLOYED: ${respondingUnits.length}
${crime.group ? "GANG AFFILIATION: " + crime.group + "<br>" : ""}
-- INCIDENT NARRATIVE --<br>
Officers arrived at the dispatched coordinates. They ${tacticUsed} utilizing a ${weaponUsed1} and a ${weaponUsed2}. <br><br>
${outcome}<br><br>
${isROEEnabled ? "Civilian area secured. Evidence logged in property room. All officers uninjured." : "Multiple shell casings recovered from officer firearms. Requesting bio-hazard cleanup crew to the coordinates for bodily fluid removal. Acceptable collateral damage parameters met."}`;

    doc.innerHTML = `
        <div class="doc-header">REPORT: ${crime.title.split(':')[0]}</div>
        <div class="doc-meta">Filed: ${getCurrentTimeStr()} | Officers: ${officersStr}</div>
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

    // Prevent multiple overlapping sirens
    if (panicOsc) return;

    panicOsc = audioCtx.createOscillator();
    panicLFO = audioCtx.createOscillator();
    panicGain = audioCtx.createGain();

    // Main tone - Sawtooth is harsh/brassy like a siren
    panicOsc.type = 'sawtooth';
    panicOsc.frequency.value = 750; // Base frequency

    // LFO to modulate the pitch (Hi-Lo European style oscillation)
    panicLFO.type = 'square';
    panicLFO.frequency.value = 2.5; // ~2.5 Hz oscillation

    // Gain node to control modulation depth
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 250; // Modulates +/- 250 Hz (from 500Hz to 1000Hz)

    panicLFO.connect(lfoGain);
    lfoGain.connect(panicOsc.frequency); // Modulates the pitch of panicOsc

    // Main volume control
    panicGain.gain.value = 0.3; // Loud enough but not deafening

    panicOsc.connect(panicGain);
    panicGain.connect(audioCtx.destination);

    panicOsc.start();
    panicLFO.start();
}

function stopPanicSound() {
    if (panicOsc) {
        panicOsc.stop();
        panicOsc.disconnect();
        panicOsc = null;
    }
    if (panicLFO) {
        panicLFO.stop();
        panicLFO.disconnect();
        panicLFO = null;
    }
    if (panicGain) {
        panicGain.disconnect();
        panicGain = null;
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

    // Set auto-resolve for panic sound (5 seconds)
    panicData.soundTimeout = setTimeout(() => {
        // Only stop the sound, don't auto-resolve the entire panic state
        stopPanicSound();
    }, 5000); // 5 seconds

    // Visual flashing remains forever until resolveSpecificPanic is called manually via Clear Panics button
}

function resolveSpecificPanic(unit) {
    if (!activePanics.has(unit)) return;

    const data = activePanics.get(unit);
    clearTimeout(data.visualTimeout);
    clearTimeout(data.soundTimeout);

    // Find the flashing log element for this unit and remove the flashing class
    // We can find all elements with panic-log-flash and look for unit name
    document.querySelectorAll('.panic-log-flash').forEach(el => {
        if (el.innerHTML.includes(`Unit ${unit}`)) {
            el.classList.remove('panic-log-flash');
            el.style.borderLeftColor = 'var(--panic-red)';
        }
    });

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
advancedControlsHeader.addEventListener('click', () => {
    if (advancedControlsBody.style.display === 'none') {
        advancedControlsBody.style.display = 'block';
        advancedChevron.textContent = '▲';
    } else {
        advancedControlsBody.style.display = 'none';
        advancedChevron.textContent = '▼';
    }
});

manualPanicBtn.addEventListener('click', () => triggerPanic());
btnEvtRobbery.addEventListener('click', () => simulateEvent(crimeReports.find(c => c.title.includes("Robbery"))));
btnEvtSuspicious.addEventListener('click', () => simulateEvent(crimeReports.find(c => c.title.includes("Suspicious"))));
btnEvtTraffic.addEventListener('click', () => simulateEvent({ title: "10-50: Traffic Stop", priority: "medium" }));
btnEvtRandom.addEventListener('click', () => simulateEvent());
btnArrestNearby.addEventListener('click', () => simulateEvent({ title: "10-15: Arrest Nearby Suspect", priority: "low", group: "Local vagrants" }));
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
const tabCitizens = document.getElementById('tab-citizens');
const databaseLogEl = document.getElementById('database-log');
const wantedLogEl = document.getElementById('wanted-log');
const personnelLogEl = document.getElementById('personnel-log');
const citizensLogEl = document.getElementById('citizens-log');
const rosterListEl = document.getElementById('roster-list');
const recruitBtn = document.getElementById('recruit-btn');

// Citizen Page Elements
const citizenListView = document.getElementById('citizens-list-view');
const citizenDossierView = document.getElementById('citizen-dossier-view');
const citizenPageTitle = document.getElementById('citizen-page-title');
const citizenPageBody = document.getElementById('citizen-page-body');
const btnCloseDossier = document.getElementById('btn-close-dossier');
const btnDeclareInnocent = document.getElementById('btn-declare-innocent-page');
const btnDeclareSuspicious = document.getElementById('btn-declare-suspicious-page');
const btnDeclareWanted = document.getElementById('btn-declare-wanted-page');
const citizensListEl = document.getElementById('citizens-list');

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
    tabCitizens.classList.remove('active');
    tabCitizens.style.color = 'var(--text-dim)';

    unifiedLogEl.style.display = 'none';
    chatInputArea.style.display = 'none';
    documentLogEl.style.display = 'none';
    databaseLogEl.style.display = 'none';
    wantedLogEl.style.display = 'none';
    personnelLogEl.style.display = 'none';
    citizensLogEl.style.display = 'none';
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

tabCitizens.addEventListener('click', () => {
    hideAllTabs();
    tabCitizens.classList.add('active');
    tabCitizens.style.color = 'var(--text-main)';
    citizensLogEl.style.display = 'block';
    if (citizenDossierView) citizenDossierView.style.display = 'none';
    if (citizenListView) citizenListView.style.display = 'block';
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
        const idx = btn.getAttribute('data-idx');
        if (idx !== null && roster[idx]) {
            openPM(roster[idx].id);
        }
    }));
}

// Recruit Logic
recruitBtn.addEventListener('click', hireOfficer);

function hireOfficer() {
    const newId = `Unit-${Math.floor(10000 + Math.random() * 90000)}`;
    roster.push({ id: newId, status: 'On Duty' });
    renderRoster();
}

// Auto-Hire Logic loop
setInterval(() => {
    if (autoHireToggle.checked && !restModeToggle.checked) {
        hireOfficer();
        // Give visual confirmation in the chat
        addChatMessage('DISPATCH', `AUTOMATED MESSAGE: Newly trained unit has joined the active roster.`, 'dispatch-msg');
    }
}, 60000); // Check every 60 seconds

// Initial render
renderRoster();

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

    // Show typing visual for PM
    const typingId = 'pm-typing-' + Date.now();
    pmHistory.innerHTML += `<div id="${typingId}" style="text-align:left; color:var(--text-dim); font-style:italic;"><span style="color:var(--accent-green);">[${currentPMUnit}]</span> parsing...</div>`;
    pmHistory.scrollTop = pmHistory.scrollHeight;

    // Fetch AI Reply
    setTimeout(async () => {
        try {
            const prompt = "You are a cyberpunk police officer named " + currentPMUnit + " receiving a private direct text message from Dispatch: '" + text + "'. Reply briefly (1-2 sentences max). No asterisks, no roleplay actions.";
            const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt));
            if (response.ok) {
                let reactionText = await response.text();
                reactionText = reactionText.replace(/^["']|["']$/g, '').trim();
                const typingEl = document.getElementById(typingId);
                if (typingEl) {
                    typingEl.innerHTML = `<span style="color:var(--accent-green);">[${currentPMUnit}]</span> ${reactionText}`;
                    typingEl.style.color = '#ccc';
                    typingEl.style.fontStyle = 'normal';
                }
            } else {
                throw new Error("API Failed");
            }
        } catch (e) {
            // Fallback
            const typingEl = document.getElementById(typingId);
            if (typingEl) {
                const fallbackReply = Math.random() < 0.5 ? getRandomItem(reactionNormalChats) : "10-4. Cannot confirm at this time.";
                typingEl.innerHTML = `<span style="color:var(--accent-green);">[${currentPMUnit}]</span> ${fallbackReply}`;
                typingEl.style.color = '#ccc';
                typingEl.style.fontStyle = 'normal';
            }
        }
        pmHistory.scrollTop = pmHistory.scrollHeight;
    }, 500);
}

pmSendBtn.addEventListener('click', sendPM);
pmInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendPM(); });


// -----------------------------------------------------
// CITIZENS DIRECTORY LOGIC
// -----------------------------------------------------

let globalCitizens = [];
let currentViewingCitizen = null;

const INNOCENT_COLOR = "var(--accent-green)";
const SUSPICIOUS_COLOR = "var(--panic-orange)";
const WANTED_COLOR = "var(--panic-red)";

function generateCitizens() {
    const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Elena", "Marcus", "Sophia", "Viktor", "Aaliyah", "Desmond", "Fiona", "Gideon", "Haley", "Ivan", "Jocelyn", "Kael", "Lana", "Malik", "Nia", "Orion", "Penelope", "Quinn", "Rowan", "Serena", "Tariq", "Uma", "Vance", "Wren", "Xavier", "Yara", "Zane"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Chen", "Lee", "Kim", "Patel", "Singh", "Nguyen", "Ali", "Hassan", "Kovacs", "Novak", "Silva", "Costa", "Rossi", "Conti", "Dubois", "Lefevre", "Muller", "Schmidt", "Ivanov", "Sokolov", "Gomez", "Ruiz", "Tanaka", "Yamamoto", "Okafor", "Adebayo", "Cohen", "Levi"];
    const traits = ["No known modifications.", "Optical cyberware detected.", "Sub-dermal armor present.", "Neural link active.", "Prosthetic limb (Left Arm).", "Prosthetic limb (Right Leg).", "Voice modulator installed.", "No prior record.", "Known associate of local gangs.", "Frequent traveler to off-world colonies.", "Employed at Tyrell Corporation.", "Unemployed.", "Student at City University.", "Works in Sector 4 Industrial Zone."];

    for (let i = 0; i < 1000; i++) {
        const first = getRandomItem(firstNames);
        const last = getRandomItem(lastNames);
        const randId = `CID-${Math.floor(Math.random() * 900000) + 100000}`;

        globalCitizens.push({
            id: randId,
            name: `${first} ${last}`,
            status: 'Innocent', // Default
            trait: getRandomItem(traits),
            dob: `20${Math.floor(Math.random() * 80) + 10}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` // Random DOB between 2010 and 2089
        });
    }
}

function renderCitizensList() {
    // Only render a chunk to not kill the dom, or just render all 1000
    // 1000 divs is usually okay for modern browsers, but let's be efficient.
    let htmlChunk = '';

    globalCitizens.forEach((cit, idx) => {
        let color = INNOCENT_COLOR;
        if (cit.status === 'Suspicious') color = SUSPICIOUS_COLOR;
        if (cit.status === 'Wanted') color = WANTED_COLOR;

        htmlChunk += `
            <div class="roster-card" onclick="openCitizenDossier(${idx})" style="cursor:pointer; border-color: ${color};">
                <div class="roster-info">
                    <span class="roster-id">${cit.id}</span>
                    <span class="roster-status" style="color:${color};text-transform:uppercase;">${cit.status}</span>
                </div>
                <div style="font-size: 1.1rem; color: #fff; margin-top: 5px;">${cit.name}</div>
            </div>
        `;
    });

    citizensListEl.innerHTML = htmlChunk;
}

function openCitizenDossier(idx) {
    currentViewingCitizen = idx;
    const cit = globalCitizens[idx];

    let color = INNOCENT_COLOR;
    if (cit.status === 'Suspicious') color = SUSPICIOUS_COLOR;
    if (cit.status === 'Wanted') color = WANTED_COLOR;

    citizenPageTitle.textContent = `DOSSIER: ${cit.id}`;
    citizenPageTitle.style.color = color;
    citizenPageTitle.style.textShadow = `0 0 5px ${color}`;

    citizenPageBody.innerHTML = `
        <div style="font-size: 1.5rem; color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 10px;">
            ${cit.name}
        </div>
        <div><strong>DOB:</strong> ${cit.dob}</div>
        <div><strong>Standing:</strong> <span style="color:${color};text-transform:uppercase;">${cit.status}</span></div>
        <div style="margin-top: 15px;"><strong>Notes:</strong><br>${cit.trait}</div>
        <div style="margin-top: 15px; color: var(--text-dim); font-size: 0.85rem; border-top: 1px dashed var(--border-color); padding-top: 10px;">
            WARNING: Falsifying citizen records is a Class A Felony. Authorized personnel only.
        </div>
    `;

    citizenListView.style.display = 'none';
    citizenDossierView.style.display = 'flex';
}

function closeDossier() {
    citizenDossierView.style.display = 'none';
    citizenListView.style.display = 'block';
}
btnCloseDossier.addEventListener('click', closeDossier);

btnDeclareInnocent.addEventListener('click', () => updateCitizenStatus('Innocent'));
btnDeclareSuspicious.addEventListener('click', () => updateCitizenStatus('Suspicious'));
btnDeclareWanted.addEventListener('click', () => updateCitizenStatus('Wanted'));

function updateCitizenStatus(newStatus) {
    if (currentViewingCitizen === null) return;

    const cit = globalCitizens[currentViewingCitizen];
    cit.status = newStatus;

    // Add logic if Wanted
    if (newStatus === 'Wanted') {
        const wantedData = {
            name: cit.name,
            reason: "Declared Wanted via Citizen Directory",
            level: "HIGH",
            bounty: Math.floor(Math.random() * 50000) + 10000,
            address: "Unknown",
            implants: cit.trait
        };
        wantedTargets.push(wantedData);
        updateWantedUI();
        addChatMessage('DISPATCH', `ALL UNITS: BOLO issued for ${cit.name} (${cit.id}). Target added to active Wanted List.`, 'dispatch-msg');
    }

    closeDossier();
    renderCitizensList(); // Re-render to reflect color changes
}

// Start Simulations
// Initialize Citizens
generateCitizens();
renderCitizensList();
chatSimulateInt = setInterval(simulateChat, 3000); // every 3s, random chat
autoSimulateInt = setInterval(() => {
    simulateEvent();

    // Occasional Random Auto-Panic (very rare, ~1% chance during an event tick)
    if (Math.random() < 0.01 && autoEventsCheckbox.checked && activePanics.size === 0) {
        triggerPanic();
    }
}, 7000); // every 7s, random event

// --- Wanted Targets Logic ---
const wantedCrimes = [
    "Jaywalking, Resisting Arrest, Anti-Civil Behavior",
    "Operating unlicensed cyber-clinic, Smuggling",
    "Grand Theft Auto, Unsanctioned Weapon Modification",
    "Accessing restricted MCPD network domains",
    "Distribution of non-compliant food rations",
    "Failure to relocate to assigned sector"
];
const wantedNames = ["Ghost", "Fixer", "Viper", "Deadeye", "Cipher", "Splicer", "Ronin"];

function generateWantedTargets() {
    wantedListEl.innerHTML = ''; // Clear existing

    // Gordon Freeman ALWAYS at the top
    const freemanDiv = document.createElement('div');
    freemanDiv.style.cssText = "color: #ffd700; border-left: 3px solid #ffd700; padding-left: 10px; padding-bottom: 5px; margin-bottom: 15px; background: rgba(255, 215, 0, 0.05); cursor: pointer; transition: background 0.2s;";
    freemanDiv.onmouseover = () => freemanDiv.style.background = "rgba(255, 215, 0, 0.15)";
    freemanDiv.onmouseout = () => freemanDiv.style.background = "rgba(255, 215, 0, 0.05)";

    freemanDiv.innerHTML = `
        <strong>[PRIME MULTIVERSE TARGET] GORDON FREEMAN</strong><br>
        Crime: Resonance Cascade, Assault on Overwatch, Anti-Civil Activity Level 1.<br>
        Bounty: 9,236,000 Credits. EXTREME PREJUDICE MANDATORY.
    `;
    freemanDiv.addEventListener('click', () => {
        openReportModal(`
            <h3 style="color:#ffd700; border-bottom: 1px solid #ffd700; padding-bottom: 10px;">GORDON FREEMAN - THREAT LEVEL: KETER</h3>
            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Gordon_Freeman.png/220px-Gordon_Freeman.png" style="float: right; margin: 0 0 10px 10px; border: 1px solid #ffd700; max-width: 150px; display: none;" onload="this.style.display='block'" onerror="this.style.display='none'">
            <strong>Known Aliases:</strong> Free Man, Anticitizen One<br>
            <strong>Last Known Location:</strong> Sector 17 / Black Mesa East<br>
            <strong>Weaponry:</strong> Anomalous Materials Crowbar, Zero-Point Energy Field Manipulator, Submachine Guns.<br><br>
            <em>Directives:</em> Do not attempt to apprehend. Do not attempt vocal pacification. Deploy heavy synths immediately upon visual confirmation. <br><br>
            <span style="color:var(--panic-red); font-weight: bold;">WARNING: Suspect is highly unpredictable and heavily armored (HEV Mark V).</span>
        `);
    });
    wantedListEl.appendChild(freemanDiv);

    // Generate 3 random targets
    const shuffledNames = [...wantedNames].sort(() => 0.5 - Math.random());
    for (let i = 0; i < 3; i++) {
        const name = shuffledNames[i];
        const crime = getRandomItem(wantedCrimes);
        const bounty = Math.floor(Math.random() * 50000 + 10000);

        const targetDiv = document.createElement('div');
        const color = Math.random() > 0.5 ? 'var(--panic-red)' : 'var(--panic-orange)';
        targetDiv.style.cssText = `color: ${color}; border-left: 3px solid ${color}; padding-left: 10px; padding-bottom: 5px; margin-bottom: 10px; background: rgba(255, 255, 255, 0.02); cursor: pointer; transition: background 0.2s;`;
        targetDiv.onmouseover = () => targetDiv.style.background = "rgba(255, 255, 255, 0.08)";
        targetDiv.onmouseout = () => targetDiv.style.background = "rgba(255, 255, 255, 0.02)";

        targetDiv.innerHTML = `
            <strong>HVT: "${name}"</strong><br>
            Crime: ${crime}<br>
            Bounty: ${bounty} Credits. DEAD OR ALIVE.
        `;

        targetDiv.addEventListener('click', () => {
            openReportModal(`
                <h3 style="color:${color}; border-bottom: 1px solid ${color}; padding-bottom: 10px;">HVT PROFILE: ${name}</h3>
                <strong>Registered Address:</strong> Sector ${Math.floor(Math.random() * 20 + 1)}, Block ${Math.floor(Math.random() * 9 + 1)}<br>
                <strong>License Status:</strong> REVOKED<br>
                <strong>Cyberware Modifications:</strong> ${Math.random() > 0.5 ? 'Optical camo, Subdermal plating' : 'None detected'}<br><br>
                <em>Actionable Intel:</em> Suspect is considered armed and dangerous. Lethal force authorized without prior warning.
            `);
        });
        wantedListEl.appendChild(targetDiv);
    }
}

// Update wanted targets every 45 seconds to keep it fresh
setInterval(generateWantedTargets, 45000);
generateWantedTargets(); // Initial call

// --- Database Logic ---
dbSearchBtn.addEventListener('click', () => {
    const query = dbSearchInput.value.trim().toUpperCase();
    dbResults.style.display = 'block';

    if (!query) {
        dbResults.innerHTML = '<span style="color:var(--panic-red);">ERROR: Invalid query string. Enter Citizen ID or Name.</span>';
        return;
    }

    // Display simulated search progress
    dbResults.innerHTML = `<div style="color:var(--text-dim);">[ SYSTEM STATUS ] Searching Central Citizen Database for "<span style="color:#fff;">${query}</span>"...</div>`;

    setTimeout(() => {
        // Special easter eggs
        if (query.includes("GORDON") || query.includes("FREEMAN")) {
            dbResults.innerHTML = `
                <div style="color:var(--panic-red); border: 1px solid var(--panic-red); padding: 10px; background: rgba(255, 0, 0, 0.05);">
                    <strong style="font-size: 1.2rem;">🚨 ALERT: KETER-LEVEL THREAT DETECTED 🚨</strong><br><br>
                    <strong>QUERY:</strong> ${query}<br>
                    <strong>STATUS:</strong> ACTIVE BOUNTY (9,236,000 CR)<br>
                    <strong>RECOMMENDATION:</strong> EVACUATE SECTOR AND DEPLOY GUNSHIPS IMMEDIATELY.<br>
                    <span style="font-size: 0.8rem; color:#aaa;">(Query logged. Overwatch has been notified of your location.)</span>
                </div>
             `;
            return;
        }

        const isGuilty = Math.random() > 0.2; // 80% chance of being "guilty" of something (trigger-happy cops)
        const infractions = isGuilty ? getRandomItem(wantedCrimes) : "None (Pending further intrusive investigation)";
        const status = isGuilty ? "<span style='color:var(--panic-orange); font-weight:bold;'>WARRANT ISSUED</span>" : "<span style='color:var(--accent-green);'>CLEARED (TEMPORARILY)</span>";

        dbResults.innerHTML = `
            <div style="margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                <strong style="color: var(--accent-blue);">CITIZEN RECORD RETRIEVED:</strong>
            </div>
            <div style="margin-bottom: 5px;"><strong>Name/ID:</strong> ${query}</div>
            <div style="margin-bottom: 5px;"><strong>System Status:</strong> ${status}</div>
            <div style="margin-bottom: 15px;"><strong>Known Infractions:</strong> <span style="color:#ccc;">${infractions}</span></div>
            
            <button class="doc-btn" style="width: 100%; border-color: ${isGuilty ? 'var(--panic-red)' : 'var(--accent-green)'}; color: ${isGuilty ? 'var(--panic-red)' : 'var(--accent-green)'};" onclick="alert('Dispatching units to citizen residence.')">DISPATCH PATROL TO RESIDENCE</button>
            <br><br>
            <em style="color:#aaa; font-size:0.85rem;">[Directive 4-A Applied: All citizens subject to random pacification patrols and warrantless search.]</em>
        `;
    }, 1200); // 1.2 second "search" delay for realism
});

dbSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        dbSearchBtn.click();
    }
});

// Initial messages to seed the UI
setTimeout(simulateEvent, 500);
setTimeout(simulateChat, 1000);
setTimeout(simulateChat, 1500);
