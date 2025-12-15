// ============================================
// PPVE DIGIT 2.0 - APPLICATION UNIFIÉE
// Dashboard VitrineMasque + Gestion Équipements Pika
// ============================================

// ========== DONNÉES LOCALES ==========
const STORAGE_KEYS = {
    lockers: 'ppve_lockers',
    masques: 'ppve_masques',
    tuyaux: 'ppve_tuyaux',
    moteurs: 'ppve_moteurs',
    batteries: 'ppve_batteries'
};

let currentPlatformFilter = 'tous';
let currentSearchTerm = '';
let currentTriCasiers = 'defaut';
let currentStatutFilter = null; // Filtre par statut (LIBRE, EN ATTENTE, OCCUPÉ, INACTIF)

let currentSection = 'casiers';

// ========== CALCUL DURÉE DE VIE ÉQUIPEMENTS ==========
function calculerEtatEquipement(dateMiseEnService, typeEquipement) {
    if (!dateMiseEnService) return { couleur: '#94a3b8', label: 'NON DATÉ', mois: null };
    
    const maintenant = new Date();
    const dateMES = new Date(dateMiseEnService);
    const moisEcoules = (maintenant - dateMES) / (1000 * 60 * 60 * 24 * 30.44);
    
    // Durées max en mois
    const dureeMax = {
        'masque': 36,  // 3 ans
        'tuyau': 36,   // 3 ans
        'moteur': 60,  // 5 ans
        'batterie': 60 // 5 ans
    };
    
    const maxMois = dureeMax[typeEquipement.toLowerCase()] || 36;
    const moisRestants = maxMois - moisEcoules;
    
    // Code couleur avec valeurs absolues positives
    if (moisRestants < 0) {
        return { couleur: '#1f2937', label: 'PÉRIMÉ', mois: Math.abs(Math.round(moisRestants)), bg: '#e5e7eb' };
    } else if (moisRestants <= 3) {
        return { couleur: '#dc2626', label: 'URGENT', mois: Math.abs(Math.round(moisRestants)), bg: '#fee2e2' };
    } else if (moisRestants <= 6) {
        return { couleur: '#f59e0b', label: 'À COMMANDER', mois: Math.abs(Math.round(moisRestants)), bg: '#fef3c7' };
    } else if (moisRestants <= 12) {
        return { couleur: '#3b82f6', label: 'DERNIÈRE ANNÉE', mois: Math.abs(Math.round(moisRestants)), bg: '#dbeafe' };
    } else {
        return { couleur: '#10b981', label: 'BON', mois: Math.abs(Math.round(moisRestants)), bg: '#d1fae5' };
    }
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 PPVE Digit 2.0 - Chargement...');
    initData();
    showSection('casiers');
    console.log('✨ Application prête !');
});

// ========== INITIALISATION DONNÉES ==========
function initData() {
    // Initialiser les casiers si inexistants
    if (!localStorage.getItem(STORAGE_KEYS.lockers)) {
        const lockers = [];
        // Plateforme I (70 casiers)
        for (let i = 1; i <= 70; i++) {
            lockers.push({
                id: `I${i}`,
                platform: 'CI',
                numero: i,
                statut: 'LIBRE',
                prenom: '',
                nom: '',
                refMasque: '',
                refTuyau: '',
                date: ''
            });
        }
        // Plateforme A (70 casiers)
        for (let i = 1; i <= 70; i++) {
            lockers.push({
                id: `A${i}`,
                platform: 'CA-A',
                numero: i,
                statut: 'LIBRE',
                prenom: '',
                nom: '',
                refMasque: '',
                refTuyau: '',
                date: ''
            });
        }
        // Plateforme B (70 casiers)
        for (let i = 1; i <= 70; i++) {
            lockers.push({
                id: `B${i}`,
                platform: 'CA-B',
                numero: i,
                statut: 'LIBRE',
                prenom: '',
                nom: '',
                refMasque: '',
                refTuyau: '',
                date: ''
            });
        }
        // Plateforme C (70 casiers)
        for (let i = 1; i <= 70; i++) {
            lockers.push({
                id: `C${i}`,
                platform: 'CA-C',
                numero: i,
                statut: 'LIBRE',
                prenom: '',
                nom: '',
                refMasque: '',
                refTuyau: '',
                date: ''
            });
        }
        localStorage.setItem(STORAGE_KEYS.lockers, JSON.stringify(lockers));
    }

    // Initialiser les équipements avec dates MES et états si inexistants
    if (!localStorage.getItem(STORAGE_KEYS.masques)) {
        const masques = [
            { reference: 'MSQ-001', modele: '3M 6800', dateMiseEnService: '2022-01-15', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null },
            { reference: 'MSQ-002', modele: '3M 6800', dateMiseEnService: '2023-06-20', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null },
            { reference: 'MSQ-003', modele: 'Honeywell N95', dateMiseEnService: '2024-03-10', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null },
            { reference: 'MSQ-004', modele: 'Dräger X-plore', dateMiseEnService: '2024-09-01', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null },
            { reference: 'MSQ-005', modele: '3M 6800', dateMiseEnService: '2025-01-05', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null }
        ];
        localStorage.setItem(STORAGE_KEYS.masques, JSON.stringify(masques));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.tuyaux)) {
        const tuyaux = [
            { reference: 'TUY-001', modele: 'Flexible 10m', dateMiseEnService: '2022-02-10', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null },
            { reference: 'TUY-002', modele: 'Flexible 15m', dateMiseEnService: '2023-07-15', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null },
            { reference: 'TUY-003', modele: 'Flexible 10m', dateMiseEnService: '2024-04-20', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null },
            { reference: 'TUY-004', modele: 'Flexible 20m', dateMiseEnService: '2024-10-12', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null },
            { reference: 'TUY-005', modele: 'Flexible 15m', dateMiseEnService: '2025-02-01', statut: 'DISPONIBLE', etat: 'stock', assigneA: null, plateforme: null }
        ];
        localStorage.setItem(STORAGE_KEYS.tuyaux, JSON.stringify(tuyaux));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.moteurs)) {
        localStorage.setItem(STORAGE_KEYS.moteurs, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.batteries)) {
        localStorage.setItem(STORAGE_KEYS.batteries, JSON.stringify([]));
    }
    
    // MIGRATION : S'assurer que tous les équipements ont un champ 'etat'
    ['masques', 'tuyaux', 'moteurs', 'batteries'].forEach(type => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[type])) || [];
        let modified = false;
        data.forEach(item => {
            if (!item.etat) {
                // Si assigné à quelqu'un, mettre en utilisation, sinon en stock
                item.etat = (item.assigneA && item.assigneA !== null) ? 'utilisation' : 'stock';
                modified = true;
            }
            // S'assurer que assigneA et plateforme existent
            if (item.assigneA === undefined) item.assigneA = null;
            if (item.plateforme === undefined) item.plateforme = null;
        });
        if (modified) {
            localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(data));
        }
    });
}

// ========== NAVIGATION SECTIONS ==========
window.showSection = function(section) {
    console.log(`📍 Changement de section: ${section}`);
    currentSection = section;
    document.getElementById('section-casiers').style.display = section === 'casiers' ? 'block' : 'none';
    document.getElementById('section-equipements').style.display = section === 'equipements' ? 'block' : 'none';
    document.getElementById('section-utilisateurs').style.display = section === 'utilisateurs' ? 'block' : 'none';
    
    // Mise à jour des boutons
    ['casiers', 'equipements', 'utilisateurs'].forEach(s => {
        const btn = document.getElementById(`btn-${s}`);
        if (btn) {
            if (s === section) {
                btn.style.background = 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
                btn.style.color = 'white';
                btn.style.boxShadow = '0 4px 15px rgba(102,126,234,0.4)';
            } else {
                btn.style.background = '#f3f4f6';
                btn.style.color = '#6b7280';
                btn.style.boxShadow = 'none';
            }
        }
    });
    
    if (section === 'casiers') renderCasiers();
    if (section === 'equipements') renderEquipements();
    if (section === 'utilisateurs') renderUtilisateurs();
};

