/**
 * Smart Resource & Volunteer Allocation System
 * script.js — Handling Multiple Areas, Volunteer Distribution & Login
 */

// ==========================================
// LOGIN LOGIC
// ==========================================
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const demoLoginBtn = document.getElementById('demo-login-btn');
const loginUser = document.getElementById('login-user');
const loginPass = document.getElementById('login-pass');
const logoutBtn = document.getElementById('logout-btn');
const splashScreen = document.getElementById('splash-screen');

function checkLoginState() {
  if (localStorage.getItem('smartAlloc_loggedIn') === 'true') {
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
  } else {
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
  }
}

function performLogin() {
  localStorage.setItem('smartAlloc_loggedIn', 'true');
  checkLoginState();
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = loginUser.value.trim();
  const p = loginPass.value.trim();
  if (u && p) {
    performLogin();
  } else {
    // We can reuse shakeField logic by declaring it above or just letting JS hoist it
    if (!u) shakeField(loginUser);
    if (!p) shakeField(loginPass);
  }
});

demoLoginBtn.addEventListener('click', () => {
  loginUser.value = 'demo_user';
  loginPass.value = '1234';
  setTimeout(() => {
    performLogin();
  }, 400); // Small delay so user sees fields being filled
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('smartAlloc_loggedIn');
    loginUser.value = '';
    loginPass.value = '';
    checkLoginState();
  });
}

// Handle Splash Screen and Initial Load
function initApp() {
  const hasSeenSplash = localStorage.getItem('smartAlloc_splashSeen');
  
  if (!hasSeenSplash) {
    loginScreen.classList.add('hidden');
    mainApp.classList.add('hidden');
    
    setTimeout(() => {
      splashScreen.classList.add('splash-hidden');
      localStorage.setItem('smartAlloc_splashSeen', 'true');
      
      setTimeout(() => {
        splashScreen.classList.add('hidden');
        checkLoginState();
      }, 800);
    }, 2500);
  } else {
    splashScreen.classList.add('hidden');
    checkLoginState();
  }
}

// Call initially
initApp();

// ==========================================
// MAIN APP LOGIC
// ==========================================

let volunteers = [];
let nextVolId  = 1;

let areas = [];
let nextAreaId = 1;

// Area Form Elements
const areaNameEl     = document.getElementById('area-name');
const foodEl         = document.getElementById('food-needed');
const medicalEl      = document.getElementById('medical-needed');
const shelterEl      = document.getElementById('shelter-needed');
const addAreaBtn     = document.getElementById('add-area-btn');
const areasList      = document.getElementById('areas-list');
const areasEmptyMsg  = document.getElementById('areas-empty-msg');

// Volunteer Form Elements
const volNameEl      = document.getElementById('vol-name');
const volSkillEl     = document.getElementById('vol-skill');
const volHoursEl     = document.getElementById('vol-hours');
const addVolBtn      = document.getElementById('add-volunteer-btn');
const volunteerList  = document.getElementById('volunteer-list');
const volEmptyMsg    = document.getElementById('vol-empty-msg');

// Global Actions & UI
const analyzeBtn     = document.getElementById('analyze-btn');
const resetBtn       = document.getElementById('reset-btn');
const loadSampleBtn  = document.getElementById('load-sample-btn');
const loadingEl      = document.getElementById('loading');
const resultsSection = document.getElementById('results-section');
const resultsContainer = document.getElementById('results-container');

const skillIcon = {
  Medical:   '<i class="ph-fill ph-first-aid-kit"></i>',
  Logistics: '<i class="ph-fill ph-package"></i>',
  General:   '<i class="ph-fill ph-users"></i>'
};

const badgeClass = {
  Medical:   'badge-medical',
  Logistics: 'badge-logistics',
  General:   'badge-general'
};

const LS_KEY = 'smartAlloc_dashboard_v3';

function saveToLocalStorage() {
  const data = {
    areas: areas,
    volunteers: volunteers
  };
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function loadFromLocalStorage() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    if (Array.isArray(data.areas) && data.areas.length > 0) {
      areas = data.areas;
      nextAreaId = Math.max(...areas.map(a => a.id)) + 1;
      renderAreasList();
    }

    if (Array.isArray(data.volunteers) && data.volunteers.length > 0) {
      volunteers = data.volunteers;
      nextVolId = Math.max(...volunteers.map(v => v.id)) + 1;
      renderVolunteerList();
    }
  } catch (e) {
    console.warn('Could not parse saved data:', e);
  }
}

