// unified-app.js
// Ce fichier regroupe la logique de gestion des casiers et des équipements
// Structure Digit 2.0 : dashboard, navigation, modularité

// ========== Données locales (localStorage) ==========
const lockersKey = 'ppve_lockers';
const equipKeys = ['masques', 'tuyaux', 'moteurs', 'batteries'];

// ========== INIT ========== 
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    renderCasiersApp();
    renderEquipementsApp();
    switchTab('casiers');
});

// ========== Navigation Onglets ==========
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.tab[onclick*="${tab}"]`).classList.add('active');
    document.getElementById(`content-${tab}`).classList.add('active');
}

// ========== Dashboard (KPIs) ==========
function renderDashboard() {
    // Casiers
    let lockers = JSON.parse(localStorage.getItem(lockersKey)) || [];
    if (!lockers.length) lockers = initLockers();
    // Équipements
    const eq = {};
    equipKeys.forEach(k => eq[k] = JSON.parse(localStorage.getItem(k)) || []);
    // Stats
    const libres = lockers.filter(l => l.statut === 'LIBRE').length;
    const attente = lockers.filter(l => l.statut === 'EN ATTENTE').length;
    const occupe = lockers.filter(l => l.statut === 'OCCUPÉ').length;
    const inactif = lockers.filter(l => l.statut === 'INACTIF').length;
    // HTML
    document.getElementById('dashboard').innerHTML = `
        <div class="kpi-card casiers"><h3>🗄️ Casiers</h3><div class="value">${lockers.length}</div></div>
        <div class="kpi-card libres"><h3>🟢 Libres</h3><div class="value">${libres}</div></div>
        <div class="kpi-card attente"><h3>🟠 En Attente</h3><div class="value">${attente}</div></div>
        <div class="kpi-card occupe"><h3>🔴 Occupés</h3><div class="value">${occupe}</div></div>
        <div class="kpi-card inactif"><h3>⚫ Inactifs</h3><div class="value">${inactif}</div></div>
        <div class="kpi-card masques"><h3>🎭 Masques</h3><div class="value">${eq.masques.length}</div></div>
        <div class="kpi-card tuyaux"><h3>🔧 Tuyaux</h3><div class="value">${eq.tuyaux.length}</div></div>
        <div class="kpi-card moteurs"><h3>⚙️ Moteurs</h3><div class="value">${eq.moteurs.length}</div></div>
        <div class="kpi-card batteries"><h3>🔋 Batteries</h3><div class="value">${eq.batteries.length}</div></div>
    `;
}

// ========== Gestion Casiers (SIMPLE) ==========
function initLockers() {
    let lockers = [];
    for (let i = 1; i <= 78; i++) lockers.push({id: `C${String(i).padStart(2,'0')}`, platform: 'CI', statut: 'LIBRE', prenom: '', nom: '', refMasque: '', refTuyau: '', date: ''});
    for (let i = 1; i <= 70; i++) lockers.push({id: `CAA${String(i).padStart(2,'0')}`, platform: 'CA-A', statut: 'LIBRE', prenom: '', nom: '', refMasque: '', refTuyau: '', date: ''});
    for (let i = 1; i <= 70; i++) lockers.push({id: `CAB${String(i).padStart(2,'0')}`, platform: 'CA-B', statut: 'LIBRE', prenom: '', nom: '', refMasque: '', refTuyau: '', date: ''});
    for (let i = 1; i <= 70; i++) lockers.push({id: `CAC${String(i).padStart(2,'0')}`, platform: 'CA-C', statut: 'LIBRE', prenom: '', nom: '', refMasque: '', refTuyau: '', date: ''});
    localStorage.setItem(lockersKey, JSON.stringify(lockers));
    return lockers;
}
function renderCasiersApp() {
    // Placeholder : à compléter avec UI interactive (voir gestion-casiers.html)
    document.getElementById('casiers-app').innerHTML = `
        <p>Gestion des casiers (attribution, validation, nettoyage, etc.)<br><em>Module à compléter selon vos besoins spécifiques.</em></p>
    `;
}

// ========== Gestion Équipements ==========
function renderEquipementsApp() {
    // Placeholder : à compléter avec UI interactive (voir Antho.html)
    document.getElementById('equipements-app').innerHTML = `
        <p>Gestion des équipements (masques, tuyaux, moteurs, batteries, maintenance, export, etc.)<br><em>Module à compléter selon vos besoins spécifiques.</em></p>
    `;
}

// ========== Rafraîchissement auto dashboard ==========
window.addEventListener('storage', renderDashboard);
