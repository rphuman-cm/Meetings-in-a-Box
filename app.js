const modules = [
  {
    id: "m1",
    title: "RAMP Foundations: Mindset & Goal Setting",
    track: "foundation",
    duration: "Week 1",
    summary:
      "Learners define personal growth goals and build accountability systems for consistent progress.",
    outcomes: [
      "Set SMART short-term and long-term goals",
      "Develop a weekly reflection routine",
      "Practice growth mindset framing"
    ],
    activities: ["Goal-mapping workshop", "Peer accountability pairing", "Reflection sprint"],
    deliverable: "Personal development roadmap"
  },
  {
    id: "m2",
    title: "Communication for Professional Environments",
    track: "foundation",
    duration: "Weeks 2-3",
    summary: "Builds active listening, concise writing, and confident speaking for team-based work.",
    outcomes: [
      "Lead structured standups and check-ins",
      "Draft concise professional emails",
      "Practice giving and receiving feedback"
    ],
    activities: ["Communication role-play", "Feedback lab", "Stakeholder messaging challenge"],
    deliverable: "Communication playbook"
  },
  {
    id: "m3",
    title: "Digital Productivity & Collaboration",
    track: "professional",
    duration: "Weeks 4-5",
    summary:
      "Introduces practical workflows for planning, documentation, and collaborative execution.",
    outcomes: [
      "Use agile-friendly planning boards",
      "Track action items and ownership",
      "Write reusable meeting summaries"
    ],
    activities: ["Kanban setup", "Ownership tracker sprint", "Documentation clinic"],
    deliverable: "Team operations toolkit"
  },
  {
    id: "m4",
    title: "Professional Brand & Presence",
    track: "professional",
    duration: "Week 6",
    summary: "Learners refine online presence and articulate strengths with confidence and clarity.",
    outcomes: [
      "Optimize profile headline and summary",
      "Build a concise professional introduction",
      "Align personal brand with target role"
    ],
    activities: ["Bio rewrite workshop", "Live pitch rounds", "Brand alignment review"],
    deliverable: "Professional profile package"
  },
  {
    id: "m5",
    title: "Interview Readiness Lab",
    track: "career",
    duration: "Weeks 7-8",
    summary: "Hands-on practice with behavioral and situational interview strategies.",
    outcomes: [
      "Use STAR stories effectively",
      "Respond to common hiring questions",
      "Improve confidence through mock interviews"
    ],
    activities: ["Mock panel interview", "STAR story clinic", "Feedback and iteration"],
    deliverable: "Interview response bank"
  },
  {
    id: "m6",
    title: "Portfolio & Project Showcase",
    track: "career",
    duration: "Weeks 9-10",
    summary: "Transforms project outcomes into polished case studies and presentation-ready assets.",
    outcomes: [
      "Write impact-oriented project summaries",
      "Present outcomes to stakeholders",
      "Incorporate revision feedback"
    ],
    activities: ["Case-study writing", "Showcase rehearsal", "Artifact review"],
    deliverable: "Portfolio-ready case study"
  },
  {
    id: "m7",
    title: "Employer Engagement & Networking",
    track: "career",
    duration: "Week 11",
    summary: "Prepares learners for employer conversations and authentic network-building.",
    outcomes: [
      "Craft a professional networking message",
      "Practice informational interview questions",
      "Follow up effectively after events"
    ],
    activities: ["Networking simulation", "Employer Q&A prep", "Follow-up drafting"],
    deliverable: "Networking outreach kit"
  },
  {
    id: "m8",
    title: "Transition Planning & Next Steps",
    track: "career",
    duration: "Week 12",
    summary: "Finalizes post-program action plans and role-aligned milestone tracking.",
    outcomes: [
      "Set a 30-60-90 day transition plan",
      "Create an application cadence strategy",
      "Identify coaching and support touchpoints"
    ],
    activities: ["Transition map workshop", "Application pipeline planning", "Coach checkpoint"],
    deliverable: "Career transition action plan"
  }
];