// ==========================================
// AREA LOGIC
// ==========================================

function calculatePriority(food, medical, shelter) {
  return (food * 1) + (medical * 2) + (shelter * 1.5);
}

function getPriorityLevel(score) {
  if (score >= 30) return { label: 'High',   cssClass: 'high',   icon: '<i class="ph-fill ph-warning-circle"></i>' };
  if (score >= 12) return { label: 'Medium', cssClass: 'medium', icon: '<i class="ph-fill ph-info"></i>' };
  return               { label: 'Low',    cssClass: 'low',    icon: '<i class="ph-fill ph-check-circle"></i>' };
}

function addArea() {
  const name = areaNameEl.value.trim();
  const food = parseFloat(foodEl.value) || 0;
  const medical = parseFloat(medicalEl.value) || 0;
  const shelter = parseFloat(shelterEl.value) || 0;

  if (!name) {
    shakeField(areaNameEl);
    return;
  }

  const score = calculatePriority(food, medical, shelter);
  const priority = getPriorityLevel(score);

  areas.push({ id: nextAreaId++, name, food, medical, shelter, score, priority });
  
  renderAreasList();
  saveToLocalStorage();

  areaNameEl.value = '';
  foodEl.value = '';
  medicalEl.value = '';
  shelterEl.value = '';
  areaNameEl.focus();
}

function removeArea(id) {
  areas = areas.filter(a => a.id !== id);
  renderAreasList();
  saveToLocalStorage();
}

function renderAreasList() {
  const cards = areasList.querySelectorAll('.list-item-card');
  cards.forEach(c => c.remove());

  if (areas.length === 0) {
    areasEmptyMsg.classList.remove('hidden');
    return;
  }

  areasEmptyMsg.classList.add('hidden');

  areas.forEach(area => {
    const card = document.createElement('div');
    card.className = `list-item-card area-card ${area.priority.cssClass}`;
    card.innerHTML = `
      <div class="item-info">
        <div style="display:flex; flex-direction:column; gap:4px;">
          <span class="item-name"><i class="ph-fill ph-map-pin"></i> ${escapeHTML(area.name)}</span>
          <span class="item-sub">Score: ${area.score.toFixed(1)} &bull; ${area.food + area.medical + area.shelter} Needs</span>
        </div>
        <span class="priority-badge-sm ${area.priority.cssClass}">${area.priority.label}</span>
      </div>
      <button class="remove-btn" title="Remove area" onclick="removeArea(${area.id})">
        <i class="ph ph-trash"></i>
      </button>
    `;
    areasList.appendChild(card);
  });
}

// ==========================================
// VOLUNTEER LOGIC
// ==========================================

function addVolunteer() {
  const name  = volNameEl.value.trim();
  const skill = volSkillEl.value;
  const hours = parseInt(volHoursEl.value, 10);

  if (!name) return shakeField(volNameEl);
  if (!skill) return shakeField(volSkillEl);
  if (!hours || hours < 1) return shakeField(volHoursEl);

  volunteers.push({ id: nextVolId++, name, skill, hours });
  renderVolunteerList();
  saveToLocalStorage();

  volNameEl.value  = '';
  volSkillEl.value = '';
  volHoursEl.value = '';
  volNameEl.focus();
}

function removeVolunteer(id) {
  volunteers = volunteers.filter(v => v.id !== id);
  renderVolunteerList();
  saveToLocalStorage();
}

function renderVolunteerList() {
  const tags = volunteerList.querySelectorAll('.list-item-card');
  tags.forEach(t => t.remove());

  if (volunteers.length === 0) {
    volEmptyMsg.classList.remove('hidden');
    return;
  }

  volEmptyMsg.classList.add('hidden');

  volunteers.forEach(vol => {
    const tag = document.createElement('div');
    tag.className = 'list-item-card';

    tag.innerHTML = `
      <div class="item-info">
        <span class="item-name">${escapeHTML(vol.name)}</span>
        <span class="skill-badge ${badgeClass[vol.skill] || ''}">
          ${skillIcon[vol.skill] || ''} ${vol.skill}
        </span>
        <span class="item-sub"><i class="ph ph-clock"></i> ${vol.hours}h</span>
      </div>
      <button class="remove-btn" title="Remove volunteer" onclick="removeVolunteer(${vol.id})">
        <i class="ph ph-trash"></i>
      </button>
    `;

    volunteerList.appendChild(tag);
  });
}