// ========== SECTION CASIERS ==========
function renderCasiers() {
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const libres = lockers.filter(l => l.statut === 'LIBRE');
    
    let html = '<div style="background:white;border-radius:20px;padding:25px;box-shadow:0 10px 40px rgba(0,0,0,0.10);">';
    
    // TITRE + EXPLICATION
    html += '<h2 style="color:#667eea;font-size:1.8em;font-weight:800;margin:0 0 10px 0;">🗄️ Attribution des Casiers</h2>';
    
    // STATS DÉTAILLÉES PAR STATUT (CLIQUABLES POUR FILTRER)
    const stats = {
        LIBRE: lockers.filter(l => l.statut === 'LIBRE').length,
        'EN ATTENTE': lockers.filter(l => l.statut === 'EN ATTENTE').length,
        'OCCUPÉ': lockers.filter(l => l.statut === 'OCCUPÉ').length,
        'INACTIF': lockers.filter(l => l.statut === 'INACTIF').length
    };
    
    const totalCasiers = lockers.length; // Total dynamique
    html += `<p style="color:#64748b;font-size:0.95em;margin:0 0 20px 0;">Cliquez sur une carte pour filtrer par statut • Total: <strong>${totalCasiers} casiers</strong></p>`;
    
    html += '<div class="stats-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:25px;">';
    
    // Carte LIBRE avec état actif/inactif
    const isLibreActive = currentStatutFilter === 'LIBRE';
    html += `<div onclick="filtrerParStatut('LIBRE')" class="stat-card" style="background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);padding:15px;border-radius:12px;text-align:center;cursor:pointer;transition:all 0.3s;border:3px solid #10b981;${isLibreActive ? 'box-shadow:0 0 0 4px rgba(16,185,129,0.3);transform:scale(1.05);' : ''}" onmouseover="if(!${isLibreActive})this.style.transform='scale(1.05)'" onmouseout="if(!${isLibreActive})this.style.transform='scale(1)'">`;
    html += `<div class="stat-number" style="font-size:2.2em;font-weight:800;color:#065f46;">${stats.LIBRE}</div>`;
    html += '<div class="stat-label" style="font-size:0.85em;color:#065f46;font-weight:700;">🟢 LIBRE</div>';
    html += `<div class="stat-percent" style="font-size:0.75em;color:#059669;margin-top:4px;">${(stats.LIBRE / totalCasiers * 100).toFixed(0)}%</div>`;
    if (isLibreActive) html += '<div class="stat-active" style="font-size:0.7em;color:#10b981;margin-top:6px;font-weight:800;">✓ ACTIF</div>';
    html += '</div>';
    
    // Carte EN ATTENTE avec état actif/inactif
    const isAttenteActive = currentStatutFilter === 'EN ATTENTE';
    html += `<div onclick="filtrerParStatut('EN ATTENTE')" class="stat-card" style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);padding:15px;border-radius:12px;text-align:center;cursor:pointer;transition:all 0.3s;border:3px solid #f59e0b;${isAttenteActive ? 'box-shadow:0 0 0 4px rgba(245,158,11,0.3);transform:scale(1.05);' : ''}" onmouseover="if(!${isAttenteActive})this.style.transform='scale(1.05)'" onmouseout="if(!${isAttenteActive})this.style.transform='scale(1)'">`;
    html += `<div class="stat-number" style="font-size:2.2em;font-weight:800;color:#92400e;">${stats['EN ATTENTE']}</div>`;
    html += '<div class="stat-label" style="font-size:0.85em;color:#92400e;font-weight:700;">🟠 EN ATTENTE</div>';
    html += `<div class="stat-percent" style="font-size:0.75em;color:#d97706;margin-top:4px;">${(stats['EN ATTENTE'] / totalCasiers * 100).toFixed(0)}%</div>`;
    if (isAttenteActive) html += '<div class="stat-active" style="font-size:0.7em;color:#f59e0b;margin-top:6px;font-weight:800;">✓ ACTIF</div>';
    html += '</div>';
    
    // Carte OCCUPÉ avec état actif/inactif
    const isOccupeActive = currentStatutFilter === 'OCCUPÉ';
    html += `<div onclick="filtrerParStatut('OCCUPÉ')" class="stat-card" style="background:linear-gradient(135deg,#fecaca 0%,#fca5a5 100%);padding:15px;border-radius:12px;text-align:center;cursor:pointer;transition:all 0.3s;border:3px solid #ef4444;${isOccupeActive ? 'box-shadow:0 0 0 4px rgba(239,68,68,0.3);transform:scale(1.05);' : ''}" onmouseover="if(!${isOccupeActive})this.style.transform='scale(1.05)'" onmouseout="if(!${isOccupeActive})this.style.transform='scale(1)'">`;
    html += `<div class="stat-number" style="font-size:2.2em;font-weight:800;color:#991b1b;">${stats['OCCUPÉ']}</div>`;
    html += '<div class="stat-label" style="font-size:0.85em;color:#991b1b;font-weight:700;">🔴 OCCUPÉ</div>';
    html += `<div class="stat-percent" style="font-size:0.75em;color:#dc2626;margin-top:4px;">${(stats['OCCUPÉ'] / totalCasiers * 100).toFixed(0)}%</div>`;
    if (isOccupeActive) html += '<div class="stat-active" style="font-size:0.7em;color:#ef4444;margin-top:6px;font-weight:800;">✓ ACTIF</div>';
    html += '</div>';
    
    // Carte INACTIF avec état actif/inactif
    const isInactifActive = currentStatutFilter === 'INACTIF';
    html += `<div onclick="filtrerParStatut('INACTIF')" class="stat-card" style="background:linear-gradient(135deg,#e2e8f0 0%,#cbd5e1 100%);padding:15px;border-radius:12px;text-align:center;cursor:pointer;transition:all 0.3s;border:3px solid #64748b;${isInactifActive ? 'box-shadow:0 0 0 4px rgba(100,116,139,0.3);transform:scale(1.05);' : ''}" onmouseover="if(!${isInactifActive})this.style.transform='scale(1.05)'" onmouseout="if(!${isInactifActive})this.style.transform='scale(1)'">`;
    html += `<div class="stat-number" style="font-size:2.2em;font-weight:800;color:#1e293b;">${stats['INACTIF']}</div>`;
    html += '<div class="stat-label" style="font-size:0.85em;color:#1e293b;font-weight:700;">⚫ INACTIF</div>';
    html += `<div class="stat-percent" style="font-size:0.75em;color:#475569;margin-top:4px;">${(stats['INACTIF'] / totalCasiers * 100).toFixed(0)}%</div>`;
    if (isInactifActive) html += '<div class="stat-active" style="font-size:0.7em;color:#64748b;margin-top:6px;font-weight:800;">✓ ACTIF</div>';
    html += '</div>';
    
    html += '</div>';
    
    // FILTRES PLATEFORMES
    html += '<div id="filtres-plateformes" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;"></div>';
    
    // RECHERCHE SIMPLE
    html += '<div style="margin-bottom:20px;">';
    html += '<input type="text" id="search-casier" style="width:100%;padding:14px 20px;border:2px solid #e2e8f0;border-radius:12px;font-size:1em;" placeholder="🔍 Rechercher un numéro de casier..." oninput="setCasiersSearch(this.value)">';
    html += '</div>';
    
    // INFO + GRILLE (TOUS LES CASIERS)
    html += '<div id="result-info" style="padding:10px 0;color:#667eea;font-weight:700;"></div>';
    html += '<div id="casiers-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;"></div>';
    
    html += '</div>';
    document.getElementById('section-casiers').innerHTML = html;
    
    try {
        renderFiltresPlateforme(lockers);
        console.log('✅ Filtres plateformes OK');
    } catch(e) {
        console.error('❌ Erreur renderFiltresPlateforme:', e);
    }
    
    try {
        // AFFICHER TOUS LES CASIERS (filtrés selon critères actifs)
        renderCasiersGrid(lockers);
        console.log('✅ Grille casiers OK');
    } catch(e) {
        console.error('❌ Erreur renderCasiersGrid:', e);
    }
}

function renderFiltresPlateforme(lockers) {
    const filtres = [
        { key: 'tous', label: 'TOUS', icon: '🌐', color: '#667eea' },
        { key: 'CI', label: 'I', icon: '🏢', color: '#3b82f6' },
        { key: 'CA-A', label: 'A', icon: '🏗️', color: '#10b981' },
        { key: 'CA-B', label: 'B', icon: '🏭', color: '#f59e0b' },
        { key: 'CA-C', label: 'C', icon: '⚙️', color: '#ef4444' }
    ];

    let html = '';
    filtres.forEach(f => {
        const count = f.key === 'tous' ? lockers.length : lockers.filter(l => l.platform === f.key).length;
        const isActive = currentPlatformFilter === f.key;
        html += `
            <button onclick="filterByPlatform('${f.key}')" style="padding:16px;border:3px solid ${isActive ? f.color : '#e2e8f0'};background:${isActive ? f.color : 'white'};color:${isActive ? 'white' : '#1f2937'};font-size:1em;font-weight:800;border-radius:12px;cursor:pointer;transition:all 0.3s;text-align:center;${isActive ? 'transform:scale(1.05);box-shadow:0 6px 20px rgba(0,0,0,0.15);' : ''}">
                <div style="font-size:1.5rem;margin-bottom:6px;">${f.icon}</div>
                <div style="font-size:1.8rem;font-weight:800;margin-bottom:4px;">${count}</div>
                <div style="font-size:0.85rem;font-weight:700;opacity:0.9;">${f.label}</div>
            </button>
        `;
    });
    document.getElementById('filtres-plateformes').innerHTML = html;
}

function renderStatsStatuts(lockers) {
    const stats = {
        LIBRE: lockers.filter(l => l.statut === 'LIBRE').length,
        'EN ATTENTE': lockers.filter(l => l.statut === 'EN ATTENTE').length,
        'OCCUPÉ': lockers.filter(l => l.statut === 'OCCUPÉ').length,
        INACTIF: lockers.filter(l => l.statut === 'INACTIF').length
    };

    const config = {
        'LIBRE': { icon: '🟢', color: '#10b981', bg: '#d1fae5' },
        'EN ATTENTE': { icon: '🟠', color: '#f59e0b', bg: '#fed7aa' },
        'OCCUPÉ': { icon: '🔴', color: '#ef4444', bg: '#fecaca' },
        'INACTIF': { icon: '⚫', color: '#64748b', bg: '#e2e8f0' }
    };

    let html = '';
    Object.keys(stats).forEach(key => {
        const c = config[key];
        html += `
            <div class="statut-card" style="background:white;padding:20px 15px;border-radius:12px;text-align:center;cursor:pointer;transition:all 0.3s;border:3px solid transparent;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size:1.8rem;margin-bottom:8px;">${c.icon}</div>
                <div style="font-size:1.8rem;font-weight:800;margin-bottom:5px;color:${c.color};">${stats[key]}</div>
                <div style="font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">${key}</div>
            </div>
        `;
    });
    document.getElementById('statuts-grid').innerHTML = html;
}

function renderCasiersGrid(lockers) {
    // Filtrer par plateforme
    let filtered = lockers;
    if (currentPlatformFilter !== 'tous') {
        filtered = lockers.filter(l => l.platform === currentPlatformFilter);
    }
    
    // Filtrer par statut (si filtre actif)
    if (currentStatutFilter) {
        filtered = filtered.filter(l => l.statut === currentStatutFilter);
    }

    // Filtrer par recherche
    if (currentSearchTerm) {
        filtered = filtered.filter(l =>
            l.id.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
            l.prenom.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
            l.nom.toLowerCase().includes(currentSearchTerm.toLowerCase())
        );
    }

    // Trier selon le filtre choisi
    if (currentTriCasiers === 'libre-first') {
        filtered.sort((a, b) => (a.statut === 'LIBRE' ? -1 : 1));
    } else if (currentTriCasiers === 'attente-first') {
        filtered.sort((a, b) => (a.statut === 'EN ATTENTE' ? -1 : 1));
    } else if (currentTriCasiers === 'occupe-first') {
        filtered.sort((a, b) => (a.statut === 'OCCUPÉ' ? -1 : 1));
    } else if (currentTriCasiers === 'inactif-first') {
        filtered.sort((a, b) => (a.statut === 'INACTIF' ? -1 : 1));
    } else if (currentTriCasiers === 'platform-asc') {
        filtered.sort((a, b) => a.platform.localeCompare(b.platform));
    } else if (currentTriCasiers === 'platform-desc') {
        filtered.sort((a, b) => b.platform.localeCompare(a.platform));
    } else if (currentTriCasiers === 'numero-asc') {
        filtered.sort((a, b) => a.numero - b.numero);
    } else if (currentTriCasiers === 'numero-desc') {
        filtered.sort((a, b) => b.numero - a.numero);
    }

    // Info résultats
    document.getElementById('result-info').textContent = 
        `📊 ${filtered.length} casier${filtered.length > 1 ? 's' : ''} affiché${filtered.length > 1 ? 's' : ''}`;

    // Grille casiers
    let html = '';
    filtered.forEach(locker => {
        const statutClass = locker.statut.toLowerCase().replace(' ', '');
        const statutColors = {
            'libre': { border: '#10b981', bg: '#d1fae5', color: '#065f46' },
            'enattente': { border: '#f59e0b', bg: '#fed7aa', color: '#92400e' },
            'occupé': { border: '#ef4444', bg: '#fecaca', color: '#991b1b' },
            'inactif': { border: '#64748b', bg: '#e2e8f0', color: '#475569' }
        };
        const c = statutColors[statutClass] || { border: '#e2e8f0', bg: 'white', color: '#64748b' };

        const platformColors = {
            'CI': '#3b82f6',
            'CA-A': '#10b981',
            'CA-B': '#f59e0b',
            'CA-C': '#ef4444'
        };

        html += `
            <div class="casier-card" onclick="showCasierDetail('${locker.id}')" style="background:white;border:3px solid #e2e8f0;border-radius:15px;padding:15px;cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden;">
                <div style="position:absolute;top:0;left:0;width:6px;height:100%;background:${c.border};"></div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;">
                    <div style="font-weight:800;font-size:1.1rem;color:#1e293b;">${locker.id}</div>
                    <div style="font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:8px;color:white;background:${platformColors[locker.platform] || '#667eea'};">${locker.platform}</div>
                </div>
                <div style="display:inline-block;padding:6px 12px;border-radius:10px;font-size:0.75rem;font-weight:700;margin-top:8px;width:100%;text-align:center;background:${c.bg};color:${c.color};">${locker.statut}</div>
                ${locker.prenom || locker.nom ? `<div style="margin-top:10px;font-size:0.75rem;color:#64748b;border-top:2px solid #f1f5f9;padding-top:10px;"><strong style="color:#1e293b;display:block;margin-bottom:4px;">${locker.prenom} ${locker.nom}</strong></div>` : '<div style="margin-top:10px;font-size:0.75rem;color:#bbb;">Aucun utilisateur</div>'}
            </div>
        `;
    });

    document.getElementById('casiers-grid').innerHTML = html || '<p style="text-align:center;color:#9ca3af;padding:40px;">Aucun casier trouvé</p>';
}