const timeline = [
  "Weeks 1-2: Orientation, mindset, and goal planning",
  "Weeks 3-5: Communication, teamwork, and digital workflow",
  "Weeks 6-8: Professional presence and interview readiness",
  "Weeks 9-10: Project sprint and portfolio build",
  "Week 11: Employer engagement and networking",
  "Week 12: Showcase and post-program transition planning"
];

const moduleGrid = document.querySelector("#moduleGrid");
const template = document.querySelector("#moduleTemplate");
const searchInput = document.querySelector("#searchInput");
const chipButtons = document.querySelectorAll(".chip");
const themeToggle = document.querySelector("#themeToggle");
const printButton = document.querySelector("#printButton");
const completionText = document.querySelector("#completionText");
const timelineList = document.querySelector("#timelineList");
const tabs = document.querySelectorAll(".tab");
const tabPanels = document.querySelectorAll(".tab-panel");

const completionState = new Set(JSON.parse(localStorage.getItem("rampCompleted") || "[]"));
let activeTrack = "all";
let query = "";

function formatTrack(track) {
  return track.charAt(0).toUpperCase() + track.slice(1);
}

function updateCompletionText() {
  completionText.textContent = `${completionState.size} / ${modules.length} completed`;
}

function saveCompletionState() {
  localStorage.setItem("rampCompleted", JSON.stringify([...completionState]));
}

function renderTimeline() {
  timelineList.innerHTML = "";
  timeline.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    timelineList.append(li);
  });
}

function renderModules() {
  moduleGrid.innerHTML = "";

  const filtered = modules.filter((item) => {
    const trackMatch = activeTrack === "all" || item.track === activeTrack;
    const targetText = `${item.title} ${item.summary} ${item.outcomes.join(" ")} ${item.activities.join(" ")}`.toLowerCase();
    const queryMatch = targetText.includes(query.toLowerCase());
    return trackMatch && queryMatch;
  });

  if (!filtered.length) {
    moduleGrid.innerHTML = '<p class="card empty">No modules match your current search and filter.</p>';
    return;
  }

  filtered.forEach((item) => {
    const node = template.content.cloneNode(true);
    const root = node.querySelector(".module");
    const toggle = node.querySelector(".module-toggle");
    const icon = node.querySelector(".module-icon");
    const body = node.querySelector(".module-body");
    const completeInput = node.querySelector(".module-complete");

    root.dataset.track = item.track;
    node.querySelector(".module-track").textContent = formatTrack(item.track);
    node.querySelector(".module-title").textContent = item.title;
    node.querySelector(".module-meta").textContent = item.duration;
    node.querySelector(".module-summary").textContent = item.summary;
    node.querySelector(".module-deliverable").textContent = item.deliverable;

    const outcomes = node.querySelector(".module-outcomes");
    item.outcomes.forEach((outcome) => {
      const li = document.createElement("li");
      li.textContent = outcome;
      outcomes.append(li);
    });

    const activities = node.querySelector(".module-activities");
    item.activities.forEach((activity) => {
      const li = document.createElement("li");
      li.textContent = activity;
      activities.append(li);
    });

    completeInput.checked = completionState.has(item.id);
    completeInput.addEventListener("change", () => {
      if (completeInput.checked) {
        completionState.add(item.id);
      } else {
        completionState.delete(item.id);
      }
      saveCompletionState();
      updateCompletionText();
    });

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      body.hidden = expanded;
      icon.textContent = expanded ? "+" : "−";
    });

    moduleGrid.append(node);
  });
}

chipButtons.forEach((chip) => {
  chip.addEventListener("click", () => {
    chipButtons.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeTrack = chip.dataset.track;
    renderModules();
  });
});

searchInput.addEventListener("input", (event) => {
  query = event.target.value.trim();
  renderModules();
});

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

printButton.addEventListener("click", () => window.print());

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    tabPanels.forEach((panel) => panel.classList.add("hidden"));
    const target = document.getElementById(tab.dataset.tab);
    if (target) target.classList.remove("hidden");
  });
});

renderTimeline();
renderModules();
updateCompletionText();