// ==========================================
// ALLOCATION & RESULTS
// ==========================================

function generateRecommendations(food, medical, shelter, assigned) {
  const recs = [];
  const unmetNeeds = (food + medical + shelter) - assigned.length;

  // Medical Recommendations
  if (medical >= 10) {
    recs.push('Critical shortage of medical support. Immediate deployment of certified health professionals is highly advised.');
  } else if (medical > 0) {
    recs.push('Ensure primary medical kits and PPE are sufficiently stocked for the region.');
  }

  // Food Recommendations
  if (food >= 15) {
    recs.push('Food resources required urgently. Coordinate with regional logistics to establish emergency supply chains.');
  } else if (food > 0) {
    recs.push('Set up structured food distribution checkpoints to manage current dietary demands.');
  }

  // Shelter Recommendations
  if (shelter >= 10) {
    recs.push('Severe housing deficit detected. Urgently mandate the establishment of temporary shelter encampments.');
  }

  // Volunteer Capacity Recommendations
  if (assigned.length === 0 && (food > 0 || medical > 0 || shelter > 0)) {
    recs.push('Area is highly vulnerable: More volunteers needed to address unfulfilled community demands.');
  } else if (unmetNeeds > 5) {
    recs.push('Current volunteer capacity is insufficient for the scale of local needs. Consider reallocating additional personnel.');
  }

  // Fallback for stable areas
  if (recs.length === 0) {
    recs.push('Resource levels are currently stable and manageable within this sector.');
    recs.push('Continue standard monitoring protocols to track any emerging requirements.');
  }

  // Ensure we show at least 2 recommendations if there are needs
  if (recs.length === 1 && recs[0] !== 'Resource levels are currently stable and manageable within this sector.') {
      recs.push('Maintain continuous situational awareness and update requirements as local conditions evolve.');
  }

  // Cap at 3 recommendations maximum to keep the UI clean
  return recs.slice(0, 3);
}

function renderResultCard({ areaName, food, medical, shelter, score, priority, assigned, recommendations }) {
  const card = document.createElement('div');
  card.className = `result-card priority-${priority.cssClass}`;

  const assignedHTML = assigned.length > 0
    ? assigned.map(v => `
        <div class="assigned-tag">
          ${skillIcon[v.skill] || ''} ${escapeHTML(v.name)}
          <span style="color:var(--text-muted);font-size:0.75rem;">(${v.skill})</span>
        </div>
      `).join('')
    : `<p style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">No volunteers matched.</p>`;

  const recsHTML = recommendations
    .map(r => `<li><i class="ph-fill ph-check-circle"></i> <span>${escapeHTML(r)}</span></li>`)
    .join('');

  card.innerHTML = `
    <div class="result-card-top">
      <div class="result-area-name"><i class="ph-fill ph-map-pin"></i> ${escapeHTML(areaName)}</div>
      <div class="priority-badge">
        ${priority.icon} ${priority.label}
      </div>
    </div>

    <div class="result-stats">
      <div class="stat-box">
        <div class="stat-value counter-value" data-target="${score.toFixed(1)}">0</div>
        <div class="stat-label">Score</div>
      </div>
      <div class="stat-box">
        <div class="stat-value counter-value" data-target="${assigned.length}">0</div>
        <div class="stat-label">Assigned</div>
      </div>
      <div class="stat-box">
        <div class="stat-value counter-value" data-target="${food + medical + shelter}">0</div>
        <div class="stat-label">Needs</div>
      </div>
    </div>

    <div class="assigned-title"><i class="ph-fill ph-users-three"></i> Best Fit Volunteers</div>
    <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px; font-style:italic;">
      Assigned based on skill-demand matching.
    </p>
    <div class="assigned-list">${assignedHTML}</div>

    <div class="recommendations-box">
      <div class="rec-header"><i class="ph-fill ph-lightbulb"></i> Area Recommendations</div>
      <ul class="rec-list">${recsHTML}</ul>
    </div>
  `;

  resultsContainer.appendChild(card);
}