// ========== FILTRES & RECHERCHE ==========
window.filterByPlatform = function(platform) {
    currentPlatformFilter = platform;
    renderCasiers();
};

window.filtrerParStatut = function(statut) {
    if (currentStatutFilter === statut) {
        // Si déjà actif, désactiver le filtre
        currentStatutFilter = null;
    } else {
        currentStatutFilter = statut;
    }
    renderCasiers();
};

window.setCasiersSearch = function(term) {
    currentSearchTerm = term;
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    renderCasiersGrid(lockers);
};

window.setTriCasiers = function(tri) {
    currentTriCasiers = tri;
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    renderCasiersGrid(lockers);
};

window.showCasierDetail = function(lockerId) {
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const locker = lockers.find(l => l.id === lockerId);
    if (!locker) return;
    
    const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
    const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
    
    let html = `
        <h2 style="color:#667eea;margin:0 0 20px 0;font-size:1.5em;">Casier ${locker.id} - ${locker.platform}</h2>
    `;
    
    if (locker.statut === 'LIBRE') {
        html += `
            <input type="text" id="input-nom" placeholder="Nom" style="width:100%;padding:12px;margin-bottom:10px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            <input type="text" id="input-prenom" placeholder="Prénom" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            
            <select id="input-masque" style="width:100%;padding:12px;margin-bottom:10px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                <option value="">-- Ref Masque --</option>`;
        
        // Afficher uniquement masques en stock
        masques.filter(m => m.etat === 'stock').forEach(m => {
            const etat = calculerEtatEquipement(m.dateMiseEnService, 'masque');
            const badge = etat.mois !== null ? ` [${etat.label} - ${etat.mois}m]` : ' [NON DATÉ]';
            html += `<option value="${m.reference}">${m.reference} - ${m.modele || 'N/A'}${badge}</option>`;
        });
        
        html += `</select>
            
            <select id="input-tuyau" style="width:100%;padding:12px;margin-bottom:20px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                <option value="">-- Ref Tuyau --</option>`;
        
        // Afficher uniquement tuyaux en stock
        tuyaux.filter(t => t.etat === 'stock').forEach(t => {
            const etat = calculerEtatEquipement(t.dateMiseEnService, 'tuyau');
            const badge = etat.mois !== null ? ` [${etat.label} - ${etat.mois}m]` : ' [NON DATÉ]';
            html += `<option value="${t.reference}">${t.reference} - ${t.modele || 'N/A'}${badge}</option>`;
        });
        
        html += `</select>
            
            <button onclick="assignerCasier('${lockerId}')" style="width:100%;padding:14px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1em;font-weight:700;border-radius:10px;cursor:pointer;margin-bottom:8px;">
                ✅ Assigner
            </button>
            <button onclick="closeModal()" style="width:100%;padding:12px;border:2px solid #e2e8f0;background:white;color:#64748b;font-size:0.95em;font-weight:600;border-radius:10px;cursor:pointer;">Annuler</button>
        `;
    } else if (locker.statut === 'EN ATTENTE') {
        html += `
            <p style="color:#64748b;margin-bottom:15px;text-align:center;">En attente • Voir <strong>UTILISATEURS</strong> pour gérer</p>
            <button onclick="closeModal()" style="width:100%;padding:12px;border:2px solid #e2e8f0;background:white;color:#64748b;font-size:0.95em;font-weight:600;border-radius:10px;cursor:pointer;">Fermer</button>
        `;
    } else {
        html += `
            <p style="color:#64748b;margin-bottom:15px;text-align:center;">Voir <strong>UTILISATEURS</strong> pour gérer</p>
            <button onclick="closeModal()" style="width:100%;padding:12px;border:2px solid #e2e8f0;background:white;color:#64748b;font-size:0.95em;font-weight:600;border-radius:10px;cursor:pointer;">Fermer</button>
        `;
    }
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-assignation').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
};

window.assignerCasier = function(lockerId) {
    const prenom = document.getElementById('input-prenom').value.trim();
    const nom = document.getElementById('input-nom').value.trim();
    const refMasque = document.getElementById('input-masque').value;
    const refTuyau = document.getElementById('input-tuyau').value;
    
    if (!prenom || !nom) {
        alert('❌ Veuillez renseigner le prénom et le nom');
        return;
    }
    
    // VÉRIFICATION ÉTAT ÉQUIPEMENTS (ALERTE ORANGE/ROUGE UNIQUEMENT)
    const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
    const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
    const masqueData = masques.find(m => m.reference === refMasque);
    const tuyauData = tuyaux.find(t => t.reference === refTuyau);
    
    let alertes = [];
    if (masqueData) {
        const etatMasque = calculerEtatEquipement(masqueData.dateMiseEnService, 'masque');
        if (etatMasque.label === 'À COMMANDER' || etatMasque.label === 'URGENT' || etatMasque.label === 'PÉRIMÉ') {
            alertes.push(`⚠️ MASQUE ${refMasque}: ${etatMasque.label} (${etatMasque.mois}m restants)`);
        }
    }
    if (tuyauData) {
        const etatTuyau = calculerEtatEquipement(tuyauData.dateMiseEnService, 'tuyau');
        if (etatTuyau.label === 'À COMMANDER' || etatTuyau.label === 'URGENT' || etatTuyau.label === 'PÉRIMÉ') {
            alertes.push(`⚠️ TUYAU ${refTuyau}: ${etatTuyau.label} (${etatTuyau.mois}m restants)`);
        }
    }
    
    if (alertes.length > 0) {
        const confirmer = confirm('⚠️ ATTENTION - ÉQUIPEMENTS À SURVEILLER:\n\n' + alertes.join('\n') + '\n\nVoulez-vous continuer cette assignation ?');
        if (!confirmer) return;
    }
    
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const locker = lockers.find(l => l.id === lockerId);
    if (locker) {
        const aujourdhui = new Date().toISOString().split('T')[0];
        locker.statut = 'EN ATTENTE';
        locker.prenom = prenom;
        locker.nom = nom;
        locker.refMasque = refMasque;
        locker.refTuyau = refTuyau;
        locker.date = aujourdhui;
        locker.dateAssignation = aujourdhui;
        locker.dateMasqueMES = masqueData?.dateMiseEnService || '';
        locker.dateTuyauMES = tuyauData?.dateMiseEnService || '';
        
        // Mettre à jour l'état des équipements (stock → utilisation)
        if (refMasque) {
            const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
            const masque = masques.find(m => m.reference === refMasque);
            if (masque) {
                masque.etat = 'utilisation';
                masque.assigneA = `${prenom} ${nom}`;
                masque.plateforme = locker.platform;
                localStorage.setItem(STORAGE_KEYS.masques, JSON.stringify(masques));
            }
        }
        
        if (refTuyau) {
            const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
            const tuyau = tuyaux.find(t => t.reference === refTuyau);
            if (tuyau) {
                tuyau.etat = 'utilisation';
                tuyau.assigneA = `${prenom} ${nom}`;
                tuyau.plateforme = locker.platform;
                localStorage.setItem(STORAGE_KEYS.tuyaux, JSON.stringify(tuyaux));
            }
        }
        
        localStorage.setItem(STORAGE_KEYS.lockers, JSON.stringify(lockers));
        closeModal();
        renderCasiers();
        alert(`✅ Casier ${lockerId} assigné à ${prenom} ${nom} (EN ATTENTE)`);
    }
};

window.libererCasier = function(lockerId) {
    if (!confirm('Libérer ce casier et remettre les équipements en stock ?')) return;
    
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const locker = lockers.find(l => l.id === lockerId);
    if (locker) {
        // Remettre les équipements en stock
        if (locker.refMasque) {
            const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
            const masque = masques.find(m => m.reference === locker.refMasque);
            if (masque) {
                masque.etat = 'stock';
                masque.assigneA = null;
                masque.plateforme = null;
                localStorage.setItem(STORAGE_KEYS.masques, JSON.stringify(masques));
            }
        }
        
        if (locker.refTuyau) {
            const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
            const tuyau = tuyaux.find(t => t.reference === locker.refTuyau);
            if (tuyau) {
                tuyau.etat = 'stock';
                tuyau.assigneA = null;
                tuyau.plateforme = null;
                localStorage.setItem(STORAGE_KEYS.tuyaux, JSON.stringify(tuyaux));
            }
        }
        
        locker.statut = 'LIBRE';
        locker.prenom = '';
        locker.nom = '';
        locker.refMasque = '';
        locker.refTuyau = '';
        locker.date = '';
        localStorage.setItem(STORAGE_KEYS.lockers, JSON.stringify(lockers));
        closeModal();
        renderCasiers();
        alert(`✅ Casier ${lockerId} libéré - Équipements remis en stock`);
    }
};

window.closeModal = function() {
    document.getElementById('modal-assignation').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
};

window.reinitialiserCasiers = function() {
    const confirmation = confirm('⚠️ ATTENTION : Cette action va réinitialiser tous les casiers à 280 unités (4 plateformes × 70).\n\n⚠️ TOUTES LES ASSIGNATIONS SERONT PERDUES !\n\nVoulez-vous continuer ?');
    if (!confirmation) return;
    
    const doubleConfirm = confirm('❗ DERNIÈRE CONFIRMATION\n\nÊtes-vous VRAIMENT sûr de vouloir réinitialiser ?\n\nCette action est IRRÉVERSIBLE.');
    if (!doubleConfirm) return;
    
    // Supprimer et recréer les casiers
    localStorage.removeItem(STORAGE_KEYS.lockers);
    
    const lockers = [];
    // Plateforme I (70 casiers)
    for (let i = 1; i <= 70; i++) {
        lockers.push({
            id: `I${i}`,
            platform: 'CI',
            numero: i,
            statut: 'LIBRE',
            prenom: '',
            nom: '',
            refMasque: '',
            refTuyau: '',
            date: ''
        });
    }
    // Plateforme A (70 casiers)
    for (let i = 1; i <= 70; i++) {
        lockers.push({
            id: `A${i}`,
            platform: 'CA-A',
            numero: i,
            statut: 'LIBRE',
            prenom: '',
            nom: '',
            refMasque: '',
            refTuyau: '',
            date: ''
        });
    }
    // Plateforme B (70 casiers)
    for (let i = 1; i <= 70; i++) {
        lockers.push({
            id: `B${i}`,
            platform: 'CA-B',
            numero: i,
            statut: 'LIBRE',
            prenom: '',
            nom: '',
            refMasque: '',
            refTuyau: '',
            date: ''
        });
    }
    // Plateforme C (70 casiers)
    for (let i = 1; i <= 70; i++) {
        lockers.push({
            id: `C${i}`,
            platform: 'CA-C',
            numero: i,
            statut: 'LIBRE',
            prenom: '',
            nom: '',
            refMasque: '',
            refTuyau: '',
            date: ''
        });
    }
    
    localStorage.setItem(STORAGE_KEYS.lockers, JSON.stringify(lockers));
    
    // Réinitialiser les filtres
    currentPlatformFilter = 'tous';
    currentSearchTerm = '';
    currentTriCasiers = 'defaut';
    currentStatutFilter = null;
    
    // Recharger l'affichage
    renderCasiers();
    
    alert(`✅ Réinitialisation terminée !\n\n280 casiers créés :\n• CI (I) : 70 casiers\n• CA-A (A) : 70 casiers\n• CA-B (B) : 70 casiers\n• CA-C (C) : 70 casiers`);
};

// ========== SECTION UTILISATEURS ==========
// Variable globale pour le filtre utilisateurs
let currentUtilisateursFilter = null;

function renderUtilisateurs() {
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    let utilisateurs = lockers.filter(l => l.prenom && l.nom);
    
    let html = '<div style="background:white;border-radius:20px;padding:25px;box-shadow:0 10px 40px rgba(0,0,0,0.10);">';
    html += '<h2 style="color:#667eea;font-size:1.8em;font-weight:800;margin:0 0 10px 0;">👤 Gestion des Utilisateurs</h2>';
    html += '<p style="color:#64748b;margin-bottom:20px;">Cycle complet : <strong>EN ATTENTE</strong> → valider popup → <strong>OCCUPÉ</strong> → matériel revient → <strong>INACTIF</strong> → nettoyé → <strong>LIBRE</strong></p>';
    
    // FILTRES DE STATUT
    const statsUtilisateurs = {
        'EN ATTENTE': utilisateurs.filter(u => u.statut === 'EN ATTENTE').length,
        'OCCUPÉ': utilisateurs.filter(u => u.statut === 'OCCUPÉ').length,
        'INACTIF': utilisateurs.filter(u => u.statut === 'INACTIF').length
    };
    
    html += '<div class="user-filters" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:20px;">';
    
    const isAttenteActive = currentUtilisateursFilter === 'EN ATTENTE';
    html += `<div onclick="filtrerUtilisateurs('EN ATTENTE')" class="user-filter-card" style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);padding:12px;border-radius:10px;text-align:center;cursor:pointer;transition:all 0.3s;border:2px solid #f59e0b;${isAttenteActive ? 'box-shadow:0 0 0 3px rgba(245,158,11,0.3);transform:scale(1.05);' : ''}">`;
    html += `<div style="font-size:1.8em;font-weight:800;color:#92400e;">${statsUtilisateurs['EN ATTENTE']}</div>`;
    html += '<div style="font-size:0.75em;color:#92400e;font-weight:700;">🟠 EN ATTENTE</div>';
    if (isAttenteActive) html += '<div style="font-size:0.65em;color:#f59e0b;margin-top:4px;font-weight:800;">✓ ACTIF</div>';
    html += '</div>';
    
    const isOccupeActive = currentUtilisateursFilter === 'OCCUPÉ';
    html += `<div onclick="filtrerUtilisateurs('OCCUPÉ')" class="user-filter-card" style="background:linear-gradient(135deg,#fecaca 0%,#fca5a5 100%);padding:12px;border-radius:10px;text-align:center;cursor:pointer;transition:all 0.3s;border:2px solid #ef4444;${isOccupeActive ? 'box-shadow:0 0 0 3px rgba(239,68,68,0.3);transform:scale(1.05);' : ''}">`;
    html += `<div style="font-size:1.8em;font-weight:800;color:#991b1b;">${statsUtilisateurs['OCCUPÉ']}</div>`;
    html += '<div style="font-size:0.75em;color:#991b1b;font-weight:700;">🔴 OCCUPÉ</div>';
    if (isOccupeActive) html += '<div style="font-size:0.65em;color:#ef4444;margin-top:4px;font-weight:800;">✓ ACTIF</div>';
    html += '</div>';
    
    const isInactifActive = currentUtilisateursFilter === 'INACTIF';
    html += `<div onclick="filtrerUtilisateurs('INACTIF')" class="user-filter-card" style="background:linear-gradient(135deg,#e2e8f0 0%,#cbd5e1 100%);padding:12px;border-radius:10px;text-align:center;cursor:pointer;transition:all 0.3s;border:2px solid #64748b;${isInactifActive ? 'box-shadow:0 0 0 3px rgba(100,116,139,0.3);transform:scale(1.05);' : ''}">`;
    html += `<div style="font-size:1.8em;font-weight:800;color:#1e293b;">${statsUtilisateurs['INACTIF']}</div>`;
    html += '<div style="font-size:0.75em;color:#1e293b;font-weight:700;">⚫ INACTIF</div>';
    if (isInactifActive) html += '<div style="font-size:0.65em;color:#64748b;margin-top:4px;font-weight:800;">✓ ACTIF</div>';
    html += '</div>';
    
    html += '</div>';
    
    // Filtrer selon le filtre actif
    if (currentUtilisateursFilter) {
        utilisateurs = utilisateurs.filter(u => u.statut === currentUtilisateursFilter);
    }
    
    if (utilisateurs.length === 0) {
        html += '<p style="text-align:center;color:#9ca3af;padding:40px;">Aucun utilisateur trouvé</p>';
    } else {
        html += '<div class="users-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">';
        utilisateurs.forEach(user => {
            const statutColors = {
                'EN ATTENTE': { bg: '#fef3c7', border: '#f59e0b', color: '#92400e' },
                'OCCUPÉ': { bg: '#fecaca', border: '#ef4444', color: '#991b1b' },
                'INACTIF': { bg: '#e2e8f0', border: '#64748b', color: '#475569' },
                'LIBRE': { bg: '#d1fae5', border: '#10b981', color: '#065f46' }
            };
            
            const c = statutColors[user.statut];
            if (!c) return;
            
            html += `
                <div class="user-card" style="background:${c.bg};border:3px solid ${c.border};padding:15px;border-radius:12px;display:flex;flex-direction:column;min-height:240px;">
                    <div style="text-align:center;margin-bottom:12px;">
                        <div style="font-size:1.1em;font-weight:800;color:#1f2937;margin-bottom:4px;">${user.prenom} ${user.nom}</div>
                        <div style="font-size:0.75em;color:#64748b;margin-bottom:8px;">🗄️ ${user.id} - ${user.platform}</div>
                        <div style="display:inline-block;padding:5px 12px;border-radius:8px;font-size:0.7em;font-weight:700;background:${c.border};color:white;">${user.statut}</div>
                    </div>
                    <div style="text-align:center;margin-bottom:12px;flex:1;">
                        ${user.refMasque ? `<div style="font-size:0.75em;color:#64748b;margin-bottom:3px;">🎭 ${user.refMasque}</div>` : ''}
                        ${user.refTuyau ? `<div style="font-size:0.75em;color:#64748b;margin-bottom:3px;">🔧 ${user.refTuyau}</div>` : ''}
                        ${user.dateAssignation ? `<div style="font-size:0.7em;color:#9ca3af;margin-top:6px;">📅 ${new Date(user.dateAssignation).toLocaleDateString('fr-FR')}</div>` : ''}
                    </div>`;
            
            // EN ATTENTE → OCCUPÉ (avec validation)
            if (user.statut === 'EN ATTENTE') {
                html += `
                    <button onclick="openModalValidationOccupation('${user.id}')" style="width:100%;padding:10px 8px;border:none;background:#ef4444;color:white;font-size:0.85em;font-weight:700;border-radius:8px;cursor:pointer;transition:all 0.3s;">
                        🔴 VALIDER
                    </button>
                `;
            }
            // OCCUPÉ → INACTIF
            else if (user.statut === 'OCCUPÉ') {
                html += `
                    <button onclick="changerStatut('${user.id}', 'INACTIF')" style="width:100%;padding:10px 8px;border:none;background:#64748b;color:white;font-size:0.85em;font-weight:700;border-radius:8px;cursor:pointer;transition:all 0.3s;">
                        ⚫ INACTIF
                    </button>
                `;
            }
            // INACTIF → LIBRE
            else if (user.statut === 'INACTIF') {
                html += `
                    <button onclick="changerStatut('${user.id}', 'LIBRE')" style="width:100%;padding:10px 8px;border:none;background:#10b981;color:white;font-size:0.85em;font-weight:700;border-radius:8px;cursor:pointer;transition:all 0.3s;">
                        🟢 LIBÉRER
                    </button>
                `;
            }
            
            html += `</div>`;
        });
        html += '</div>';
    }
    
    html += '</div>';
    document.getElementById('section-utilisateurs').innerHTML = html;
}