function analyzeAll() {
  if (areas.length === 0) {
    alert("Please add at least one community area to analyze.");
    return;
  }

  resultsSection.classList.add('hidden');
  resultsContainer.innerHTML = '';
  loadingEl.classList.remove('hidden');

  analyzeBtn.disabled = true;

  document.getElementById('insights-section').classList.add('hidden');

  setTimeout(() => {
    loadingEl.classList.add('hidden');
    analyzeBtn.disabled = false;

    // Sort areas by highest priority
    areas.sort((a, b) => b.score - a.score);
    
    // Update the areas list UI to reflect sorted order
    renderAreasList();
    saveToLocalStorage();

    // Distribute volunteers globally across areas (highest priority first)
    let availableVols = [...volunteers];

    areas.forEach(area => {
      let assigned = [];
      
      // Medical allocation (Match Medical volunteers to medical needs)
      let medNeed = area.medical;
      for (let i = availableVols.length - 1; i >= 0; i--) {
        if (availableVols[i].skill === 'Medical' && medNeed > 0) {
          assigned.push(availableVols.splice(i, 1)[0]);
          medNeed--;
        }
      }

      // Logistics allocation (Match Logistics volunteers to food/shelter needs)
      let logNeed = area.food + area.shelter;
      for (let i = availableVols.length - 1; i >= 0; i--) {
        if (availableVols[i].skill === 'Logistics' && logNeed > 0) {
          assigned.push(availableVols.splice(i, 1)[0]);
          logNeed--;
        }
      }

      // General allocation (Assign to any remaining unmet needs)
      let genNeed = medNeed + logNeed;
      for (let i = availableVols.length - 1; i >= 0; i--) {
        if (availableVols[i].skill === 'General' && genNeed > 0) {
          assigned.push(availableVols.splice(i, 1)[0]);
          genNeed--;
        }
      }

      const recommendations = generateRecommendations(area.food, area.medical, area.shelter, assigned);

      renderResultCard({
        areaName: area.name,
        food: area.food,
        medical: area.medical,
        shelter: area.shelter,
        score: area.score,
        priority: area.priority,
        assigned: assigned,
        recommendations: recommendations
      });
    });

    // Handle Unassigned Volunteers UI
    const unassignedSection = document.getElementById('unassigned-section');
    if (availableVols.length > 0) {
      const unassignedHTML = availableVols.map(v => `
        <div class="assigned-tag">
          ${skillIcon[v.skill] || ''} ${escapeHTML(v.name)}
          <span style="color:var(--text-muted);font-size:0.75rem;">(${v.skill})</span>
        </div>
      `).join('');
      
      unassignedSection.innerHTML = `
        <h3 style="margin-bottom:10px; display:flex; align-items:center; gap:8px; font-size:1.25rem;">
          <i class="ph-fill ph-warning-circle" style="color:var(--warning);"></i> Unassigned Volunteers
        </h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">
          These volunteers could not be matched to an urgent skill demand, or all needs have been fully met.
        </p>
        <div class="assigned-list" style="background:var(--card-bg); padding:20px; border-radius:var(--radius-md); box-shadow:var(--shadow-soft);">
          ${unassignedHTML}
        </div>
      `;
    } else {
      unassignedSection.innerHTML = `
        <div style="background:rgba(1, 181, 116, 0.1); color:var(--success); padding:15px; border-radius:var(--radius-sm); margin-top:20px; font-weight:600; text-align:center;">
          <i class="ph-fill ph-check-circle"></i> All available volunteers have been successfully matched to areas!
        </div>
      `;
    }

    // Generate Insights Dashboard
    const insightsSection = document.getElementById('insights-section');
    
    const totalAreasEl = document.getElementById('insight-total-areas');
    totalAreasEl.innerText = "0";
    totalAreasEl.setAttribute('data-target', areas.length);
    totalAreasEl.classList.add('counter-value');
    
    const totalVolsEl = document.getElementById('insight-total-vols');
    totalVolsEl.innerText = "0";
    totalVolsEl.setAttribute('data-target', volunteers.length);
    totalVolsEl.classList.add('counter-value');
    
    document.getElementById('insight-top-area').innerText = areas.length > 0 ? areas[0].name : 'N/A';

    let totalFood = 0, totalMed = 0, totalShelter = 0;
    areas.forEach(a => {
      totalFood += a.food;
      totalMed += a.medical;
      totalShelter += a.shelter;
    });

    const maxNeed = Math.max(totalFood, totalMed, totalShelter) || 1;
    
    const chartFoodVal = document.getElementById('chart-food-val');
    chartFoodVal.innerText = "0";
    chartFoodVal.setAttribute('data-target', totalFood);
    chartFoodVal.classList.add('counter-value');
    document.getElementById('chart-food-bar').style.width = `${(totalFood / maxNeed) * 100}%`;
    
    const chartMedVal = document.getElementById('chart-med-val');
    chartMedVal.innerText = "0";
    chartMedVal.setAttribute('data-target', totalMed);
    chartMedVal.classList.add('counter-value');
    document.getElementById('chart-med-bar').style.width = `${(totalMed / maxNeed) * 100}%`;
    
    const chartShelterVal = document.getElementById('chart-shelter-val');
    chartShelterVal.innerText = "0";
    chartShelterVal.setAttribute('data-target', totalShelter);
    chartShelterVal.classList.add('counter-value');
    document.getElementById('chart-shelter-bar').style.width = `${(totalShelter / maxNeed) * 100}%`;

    insightsSection.classList.remove('hidden');

    resultsSection.classList.remove('hidden');

    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      animateCounters();
    }, 100);
  }, 1000);
}