window.openModalValidationOccupation = function(lockerId) {
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const locker = lockers.find(l => l.id === lockerId);
    if (!locker) return;
    
    const html = `
        <div style="max-height:80vh;overflow-y:auto;padding-right:5px;">
            <h2 style="color:#667eea;margin:0 0 15px 0;font-size:clamp(1.2em, 5vw, 1.6em);line-height:1.3;">✅ Validation remise équipements</h2>
            
            <div style="background:#fef3c7;border:3px solid #f59e0b;border-radius:10px;padding:clamp(12px, 3vw, 15px);margin-bottom:15px;">
                <div style="font-weight:800;color:#92400e;margin-bottom:6px;font-size:clamp(0.95em, 4vw, 1.05em);">⚠️ ATTENTION</div>
                <div style="color:#92400e;font-size:clamp(0.85em, 3.5vw, 0.95em);line-height:1.5;">Toutes les cases sont <strong>décochées par défaut</strong>. Vous devez cocher les 3 cases pour valider la prise en charge.</div>
            </div>
            
            <div style="background:#f9fafb;padding:clamp(12px, 3vw, 18px);border-radius:10px;margin-bottom:15px;border:3px solid #667eea;">
                <div style="font-size:clamp(1em, 4vw, 1.2em);font-weight:800;color:#1f2937;margin-bottom:8px;word-break:break-word;">${locker.prenom} ${locker.nom}</div>
                <div style="color:#64748b;margin-bottom:4px;font-size:clamp(0.85em, 3.5vw, 0.95em);">Casier <strong>${locker.id}</strong> - ${locker.platform}</div>
                <div style="color:#64748b;font-size:clamp(0.8em, 3.5vw, 0.9em);">📅 ${new Date(locker.date).toLocaleDateString('fr-FR')}</div>
            </div>
            
            <div style="background:white;padding:clamp(12px, 3vw, 18px);border-radius:10px;margin-bottom:15px;border:2px solid #e2e8f0;">
                <div style="font-weight:700;color:#1f2937;margin-bottom:12px;font-size:clamp(0.95em, 4vw, 1.05em);">Équipements à remettre :</div>
                
                <label style="display:flex;align-items:center;margin-bottom:12px;cursor:pointer;padding:clamp(10px, 2.5vw, 14px);background:#fef3c7;border-radius:8px;transition:all 0.3s;min-height:50px;" ontouchstart="this.style.background='#fed7aa'" ontouchend="this.style.background='#fef3c7'" onmouseover="this.style.background='#fed7aa'" onmouseout="this.style.background='#fef3c7'">
                    <input type="checkbox" id="check-tuyau-${lockerId}" style="width:clamp(20px, 5vw, 24px);height:clamp(20px, 5vw, 24px);min-width:20px;min-height:20px;margin-right:clamp(8px, 2vw, 12px);cursor:pointer;flex-shrink:0;">
                    <span style="color:#1f2937;font-size:clamp(0.9em, 3.8vw, 1em);font-weight:600;line-height:1.4;word-break:break-word;">🔧 Tuyau <strong style="color:#d97706;">${locker.refTuyau || 'N/A'}</strong> remis</span>
                </label>
                
                <label style="display:flex;align-items:center;margin-bottom:12px;cursor:pointer;padding:clamp(10px, 2.5vw, 14px);background:#dbeafe;border-radius:8px;transition:all 0.3s;min-height:50px;" ontouchstart="this.style.background='#bfdbfe'" ontouchend="this.style.background='#dbeafe'" onmouseover="this.style.background='#bfdbfe'" onmouseout="this.style.background='#dbeafe'">
                    <input type="checkbox" id="check-masque-${lockerId}" style="width:clamp(20px, 5vw, 24px);height:clamp(20px, 5vw, 24px);min-width:20px;min-height:20px;margin-right:clamp(8px, 2vw, 12px);cursor:pointer;flex-shrink:0;">
                    <span style="color:#1f2937;font-size:clamp(0.9em, 3.8vw, 1em);font-weight:600;line-height:1.4;word-break:break-word;">🎭 Masque <strong style="color:#2563eb;">${locker.refMasque || 'N/A'}</strong> remis</span>
                </label>
            </div>
            
            <label style="display:flex;align-items:start;margin-bottom:20px;cursor:pointer;padding:clamp(12px, 3vw, 16px);background:#fef3c7;border-radius:10px;border:3px solid #f59e0b;">
                <input type="checkbox" id="check-responsable-${lockerId}" style="width:clamp(20px, 5vw, 24px);height:clamp(20px, 5vw, 24px);min-width:20px;min-height:20px;margin-right:clamp(8px, 2vw, 12px);margin-top:2px;cursor:pointer;flex-shrink:0;">
                <div style="flex:1;">
                    <div style="color:#92400e;font-size:clamp(0.9em, 3.8vw, 1em);line-height:1.4;font-weight:700;margin-bottom:6px;">⚠️ Déclaration de responsabilité</div>
                    <div style="color:#92400e;font-size:clamp(0.8em, 3.5vw, 0.9em);line-height:1.5;word-break:break-word;">En cochant cette case, je confirme que <strong>${locker.prenom} ${locker.nom}</strong> devient responsable de ces équipements et en assume la garde.</div>
                </div>
            </label>
            
            <button onclick="validerOccupationFinale('${lockerId}')" style="width:100%;padding:clamp(14px, 3.5vw, 18px);border:none;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:white;font-size:clamp(1em, 4vw, 1.15em);font-weight:700;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(239,68,68,0.4);margin-bottom:10px;min-height:50px;touch-action:manipulation;">
                🔴 VALIDER OCCUPATION DÉFINITIVE
            </button>
            
            <button onclick="closeModal()" style="width:100%;padding:clamp(12px, 3vw, 14px);border:2px solid #e2e8f0;background:white;color:#64748b;font-size:clamp(0.95em, 3.8vw, 1em);font-weight:700;border-radius:12px;cursor:pointer;min-height:48px;touch-action:manipulation;">
                Annuler
            </button>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-assignation').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
};

window.validerOccupationFinale = function(lockerId) {
    const checkTuyau = document.getElementById(`check-tuyau-${lockerId}`);
    const checkMasque = document.getElementById(`check-masque-${lockerId}`);
    const checkResponsable = document.getElementById(`check-responsable-${lockerId}`);
    
    if (!checkTuyau || !checkMasque || !checkResponsable) {
        alert('❌ Erreur: cases à cocher introuvables');
        return;
    }
    
    if (!checkTuyau.checked) {
        alert('❌ Veuillez confirmer la remise du tuyau');
        return;
    }
    
    if (!checkMasque.checked) {
        alert('❌ Veuillez confirmer la remise du masque');
        return;
    }
    
    if (!checkResponsable.checked) {
        alert('❌ Vous devez cocher la case de responsabilité');
        return;
    }
    
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const locker = lockers.find(l => l.id === lockerId);
    if (locker) {
        locker.statut = 'OCCUPÉ';
        locker.dateOccupation = new Date().toISOString().split('T')[0];
        localStorage.setItem(STORAGE_KEYS.lockers, JSON.stringify(lockers));
        closeModal();
        renderUtilisateurs();
        alert(`✅ Casier ${lockerId} passé en OCCUPÉ\n\n${locker.prenom} ${locker.nom} est maintenant responsable des équipements.`);
    }
};

window.changerStatut = function(lockerId, nouveauStatut) {
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const locker = lockers.find(l => l.id === lockerId);
    if (locker) {
        locker.statut = nouveauStatut;
        if (nouveauStatut === 'LIBRE') {
            // Archiver ou réinitialiser
            locker.prenom = '';
            locker.nom = '';
            locker.refMasque = '';
            locker.refTuyau = '';
            locker.date = '';
            locker.dateOccupation = '';
        }
        localStorage.setItem(STORAGE_KEYS.lockers, JSON.stringify(lockers));
        renderUtilisateurs();
        alert(`✅ Casier ${lockerId} passé en ${nouveauStatut}`);
    }
};

window.filtrerUtilisateurs = function(statut) {
    if (currentUtilisateursFilter === statut) {
        // Si déjà actif, désactiver le filtre
        currentUtilisateursFilter = null;
    } else {
        currentUtilisateursFilter = statut;
    }
    renderUtilisateurs();
};

// ========== SECTION ÉQUIPEMENTS ==========
function renderEquipements() {
    const html = `
        <div style="background:white;border-radius:20px;padding:25px;box-shadow:0 10px 40px rgba(0,0,0,0.10);">
            <h2 style="color:#667eea;font-size:1.8em;font-weight:800;margin:0 0 10px 0;">📦 Gestion des Équipements</h2>
            <p style="color:#64748b;margin-bottom:25px;font-size:0.95em;">Suivi temporel & pilotage prédictif du parc matériel</p>
            
            <!-- KPI POWER BI STYLE -->
            <div id="equip-kpi" style="margin-bottom:25px;"></div>
            
            <!-- PRÉDICTION FLUX CHANGEMENT -->
            <div id="equip-prediction" style="margin-bottom:25px;"></div>
            
            <!-- NAVIGATION TYPE -->
            <div id="equip-nav" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;"></div>
            
            <!-- STATS DÉTAILLÉES -->
            <div id="equip-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;"></div>
            
            <!-- ACTIONS -->
            <div id="equip-actions" style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;"></div>
            
            <!-- LISTE -->
            <div id="equip-list"></div>
        </div>
    `;
    document.getElementById('section-equipements').innerHTML = html;
    renderEquipKPI();
    renderEquipPrediction();
    renderEquipNav();
    renderEquipStats();
    renderEquipActions();
    renderEquipList();
}

let currentEquipType = 'masques';

// KPI POWER BI - Vue d'ensemble du parc
function renderEquipKPI() {
    const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
    const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
    const moteurs = JSON.parse(localStorage.getItem(STORAGE_KEYS.moteurs)) || [];
    const batteries = JSON.parse(localStorage.getItem(STORAGE_KEYS.batteries)) || [];
    
    const tousEquipements = [
        ...masques.map(m => ({ ...m, type: 'masque' })),
        ...tuyaux.map(t => ({ ...t, type: 'tuyau' })),
        ...moteurs.map(m => ({ ...m, type: 'moteur' })),
        ...batteries.map(b => ({ ...b, type: 'batterie' }))
    ];
    
    let parEtat = { BON: 0, 'DERNIÈRE ANNÉE': 0, 'À COMMANDER': 0, URGENT: 0, 'PÉRIMÉ': 0, 'NON DATÉ': 0 };
    
    tousEquipements.forEach(eq => {
        const etat = calculerEtatEquipement(eq.dateMiseEnService, eq.type);
        parEtat[etat.label] = (parEtat[etat.label] || 0) + 1;
    });
    
    const total = tousEquipements.length;
    
    document.getElementById('equip-kpi').innerHTML = `
        <div style="background:linear-gradient(135deg,#f9fafb 0%,#f3f4f6 100%);border:3px solid #e2e8f0;border-radius:15px;padding:20px;margin-bottom:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">
                <h3 style="color:#1f2937;font-size:1.3em;font-weight:800;margin:0;display:flex;align-items:center;gap:10px;">
                    <span style="font-size:1.5em;">📊</span> KPI GLOBAL - PARC MATÉRIEL
                </h3>
                <div style="background:#667eea;color:white;padding:8px 16px;border-radius:20px;font-weight:800;font-size:1.2em;">
                    ${total} équipements
                </div>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
                <div style="background:#d1fae5;border:3px solid #10b981;padding:15px;border-radius:12px;text-align:center;">
                    <div style="font-size:2.2em;font-weight:800;color:#065f46;">${parEtat.BON}</div>
                    <div style="font-size:0.85em;color:#065f46;font-weight:700;">🟢 BON</div>
                    <div style="font-size:0.75em;color:#059669;margin-top:4px;">${total > 0 ? Math.round(parEtat.BON / total * 100) : 0}%</div>
                </div>
                
                <div style="background:#dbeafe;border:3px solid #3b82f6;padding:15px;border-radius:12px;text-align:center;">
                    <div style="font-size:2.2em;font-weight:800;color:#1e40af;">${parEtat['DERNIÈRE ANNÉE']}</div>
                    <div style="font-size:0.85em;color:#1e40af;font-weight:700;">🔵 DERNIÈRE ANNÉE</div>
                    <div style="font-size:0.75em;color:#2563eb;margin-top:4px;">${total > 0 ? Math.round(parEtat['DERNIÈRE ANNÉE'] / total * 100) : 0}%</div>
                </div>
                
                <div style="background:#fef3c7;border:3px solid #f59e0b;padding:15px;border-radius:12px;text-align:center;">
                    <div style="font-size:2.2em;font-weight:800;color:#92400e;">${parEtat['À COMMANDER']}</div>
                    <div style="font-size:0.85em;color:#92400e;font-weight:700;">🟠 À COMMANDER</div>
                    <div style="font-size:0.75em;color:#d97706;margin-top:4px;">${total > 0 ? Math.round(parEtat['À COMMANDER'] / total * 100) : 0}%</div>
                </div>
                
                <div style="background:#fee2e2;border:3px solid#dc2626;padding:15px;border-radius:12px;text-align:center;">
                    <div style="font-size:2.2em;font-weight:800;color:#991b1b;">${parEtat.URGENT}</div>
                    <div style="font-size:0.85em;color:#991b1b;font-weight:700;">🔴 URGENT</div>
                    <div style="font-size:0.75em;color:#dc2626;margin-top:4px;">${total > 0 ? Math.round(parEtat.URGENT / total * 100) : 0}%</div>
                </div>
                
                <div style="background:#e5e7eb;border:3px solid #6b7280;padding:15px;border-radius:12px;text-align:center;">
                    <div style="font-size:2.2em;font-weight:800;color:#1f2937;">${parEtat['PÉRIMÉ']}</div>
                    <div style="font-size:0.85em;color:#1f2937;font-weight:700;">⚫ PÉRIMÉ</div>
                    <div style="font-size:0.75em;color:#475569;margin-top:4px;">${total > 0 ? Math.round(parEtat['PÉRIMÉ'] / total * 100) : 0}%</div>
                </div>
                
                <div style="background:#f9fafb;border:3px solid #cbd5e1;padding:15px;border-radius:12px;text-align:center;">
                    <div style="font-size:2.2em;font-weight:800;color:#64748b;">${parEtat['NON DATÉ']}</div>
                    <div style="font-size:0.85em;color:#64748b;font-weight:700;">📅 NON DATÉ</div>
                    <div style="font-size:0.75em;color:#94a3b8;margin-top:4px;">${total > 0 ? Math.round(parEtat['NON DATÉ'] / total * 100) : 0}%</div>
                </div>
            </div>
        </div>
    `;
}

// PRÉDICTION FLUX CHANGEMENT - Éviter commande massive
function renderEquipPrediction() {
    const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
    const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
    const moteurs = JSON.parse(localStorage.getItem(STORAGE_KEYS.moteurs)) || [];
    const batteries = JSON.parse(localStorage.getItem(STORAGE_KEYS.batteries)) || [];
    
    const tousEquipements = [
        ...masques.map(m => ({ ...m, type: 'masque' })),
        ...tuyaux.map(t => ({ ...t, type: 'tuyau' })),
        ...moteurs.map(m => ({ ...m, type: 'moteur' })),
        ...batteries.map(b => ({ ...b, type: 'batterie' }))
    ];
    
    // Calculer combien d'équipements arrivent à échéance par trimestre
    const trimestres = {
        'T1 (3 mois)': 0,
        'T2 (6 mois)': 0,
        'T3 (9 mois)': 0,
        'T4 (12 mois)': 0,
        'Au-delà': 0
    };
    
    tousEquipements.forEach(eq => {
        const etat = calculerEtatEquipement(eq.dateMiseEnService, eq.type);
        if (etat.mois !== null && etat.mois >= 0) {
            if (etat.mois <= 3) trimestres['T1 (3 mois)']++;
            else if (etat.mois <= 6) trimestres['T2 (6 mois)']++;
            else if (etat.mois <= 9) trimestres['T3 (9 mois)']++;
            else if (etat.mois <= 12) trimestres['T4 (12 mois)']++;
            else trimestres['Au-delà']++;
        }
    });
    
    const maxTrimestriel = Math.max(...Object.values(trimestres));
    const seuilAlerte = tousEquipements.length * 0.25; // Alerte si >25% sur un trimestre
    
    document.getElementById('equip-prediction').innerHTML = `
        <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border:3px solid #f59e0b;border-radius:15px;padding:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">
                <h3 style="color:#92400e;font-size:1.3em;font-weight:800;margin:0;display:flex;align-items:center;gap:10px;">
                    <span style="font-size:1.5em;">📈</span> PRÉDICTION FLUX CHANGEMENT
                </h3>
                ${maxTrimestriel > seuilAlerte ? 
                    '<div style="background:#dc2626;color:white;padding:8px 16px;border-radius:20px;font-weight:800;font-size:0.95em;animation:pulse 2s infinite;">⚠️ ALERTE FLUX</div>' : 
                    '<div style="background:#10b981;color:white;padding:8px 16px;border-radius:20px;font-weight:800;font-size:0.95em;">✅ FLUX ÉQUILIBRÉ</div>'}
            </div>
            
            <div style="color:#92400e;margin-bottom:15px;font-size:0.9em;font-weight:600;">
                ${maxTrimestriel > seuilAlerte ? 
                    '⚠️ Plus de 25% des équipements arrivent à échéance sur le même trimestre. Anticiper les commandes pour étaler les changements.' :
                    '✅ Les échéances sont bien réparties sur l\'année. Pas de risque de commande massive.'}
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
                ${Object.entries(trimestres).map(([periode, nb]) => {
                    const pourcentage = tousEquipements.length > 0 ? (nb / tousEquipements.length * 100).toFixed(0) : 0;
                    const couleur = nb > seuilAlerte ? '#dc2626' : (nb > seuilAlerte * 0.5 ? '#f59e0b' : '#10b981');
                    return `
                        <div style="background:white;border:2px solid ${couleur};padding:12px;border-radius:10px;text-align:center;">
                            <div style="font-size:1.8em;font-weight:800;color:${couleur};">${nb}</div>
                            <div style="font-size:0.8em;color:#64748b;font-weight:700;margin-top:4px;">${periode}</div>
                            <div style="font-size:0.75em;color:#9ca3af;margin-top:2px;">${pourcentage}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="background:white;border-radius:10px;padding:15px;margin-top:15px;">
                <div style="font-weight:700;color:#92400e;margin-bottom:8px;font-size:0.95em;">💡 RECOMMANDATION SMART:</div>
                <div style="color:#64748b;font-size:0.85em;line-height:1.5;">
                    ${maxTrimestriel > seuilAlerte ? 
                        `Commander dès maintenant <strong>${Math.ceil(maxTrimestriel * 0.4)} équipements</strong> pour anticiper le pic du ${Object.entries(trimestres).find(([,v]) => v === maxTrimestriel)[0]}. Cela lissera les coûts et évitera une rupture de stock.` :
                        'Continuer la surveillance mensuelle. Planifier les commandes au fur et à mesure des échéances.'}
                </div>
            </div>
        </div>
        
        <style>
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        </style>
    `;
}

function renderEquipNav() {
    const types = [
        { key: 'masques', label: '🎭 Masques' },
        { key: 'tuyaux', label: '🔧 Tuyaux' },
        { key: 'moteurs', label: '⚙️ Moteurs' },
        { key: 'batteries', label: '🔋 Batteries' }
    ];

    let html = '';
    types.forEach(t => {
        const isActive = currentEquipType === t.key;
        html += `
            <button onclick="switchEquipType('${t.key}')" style="padding:14px 20px;border:none;background:${isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f9fafb'};color:${isActive ? 'white' : '#6b7280'};font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;transition:all 0.3s;${isActive ? 'box-shadow:0 5px 15px rgba(102,126,234,0.4);' : ''}">
                ${t.label}
            </button>
        `;
    });
    document.getElementById('equip-nav').innerHTML = html;
}

function renderEquipStats() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const stock = data.filter(e => e.etat === 'stock').length;
    const utilisation = data.filter(e => e.etat === 'utilisation').length;
    const commande = data.filter(e => e.etat === 'commande').length;
    const horsService = data.filter(e => e.etat === 'hors_service').length;

    document.getElementById('equip-stats').innerHTML = `
        <div style="background:linear-gradient(135deg,#f0f4ff 0%,#e0e7ff 100%);padding:20px;border-radius:12px;text-align:center;border:3px solid #667eea;">
            <div style="font-size:0.85rem;color:#667eea;font-weight:700;text-transform:uppercase;margin-bottom:8px;">📊 Total</div>
            <div style="font-size:2.5rem;font-weight:800;color:#667eea;">${data.length}</div>
        </div>
        <div style="background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);padding:20px;border-radius:12px;text-align:center;border:3px solid #10b981;">
            <div style="font-size:0.85rem;color:#065f46;font-weight:700;text-transform:uppercase;margin-bottom:8px;">📦 Stock</div>
            <div style="font-size:2.5rem;font-weight:800;color:#10b981;">${stock}</div>
        </div>
        <div style="background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);padding:20px;border-radius:12px;text-align:center;border:3px solid #3b82f6;">
            <div style="font-size:0.85rem;color:#1e40af;font-weight:700;text-transform:uppercase;margin-bottom:8px;">👤 Utilisation</div>
            <div style="font-size:2.5rem;font-weight:800;color:#3b82f6;">${utilisation}</div>
        </div>
        <div style="background:linear-gradient(135deg,#fef3c7 0%,#fed7aa 100%);padding:20px;border-radius:12px;text-align:center;border:3px solid #f59e0b;">
            <div style="font-size:0.85rem;color:#92400e;font-weight:700;text-transform:uppercase;margin-bottom:8px;">🛒 Commande</div>
            <div style="font-size:2.5rem;font-weight:800;color:#f59e0b;">${commande}</div>
        </div>
        <div style="background:linear-gradient(135deg,#fee2e2 0%,#fca5a5 100%);padding:20px;border-radius:12px;text-align:center;border:3px solid #ef4444;">
            <div style="font-size:0.85rem;color:#991b1b;font-weight:700;text-transform:uppercase;margin-bottom:8px;">🔧 Hors Service</div>
            <div style="font-size:2.5rem;font-weight:800;color:#ef4444;">${horsService}</div>
        </div>
    `;
}

function renderEquipActions() {
    document.getElementById('equip-actions').innerHTML = `
        <button onclick="addEquipement()" style="padding:12px 24px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 15px rgba(16,185,129,0.3);">
            ➕ Ajouter
        </button>
        <button onclick="exportEquipExcel()" style="padding:12px 24px;border:none;background:#f3f4f6;color:#374151;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;transition:all 0.3s;">
            📊 Export Excel
        </button>
        <button onclick="exportEquipPDF()" style="padding:12px 24px;border:none;background:#f3f4f6;color:#374151;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;transition:all 0.3s;">
            📄 Export PDF
        </button>
    `;
}

// Fonction pour générer un badge de statut avec couleurs distinctes
function getStatutBadge(statut) {
    const statutStyles = {
        'DISPONIBLE': { 
            bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
            color: '#065f46', 
            border: '#10b981',
            icon: '✅'
        },
        'EN SERVICE': { 
            bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
            color: '#1e40af', 
            border: '#3b82f6',
            icon: '🔵'
        },
        'MAINTENANCE': { 
            bg: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)', 
            color: '#92400e', 
            border: '#f97316',
            icon: '🔧'
        },
        'RÉFORMÉ': { 
            bg: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)', 
            color: '#991b1b', 
            border: '#ef4444',
            icon: '❌'
        }
    };
    
    const style = statutStyles[statut] || statutStyles['DISPONIBLE'];
    
    return `<div style="display:inline-block;padding:8px 16px;border-radius:8px;background:${style.bg};color:${style.color};font-weight:800;font-size:0.9em;border:3px solid ${style.border};text-transform:uppercase;">${style.icon} ${statut}</div>`;
}

function renderEquipList() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    
    if (data.length === 0) {
        document.getElementById('equip-list').innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px;">Aucun équipement enregistré</p>';
        return;
    }
    
    // Trier par état (périmé -> urgent -> à commander -> bon)
    const dataTriee = [...data].sort((a, b) => {
        const etatA = calculerEtatEquipement(a.dateMiseEnService, currentEquipType.slice(0, -1));
        const etatB = calculerEtatEquipement(b.dateMiseEnService, currentEquipType.slice(0, -1));
        const ordre = { 'PÉRIMÉ': 0, 'URGENT': 1, 'À COMMANDER': 2, 'DERNIÈRE ANNÉE': 3, 'BON': 4, 'NON DATÉ': 5 };
        return (ordre[etatA.label] || 99) - (ordre[etatB.label] || 99);
    });

    let html = '<div style="display:grid;gap:15px;">';
    dataTriee.forEach((item, index) => {
        const typeEquip = currentEquipType.slice(0, -1); // masques -> masque
        const etat = calculerEtatEquipement(item.dateMiseEnService, typeEquip);
        
        // Badge d'état selon etat (stock/utilisation/commande/hors_service)
        const etats = {
            'stock': { label: '📦 EN STOCK', couleur: '#10b981', bg: '#d1fae5' },
            'utilisation': { label: '👤 EN UTILISATION', couleur: '#3b82f6', bg: '#dbeafe' },
            'commande': { label: '🛒 EN COMMANDE', couleur: '#f59e0b', bg: '#fef3c7' },
            'hors_service': { label: '🔧 HORS SERVICE', couleur: '#ef4444', bg: '#fee2e2' }
        };
        const etatItem = etats[item.etat] || { label: '❓ INCONNU', couleur: '#64748b', bg: '#f1f5f9' };
        
        html += `
            <div style="background:${etat.bg};padding:20px;border-radius:12px;border-left:6px solid ${etat.couleur};transition:all 0.3s;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:15px;flex-wrap:wrap;gap:10px;">
                    <div style="flex:1;">
                        <div style="font-size:1.3em;font-weight:800;color:#1f2937;margin-bottom:5px;">${item.reference || '?'}</div>
                        <div style="font-size:0.9em;color:#64748b;margin-bottom:8px;">${item.modele || 'N/A'}</div>
                        <div style="display:inline-block;padding:6px 12px;border-radius:15px;font-size:0.8em;font-weight:700;background:${etatItem.bg};color:${etatItem.couleur};border:2px solid ${etatItem.couleur};">
                            ${etatItem.label}
                        </div>
                    </div>
                    <div>
                        <div style="padding:8px 14px;border-radius:20px;font-size:0.85em;font-weight:700;text-transform:uppercase;background:${etat.couleur};color:white;text-align:center;margin-bottom:6px;">
                            ${etat.label}
                        </div>
                        ${etat.mois !== null ? `<div style="text-align:center;font-size:0.8em;font-weight:700;color:${etat.couleur};">${etat.mois > 0 ? etat.mois + 'm restants' : 'EXPIRÉ'}</div>` : ''}
                    </div>
                </div>
                
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:15px;padding:15px;background:white;border-radius:10px;">
                    <div>
                        <strong style="color:#6b7280;font-size:0.75em;text-transform:uppercase;">📅 Mise en service:</strong><br>
                        <span style="color:#1f2937;font-weight:700;">${item.dateMiseEnService ? new Date(item.dateMiseEnService).toLocaleDateString('fr-FR') : '❌ Non renseignée'}</span>
                    </div>
                    ${item.assigneA ? `<div><strong style="color:#6b7280;font-size:0.75em;text-transform:uppercase;">👤 Assigné à:</strong><br><span style="color:#1f2937;font-weight:700;">${item.assigneA}</span></div>` : ''}
                    ${item.plateforme ? `<div><strong style="color:#6b7280;font-size:0.75em;text-transform:uppercase;">🏭 Plateforme:</strong><br><span style="color:#1f2937;font-weight:700;">${item.plateforme}</span></div>` : ''}
                </div>
                
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button data-index="${index}" onclick="event.stopPropagation();changerEtatEquipementByIndex(parseInt(this.getAttribute('data-index')))" style="padding:10px 18px;font-size:0.9em;border-radius:8px;border:none;background:#8b5cf6;color:white;font-weight:700;cursor:pointer;">🔄 Changer état</button>
                    <button data-index="${index}" onclick="event.stopPropagation();modifierEquipementByIndex(parseInt(this.getAttribute('data-index')))" style="padding:10px 18px;font-size:0.9em;border-radius:8px;border:none;background:#3b82f6;color:white;font-weight:700;cursor:pointer;">✏️ Modifier</button>
                    <button data-index="${index}" onclick="event.stopPropagation();supprimerEquipementByIndex(parseInt(this.getAttribute('data-index')))" style="padding:10px 18px;font-size:0.9em;border-radius:8px;border:none;background:#ef4444;color:white;font-weight:700;cursor:pointer;">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    document.getElementById('equip-list').innerHTML = html;
}

// ========== ACTIONS ÉQUIPEMENTS ==========
window.switchEquipType = function(type) {
    currentEquipType = type;
    renderEquipNav();
    renderEquipStats();
    renderEquipList();
};

window.addEquipement = function() {
    const html = `
        <div style="max-height:85vh;overflow-y:auto;">
            <h2 style="color:#667eea;margin:0 0 20px 0;font-size:1.6em;">➕ Ajouter un équipement</h2>
            
            <div style="background:#f9fafb;padding:15px;border-radius:10px;margin-bottom:20px;border:3px solid #667eea;">
                <div style="font-weight:700;color:#1f2937;margin-bottom:5px;">Type sélectionné:</div>
                <div style="font-size:1.2em;color:#667eea;font-weight:800;">${currentEquipType.toUpperCase()}</div>
            </div>
            
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📝 Référence:</label>
            <input type="text" id="new-ref" placeholder="Ex: MSQ-006" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">🏷️ Modèle:</label>
            <input type="text" id="new-modele" placeholder="Ex: 3M 6800" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            
            <div style="background:#fef3c7;border:3px solid #f59e0b;border-radius:10px;padding:15px;margin-bottom:15px;">
                <div style="font-weight:800;color:#92400e;margin-bottom:10px;font-size:1.05em;">📅 CHOIX MODE ADMINISTRATEUR</div>
                <div style="color:#92400e;font-size:0.9em;margin-bottom:12px;">Vous pouvez indiquer soit la <strong>date de mise en service</strong>, soit directement la <strong>date de péremption</strong>.</div>
                
                <label style="display:flex;align-items:center;margin-bottom:10px;cursor:pointer;">
                    <input type="radio" name="dateMode" value="mes" checked style="margin-right:10px;width:20px;height:20px;">
                    <span style="font-weight:700;color:#92400e;">Date de mise en service (le système calcule la péremption)</span>
                </label>
                
                <label style="display:flex;align-items:center;cursor:pointer;">
                    <input type="radio" name="dateMode" value="peremption" style="margin-right:10px;width:20px;height:20px;">
                    <span style="font-weight:700;color:#92400e;">Date de péremption (si vous la connaissez déjà)</span>
                </label>
            </div>
            
            <div id="date-mes-input">
                <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📅 Date de mise en service:</label>
                <input type="date" id="new-date-mes" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            </div>
            
            <div id="date-peremption-input" style="display:none;">
                <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">⏳ Date de péremption:</label>
                <input type="date" id="new-date-peremption" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                <div style="font-size:0.85em;color:#64748b;margin-top:-10px;margin-bottom:15px;">Le système rétro-calculera la date de mise en service</div>
            </div>
            
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📦 Statut initial:</label>
            <select id="new-statut" style="width:100%;padding:12px;margin-bottom:20px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                <option value="DISPONIBLE">✅ DISPONIBLE (en stock)</option>
                <option value="EN SERVICE">🔵 EN SERVICE (en utilisation)</option>
                <option value="MAINTENANCE">🔧 MAINTENANCE (réparation)</option>
                <option value="RÉFORMÉ">❌ RÉFORMÉ (hors d'usage)</option>
            </select>
            
            <button onclick="validerAjoutEquipement()" style="width:100%;padding:15px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;margin-bottom:10px;">
                ✅ AJOUTER
            </button>
            
            <button onclick="closeModal()" style="width:100%;padding:12px;border:2px solid #e2e8f0;background:white;color:#64748b;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;">
                Annuler
            </button>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-assignation').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    
    // Gestion changement mode date
    document.querySelectorAll('input[name="dateMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'mes') {
                document.getElementById('date-mes-input').style.display = 'block';
                document.getElementById('date-peremption-input').style.display = 'none';
            } else {
                document.getElementById('date-mes-input').style.display = 'none';
                document.getElementById('date-peremption-input').style.display = 'block';
            }
        });
    });
};