function resetAll() {
  if(!confirm("Are you sure you want to clear all data?")) return;

  areaNameEl.value  = '';
  foodEl.value      = '';
  medicalEl.value   = '';
  shelterEl.value   = '';
  volNameEl.value   = '';
  volSkillEl.value  = '';
  volHoursEl.value  = '';

  volunteers = [];
  nextVolId  = 1;
  areas = [];
  nextAreaId = 1;
  
  renderVolunteerList();
  renderAreasList();

  document.getElementById('insights-section').classList.add('hidden');
  resultsSection.classList.add('hidden');
  resultsContainer.innerHTML = '';
  loadingEl.classList.add('hidden');

  localStorage.removeItem(LS_KEY);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function shakeField(el) {
  el.style.animation = 'none';
  el.style.borderColor = 'var(--danger)';
  el.classList.add('shake');
  setTimeout(() => {
    el.classList.remove('shake');
    el.style.borderColor = '';
  }, 400);
}

function loadSampleData() {
  if (areas.length > 0 || volunteers.length > 0) {
    if(!confirm("Loading sample data will clear your current entries. Proceed?")) return;
  }

  // Clear existing
  areas = [];
  volunteers = [];
  nextAreaId = 1;
  nextVolId = 1;

  // Add Sample Areas
  const sampleAreas = [
    { name: 'North District', food: 25, medical: 15, shelter: 5 },
    { name: 'East Side Encampment', food: 5, medical: 2, shelter: 20 },
    { name: 'Downtown Center', food: 10, medical: 5, shelter: 5 }
  ];

  sampleAreas.forEach(sa => {
    const score = calculatePriority(sa.food, sa.medical, sa.shelter);
    const priority = getPriorityLevel(score);
    areas.push({ id: nextAreaId++, name: sa.name, food: sa.food, medical: sa.medical, shelter: sa.shelter, score, priority });
  });

  // Add Sample Volunteers
  const sampleVols = [
    { name: 'Dr. Sarah Smith', skill: 'Medical', hours: 12 },
    { name: 'John Doe', skill: 'Logistics', hours: 8 },
    { name: 'Emily Chen', skill: 'General', hours: 24 }
  ];

  sampleVols.forEach(sv => {
    volunteers.push({ id: nextVolId++, name: sv.name, skill: sv.skill, hours: sv.hours });
  });

  renderAreasList();
  renderVolunteerList();
  saveToLocalStorage();
  
  document.getElementById('insights-section').classList.add('hidden');
  resultsSection.classList.add('hidden');
  resultsContainer.innerHTML = '';
}

// Event Listeners
addAreaBtn.addEventListener('click', addArea);
addVolBtn.addEventListener('click', addVolunteer);
analyzeBtn.addEventListener('click', analyzeAll);
loadSampleBtn.addEventListener('click', loadSampleData);
resetBtn.addEventListener('click', resetAll);

areaNameEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addArea();
  }
});

volNameEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addVolunteer();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
});

function animateCounters() {
  const counters = document.querySelectorAll('.counter-value');
  const duration = 1500; // ms

  counters.forEach(counter => {
    const target = parseFloat(counter.getAttribute('data-target')) || 0;
    const isFloat = target % 1 !== 0;
    const startTime = performance.now();

    function updateCount(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      const currentVal = target * ease;

      counter.innerText = isFloat ? currentVal.toFixed(1) : Math.floor(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        counter.innerText = isFloat ? target.toFixed(1) : target;
      }
    }
    requestAnimationFrame(updateCount);
  });
}