window.validerAjoutEquipement = function() {
    const ref = document.getElementById('new-ref').value.trim();
    const modele = document.getElementById('new-modele').value.trim();
    const statut = document.getElementById('new-statut').value;
    const dateMode = document.querySelector('input[name="dateMode"]:checked').value;
    
    if (!ref) {
        alert('❌ Veuillez renseigner une référence');
        return;
    }
    
    let dateMES;
    if (dateMode === 'mes') {
        dateMES = document.getElementById('new-date-mes').value;
    } else {
        // Rétro-calcul: si on donne la péremption, on calcule la MES
        const datePeremption = document.getElementById('new-date-peremption').value;
        if (!datePeremption) {
            alert('❌ Veuillez renseigner la date de péremption');
            return;
        }
        const dureeMax = { masques: 36, tuyaux: 36, moteurs: 60, batteries: 60 }[currentEquipType] || 36;
        const datePerem = new Date(datePeremption);
        datePerem.setMonth(datePerem.getMonth() - dureeMax);
        dateMES = datePerem.toISOString().split('T')[0];
    }
    
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    data.push({
        id: Date.now(),
        reference: ref,
        modele: modele || 'N/A',
        dateMiseEnService: dateMES,
        statut: statut,
        etat: 'stock', // Par défaut en stock
        assigneA: null,
        plateforme: null,
        dateAjout: new Date().toISOString().split('T')[0],
        historique: [{
            date: new Date().toISOString(),
            action: 'Ajout',
            statut: statut,
            etat: 'stock'
        }]
    });
    
    localStorage.setItem(STORAGE_KEYS[currentEquipType], JSON.stringify(data));
    closeModal();
    renderEquipements();
    alert(`✅ Équipement ${ref} ajouté avec succès !\n📅 Date MES: ${new Date(dateMES).toLocaleDateString('fr-FR')}`);
};

window.mettreEnService = function(id) {
    const utilisateur = prompt('Nom de l\'utilisateur:');
    if (!utilisateur) return;
    
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const item = data.find(e => e.id === id);
    if (item) {
        item.statut = 'utilisation';
        item.utilisateur = utilisateur;
        item.dateMiseEnService = new Date().toISOString().split('T')[0];
        item.historique.push({
            date: new Date().toISOString(),
            action: 'Mise en service',
            statut: 'utilisation',
            utilisateur: utilisateur
        });
        localStorage.setItem(STORAGE_KEYS[currentEquipType], JSON.stringify(data));
        renderEquipStats();
        renderEquipList();
        alert('✅ Équipement mis en service !');
    }
};

window.mettreEnMaintenance = function(id) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const item = data.find(e => e.id === id);
    if (item) {
        item.statut = 'stock';
        item.utilisateur = null;
        item.dateControle = new Date().toISOString().split('T')[0];
        item.historique.push({
            date: new Date().toISOString(),
            action: 'Maintenance',
            statut: 'stock',
            remarques: 'Remis en stock pour maintenance'
        });
        localStorage.setItem(STORAGE_KEYS[currentEquipType], JSON.stringify(data));
        renderEquipStats();
        renderEquipList();
        alert('✅ Équipement mis en maintenance !');
    }
};

window.voirHistorique = function(id) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const item = data.find(e => e.id === id);
    if (item && item.historique) {
        let msg = `📜 Historique de ${item.reference}\n\n`;
        item.historique.forEach(h => {
            msg += `• ${new Date(h.date).toLocaleDateString('fr-FR')} - ${h.action}\n`;
            if (h.utilisateur) msg += `  Utilisateur: ${h.utilisateur}\n`;
            if (h.remarques) msg += `  ${h.remarques}\n`;
            msg += '\n';
        });
        alert(msg);
    }
};

window.changerEtatEquipement = function(reference) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const item = data.find(e => e.reference === reference);
    if (!item) return;
    
    const estEnUtilisation = item.etat === 'utilisation';
    const estAssigne = item.assigneA !== null && item.assigneA !== undefined;
    
    const html = `
        <h2 style="color:#667eea;margin:0 0 20px 0;font-size:1.6em;">🔄 Changer l'état - ${reference}</h2>
        
        <div style="background:#f9fafb;padding:15px;border-radius:10px;margin-bottom:20px;">
            <div style="margin-bottom:8px;"><strong>État actuel:</strong> <span style="color:#667eea;font-weight:700;">${item.etat || 'stock'}</span></div>
            ${item.assigneA ? `<div style="margin-bottom:8px;"><strong>Assigné à:</strong> ${item.assigneA}</div>` : ''}
            ${item.plateforme ? `<div><strong>Plateforme:</strong> ${item.plateforme}</div>` : ''}
        </div>
        
        ${estAssigne ? `
            <div style="background:#fee2e2;border:2px solid #ef4444;padding:12px;border-radius:8px;margin-bottom:15px;font-size:0.9em;color:#991b1b;">
                ⚠️ <strong>ATTENTION:</strong> Cet équipement est assigné à un utilisateur. Si vous changez son état, il sera automatiquement libéré de l'assignation.
            </div>
        ` : ''}
        
        <label style="display:block;margin-bottom:10px;font-weight:700;color:#1f2937;">Nouvel état:</label>
        <select id="nouvel-etat" style="width:100%;padding:12px;margin-bottom:20px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            <option value="stock" ${item.etat === 'stock' ? 'selected' : ''}>📦 EN STOCK (disponible)</option>
            <option value="utilisation" ${item.etat === 'utilisation' ? 'selected' : ''}>👤 EN UTILISATION (assigné à un utilisateur)</option>
            <option value="commande" ${item.etat === 'commande' ? 'selected' : ''}>🛒 EN COMMANDE (à commander/réceptionner)</option>
            <option value="hors_service" ${item.etat === 'hors_service' ? 'selected' : ''}>🔧 HORS SERVICE (défectueux/maintenance)</option>
        </select>
        
        <div style="background:#fef3c7;padding:12px;border-radius:8px;margin-bottom:20px;font-size:0.9em;color:#92400e;">
            ℹ️ <strong>Note:</strong> L'état "EN UTILISATION" est normalement géré automatiquement lors de l'assignation d'un casier.
        </div>
        
        <button onclick="validerChangementEtat('${reference}')" style="width:100%;padding:15px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;margin-bottom:10px;">
            ✅ Valider le changement
        </button>
        <button onclick="closeModal()" style="width:100%;padding:12px;border:2px solid #e2e8f0;background:white;color:#64748b;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;">Annuler</button>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-assignation').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
};

window.validerChangementEtat = function(reference) {
    const nouvelEtat = document.getElementById('nouvel-etat').value;
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const item = data.find(e => e.reference === reference);
    
    if (!item) return;
    
    const ancienEtat = item.etat;
    const etaitAssigne = item.assigneA !== null;
    
    // Avertissement si changement d'état d'un équipement assigné
    if (etaitAssigne && nouvelEtat !== 'utilisation') {
        if (!confirm(`⚠️ Cet équipement est assigné à ${item.assigneA}.\n\nEn changeant l'état vers "${nouvelEtat}", l'équipement sera libéré de l'assignation.\n\nContinuer ?`)) {
            return;
        }
    }
    
    item.etat = nouvelEtat;
    
    // Si changement vers stock, commande ou hors_service, nettoyer les infos d'assignation
    if (nouvelEtat !== 'utilisation') {
        item.assigneA = null;
        item.plateforme = null;
    }
    
    localStorage.setItem(STORAGE_KEYS[currentEquipType], JSON.stringify(data));
    closeModal();
    renderEquipStats();
    renderEquipList();
    
    let message = `✅ ${reference} : ${ancienEtat} → ${nouvelEtat}`;
    if (etaitAssigne && nouvelEtat !== 'utilisation') {
        message += '\n\n🔓 Équipement libéré de l\'assignation';
    }
    alert(message);
};

window.modifierEquipement = function(reference) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const item = data.find(e => e.reference === reference);
    if (!item) return;
    
    const etat = calculerEtatEquipement(item.dateMiseEnService, currentEquipType.slice(0, -1));
    
    const html = `
        <div style="max-height:85vh;overflow-y:auto;">
            <h2 style="color:#667eea;margin:0 0 20px 0;font-size:1.6em;">✏️ Modifier - ${reference}</h2>
            
            <div style="background:#f9fafb;padding:15px;border-radius:10px;margin-bottom:20px;border:2px solid #e2e8f0;">
                <div style="margin-bottom:8px;"><strong>Référence:</strong> ${item.reference}</div>
                <div style="margin-bottom:8px;"><strong>Modèle:</strong> ${item.modele || 'N/A'}</div>
                <div style="margin-bottom:8px;"><strong>État actuel:</strong> <span style="color:#667eea;font-weight:700;">${item.etat || 'stock'}</span></div>
                ${item.assigneA ? `<div style="margin-bottom:8px;"><strong>Assigné à:</strong> ${item.assigneA}</div>` : ''}
                ${item.plateforme ? `<div><strong>Plateforme:</strong> ${item.plateforme}</div>` : ''}
            </div>
            
            <div style="background:${etat.bg};border:3px solid ${etat.couleur};border-radius:10px;padding:15px;margin-bottom:20px;">
                <div style="font-weight:800;color:${etat.couleur};margin-bottom:5px;font-size:1.05em;">⏱️ État durée de vie</div>
                <div style="color:${etat.couleur};font-size:0.95em;">${etat.label} ${etat.mois !== null ? `(${etat.mois} mois ${etat.mois > 0 ? 'restants' : 'dépassés'})` : ''}</div>
            </div>
            
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📅 Date de mise en service:</label>
            <input type="date" id="edit-date-mes" value="${item.dateMiseEnService || ''}" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;"> Commentaire (optionnel):</label>
            <textarea id="edit-commentaire" placeholder="Ex: Remis en stock après utilisation par Mickael..." style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;min-height:80px;resize:vertical;font-family:inherit;"></textarea>
            
            <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:10px;padding:12px;margin-bottom:20px;">
                <label style="display:flex;align-items:center;cursor:pointer;">
                    <input type="checkbox" id="remettre-stock" style="margin-right:10px;width:20px;height:20px;">
                    <span style="font-weight:700;color:#92400e;">🔄 Remettre en stock (libérer l'assignation)</span>
                </label>
                <div style="font-size:0.85em;color:#92400e;margin-top:8px;margin-left:30px;">Si coché, l'équipement sera disponible pour une nouvelle assignation</div>
            </div>
            
            <button onclick="validerModificationEquipement('${reference}')" style="width:100%;padding:15px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;margin-bottom:10px;">
                ✅ Enregistrer les modifications
            </button>
            <button onclick="closeModal()" style="width:100%;padding:12px;border:2px solid #e2e8f0;background:white;color:#64748b;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;">Annuler</button>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-assignation').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
};

window.validerModificationEquipement = function(reference) {
    const nouvelleDateMES = document.getElementById('edit-date-mes').value;
    const commentaire = document.getElementById('edit-commentaire').value.trim();
    const remettreStock = document.getElementById('remettre-stock').checked;
    
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const item = data.find(e => e.reference === reference);
    
    if (!item) return;
    
    // Enregistrer les modifications
    const ancienneDateMES = item.dateMiseEnService;
    const ancienEtat = item.etat;
    
    item.dateMiseEnService = nouvelleDateMES;
    
    // Si remise en stock cochée
    if (remettreStock) {
        item.etat = 'stock';
        item.assigneA = null;
        item.plateforme = null;
    }
    
    // Ajouter à l'historique
    if (!item.historique) item.historique = [];
    item.historique.push({
        date: new Date().toISOString(),
        action: 'Modification',
        ancienneDateMES: ancienneDateMES,
        nouvelleDateMES: nouvelleDateMES,
        ancienEtat: ancienEtat,
        nouvelEtat: item.etat,
        remisEnStock: remettreStock,
        commentaire: commentaire || null
    });
    
    localStorage.setItem(STORAGE_KEYS[currentEquipType], JSON.stringify(data));
    closeModal();
    renderEquipStats();
    renderEquipList();
    
    let message = `✅ ${reference} modifié avec succès !\n\n`;
    if (ancienneDateMES !== nouvelleDateMES) message += `📅 Date MES: ${new Date(ancienneDateMES || '').toLocaleDateString('fr-FR') || 'N/A'} → ${new Date(nouvelleDateMES).toLocaleDateString('fr-FR')}\n`;
    if (remettreStock) message += `🔄 Remis en stock\n`;
    if (commentaire) message += `💬 Commentaire: ${commentaire}`;
    
    alert(message);
};

// Nouvelles fonctions utilisant l'index au lieu de la référence
window.changerEtatEquipementByIndex = function(index) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const dataTriee = [...data].sort((a, b) => {
        const etatA = calculerEtatEquipement(a.dateMiseEnService, currentEquipType.slice(0, -1));
        const etatB = calculerEtatEquipement(b.dateMiseEnService, currentEquipType.slice(0, -1));
        const ordre = { 'PÉRIMÉ': 0, 'URGENT': 1, 'À COMMANDER': 2, 'DERNIÈRE ANNÉE': 3, 'BON': 4, 'NON DATÉ': 5 };
        return (ordre[etatA.label] || 99) - (ordre[etatB.label] || 99);
    });
    if (dataTriee[index]) changerEtatEquipement(dataTriee[index].reference);
};

window.modifierEquipementByIndex = function(index) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const dataTriee = [...data].sort((a, b) => {
        const etatA = calculerEtatEquipement(a.dateMiseEnService, currentEquipType.slice(0, -1));
        const etatB = calculerEtatEquipement(b.dateMiseEnService, currentEquipType.slice(0, -1));
        const ordre = { 'PÉRIMÉ': 0, 'URGENT': 1, 'À COMMANDER': 2, 'DERNIÈRE ANNÉE': 3, 'BON': 4, 'NON DATÉ': 5 };
        return (ordre[etatA.label] || 99) - (ordre[etatB.label] || 99);
    });
    if (dataTriee[index]) modifierEquipement(dataTriee[index].reference);
};

window.supprimerEquipementByIndex = function(index) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const dataTriee = [...data].sort((a, b) => {
        const etatA = calculerEtatEquipement(a.dateMiseEnService, currentEquipType.slice(0, -1));
        const etatB = calculerEtatEquipement(b.dateMiseEnService, currentEquipType.slice(0, -1));
        const ordre = { 'PÉRIMÉ': 0, 'URGENT': 1, 'À COMMANDER': 2, 'DERNIÈRE ANNÉE': 3, 'BON': 4, 'NON DATÉ': 5 };
        return (ordre[etatA.label] || 99) - (ordre[etatB.label] || 99);
    });
    if (dataTriee[index]) supprimerEquipement(dataTriee[index].reference);
};

window.supprimerEquipement = function(reference) {
    if (!confirm('⚠️ Supprimer cet équipement ?')) return;
    
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const filtered = data.filter(e => e.reference !== reference);
    
    if (data.length === filtered.length) {
        alert('❌ Erreur : équipement non trouvé !');
        return;
    }
    
    localStorage.setItem(STORAGE_KEYS[currentEquipType], JSON.stringify(filtered));
    renderEquipStats();
    renderEquipList();
    alert('✅ Équipement supprimé !');
};

window.exportEquipExcel = function() {
    alert('📊 Export Excel en cours de développement...\n\nUtilisez la bibliothèque XLSX pour générer un fichier Excel avec les données.');
};

window.exportEquipPDF = function() {
    alert('📄 Export PDF en cours de développement...\n\nUtilisez jsPDF pour générer un rapport PDF des équipements.');
};

// ========== SYNCHRONISATION TEMPS RÉEL ==========
window.addEventListener('storage', () => {
    if (currentSection === 'casiers') renderCasiers();
    if (currentSection === 'equipements') {
        renderEquipStats();
        renderEquipList();
    }
    if (currentSection === 'utilisateurs') renderUtilisateurs();
});

console.log('✅ PPVE Digit 2.0 chargé avec succès !');
