// ============================================
// GESTION MASQUES VENTILÉS DIGIT 2.0
// Dashboard VitrineMasque + Gestion Équipements Pika
// ============================================

// ========== GESTION D'ERREURS GLOBALE ==========
window.onerror = function(msg, url, line, col, error) {
    console.error('🔴 Erreur globale:', {
        message: msg,
        url: url,
        line: line,
        column: col,
        error: error
    });
    
    afficherToast('Une erreur inattendue s\'est produite. Veuillez réessayer.', 'error');
    return true; // Empêche affichage natif
};

// Promise rejection non gérée
window.addEventListener('unhandledrejection', function(event) {
    console.error('🔴 Promise rejection non gérée:', event.reason);
    afficherToast('Erreur de chargement. Veuillez rafraîchir la page.', 'error');
});

// ========== FONCTION TOAST NOTIFICATION ==========
function afficherToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInToast 0.3s ease;
        font-weight: 700;
        max-width: 350px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutToast 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Ajouter animations CSS
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideInToast {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutToast {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        @media (max-width: 767px) {
            .toast {
                right: 10px !important;
                left: 10px !important;
                max-width: calc(100% - 20px) !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// ========== DONNÉES LOCALES ==========
const STORAGE_KEYS = {
    lockers: 'ppve_lockers',
    masques: 'ppve_masques',
    tuyaux: 'ppve_tuyaux',
    moteurs: 'ppve_moteurs',
    batteries: 'ppve_batteries',
    prixAccessoires: 'ppve_prix_accessoires'
};

let currentPlatformFilter = 'tous';
let currentSearchTerm = '';
let currentTriCasiers = 'defaut';
let currentStatutFilter = null; // Filtre par statut (LIBRE, EN ATTENTE, OCCUPÉ, INACTIF)
let currentUtilisateursFilter = null; // Filtre utilisateurs (EN ATTENTE, OCCUPÉ, INACTIF)

let currentSection = 'casiers';

// ========== CALCUL DURÉE DE VIE ÉQUIPEMENTS ==========
function calculerEtatEquipement(dateMiseEnService, typeEquipement) {
    if (!dateMiseEnService) return null; // Ignorer les équipements sans date
    
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
    console.log('🚀 Gestion Masques Ventilés Digit 2.0 - Chargement...');
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
            if (!etat) return; // Ignorer si pas de date
            const badge = ` [${etat.label} - ${etat.mois}m]`;
            html += `<option value="${m.reference}">${m.reference} - ${m.modele || 'N/A'}${badge}</option>`;
        });
        
        html += `</select>
            
            <select id="input-tuyau" style="width:100%;padding:12px;margin-bottom:20px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                <option value="">-- Ref Tuyau --</option>`;
        
        // Afficher uniquement tuyaux en stock
        tuyaux.filter(t => t.etat === 'stock').forEach(t => {
            const etat = calculerEtatEquipement(t.dateMiseEnService, 'tuyau');
            if (!etat) return; // Ignorer si pas de date
            const badge = ` [${etat.label} - ${etat.mois}m]`;
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
            <div style="background:#fef3c7;border:2px solid #f59e0b;padding:15px;border-radius:10px;margin-bottom:15px;">
                <div style="font-weight:700;color:#92400e;margin-bottom:8px;">👤 ${locker.prenom} ${locker.nom}</div>
                <div style="color:#78350f;font-size:0.9em;">😷 Masque: ${locker.refMasque || 'N/A'}</div>
                <div style="color:#78350f;font-size:0.9em;">🔧 Tuyau: ${locker.refTuyau || 'N/A'}</div>
            </div>
            <button onclick="annulerAssignation('${lockerId}')" style="width:100%;padding:14px;border:none;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:white;font-size:1em;font-weight:700;border-radius:10px;cursor:pointer;margin-bottom:8px;">
                🚫 Annuler l'Assignation
            </button>
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

// Annuler une assignation (EN ATTENTE → LIBRE)
window.annulerAssignation = function(lockerId) {
    const confirmation = prompt('⚠️ ANNULATION D\'ASSIGNATION\n\nCette action va :\n• Remettre le casier en LIBRE\n• Libérer les équipements\n• Effacer les informations utilisateur\n\nTapez "VALIDER" pour confirmer :');
    
    if (confirmation !== 'VALIDER') {
        if (confirmation !== null) {
            afficherToast('❌ Annulation refusée - Vous devez taper "VALIDER"', 'error');
        }
        return;
    }
    
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const locker = lockers.find(l => l.id === lockerId);
    
    if (!locker || locker.statut !== 'EN ATTENTE') {
        afficherToast('❌ Impossible d\'annuler - Casier non en attente', 'error');
        return;
    }
    
    // Libérer les équipements
    const refMasque = locker.refMasque;
    const refTuyau = locker.refTuyau;
    
    if (refMasque) {
        const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
        const masque = masques.find(m => m.reference === refMasque);
        if (masque) {
            masque.etat = 'stock';
            masque.assigneA = null;
            masque.plateforme = null;
            localStorage.setItem(STORAGE_KEYS.masques, JSON.stringify(masques));
        }
    }
    
    if (refTuyau) {
        const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
        const tuyau = tuyaux.find(t => t.reference === refTuyau);
        if (tuyau) {
            tuyau.etat = 'stock';
            tuyau.assigneA = null;
            tuyau.plateforme = null;
            localStorage.setItem(STORAGE_KEYS.tuyaux, JSON.stringify(tuyaux));
        }
    }
    
    // Remettre le casier en LIBRE
    locker.statut = 'LIBRE';
    locker.prenom = '';
    locker.nom = '';
    locker.refMasque = '';
    locker.refTuyau = '';
    locker.date = '';
    locker.dateOccupation = '';
    
    localStorage.setItem(STORAGE_KEYS.lockers, JSON.stringify(lockers));
    closeModal();
    renderUtilisateurs();
    
    afficherToast(`✅ Assignation annulée - Casier ${lockerId} remis en LIBRE`, 'success');
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
        
        // 📱 ÉCRITURE TAG NFC OBLIGATOIRE (sauf en mode admin)
        if (!isAdminAuthenticated()) {
            alert(`✅ Casier ${lockerId} passé en OCCUPÉ\n\n${locker.prenom} ${locker.nom} est maintenant responsable des équipements.\n\n⚠️ ÉTAPE OBLIGATOIRE : Vous devez maintenant programmer le TAG NFC.`);
            
            // Forcer l'écriture du tag
            ecrireTagOccupation(locker);
        } else {
            alert(`✅ Casier ${lockerId} passé en OCCUPÉ\n\n${locker.prenom} ${locker.nom} est maintenant responsable des équipements.\n\n🔓 MODE ADMIN : Étape NFC bypassée.`);
        }
    }
};

window.changerStatut = function(lockerId, nouveauStatut) {
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const locker = lockers.find(l => l.id === lockerId);
    if (locker) {
        const ancienStatut = locker.statut;
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
        
        // 📱 ÉCRITURE TAG NFC OBLIGATOIRE quand on passe EN ATTENTE → OCCUPÉ (sauf en mode admin)
        if (ancienStatut === 'EN ATTENTE' && nouveauStatut === 'OCCUPÉ') {
            if (!isAdminAuthenticated()) {
                alert(`✅ Casier ${lockerId} passé en ${nouveauStatut}\n\n⚠️ ÉTAPE OBLIGATOIRE : Vous devez maintenant programmer le TAG NFC avec les informations de ${locker.prenom} ${locker.nom}.`);
                
                // Forcer l'écriture du tag
                ecrireTagOccupation(locker);
            } else {
                alert(`✅ Casier ${lockerId} passé en ${nouveauStatut}\n\n🔓 MODE ADMIN : Étape NFC bypassée.`);
            }
        }
        // 📱 EFFACEMENT TAG NFC OBLIGATOIRE quand on passe INACTIF/OCCUPÉ → LIBRE/ACTIF (sauf en mode admin)
        else if ((ancienStatut === 'INACTIF' || ancienStatut === 'OCCUPÉ') && 
            (nouveauStatut === 'LIBRE' || nouveauStatut === 'ACTIF')) {
            
            if (!isAdminAuthenticated()) {
                alert(`✅ Casier ${lockerId} passé en ${nouveauStatut}\n\n⚠️ ÉTAPE OBLIGATOIRE : Vous devez maintenant effacer le TAG NFC pour le remettre à zéro.`);
                
                // Forcer l'effacement du tag
                effacerTagNFC(lockerId);
            } else {
                alert(`✅ Casier ${lockerId} passé en ${nouveauStatut}\n\n🔓 MODE ADMIN : Étape NFC bypassée.`);
            }
        } else {
            alert(`✅ Casier ${lockerId} passé en ${nouveauStatut}`);
        }
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
    
    let parEtat = { BON: 0, 'DERNIÈRE ANNÉE': 0, 'À COMMANDER': 0, URGENT: 0, 'PÉRIMÉ': 0 };
    
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
            </div>
        </div>
    `;
}

// PRÉDICTION FLUX CHANGEMENT - Par type d'équipement
function renderEquipPrediction() {
    const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
    const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
    const moteurs = JSON.parse(localStorage.getItem(STORAGE_KEYS.moteurs)) || [];
    const batteries = JSON.parse(localStorage.getItem(STORAGE_KEYS.batteries)) || [];
    
    const typesEquipements = {
        'masques': { data: masques, icon: '🎭', label: 'Masques', color: '#3b82f6' },
        'tuyaux': { data: tuyaux, icon: '🔧', label: 'Tuyaux', color: '#10b981' },
        'moteurs': { data: moteurs, icon: '⚙️', label: 'Moteurs', color: '#f59e0b' },
        'batteries': { data: batteries, icon: '🔋', label: 'Batteries', color: '#ef4444' }
    };
    
    // Calculer les prédictions PAR TYPE
    const predictions = {};
    let alerteGlobale = false;
    
    Object.entries(typesEquipements).forEach(([key, info]) => {
        const equipements = info.data.map(e => ({ ...e, type: key.slice(0, -1) }));
        
        const trimestres = {
            'T1': 0, 'T2': 0, 'T3': 0, 'T4': 0, 'Au-delà': 0
        };
        
        const detailsT1 = [];
        
        equipements.forEach(eq => {
            const etat = calculerEtatEquipement(eq.dateMiseEnService, eq.type);
            if (etat.mois !== null && etat.mois >= 0) {
                if (etat.mois <= 3) {
                    trimestres['T1']++;
                    detailsT1.push({ ...eq, moisRestants: etat.mois, etat });
                }
                else if (etat.mois <= 6) trimestres['T2']++;
                else if (etat.mois <= 9) trimestres['T3']++;
                else if (etat.mois <= 12) trimestres['T4']++;
                else trimestres['Au-delà']++;
            }
        });
        
        const seuilAlerte = equipements.length * 0.25;
        const maxTrimestre = Math.max(...Object.values(trimestres));
        if (maxTrimestre > seuilAlerte) alerteGlobale = true;
        
        predictions[key] = {
            ...info,
            trimestres,
            total: equipements.length,
            seuilAlerte,
            maxTrimestre,
            detailsT1: detailsT1.sort((a, b) => a.moisRestants - b.moisRestants)
        };
    });
    
    // HTML avec prédictions par type
    let html = `
        <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border:3px solid #f59e0b;border-radius:15px;padding:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;flex-wrap:wrap;gap:10px;">
                <h3 style="color:#92400e;font-size:1.3em;font-weight:800;margin:0;display:flex;align-items:center;gap:10px;">
                    <span style="font-size:1.5em;">📈</span> PRÉDICTION FLUX CHANGEMENT
                </h3>
                ${alerteGlobale ? 
                    '<div style="background:#dc2626;color:white;padding:8px 16px;border-radius:20px;font-weight:800;font-size:0.95em;animation:pulse 2s infinite;">⚠️ ALERTE FLUX</div>' : 
                    '<div style="background:#10b981;color:white;padding:8px 16px;border-radius:20px;font-weight:800;font-size:0.95em;">✅ FLUX ÉQUILIBRÉ</div>'}
            </div>
            
            <div style="color:#92400e;margin-bottom:15px;font-size:0.9em;font-weight:600;">
                ${alerteGlobale ? 
                    '⚠️ Certains équipements concentrent plus de 25% d\'échéances sur un trimestre. Cliquez sur un type pour voir le détail.' :
                    '✅ Les échéances sont bien réparties. Cliquez sur un type pour anticiper les changements.'}
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">`;
    
    Object.entries(predictions).forEach(([key, pred]) => {
        const alerte = pred.maxTrimestre > pred.seuilAlerte;
        const nbT1 = pred.trimestres['T1'];
        const pourcentageT1 = pred.total > 0 ? (nbT1 / pred.total * 100).toFixed(0) : 0;
        
        html += `
            <div onclick="ouvrirDetailPrediction('${key}')" style="background:white;border:3px solid ${alerte ? '#dc2626' : pred.color};padding:15px;border-radius:12px;cursor:pointer;transition:all 0.3s;text-align:center;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <div style="font-size:2em;margin-bottom:8px;">${pred.icon}</div>
                <div style="font-size:0.85em;font-weight:700;color:#64748b;margin-bottom:8px;">${pred.label}</div>
                <div style="font-size:2em;font-weight:800;color:${alerte ? '#dc2626' : pred.color};">${nbT1}</div>
                <div style="font-size:0.75em;color:#9ca3af;margin-top:4px;">à changer T1 (${pourcentageT1}%)</div>
                ${alerte ? '<div style="font-size:0.7em;color:#dc2626;margin-top:6px;font-weight:800;">⚠️ PRIORITÉ</div>' : ''}
                <div style="margin-top:10px;font-size:0.7em;color:#667eea;font-weight:700;">👁️ Voir détails</div>
            </div>
        `;
    });
    
    html += `
            </div>
            
            ${alerteGlobale ? `
                <div style="background:white;border:3px solid #dc2626;border-radius:10px;padding:15px;margin-top:15px;">
                    <div style="font-weight:800;color:#dc2626;margin-bottom:12px;font-size:1em;display:flex;align-items:center;gap:8px;">
                        <span style="font-size:1.3em;">⚡</span> MODÈLE DE RATIONALISATION DES COMMANDES
                    </div>
                    <div style="color:#64748b;font-size:0.85em;line-height:1.5;margin-bottom:12px;">
                        Pour éviter une commande massive et optimiser le budget, nous recommandons d'étaler les achats :
                    </div>
                    <button onclick="ouvrirModeleRationalisation()" style="width:100%;padding:14px;border:none;background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%);color:white;font-size:0.95em;font-weight:800;border-radius:10px;cursor:pointer;box-shadow:0 4px 15px rgba(220,38,38,0.3);transition:all 0.3s;">
                        📊 OUVRIR LE MODÈLE D'OPTIMISATION
                    </button>
                </div>
            ` : `
                <div style="background:white;border-radius:10px;padding:15px;margin-top:15px;">
                    <div style="font-weight:700;color:#92400e;margin-bottom:8px;font-size:0.95em;">💡 RECOMMANDATION SMART:</div>
                    <div style="color:#64748b;font-size:0.85em;line-height:1.5;">
                        Cliquez sur un type d'équipement pour voir la liste détaillée des références à changer dans les 3 prochains mois et optimiser vos commandes.
                    </div>
                </div>
            `}
        </div>
        
        <style>
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        </style>
    `;
    
    document.getElementById('equip-prediction').innerHTML = html;
}

// POPUP DÉTAIL PRÉDICTION PAR TYPE
window.ouvrirDetailPrediction = function(typeKey) {
    const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
    const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
    const moteurs = JSON.parse(localStorage.getItem(STORAGE_KEYS.moteurs)) || [];
    const batteries = JSON.parse(localStorage.getItem(STORAGE_KEYS.batteries)) || [];
    
    const typesData = {
        'masques': { data: masques, icon: '🎭', label: 'Masques', type: 'masque', color: '#3b82f6' },
        'tuyaux': { data: tuyaux, icon: '🔧', label: 'Tuyaux', type: 'tuyau', color: '#10b981' },
        'moteurs': { data: moteurs, icon: '⚙️', label: 'Moteurs', type: 'moteur', color: '#f59e0b' },
        'batteries': { data: batteries, icon: '🔋', label: 'Batteries', type: 'batterie', color: '#ef4444' }
    };
    
    const info = typesData[typeKey];
    if (!info) return;
    
    // Analyser tous les équipements
    const analyses = info.data.map(eq => {
        const etat = calculerEtatEquipement(eq.dateMiseEnService, info.type);
        return { ...eq, etat, moisRestants: etat.mois };
    }).filter(eq => eq.moisRestants !== null && eq.moisRestants >= 0 && eq.moisRestants <= 12);
    
    // Trier par urgence (mois restants croissants)
    analyses.sort((a, b) => a.moisRestants - b.moisRestants);
    
    // Grouper par trimestre
    const parTrimestre = {
        'T1 (0-3 mois)': analyses.filter(a => a.moisRestants <= 3),
        'T2 (4-6 mois)': analyses.filter(a => a.moisRestants > 3 && a.moisRestants <= 6),
        'T3 (7-9 mois)': analyses.filter(a => a.moisRestants > 6 && a.moisRestants <= 9),
        'T4 (10-12 mois)': analyses.filter(a => a.moisRestants > 9 && a.moisRestants <= 12)
    };
    
    let html = `
        <div style="max-height:80vh;overflow-y:auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <h3 style="color:${info.color};font-size:1.5em;font-weight:800;margin:0;display:flex;align-items:center;gap:10px;">
                    ${info.icon} Prédiction ${info.label}
                </h3>
                <button onclick="closeModal()" style="background:#ef4444;color:white;border:none;border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;">✕ Fermer</button>
            </div>
            
            <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-left:5px solid ${info.color};padding:15px;border-radius:10px;margin-bottom:20px;">
                <div style="font-size:0.95em;font-weight:700;color:#92400e;margin-bottom:8px;">📊 RÉSUMÉ</div>
                <div style="color:#64748b;font-size:0.9em;">
                    <strong>${analyses.length}</strong> équipement(s) à renouveler dans les 12 prochains mois.
                </div>
            </div>
    `;
    
    Object.entries(parTrimestre).forEach(([trimestre, items]) => {
        if (items.length === 0) return;
        
        const couleurTrimestre = items[0].moisRestants <= 3 ? '#dc2626' : (items[0].moisRestants <= 6 ? '#f59e0b' : '#10b981');
        
        html += `
            <div style="margin-bottom:20px;">
                <div style="background:${couleurTrimestre};color:white;padding:10px 15px;border-radius:8px;font-weight:800;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                    <span>${trimestre}</span>
                    <span style="background:rgba(255,255,255,0.3);padding:4px 12px;border-radius:20px;">${items.length}</span>
                </div>
                
                <div style="display:grid;gap:10px;">
        `;
        
        items.forEach(item => {
            if (!item.dateMiseEnService) return; // Ignorer sans date
            const dateStr = new Date(item.dateMiseEnService).toLocaleDateString('fr-FR');
            
            html += `
                <div style="background:${item.etat.bg};border-left:4px solid ${item.etat.couleur};padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <div style="flex:1;min-width:150px;">
                        <div style="font-weight:800;color:#1f2937;font-size:0.95em;">${item.reference}</div>
                        <div style="font-size:0.8em;color:#64748b;margin-top:2px;">MES: ${dateStr}</div>
                        ${item.assigneA ? `<div style="font-size:0.75em;color:#667eea;margin-top:2px;">👤 ${item.assigneA}</div>` : ''}
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.2em;font-weight:800;color:${item.etat.couleur};">${item.moisRestants} mois</div>
                        <div style="font-size:0.75em;color:${item.etat.couleur};font-weight:700;">${item.etat.label}</div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    if (analyses.length === 0) {
        html += '<p style="text-align:center;color:#9ca3af;padding:40px;">Aucun équipement à renouveler dans les 12 prochains mois. 🎉</p>';
    }
    
    html += `
            <div style="background:#f0f9ff;border:2px solid #3b82f6;border-radius:10px;padding:15px;margin-top:20px;">
                <div style="font-weight:700;color:#1e40af;margin-bottom:8px;font-size:0.9em;">💡 CONSEIL OPTIMISATION:</div>
                <div style="color:#64748b;font-size:0.85em;line-height:1.5;">
                    ${parTrimestre['T1 (0-3 mois)'].length > 0 ? 
                        `⚠️ <strong>Action prioritaire:</strong> Commander ${parTrimestre['T1 (0-3 mois)'].length} ${info.label.toLowerCase()} dès maintenant pour éviter les ruptures.` :
                        `✅ Pas d'urgence immédiate. Planifier les commandes progressivement.`}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal-assignation').style.display = 'block';
};

// MODÈLE DE RATIONALISATION DES COMMANDES
window.ouvrirModeleRationalisation = function() {
    const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
    const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
    const moteurs = JSON.parse(localStorage.getItem(STORAGE_KEYS.moteurs)) || [];
    const batteries = JSON.parse(localStorage.getItem(STORAGE_KEYS.batteries)) || [];
    
    const typesData = {
        'masques': { data: masques, icon: '🎭', label: 'Masques', type: 'masque', color: '#3b82f6' },
        'tuyaux': { data: tuyaux, icon: '🔧', label: 'Tuyaux', type: 'tuyau', color: '#10b981' },
        'moteurs': { data: moteurs, icon: '⚙️', label: 'Moteurs', type: 'moteur', color: '#f59e0b' },
        'batteries': { data: batteries, icon: '🔋', label: 'Batteries', type: 'batterie', color: '#ef4444' }
    };
    
    // Analyser TOUS les équipements sur 12 mois
    const planificationGlobale = [];
    
    Object.entries(typesData).forEach(([key, info]) => {
        const equipements = info.data.map(eq => {
            const etat = calculerEtatEquipement(eq.dateMiseEnService, info.type);
            return { ...eq, etat, moisRestants: etat.mois, categorie: info.label, categorieKey: key, icon: info.icon, color: info.color };
        }).filter(eq => eq.moisRestants !== null && eq.moisRestants >= 0 && eq.moisRestants <= 12);
        
        planificationGlobale.push(...equipements);
    });
    
    // Trier par urgence (mois restants)
    planificationGlobale.sort((a, b) => a.moisRestants - b.moisRestants);
    
    // Charger les prix accessoires personnalisés
    const prixPerso = JSON.parse(localStorage.getItem(STORAGE_KEYS.prixAccessoires)) || {};
    const coutMoyen = { 
        masque: prixPerso.masques || 150,
        tuyau: prixPerso.tuyaux || 80,
        moteur: prixPerso.moteurs || 350,
        batterie: prixPerso.batteries || 200
    };
    
    const parTrimestre = {
        'T1 (0-3 mois)': { items: [], cout: 0 },
        'T2 (4-6 mois)': { items: [], cout: 0 },
        'T3 (7-9 mois)': { items: [], cout: 0 },
        'T4 (10-12 mois)': { items: [], cout: 0 }
    };
    
    planificationGlobale.forEach(eq => {
        const cout = coutMoyen[eq.categorie.toLowerCase().replace('s', '')] || 100;
        if (eq.moisRestants <= 3) {
            parTrimestre['T1 (0-3 mois)'].items.push(eq);
            parTrimestre['T1 (0-3 mois)'].cout += cout;
        } else if (eq.moisRestants <= 6) {
            parTrimestre['T2 (4-6 mois)'].items.push(eq);
            parTrimestre['T2 (4-6 mois)'].cout += cout;
        } else if (eq.moisRestants <= 9) {
            parTrimestre['T3 (7-9 mois)'].items.push(eq);
            parTrimestre['T3 (7-9 mois)'].cout += cout;
        } else {
            parTrimestre['T4 (10-12 mois)'].items.push(eq);
            parTrimestre['T4 (10-12 mois)'].cout += cout;
        }
    });
    
    const coutTotal = Object.values(parTrimestre).reduce((sum, t) => sum + t.cout, 0);
    const coutMoyenTrimestre = coutTotal / 4;
    
    let html = `
        <div style="max-height:85vh;overflow-y:auto;padding-right:10px;">
            <!-- EN-TÊTE -->
            <div style="background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%);color:white;padding:25px;border-radius:12px;margin-bottom:25px;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:15px;">
                    <div>
                        <h2 style="margin:0 0 10px 0;font-size:1.8em;font-weight:800;">⚡ MODÈLE DE RATIONALISATION</h2>
                        <div style="font-size:0.95em;opacity:0.9;">Optimisation des commandes sur 12 mois</div>
                    </div>
                    <button onclick="closeModal()" style="background:rgba(255,255,255,0.2);color:white;border:none;border-radius:8px;padding:10px 20px;font-weight:700;cursor:pointer;">✕</button>
                </div>
                
                <div style="background:rgba(255,255,255,0.2);padding:15px;border-radius:10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;text-align:center;">
                    <div>
                        <div style="font-size:1.8em;font-weight:800;">${planificationGlobale.length}</div>
                        <div style="font-size:0.8em;opacity:0.9;">Équipements à renouveler</div>
                    </div>
                    <div>
                        <div style="font-size:1.8em;font-weight:800;">${coutTotal.toLocaleString('fr-FR')}€</div>
                        <div style="font-size:0.8em;opacity:0.9;">Budget total estimé</div>
                    </div>
                    <div>
                        <div style="font-size:1.8em;font-weight:800;">${coutMoyenTrimestre.toFixed(0)}€</div>
                        <div style="font-size:0.8em;opacity:0.9;">Coût moyen/trimestre</div>
                    </div>
                </div>
            </div>
            
            <!-- ANALYSE PAR TRIMESTRE -->
            <div style="background:#fff3cd;border:3px solid #f59e0b;border-radius:10px;padding:15px;margin-bottom:20px;">
                <div style="font-weight:800;color:#92400e;margin-bottom:12px;font-size:1em;">📊 RÉPARTITION DES COÛTS</div>
                <div style="display:grid;gap:12px;">
    `;
    
    Object.entries(parTrimestre).forEach(([trimestre, data]) => {
        const depassement = data.cout > coutMoyenTrimestre * 1.5;
        const pourcentage = coutTotal > 0 ? ((data.cout / coutTotal) * 100).toFixed(0) : 0;
        
        html += `
            <div style="background:white;border-left:5px solid ${depassement ? '#dc2626' : '#10b981'};padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-weight:800;color:#1f2937;font-size:0.95em;">${trimestre}</div>
                    <div style="font-size:0.75em;color:#64748b;margin-top:2px;">${data.items.length} équipement(s)</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:1.3em;font-weight:800;color:${depassement ? '#dc2626' : '#10b981'};">${data.cout.toLocaleString('fr-FR')}€</div>
                    <div style="font-size:0.7em;color:#9ca3af;">${pourcentage}% du budget</div>
                    ${depassement ? '<div style="font-size:0.7em;color:#dc2626;font-weight:700;margin-top:2px;">⚠️ SURCHARGE</div>' : ''}
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <!-- RECOMMANDATIONS SMART -->
            <div style="background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);border:3px solid #3b82f6;border-radius:10px;padding:20px;margin-bottom:20px;">
                <div style="font-weight:800;color:#1e40af;margin-bottom:15px;font-size:1.1em;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:1.3em;">💡</span> STRATÉGIE D'OPTIMISATION
                </div>
    `;
    
    const t1Surcharge = parTrimestre['T1 (0-3 mois)'].cout > coutMoyenTrimestre * 1.5;
    const t2Surcharge = parTrimestre['T2 (4-6 mois)'].cout > coutMoyenTrimestre * 1.5;
    
    if (t1Surcharge) {
        const aAnticiper = Math.ceil(parTrimestre['T1 (0-3 mois)'].items.length * 0.3);
        html += `
            <div style="background:white;padding:12px;border-radius:8px;margin-bottom:10px;border-left:4px solid #dc2626;">
                <div style="font-weight:700;color:#991b1b;margin-bottom:6px;">🚨 ACTION URGENTE - T1 surchargé</div>
                <div style="font-size:0.85em;color:#64748b;line-height:1.5;">
                    Anticiper <strong>${aAnticiper} équipements</strong> du T1 en les commandant dès maintenant. 
                    Cela réduira le pic de coût de <strong>${(parTrimestre['T1 (0-3 mois)'].cout * 0.3).toFixed(0)}€</strong>.
                </div>
            </div>
        `;
    }
    
    if (t2Surcharge) {
        html += `
            <div style="background:white;padding:12px;border-radius:8px;margin-bottom:10px;border-left:4px solid #f59e0b;">
                <div style="font-weight:700;color:#92400e;margin-bottom:6px;">⚠️ ATTENTION - T2 à surveiller</div>
                <div style="font-size:0.85em;color:#64748b;line-height:1.5;">
                    Planifier les commandes T2 dès la fin du T1 pour lisser les coûts.
                </div>
            </div>
        `;
    }
    
    html += `
            <div style="background:white;padding:12px;border-radius:8px;border-left:4px solid #10b981;">
                <div style="font-weight:700;color:#065f46;margin-bottom:6px;">✅ PLAN OPTIMAL</div>
                <div style="font-size:0.85em;color:#64748b;line-height:1.5;">
                    Budget mensuel recommandé : <strong>${(coutTotal / 12).toFixed(0)}€/mois</strong><br>
                    Permet d'étaler les dépenses et d'éviter les ruptures de stock.
                </div>
            </div>
        </div>
        
        <!-- DÉTAIL PAR CATÉGORIE -->
        <div style="background:white;border:2px solid #e2e8f0;border-radius:10px;padding:20px;">
            <div style="font-weight:800;color:#1f2937;margin-bottom:15px;font-size:1.1em;">📦 RÉPARTITION PAR TYPE D'ÉQUIPEMENT</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
    `;
    
    // Calculer par catégorie
    const parCategorie = {};
    planificationGlobale.forEach(eq => {
        if (!parCategorie[eq.categorie]) {
            parCategorie[eq.categorie] = { 
                items: [], 
                cout: 0, 
                icon: eq.icon, 
                color: eq.color 
            };
        }
        parCategorie[eq.categorie].items.push(eq);
        parCategorie[eq.categorie].cout += coutMoyen[eq.categorie.toLowerCase().replace('s', '')] || 100;
    });
    
    Object.entries(parCategorie).forEach(([cat, data]) => {
        html += `
            <div style="background:linear-gradient(135deg,${data.color}15 0%,${data.color}25 100%);border:2px solid ${data.color};padding:15px;border-radius:10px;text-align:center;">
                <div style="font-size:2em;margin-bottom:8px;">${data.icon}</div>
                <div style="font-size:0.85em;font-weight:700;color:#64748b;margin-bottom:8px;">${cat}</div>
                <div style="font-size:1.5em;font-weight:800;color:${data.color};">${data.items.length}</div>
                <div style="font-size:0.75em;color:#9ca3af;margin-top:4px;">${data.cout.toLocaleString('fr-FR')}€</div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <!-- BOUTON TÉLÉCHARGER PLAN -->
        <div style="margin-top:20px;text-align:center;">
            <button onclick="alert('Export du plan de rationalisation en développement')" style="padding:14px 30px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1em;font-weight:800;border-radius:10px;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.3);">
                📥 TÉLÉCHARGER LE PLAN D'ACTION
            </button>
        </div>
    </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal-assignation').style.display = 'block';
};

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
    // Vérifier si l'utilisateur est authentifié en tant qu'admin
    const isAdmin = isAdminAuthenticated();
    
    document.getElementById('equip-actions').innerHTML = `
        <button onclick="addEquipement()" style="padding:12px 24px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 15px rgba(16,185,129,0.3);">
            ➕ Ajouter
        </button>
        ${isAdmin ? `
        <button onclick="ouvrirConsommables()" style="padding:12px 24px;border:none;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:white;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 15px rgba(139,92,246,0.3);">
            📦 Consommables
        </button>
        <button onclick="ouvrirPrixAccessoires()" style="padding:12px 24px;border:none;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 15px rgba(245,158,11,0.3);">
            💰 Prix Accessoires
        </button>
        ` : ''}
        <button onclick="genererFeuilleAudit()" style="padding:12px 24px;border:none;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 15px rgba(102,126,234,0.3);">
            📋 Feuille d'Audit
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
        if (!etatA) return 1; // Mettre les sans date à la fin
        if (!etatB) return -1;
        const ordre = { 'PÉRIMÉ': 0, 'URGENT': 1, 'À COMMANDER': 2, 'DERNIÈRE ANNÉE': 3, 'BON': 4 };
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
                    ${(currentEquipType === 'moteurs' || currentEquipType === 'batteries') && item.certificationAtex ? `
                    <div>
                        <strong style="color:#6b7280;font-size:0.75em;text-transform:uppercase;">⚡ Catégorie:</strong><br>
                        <span style="display:inline-block;padding:4px 10px;border-radius:12px;font-weight:800;font-size:0.85em;${item.certificationAtex === 'ATEX' ? 'background:#dcfce7;color:#166534;border:2px solid #16a34a;' : 'background:#f3f4f6;color:#374151;border:2px solid #9ca3af;'}">${item.certificationAtex === 'ATEX' ? '⚡ Usage ATEX' : '❌ Usage Standard'}</span>
                    </div>` : ''}
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
            
            <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);padding:15px;border-radius:12px;margin-bottom:20px;text-align:center;">
                <button onclick="scannerNFC()" style="width:100%;padding:14px;border:none;background:rgba(255,255,255,0.2);color:white;font-size:1.1em;font-weight:800;border-radius:10px;cursor:pointer;backdrop-filter:blur(10px);border:2px solid rgba(255,255,255,0.3);">
                    📱 SCANNER NFC
                </button>
                <div style="color:rgba(255,255,255,0.9);font-size:0.85em;margin-top:10px;">Approchez l'équipement avec la puce NFC pour remplissage automatique</div>
            </div>
            
            <div style="background:#f0fdf4;border:2px solid #10b981;padding:12px;border-radius:10px;margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:10px;color:#047857;">
                    <div style="font-size:1.3em;">💡</div>
                    <div style="font-size:0.85em;line-height:1.5;">
                        <strong>Deux modes disponibles :</strong><br>
                        • <strong>Automatique</strong> : Scannez la puce NFC (recommandé)<br>
                        • <strong>Manuel</strong> : Remplissez les champs ci-dessous si NFC indisponible
                    </div>
                </div>
            </div>
            
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">🏢 Marque:</label>
            <select id="new-marque" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                <option value="">-- Sélectionner une marque --</option>
                <option value="DRAGER">DRAGER</option>
                <option value="3M">3M</option>
            </select>
            
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📝 Référence article:</label>
            <input type="text" id="new-ref" placeholder="Ex: 11234567" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">🔢 Numéro Axens:</label>
            <input type="text" id="new-modele" placeholder="Ex: 120" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            
            ${currentEquipType === 'moteurs' || currentEquipType === 'batteries' ? `
            <div style="background:#fef3c7;border:3px solid #f59e0b;border-radius:10px;padding:15px;margin-bottom:15px;">
                <div style="font-weight:800;color:#92400e;margin-bottom:10px;font-size:1.05em;">⚡ CATÉGORIE D'USAGE</div>
                <div style="color:#92400e;font-size:0.9em;margin-bottom:12px;">
                    Certains modèles sont conçus pour un usage en zone ATEX (atmosphère explosive), d'autres pour un usage standard.<br>
                    Sélectionnez la catégorie selon les caractéristiques du modèle :
                </div>
                
                <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">🔒 Catégorie d'usage:</label>
                <select id="new-atex" style="width:100%;padding:12px;margin-bottom:10px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                    <option value="NON_ATEX">❌ NON ATEX (usage standard)</option>
                    <option value="ATEX">⚡ ATEX (conçu pour zones à risque)</option>
                </select>
                <div style="font-size:0.85em;color:#92400e;margin-top:5px;">
                    ℹ️ Cette information dépend du modèle de l'équipement (voir fiche technique fabricant)
                </div>
            </div>
            ` : ''}
            
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
    const marque = document.getElementById('new-marque').value.trim();
    const ref = document.getElementById('new-ref').value.trim();
    const modele = document.getElementById('new-modele').value.trim();
    const statut = document.getElementById('new-statut').value;
    const dateMode = document.querySelector('input[name="dateMode"]:checked').value;
    
    // Récupérer la catégorie d'usage ATEX si applicable (moteurs ou batteries)
    let certificationAtex = null;
    if (currentEquipType === 'moteurs' || currentEquipType === 'batteries') {
        const atexSelect = document.getElementById('new-atex');
        certificationAtex = atexSelect ? atexSelect.value : 'NON_ATEX';
    }
    
    if (!marque) {
        alert('❌ Veuillez sélectionner une marque');
        return;
    }
    
    if (!ref) {
        alert('❌ Veuillez renseigner une référence article');
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
    const newEquipement = {
        id: Date.now(),
        marque: marque,
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
    };
    
    // Ajouter la certification ATEX uniquement pour moteurs et batteries
    if (certificationAtex !== null) {
        newEquipement.certificationAtex = certificationAtex;
    }
    
    data.push(newEquipement);
    
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
                <div style="margin-bottom:8px;"><strong>Marque:</strong> ${item.marque || 'N/A'}</div>
                <div style="margin-bottom:8px;"><strong>Référence article:</strong> ${item.reference}</div>
                <div style="margin-bottom:8px;"><strong>Numéro Axens:</strong> ${item.modele || 'N/A'}</div>
                <div style="margin-bottom:8px;"><strong>État actuel:</strong> <span style="color:#667eea;font-weight:700;">${item.etat || 'stock'}</span></div>
                ${item.assigneA ? `<div style="margin-bottom:8px;"><strong>Assigné à:</strong> ${item.assigneA}</div>` : ''}
                ${item.plateforme ? `<div style="margin-bottom:8px;"><strong>Plateforme:</strong> ${item.plateforme}</div>` : ''}
                ${(currentEquipType === 'moteurs' || currentEquipType === 'batteries') && item.certificationAtex ? `<div><strong>Catégorie d'usage:</strong> <span style="font-weight:700;color:${item.certificationAtex === 'ATEX' ? '#16a34a' : '#6b7280'};">${item.certificationAtex === 'ATEX' ? '⚡ Usage ATEX' : '❌ Usage Standard'}</span></div>` : ''}
            </div>
            
            <div style="background:${etat.bg};border:3px solid ${etat.couleur};border-radius:10px;padding:15px;margin-bottom:20px;">
                <div style="font-weight:800;color:${etat.couleur};margin-bottom:5px;font-size:1.05em;">⏱️ État durée de vie</div>
                <div style="color:${etat.couleur};font-size:0.95em;">${etat.label} ${etat.mois !== null ? `(${etat.mois} mois ${etat.mois > 0 ? 'restants' : 'dépassés'})` : ''}</div>
            </div>
            
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📅 Date de mise en service:</label>
            <input type="date" id="edit-date-mes" value="${item.dateMiseEnService || ''}" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
            
            ${currentEquipType === 'moteurs' || currentEquipType === 'batteries' ? `
            <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">⚡ Catégorie d'usage:</label>
            <select id="edit-atex" style="width:100%;padding:12px;margin-bottom:15px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                <option value="NON_ATEX" ${item.certificationAtex === 'NON_ATEX' || !item.certificationAtex ? 'selected' : ''}>❌ Usage Standard</option>
                <option value="ATEX" ${item.certificationAtex === 'ATEX' ? 'selected' : ''}>⚡ Usage ATEX (zones à risque)</option>
            </select>
            ` : ''}
            
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
    
    // Récupérer la catégorie d'usage ATEX si applicable
    let nouvelleCertificationAtex = null;
    if (currentEquipType === 'moteurs' || currentEquipType === 'batteries') {
        const atexSelect = document.getElementById('edit-atex');
        if (atexSelect) {
            nouvelleCertificationAtex = atexSelect.value;
        }
    }
    
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const item = data.find(e => e.reference === reference);
    
    if (!item) return;
    
    // Enregistrer les modifications
    const ancienneDateMES = item.dateMiseEnService;
    const ancienEtat = item.etat;
    const ancienneCertificationAtex = item.certificationAtex;
    
    item.dateMiseEnService = nouvelleDateMES;
    
    // Mettre à jour la certification ATEX si applicable
    if (nouvelleCertificationAtex !== null) {
        item.certificationAtex = nouvelleCertificationAtex;
    }
    
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
        ancienneCertificationAtex: ancienneCertificationAtex,
        nouvelleCertificationAtex: nouvelleCertificationAtex,
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
        if (!etatA) return 1;
        if (!etatB) return -1;
        const ordre = { 'PÉRIMÉ': 0, 'URGENT': 1, 'À COMMANDER': 2, 'DERNIÈRE ANNÉE': 3, 'BON': 4 };
        return (ordre[etatA.label] || 99) - (ordre[etatB.label] || 99);
    });
    if (dataTriee[index]) changerEtatEquipement(dataTriee[index].reference);
};

window.modifierEquipementByIndex = function(index) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const dataTriee = [...data].sort((a, b) => {
        const etatA = calculerEtatEquipement(a.dateMiseEnService, currentEquipType.slice(0, -1));
        const etatB = calculerEtatEquipement(b.dateMiseEnService, currentEquipType.slice(0, -1));
        if (!etatA) return 1;
        if (!etatB) return -1;
        const ordre = { 'PÉRIMÉ': 0, 'URGENT': 1, 'À COMMANDER': 2, 'DERNIÈRE ANNÉE': 3, 'BON': 4 };
        return (ordre[etatA.label] || 99) - (ordre[etatB.label] || 99);
    });
    if (dataTriee[index]) modifierEquipement(dataTriee[index].reference);
};

window.supprimerEquipementByIndex = function(index) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const dataTriee = [...data].sort((a, b) => {
        const etatA = calculerEtatEquipement(a.dateMiseEnService, currentEquipType.slice(0, -1));
        const etatB = calculerEtatEquipement(b.dateMiseEnService, currentEquipType.slice(0, -1));
        if (!etatA) return 1;
        if (!etatB) return -1;
        const ordre = { 'PÉRIMÉ': 0, 'URGENT': 1, 'À COMMANDER': 2, 'DERNIÈRE ANNÉE': 3, 'BON': 4 };
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

// ========== FEUILLE D'AUDIT ==========
window.genererFeuilleAudit = function() {
    const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
    const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
    const moteurs = JSON.parse(localStorage.getItem(STORAGE_KEYS.moteurs)) || [];
    const batteries = JSON.parse(localStorage.getItem(STORAGE_KEYS.batteries)) || [];
    
    const tousEquipements = [
        ...masques.map(m => ({ ...m, categorie: '🎭 Masque' })),
        ...tuyaux.map(t => ({ ...t, categorie: '🔧 Tuyau' })),
        ...moteurs.map(m => ({ ...m, categorie: '⚙️ Moteur' })),
        ...batteries.map(b => ({ ...b, categorie: '🔋 Batterie' }))
    ];
    
    // Séparer par état
    const enUtilisation = tousEquipements.filter(eq => eq.etat === 'utilisation');
    const enStock = tousEquipements.filter(eq => eq.etat === 'stock');
    const enCommande = tousEquipements.filter(eq => eq.etat === 'commande');
    const horsService = tousEquipements.filter(eq => eq.etat === 'hors_service');
    
    const dateAudit = new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let html = `
        <div style="max-height:85vh;overflow-y:auto;padding-right:10px;">
            <!-- EN-TÊTE -->
            <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:25px;border-radius:12px;margin-bottom:25px;text-align:center;">
                <h2 style="margin:0 0 10px 0;font-size:1.8em;font-weight:800;">📋 FEUILLE D'AUDIT ÉQUIPEMENTS</h2>
                <div style="font-size:0.95em;opacity:0.9;">Généré le ${dateAudit}</div>
                <div style="background:rgba(255,255,255,0.2);padding:12px;border-radius:8px;margin-top:15px;">
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;text-align:center;">
                        <div>
                            <div style="font-size:1.8em;font-weight:800;">${tousEquipements.length}</div>
                            <div style="font-size:0.8em;opacity:0.9;">Total équipements</div>
                        </div>
                        <div>
                            <div style="font-size:1.8em;font-weight:800;">${enUtilisation.length}</div>
                            <div style="font-size:0.8em;opacity:0.9;">En utilisation</div>
                        </div>
                        <div>
                            <div style="font-size:1.8em;font-weight:800;">${enStock.length}</div>
                            <div style="font-size:0.8em;opacity:0.9;">En stock</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- BOUTON FERMER -->
            <button onclick="closeModal()" style="position:absolute;top:15px;right:15px;background:#ef4444;color:white;border:none;border-radius:8px;padding:10px 20px;font-weight:700;cursor:pointer;z-index:10;">✕ Fermer</button>
    `;
    
    // SECTION EN UTILISATION
    if (enUtilisation.length > 0) {
        html += `
            <div style="margin-bottom:30px;">
                <div style="background:#3b82f6;color:white;padding:15px;border-radius:10px 10px 0 0;font-weight:800;font-size:1.2em;">
                    🔵 ÉQUIPEMENTS EN COURS D'UTILISATION (${enUtilisation.length})
                </div>
                <div style="background:white;border:3px solid #3b82f6;border-top:none;border-radius:0 0 10px 10px;padding:15px;">
        `;
        
        enUtilisation.sort((a, b) => (a.assigneA || '').localeCompare(b.assigneA || '')).forEach(eq => {
            const etat = calculerEtatEquipement(eq.dateMiseEnService, eq.categorie.includes('Masque') ? 'masque' : eq.categorie.includes('Tuyau') ? 'tuyau' : eq.categorie.includes('Moteur') ? 'moteur' : 'batterie');
            if (!etat) return; // Ignorer sans date
            const dateMES = new Date(eq.dateMiseEnService).toLocaleDateString('fr-FR');
            const nbMaintenances = eq.historiqueMaintenance ? eq.historiqueMaintenance.length : 0;
            const nbControles = eq.historiqueControles ? eq.historiqueControles.length : 0;
            
            html += `
                <div style="background:#f8fafc;border-left:5px solid ${etat.couleur};padding:15px;margin-bottom:12px;border-radius:8px;">
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;">
                        <div>
                            <div style="font-weight:800;color:#1f2937;font-size:1.05em;margin-bottom:5px;">${eq.categorie} - ${eq.reference}</div>
                            <div style="font-size:0.85em;color:#64748b;">MES: ${dateMES}</div>
                            <div style="display:inline-block;margin-top:5px;padding:4px 10px;border-radius:6px;font-size:0.75em;font-weight:700;background:${etat.bg};color:${etat.couleur};">
                                ${etat.label} (${etat.mois !== null ? Math.abs(etat.mois) + ' mois' : 'N/A'})
                            </div>
                            ${(eq.categorie.includes('Moteur') || eq.categorie.includes('Batterie')) && eq.certificationAtex ? `
                            <div style="display:inline-block;margin-top:5px;margin-left:5px;padding:4px 10px;border-radius:6px;font-size:0.75em;font-weight:700;${eq.certificationAtex === 'ATEX' ? 'background:#dcfce7;color:#166534;' : 'background:#f3f4f6;color:#374151;'}">
                                ${eq.certificationAtex === 'ATEX' ? '⚡ ATEX' : '❌ NON ATEX'}
                            </div>` : ''}
                        </div>
                        <div>
                            <div style="font-size:0.85em;color:#64748b;margin-bottom:3px;">👤 <strong>Assigné à:</strong></div>
                            <div style="font-weight:700;color:#667eea;font-size:0.95em;">${eq.assigneA || 'Non assigné'}</div>
                            ${eq.plateforme ? `<div style="font-size:0.8em;color:#64748b;margin-top:3px;">🏭 ${eq.plateforme}</div>` : ''}
                        </div>
                        <div>
                            <div style="font-size:0.85em;color:#64748b;margin-bottom:3px;">🔧 <strong>Interventions:</strong></div>
                            <div style="font-weight:700;color:#10b981;font-size:0.95em;">${nbMaintenances} maintenance(s)</div>
                            <div style="font-weight:700;color:#f59e0b;font-size:0.95em;margin-top:2px;">${nbControles} contrôle(s)</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // SECTION EN STOCK
    if (enStock.length > 0) {
        html += `
            <div style="margin-bottom:30px;">
                <div style="background:#10b981;color:white;padding:15px;border-radius:10px 10px 0 0;font-weight:800;font-size:1.2em;">
                    🟢 ÉQUIPEMENTS EN STOCK DISPONIBLE (${enStock.length})
                </div>
                <div style="background:white;border:3px solid #10b981;border-top:none;border-radius:0 0 10px 10px;padding:15px;">
        `;
        
        enStock.forEach(eq => {
            const etat = calculerEtatEquipement(eq.dateMiseEnService, eq.categorie.includes('Masque') ? 'masque' : eq.categorie.includes('Tuyau') ? 'tuyau' : eq.categorie.includes('Moteur') ? 'moteur' : 'batterie');
            if (!etat) return; // Ignorer sans date
            const dateMES = new Date(eq.dateMiseEnService).toLocaleDateString('fr-FR');
            const nbMaintenances = eq.historiqueMaintenance ? eq.historiqueMaintenance.length : 0;
            const nbControles = eq.historiqueControles ? eq.historiqueControles.length : 0;
            
            html += `
                <div style="background:#f8fafc;border-left:5px solid #10b981;padding:12px;margin-bottom:10px;border-radius:8px;display:grid;grid-template-columns:1fr auto auto;gap:15px;align-items:center;">
                    <div>
                        <div style="font-weight:800;color:#1f2937;font-size:0.95em;">${eq.categorie} - ${eq.reference}</div>
                        <div style="font-size:0.75em;color:#64748b;margin-top:2px;">MES: ${dateMES}</div>
                        ${(eq.categorie.includes('Moteur') || eq.categorie.includes('Batterie')) && eq.certificationAtex ? `
                        <div style="display:inline-block;margin-top:4px;padding:3px 8px;border-radius:4px;font-size:0.7em;font-weight:700;${eq.certificationAtex === 'ATEX' ? 'background:#dcfce7;color:#166534;' : 'background:#f3f4f6;color:#374151;'}">
                            ${eq.certificationAtex === 'ATEX' ? '⚡ ATEX' : '❌ NON ATEX'}
                        </div>` : ''}
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:0.75em;color:#64748b;">Interventions</div>
                        <div style="font-weight:700;color:#10b981;font-size:0.9em;">${nbMaintenances + nbControles}</div>
                    </div>
                    <div style="padding:6px 12px;border-radius:6px;font-size:0.75em;font-weight:700;background:${etat.bg};color:${etat.couleur};">
                        ${etat.label}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // SECTIONS COMMANDE ET HORS SERVICE
    if (enCommande.length > 0) {
        html += `
            <div style="margin-bottom:30px;">
                <div style="background:#f59e0b;color:white;padding:15px;border-radius:10px 10px 0 0;font-weight:800;font-size:1.2em;">
                    🟠 ÉQUIPEMENTS EN COMMANDE (${enCommande.length})
                </div>
                <div style="background:white;border:3px solid #f59e0b;border-top:none;border-radius:0 0 10px 10px;padding:15px;">
        `;
        
        enCommande.forEach(eq => {
            html += `
                <div style="background:#fef3c7;border-left:5px solid #f59e0b;padding:12px;margin-bottom:10px;border-radius:8px;">
                    <div style="font-weight:800;color:#1f2937;font-size:0.95em;">${eq.categorie} - ${eq.reference}</div>
                    <div style="font-size:0.75em;color:#92400e;margin-top:4px;">En attente de réception</div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    if (horsService.length > 0) {
        html += `
            <div style="margin-bottom:30px;">
                <div style="background:#ef4444;color:white;padding:15px;border-radius:10px 10px 0 0;font-weight:800;font-size:1.2em;">
                    🔴 ÉQUIPEMENTS HORS SERVICE (${horsService.length})
                </div>
                <div style="background:white;border:3px solid #ef4444;border-top:none;border-radius:0 0 10px 10px;padding:15px;">
        `;
        
        horsService.forEach(eq => {
            const nbMaintenances = eq.historiqueMaintenance ? eq.historiqueMaintenance.length : 0;
            const nbControles = eq.historiqueControles ? eq.historiqueControles.length : 0;
            
            html += `
                <div style="background:#fee2e2;border-left:5px solid #ef4444;padding:12px;margin-bottom:10px;border-radius:8px;">
                    <div style="font-weight:800;color:#1f2937;font-size:0.95em;">${eq.categorie} - ${eq.reference}</div>
                    <div style="font-size:0.75em;color:#991b1b;margin-top:4px;">⚠️ Nécessite réparation ou remplacement (${nbMaintenances + nbControles} intervention(s))</div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // FOOTER
    html += `
            <div style="background:#f1f5f9;border:2px solid #cbd5e1;border-radius:10px;padding:20px;margin-top:20px;">
                <div style="font-weight:700;color:#475569;margin-bottom:10px;font-size:1.1em;">📊 RÉSUMÉ DE L'AUDIT</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
                    <div style="background:white;padding:12px;border-radius:8px;text-align:center;border:2px solid #3b82f6;">
                        <div style="font-size:1.5em;font-weight:800;color:#3b82f6;">${enUtilisation.length}</div>
                        <div style="font-size:0.75em;color:#64748b;margin-top:4px;">En utilisation</div>
                    </div>
                    <div style="background:white;padding:12px;border-radius:8px;text-align:center;border:2px solid #10b981;">
                        <div style="font-size:1.5em;font-weight:800;color:#10b981;">${enStock.length}</div>
                        <div style="font-size:0.75em;color:#64748b;margin-top:4px;">En stock</div>
                    </div>
                    <div style="background:white;padding:12px;border-radius:8px;text-align:center;border:2px solid #f59e0b;">
                        <div style="font-size:1.5em;font-weight:800;color:#f59e0b;">${enCommande.length}</div>
                        <div style="font-size:0.75em;color:#64748b;margin-top:4px;">En commande</div>
                    </div>
                    <div style="background:white;padding:12px;border-radius:8px;text-align:center;border:2px solid #ef4444;">
                        <div style="font-size:1.5em;font-weight:800;color:#ef4444;">${horsService.length}</div>
                        <div style="font-size:0.75em;color:#64748b;margin-top:4px;">Hors service</div>
                    </div>
                </div>
                <div style="margin-top:15px;padding:12px;background:white;border-radius:8px;font-size:0.85em;color:#64748b;">
                    📅 Ce document constitue un audit instantané de l'état du parc d'équipements au ${dateAudit}.
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal-assignation').style.display = 'block';
};

// ========== PRIX ACCESSOIRES ==========
window.ouvrirPrixAccessoires = function() {
    const prixPerso = JSON.parse(localStorage.getItem(STORAGE_KEYS.prixAccessoires)) || {};
    
    const prixDefaut = {
        masques: 150,
        tuyaux: 80,
        moteurAtex: 450,
        moteurNonAtex: 300,
        batterieAtex: 250,
        batterieNonAtex: 150
    };
    
    const prixActuels = {
        masques: prixPerso.masques || prixDefaut.masques,
        tuyaux: prixPerso.tuyaux || prixDefaut.tuyaux,
        moteurAtex: prixPerso.moteurAtex || prixDefaut.moteurAtex,
        moteurNonAtex: prixPerso.moteurNonAtex || prixDefaut.moteurNonAtex,
        batterieAtex: prixPerso.batterieAtex || prixDefaut.batterieAtex,
        batterieNonAtex: prixPerso.batterieNonAtex || prixDefaut.batterieNonAtex
    };
    
    const icons = {
        masques: '🎭',
        tuyaux: '💨',
        moteurAtex: '⚙️💥',
        moteurNonAtex: '⚙️',
        batterieAtex: '🔋💥',
        batterieNonAtex: '🔋'
    };
    
    const labels = {
        masques: 'Masques/Cagoules',
        tuyaux: 'Tuyaux',
        moteurAtex: 'Moteur ATEX',
        moteurNonAtex: 'Moteur NON ATEX',
        batterieAtex: 'Batterie ATEX',
        batterieNonAtex: 'Batterie NON ATEX'
    };
    
    let html = `
        <div style="max-height:85vh;overflow-y:auto;padding-right:10px;">
            <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;padding:30px;border-radius:20px 20px 0 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:2em;font-weight:800;margin-bottom:8px;">💰 Prix des Accessoires</div>
                        <div style="font-size:0.95em;opacity:0.9;">Définir les prix réels pour optimiser les calculs</div>
                    </div>
                    <button onclick="closeModal()" style="background:rgba(255,255,255,0.2);color:white;border:none;border-radius:8px;padding:10px 20px;font-weight:700;cursor:pointer;">✕</button>
                </div>
            </div>
            
            <div style="padding:30px;">
                <div style="background:#f0fdf4;border:2px solid #10b981;padding:15px;border-radius:12px;margin-bottom:25px;">
                    <div style="display:flex;align-items:center;gap:10px;color:#047857;">
                        <div style="font-size:1.5em;">💡</div>
                        <div style="font-size:0.9em;line-height:1.5;">
                            <strong>Les prix que vous définissez ici seront automatiquement utilisés</strong> dans tous les calculs d'optimisation, de prévision et de rationalisation des commandes.
                        </div>
                    </div>
                </div>
                
                <div style="display:grid;gap:20px;">
                    ${Object.keys(prixActuels).map(cat => `
                        <div style="background:#f9fafb;padding:20px;border-radius:12px;border:2px solid #e5e7eb;">
                            <div style="display:flex;align-items:center;gap:15px;margin-bottom:15px;">
                                <div style="font-size:2.5em;">${icons[cat]}</div>
                                <div style="flex:1;">
                                    <div style="font-size:1.2em;font-weight:700;color:#374151;">${labels[cat]}</div>
                                    <div style="font-size:0.85em;color:#6b7280;">Prix par défaut: ${prixDefaut[cat]}€</div>
                                </div>
                            </div>
                            <div style="display:flex;align-items:center;gap:10px;">
                                <input 
                                    type="number" 
                                    id="prix-${cat}" 
                                    value="${prixActuels[cat]}" 
                                    min="0" 
                                    step="1"
                                    placeholder="${prixDefaut[cat]}"
                                    style="flex:1;padding:12px 16px;border:2px solid #d1d5db;border-radius:8px;font-size:1.1em;font-weight:700;color:#374151;"
                                />
                                <span style="font-size:1.2em;font-weight:800;color:#6b7280;">€</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="display:flex;gap:12px;margin-top:25px;">
                    <button onclick="sauvegarderPrixAccessoires()" style="flex:1;padding:16px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1.1em;font-weight:800;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.3);">
                        ✅ ENREGISTRER LES PRIX
                    </button>
                    <button onclick="reinitialiserPrixAccessoires()" style="padding:16px 24px;border:2px solid #ef4444;background:white;color:#ef4444;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;">
                        🔄 Réinitialiser
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal-assignation').style.display = 'block';
};

window.sauvegarderPrixAccessoires = function() {
    const prix = {
        masques: parseInt(document.getElementById('prix-masques').value) || 150,
        tuyaux: parseInt(document.getElementById('prix-tuyaux').value) || 80,
        moteurAtex: parseInt(document.getElementById('prix-moteurAtex').value) || 450,
        moteurNonAtex: parseInt(document.getElementById('prix-moteurNonAtex').value) || 300,
        batterieAtex: parseInt(document.getElementById('prix-batterieAtex').value) || 250,
        batterieNonAtex: parseInt(document.getElementById('prix-batterieNonAtex').value) || 150
    };
    
    localStorage.setItem(STORAGE_KEYS.prixAccessoires, JSON.stringify(prix));
    
    closeModal();
    
    showModal(
        '✅ Prix enregistrés',
        `Les prix des accessoires ont été mis à jour avec succès :<br><br>
        🎭 Masques: <strong>${prix.masques}€</strong><br>
        💨 Tuyaux: <strong>${prix.tuyaux}€</strong><br>
        ⚙️💥 Moteur ATEX: <strong>${prix.moteurAtex}€</strong><br>
        ⚙️ Moteur NON ATEX: <strong>${prix.moteurNonAtex}€</strong><br>
        🔋💥 Batterie ATEX: <strong>${prix.batterieAtex}€</strong><br>
        🔋 Batterie NON ATEX: <strong>${prix.batterieNonAtex}€</strong><br><br>
        Ces prix seront utilisés dans tous les calculs d'optimisation.`,
        'success'
    );
};

window.reinitialiserPrixAccessoires = function() {
    if (confirm('Voulez-vous vraiment réinitialiser les prix aux valeurs par défaut ?')) {
        localStorage.removeItem(STORAGE_KEYS.prixAccessoires);
        document.getElementById('prix-masques').value = 150;
        document.getElementById('prix-tuyaux').value = 80;
        document.getElementById('prix-moteurAtex').value = 450;
        document.getElementById('prix-moteurNonAtex').value = 300;
        document.getElementById('prix-batterieAtex').value = 250;
        document.getElementById('prix-batterieNonAtex').value = 150;
        
        showModal(
            '🔄 Prix réinitialisés',
            'Les prix ont été réinitialisés aux valeurs par défaut.',
            'info'
        );
    }
};

window.exportEquipExcel = function() {
    alert('📊 Export Excel en cours de développement...\n\nUtilisez la bibliothèque XLSX pour générer un fichier Excel avec les données.');
};

window.exportEquipPDF = function() {
    alert('📄 Export PDF en cours de développement...\n\nUtilisez jsPDF pour générer un rapport PDF des équipements.');
};

// ========== CONSOMMABLES ==========
window.ouvrirConsommables = function() {
    // Vérifier si le module consommables est chargé
    if (typeof CONSOMMABLES_DATA === 'undefined') {
        showModal(
            '⚠️ Module non chargé',
            'Le module de gestion des consommables n\'est pas encore activé.<br><br>Pour l\'activer, ajoutez dans index.html :<br><code>&lt;script src="consommables-masques.js"&gt;&lt;/script&gt;</code>',
            'info'
        );
        return;
    }
    
    // Initialiser les données si première fois
    if (!localStorage.getItem('consommables_masques')) {
        initConsommablesData();
    }
    
    const data = getConsommablesData();
    const alertes = getAlerteStockBas();
    const valeurStock = calculerValeurStock();
    
    let html = `
        <div style="max-height:85vh;overflow-y:auto;padding-right:10px;">
            <!-- EN-TÊTE -->
            <div style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:white;padding:30px;border-radius:20px 20px 0 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:2em;font-weight:800;margin-bottom:8px;">📦 Consommables & Pièces</div>
                        <div style="font-size:0.95em;opacity:0.9;">Suivi des stocks et consommations</div>
                    </div>
                    <button onclick="closeModal()" style="background:rgba(255,255,255,0.2);color:white;border:none;border-radius:8px;padding:10px 20px;font-weight:700;cursor:pointer;">✕</button>
                </div>
            </div>
            
            <div style="padding:30px;">
                <!-- ALERTES STOCK BAS -->
                ${alertes.length > 0 ? `
                    <div style="background:#fee2e2;border:3px solid #ef4444;padding:20px;border-radius:12px;margin-bottom:25px;">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:15px;">
                            <div style="font-size:2em;">⚠️</div>
                            <div>
                                <div style="font-size:1.3em;font-weight:800;color:#991b1b;">${alertes.length} Item${alertes.length > 1 ? 's' : ''} en Stock Bas</div>
                                <div style="font-size:0.9em;color:#7f1d1d;">Réapprovisionnement recommandé</div>
                            </div>
                        </div>
                        <div style="display:grid;gap:10px;">
                            ${alertes.map(item => `
                                <div style="background:white;padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                                    <div>
                                        <div style="font-weight:700;color:#1f2937;">${item.nom}</div>
                                        <div style="font-size:0.85em;color:#64748b;">${item.categorie} - ${item.ref}</div>
                                    </div>
                                    <div style="text-align:right;">
                                        <div style="font-weight:800;color:#ef4444;font-size:1.2em;">${item.stock} ${item.unite}</div>
                                        <div style="font-size:0.75em;color:#991b1b;">Seuil: ${item.seuilAlerte}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- VALEUR STOCK -->
                <div style="background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border:3px solid #3b82f6;padding:20px;border-radius:12px;margin-bottom:25px;text-align:center;">
                    <div style="font-size:0.9em;color:#1e40af;font-weight:700;margin-bottom:8px;">💰 VALEUR TOTALE DU STOCK</div>
                    <div style="font-size:2.5em;font-weight:800;color:#1e40af;">${valeurStock.total.toLocaleString('fr-FR')}€</div>
                </div>
                
                <!-- CATÉGORIES -->
                <div style="display:grid;gap:20px;">
                    ${Object.entries(data.categories).map(([catId, categorie]) => {
                        const valeurCat = valeurStock.details[catId].valeur;
                        const nbItems = categorie.items.length;
                        const nbAlertes = categorie.items.filter(i => i.stock <= i.seuilAlerte).length;
                        
                        return `
                            <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                                <!-- HEADER CATÉGORIE -->
                                <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:15px 20px;display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <div style="font-size:1.8em;">${categorie.icon}</div>
                                        <div>
                                            <div style="font-size:1.1em;font-weight:800;">${categorie.label}</div>
                                            <div style="font-size:0.85em;opacity:0.9;">${nbItems} références - ${valeurCat.toLocaleString('fr-FR')}€</div>
                                        </div>
                                    </div>
                                    ${nbAlertes > 0 ? `<div style="background:#ef4444;padding:6px 12px;border-radius:8px;font-size:0.85em;font-weight:700;">⚠️ ${nbAlertes}</div>` : ''}
                                </div>
                                
                                <!-- ITEMS -->
                                <div style="padding:15px;">
                                    <div style="display:grid;gap:12px;">
                                        ${categorie.items.map(item => {
                                            const alerte = item.stock <= item.seuilAlerte;
                                            return `
                                                <div style="background:white;border:2px solid ${alerte ? '#ef4444' : '#e5e7eb'};padding:15px;border-radius:8px;">
                                                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
                                                        <div style="flex:1;">
                                                            <div style="font-weight:800;color:#1f2937;font-size:1.05em;margin-bottom:4px;">${item.nom}</div>
                                                            <div style="font-size:0.85em;color:#64748b;">${item.ref}</div>
                                                        </div>
                                                        <div style="text-align:right;">
                                                            <div style="font-weight:800;color:${alerte ? '#ef4444' : '#10b981'};font-size:1.3em;">${item.stock}</div>
                                                            <div style="font-size:0.75em;color:#64748b;">${item.unite}</div>
                                                        </div>
                                                    </div>
                                                    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #e5e7eb;flex-wrap:wrap;gap:10px;">
                                                        <div style="display:flex;gap:15px;font-size:0.9em;flex-wrap:wrap;">
                                                            <div><span style="color:#64748b;">Prix:</span> <strong>${item.prix}€</strong></div>
                                                            <div><span style="color:#64748b;">Seuil:</span> <strong>${item.seuilAlerte}</strong></div>
                                                            <div><span style="color:#64748b;">Valeur:</span> <strong>${(item.prix * item.stock).toLocaleString('fr-FR')}€</strong></div>
                                                        </div>
                                                        <div style="display:flex;gap:8px;align-items:center;">
                                                            ${alerte ? '<div style="color:#ef4444;font-size:0.85em;font-weight:700;margin-right:8px;">⚠️ STOCK BAS</div>' : ''}
                                                            <button onclick="modifierConsommable('${catId}', '${item.ref}')" style="padding:6px 12px;border:none;background:#3b82f6;color:white;border-radius:6px;cursor:pointer;font-size:0.85em;font-weight:700;">✏️ Modifier</button>
                                                            <button onclick="supprimerConsommable('${catId}', '${item.ref}')" style="padding:6px 12px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:0.85em;font-weight:700;">🗑️</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                    
                                    <!-- BOUTON AJOUTER DANS CATÉGORIE -->
                                    <div style="margin-top:15px;text-align:center;">
                                        <button onclick="ajouterNouveauConsommable('${catId}')" style="padding:10px 20px;border:2px dashed #667eea;background:white;color:#667eea;border-radius:8px;cursor:pointer;font-size:0.9em;font-weight:700;width:100%;">
                                            ➕ Ajouter un nouveau consommable
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <!-- ACTIONS GLOBALES -->
                <div style="display:flex;gap:12px;margin-top:25px;flex-wrap:wrap;">
                    <button onclick="exportConsommablesExcel()" style="flex:1;min-width:200px;padding:14px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.3);">
                        📊 Export Excel
                    </button>
                    <button onclick="reinitialiserConsommables()" style="padding:14px 20px;border:2px solid #ef4444;background:white;color:#ef4444;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;">
                        🔄 Réinitialiser tout
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal-assignation').style.display = 'block';
};

// Modifier un consommable
window.modifierConsommable = function(categorieId, itemRef) {
    const data = getConsommablesData();
    const categorie = data.categories[categorieId];
    const item = categorie.items.find(i => i.ref === itemRef);
    
    if (!item) return;
    
    const html = `
        <div style="max-height:80vh;overflow-y:auto;padding-right:10px;">
            <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:white;padding:25px;border-radius:15px 15px 0 0;">
                <h2 style="margin:0;font-size:1.8em;font-weight:800;">✏️ Modifier ${item.nom}</h2>
                <div style="margin-top:8px;opacity:0.9;font-size:0.9em;">${categorie.label} - ${itemRef}</div>
            </div>
            
            <div style="padding:25px;">
                <div style="margin-bottom:20px;">
                    <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📝 Nom du consommable:</label>
                    <input type="text" id="edit-nom" value="${item.nom}" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">🔢 Référence:</label>
                    <input type="text" id="edit-ref" value="${item.ref}" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                </div>
                
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:20px;">
                    <div>
                        <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">💰 Prix unitaire (€):</label>
                        <input type="number" id="edit-prix" value="${item.prix}" min="0" step="0.01" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                    </div>
                    
                    <div>
                        <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📦 Stock actuel:</label>
                        <input type="number" id="edit-stock" value="${item.stock}" min="0" step="1" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                    </div>
                </div>
                
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:25px;">
                    <div>
                        <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">⚠️ Seuil d'alerte:</label>
                        <input type="number" id="edit-seuil" value="${item.seuilAlerte}" min="0" step="1" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                    </div>
                    
                    <div>
                        <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📏 Unité:</label>
                        <input type="text" id="edit-unite" value="${item.unite}" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                    </div>
                </div>
                
                <div style="display:flex;gap:12px;">
                    <button onclick="sauvegarderModifConsommable('${categorieId}', '${itemRef}')" style="flex:1;padding:14px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1.1em;font-weight:800;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.3);">
                        ✅ ENREGISTRER
                    </button>
                    <button onclick="ouvrirConsommables()" style="padding:14px 24px;border:2px solid #64748b;background:white;color:#64748b;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal-assignation').style.display = 'block';
};

// Sauvegarder la modification
window.sauvegarderModifConsommable = function(categorieId, oldRef) {
    const nouveauNom = document.getElementById('edit-nom').value.trim();
    const nouvelleRef = document.getElementById('edit-ref').value.trim();
    const nouveauPrix = parseFloat(document.getElementById('edit-prix').value) || 0;
    const nouveauStock = parseInt(document.getElementById('edit-stock').value) || 0;
    const nouveauSeuil = parseInt(document.getElementById('edit-seuil').value) || 0;
    const nouvelleUnite = document.getElementById('edit-unite').value.trim();
    
    if (!nouveauNom || !nouvelleRef) {
        alert('❌ Le nom et la référence sont obligatoires');
        return;
    }
    
    const data = getConsommablesData();
    const categorie = data.categories[categorieId];
    const item = categorie.items.find(i => i.ref === oldRef);
    
    if (!item) return;
    
    // Vérifier si la nouvelle référence existe déjà (si changée)
    if (nouvelleRef !== oldRef) {
        const refExiste = categorie.items.some(i => i.ref === nouvelleRef);
        if (refExiste) {
            alert('❌ Cette référence existe déjà dans cette catégorie');
            return;
        }
    }
    
    // Mettre à jour
    item.nom = nouveauNom;
    item.ref = nouvelleRef;
    item.prix = nouveauPrix;
    item.stock = nouveauStock;
    item.seuilAlerte = nouveauSeuil;
    item.unite = nouvelleUnite;
    
    // Enregistrer dans l'historique
    data.historique.push({
        date: new Date().toISOString(),
        type: 'modification',
        categorie: categorieId,
        item: nouveauNom,
        ref: nouvelleRef,
        ancienneRef: oldRef
    });
    
    localStorage.setItem('consommables_masques', JSON.stringify(data));
    
    showModal(
        '✅ Modification enregistrée',
        `Le consommable <strong>${nouveauNom}</strong> a été mis à jour avec succès.<br><br>
        📦 Stock: ${nouveauStock} ${nouvelleUnite}<br>
        💰 Prix: ${nouveauPrix}€<br>
        ⚠️ Seuil: ${nouveauSeuil}`,
        'success'
    );
    
    // Rafraîchir après 1 seconde
    setTimeout(() => {
        closeModal();
        ouvrirConsommables();
    }, 1500);
};

// Supprimer un consommable
window.supprimerConsommable = function(categorieId, itemRef) {
    const data = getConsommablesData();
    const categorie = data.categories[categorieId];
    const item = categorie.items.find(i => i.ref === itemRef);
    
    if (!item) return;
    
    if (confirm(`Voulez-vous vraiment supprimer le consommable :\n\n${item.nom} (${itemRef}) ?\n\nCette action est irréversible.`)) {
        const index = categorie.items.findIndex(i => i.ref === itemRef);
        if (index !== -1) {
            categorie.items.splice(index, 1);
            
            // Enregistrer dans l'historique
            data.historique.push({
                date: new Date().toISOString(),
                type: 'suppression',
                categorie: categorieId,
                item: item.nom,
                ref: itemRef
            });
            
            localStorage.setItem('consommables_masques', JSON.stringify(data));
            
            afficherToast(`🗑️ ${item.nom} supprimé`, 'success');
            ouvrirConsommables();
        }
    }
};

// Ajouter un nouveau consommable
window.ajouterNouveauConsommable = function(categorieId) {
    const data = getConsommablesData();
    const categorie = data.categories[categorieId];
    
    const html = `
        <div style="max-height:80vh;overflow-y:auto;padding-right:10px;">
            <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:25px;border-radius:15px 15px 0 0;">
                <h2 style="margin:0;font-size:1.8em;font-weight:800;">➕ Nouveau Consommable</h2>
                <div style="margin-top:8px;opacity:0.9;font-size:0.9em;">${categorie.icon} ${categorie.label}</div>
            </div>
            
            <div style="padding:25px;">
                <div style="margin-bottom:20px;">
                    <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📝 Nom du consommable: <span style="color:#ef4444;">*</span></label>
                    <input type="text" id="new-nom" placeholder="Ex: Filtre P3 Premium" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">🔢 Référence: <span style="color:#ef4444;">*</span></label>
                    <input type="text" id="new-ref" placeholder="Ex: FIL-P3-002" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                </div>
                
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:20px;">
                    <div>
                        <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">💰 Prix unitaire (€):</label>
                        <input type="number" id="new-prix" value="0" min="0" step="0.01" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                    </div>
                    
                    <div>
                        <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📦 Stock initial:</label>
                        <input type="number" id="new-stock" value="0" min="0" step="1" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                    </div>
                </div>
                
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:25px;">
                    <div>
                        <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">⚠️ Seuil d'alerte:</label>
                        <input type="number" id="new-seuil" value="10" min="0" step="1" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                    </div>
                    
                    <div>
                        <label style="display:block;margin-bottom:8px;font-weight:700;color:#1f2937;">📏 Unité:</label>
                        <input type="text" id="new-unite" value="unité" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                    </div>
                </div>
                
                <div style="display:flex;gap:12px;">
                    <button onclick="sauvegarderNouveauConsommable('${categorieId}')" style="flex:1;padding:14px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1.1em;font-weight:800;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.3);">
                        ✅ AJOUTER
                    </button>
                    <button onclick="ouvrirConsommables()" style="padding:14px 24px;border:2px solid #64748b;background:white;color:#64748b;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal-assignation').style.display = 'block';
};

// Sauvegarder le nouveau consommable
window.sauvegarderNouveauConsommable = function(categorieId) {
    const nom = document.getElementById('new-nom').value.trim();
    const ref = document.getElementById('new-ref').value.trim();
    const prix = parseFloat(document.getElementById('new-prix').value) || 0;
    const stock = parseInt(document.getElementById('new-stock').value) || 0;
    const seuil = parseInt(document.getElementById('new-seuil').value) || 10;
    const unite = document.getElementById('new-unite').value.trim() || 'unité';
    
    if (!nom || !ref) {
        alert('❌ Le nom et la référence sont obligatoires');
        return;
    }
    
    const newItem = {
        ref: ref,
        nom: nom,
        prix: prix,
        stock: stock,
        seuilAlerte: seuil,
        unite: unite
    };
    
    const resultat = ajouterConsommable(categorieId, newItem);
    
    if (resultat) {
        showModal(
            '✅ Consommable ajouté',
            `<strong>${nom}</strong> a été ajouté avec succès !<br><br>
            🔢 Référence: ${ref}<br>
            📦 Stock: ${stock} ${unite}<br>
            💰 Prix: ${prix}€`,
            'success'
        );
        
        setTimeout(() => {
            closeModal();
            ouvrirConsommables();
        }, 1500);
    } else {
        alert('❌ Erreur : Cette référence existe déjà');
    }
};

// Export Excel des consommables
window.exportConsommablesExcel = function() {
    alert('📊 Export Excel en développement...\n\nUtilisera la bibliothèque XLSX pour générer un fichier Excel avec tous les consommables.');
};

// Réinitialiser tous les consommables
window.reinitialiserConsommables = function() {
    if (confirm('⚠️ ATTENTION !\n\nVoulez-vous vraiment réinitialiser tous les consommables aux valeurs par défaut ?\n\nToutes vos modifications et historiques seront perdus.\n\nCette action est IRRÉVERSIBLE.')) {
        localStorage.removeItem('consommables_masques');
        afficherToast('🔄 Consommables réinitialisés', 'success');
        ouvrirConsommables();
    }
};

// ========== SCANNER NFC ==========
window.scannerNFC = async function() {
    // Vérifier si le navigateur supporte NFC
    if ('NDEFReader' in window) {
        try {
            const ndef = new NDEFReader();
            
            // Interface de scan
            const scanModal = document.createElement('div');
            scanModal.id = 'nfc-scan-modal';
            scanModal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:20000;';
            scanModal.innerHTML = `
                <div style="background:white;border-radius:20px;padding:40px;text-align:center;max-width:400px;">
                    <div style="font-size:4em;margin-bottom:20px;">📱</div>
                    <div style="font-size:1.5em;font-weight:800;color:#3b82f6;margin-bottom:15px;">Scan NFC en cours...</div>
                    <div style="color:#64748b;margin-bottom:25px;">Approchez l'équipement de votre téléphone</div>
                    <div style="background:#f0f9ff;padding:15px;border-radius:10px;margin-bottom:20px;">
                        <div style="font-size:3em;margin-bottom:10px;">📡</div>
                        <div id="nfc-status" style="font-size:0.9em;color:#1e40af;">En attente du signal NFC...</div>
                    </div>
                    <div style="background:#fef3c7;padding:12px;border-radius:8px;margin-bottom:15px;font-size:0.85em;color:#92400e;text-align:left;">
                        <strong>Format attendu sur la puce NFC :</strong><br>
                        MARQUE|REFERENCE|NUMERO<br>
                        <br>
                        <strong>Exemple :</strong><br>
                        DRAGER|11234567|120
                    </div>
                    <button onclick="document.getElementById('nfc-scan-modal').remove()" style="width:100%;padding:12px;border:2px solid #e2e8f0;background:white;color:#64748b;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;">
                        Annuler
                    </button>
                </div>
            `;
            document.body.appendChild(scanModal);
            
            console.log('🔍 Démarrage du scan NFC...');
            
            // Démarrer le scan
            await ndef.scan();
            console.log('✅ Scan NFC activé');
            
            document.getElementById('nfc-status').textContent = '✅ Scanner prêt - Approchez la puce';
            document.getElementById('nfc-status').style.color = '#10b981';
            
            ndef.addEventListener("reading", ({ message, serialNumber }) => {
                console.log('📡 Tag NFC détecté:', serialNumber);
                
                const modal = document.getElementById('nfc-scan-modal');
                if (modal) modal.remove();
                
                // Parser les données NFC
                let marque = '', reference = '', numeroAxens = '';
                let dataRaw = '';
                
                for (const record of message.records) {
                    console.log('📄 Record type:', record.recordType);
                    console.log('📄 Media type:', record.mediaType);
                    
                    // Gérer les différents types d'encodage
                    try {
                        let data = '';
                        
                        if (record.recordType === "text") {
                            // Pour les records de type texte
                            const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                            data = textDecoder.decode(record.data);
                        } else {
                            // Pour les autres types, essayer un décodage brut
                            const textDecoder = new TextDecoder('utf-8');
                            data = textDecoder.decode(record.data);
                        }
                        
                        // Nettoyer les caractères invisibles (BOM, etc.)
                        data = data.replace(/^\uFEFF/, '').trim();
                        dataRaw = data;
                        
                        console.log('📝 Données brutes:', data);
                        
                        // Format attendu: "MARQUE|REFERENCE|NUMERO"
                        const parts = data.split('|');
                        console.log('📊 Données parsées:', parts);
                        
                        if (parts.length >= 3) {
                            marque = parts[0].trim();
                            reference = parts[1].trim();
                            numeroAxens = parts[2].trim();
                        } else if (parts.length === 1) {
                            // Si pas de séparateur, afficher un message d'erreur informatif
                            showModal(
                                '⚠️ Format de puce incorrect',
                                `La puce contient : <strong>${data}</strong><br><br>
                                Format attendu :<br>
                                <code>MARQUE|REFERENCE|NUMERO</code><br><br>
                                Exemple :<br>
                                <code>DRAGER|11234567|120</code><br><br>
                                Veuillez reprogrammer la puce avec NFC Tools au bon format.`,
                                'warning'
                            );
                            return;
                        }
                    } catch (e) {
                        console.error('❌ Erreur de décodage:', e);
                    }
                }
                
                if (marque && reference && numeroAxens) {
                    // Normaliser la marque (majuscules, sans espaces)
                    marque = marque.toUpperCase().trim();
                    
                    // Vérifier que la marque est valide
                    const marqueValide = ['DRAGER', '3M'].includes(marque);
                    
                    console.log('📊 Marque normalisée:', marque);
                    console.log('✅ Marque valide:', marqueValide);
                    
                    // Remplir les champs
                    const selectMarque = document.getElementById('new-marque');
                    if (marqueValide) {
                        selectMarque.value = marque;
                        console.log('✅ Select marque rempli avec:', selectMarque.value);
                    } else {
                        console.warn('⚠️ Marque non reconnue:', marque, '- Valeurs acceptées: DRAGER, 3M');
                    }
                    
                    document.getElementById('new-ref').value = reference;
                    document.getElementById('new-modele').value = numeroAxens;
                    
                    // Date automatique à aujourd'hui
                    document.getElementById('new-date-mes').value = new Date().toISOString().split('T')[0];
                    
                    console.log('✅ Données chargées:', { marque, reference, numeroAxens });
                    
                    // Notification de succès avec avertissement si marque invalide
                    let message = `Données chargées :<br><br>
                        🏢 Marque: <strong>${marque}</strong> ${!marqueValide ? '⚠️ (non reconnue - sélectionnez manuellement)' : '✅'}<br>
                        📝 Référence: <strong>${reference}</strong><br>
                        🔢 N° Axens: <strong>${numeroAxens}</strong><br><br>`;
                    
                    if (!marqueValide) {
                        message += `<div style="background:#fef3c7;padding:10px;border-radius:8px;margin-top:10px;color:#92400e;">
                            ⚠️ La marque "<strong>${marque}</strong>" n'est pas dans la liste.<br>
                            Marques acceptées: <strong>DRAGER</strong> ou <strong>3M</strong><br>
                            Sélectionnez manuellement la bonne marque.
                        </div><br>`;
                    }
                    
                    message += 'Sélectionnez le statut initial et validez.';
                    
                    showModal(
                        '✅ Scan NFC réussi',
                        message,
                        'success'
                    );
                } else {
                    showModal(
                        '⚠️ Données incomplètes',
                        `Données lues : <strong>${dataRaw}</strong><br><br>
                        Les 3 champs n'ont pas pu être extraits.<br>
                        Marque: ${marque || '❌'}<br>
                        Référence: ${reference || '❌'}<br>
                        N° Axens: ${numeroAxens || '❌'}<br><br>
                        Vérifiez le format sur la puce NFC.`,
                        'warning'
                    );
                }
            });
            
            ndef.addEventListener("readingerror", () => {
                const modal = document.getElementById('nfc-scan-modal');
                if (modal) modal.remove();
                
                showModal(
                    '❌ Erreur de lecture NFC',
                    'Impossible de lire la puce NFC.<br>Réessayez ou vérifiez que la puce contient des données.',
                    'error'
                );
            });
            
        } catch (error) {
            const modal = document.getElementById('nfc-scan-modal');
            if (modal) modal.remove();
            
            console.error('❌ Erreur NFC:', error);
            
            let errorMsg = error.message;
            if (error.name === 'NotAllowedError') {
                errorMsg = 'Permission NFC refusée. Autorisez l\'accès au NFC dans les paramètres.';
            } else if (error.name === 'NotSupportedError') {
                errorMsg = 'NFC non supporté. Utilisez Chrome sur Android.';
            }
            
            showModal(
                '❌ Erreur NFC',
                `${errorMsg}<br><br>
                <strong>Prérequis :</strong><br>
                • Chrome sur Android<br>
                • HTTPS ou localhost<br>
                • NFC activé sur le téléphone<br>
                • Permission accordée`,
                'error'
            );
        }
    } else {
        // Simulation pour les navigateurs sans NFC
        showModal(
            '⚠️ NFC non disponible',
            `L'API Web NFC n'est pas disponible sur ce navigateur.<br><br>
            <strong>Prérequis :</strong><br>
            • Chrome sur Android (version 89+)<br>
            • HTTPS ou localhost<br><br>
            Voulez-vous utiliser le <strong>mode SIMULATION</strong> pour tester ?`,
            'warning'
        );
        
        setTimeout(() => {
            if (confirm('Activer le mode simulation ?')) {
                simulerScanNFC();
            }
        }, 100);
    }
};

// Fonction de simulation NFC pour les tests
window.simulerScanNFC = function() {
    const exemples = [
        { marque: 'DRAGER', reference: '11234567', numeroAxens: '120' },
        { marque: '3M', reference: '98765432', numeroAxens: '245' },
        { marque: 'DRAGER', reference: '55512345', numeroAxens: '089' },
        { marque: '3M', reference: '44498765', numeroAxens: '156' }
    ];
    
    // Choisir un exemple aléatoire
    const exemple = exemples[Math.floor(Math.random() * exemples.length)];
    
    // Animation de scan
    const scanModal = document.createElement('div');
    scanModal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:20000;';
    scanModal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:40px;text-align:center;max-width:400px;">
            <div style="font-size:4em;margin-bottom:20px;">📱</div>
            <div style="font-size:1.5em;font-weight:800;color:#3b82f6;margin-bottom:15px;">Simulation scan NFC...</div>
            <div style="color:#64748b;margin-bottom:25px;">Chargement des données...</div>
            <div style="background:#f0f9ff;padding:15px;border-radius:10px;">
                <div style="font-size:3em;margin-bottom:10px;">⏳</div>
                <div style="font-size:0.9em;color:#1e40af;">Traitement...</div>
            </div>
        </div>
    `;
    document.body.appendChild(scanModal);
    
    // Simuler un délai de scan
    setTimeout(() => {
        scanModal.remove();
        
        // Remplir les champs
        document.getElementById('new-marque').value = exemple.marque;
        document.getElementById('new-ref').value = exemple.reference;
        document.getElementById('new-modele').value = exemple.numeroAxens;
        
        // Date automatique à aujourd'hui
        document.getElementById('new-date-mes').value = new Date().toISOString().split('T')[0];
        
        // Notification de succès
        showModal(
            '✅ Scan NFC simulé réussi',
            `Données chargées (SIMULATION) :<br><br>
            🏢 Marque: <strong>${exemple.marque}</strong><br>
            📝 Référence: <strong>${exemple.reference}</strong><br>
            🔢 N° Axens: <strong>${exemple.numeroAxens}</strong><br><br>
            Sélectionnez le statut initial et validez.`,
            'success'
        );
    }, 1500);
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

// ========== SYSTÈME NFC (< 100 BYTES) ==========

// Vérifier disponibilité NFC au chargement
if ('NDEFReader' in window) {
    console.log('✅ NFC disponible sur cet appareil');
} else {
    console.log('⚠️ NFC non disponible (nécessite Chrome Android + HTTPS)');
}

// Valider taille message (max 100 bytes)
function validerTailleMessage(message, maxBytes = 100) {
    const taille = new Blob([message]).size;
    
    if (taille > maxBytes) {
        console.error(`❌ Message trop grand: ${taille} bytes (max: ${maxBytes})`);
        return { valide: false, taille };
    }
    
    console.log(`✅ Message valide: ${taille} bytes / ${maxBytes}`);
    return { valide: true, taille };
}

// ÉCRIRE TAG CASIER (format: "C:CI-042" = 9 bytes)
async function ecrireTagCasier(casierId) {
    try {
        const ndef = new NDEFReader();
        const message = `C:${casierId}`;
        
        const validation = validerTailleMessage(message);
        if (!validation.valide) {
            afficherToast(`Message trop grand: ${validation.taille} bytes`, 'error');
            return;
        }
        
        await ndef.write({
            records: [{
                recordType: "text",
                data: message,
                encoding: "utf-8",
                lang: "fr"
            }]
        });
        
        afficherToast(`✅ Tag casier ${casierId} écrit (${validation.taille} bytes)`, 'success', 4000);
        console.log(`📝 Tag écrit: ${message} (${validation.taille} bytes)`);
        
    } catch (error) {
        console.error('❌ Erreur écriture NFC:', error);
        afficherToast('Erreur écriture NFC: ' + error.message, 'error');
    }
}

// ÉCRIRE TAG ÉQUIPEMENT (format: "E:M-1234" ou "E:M-1234:CI-042" = 9-16 bytes)
async function ecrireTagEquipement(equipId, casierId = null) {
    try {
        const ndef = new NDEFReader();
        const message = casierId ? `E:${equipId}:${casierId}` : `E:${equipId}`;
        
        const validation = validerTailleMessage(message);
        if (!validation.valide) {
            afficherToast(`Message trop grand: ${validation.taille} bytes`, 'error');
            return;
        }
        
        await ndef.write({
            records: [{
                recordType: "text",
                data: message,
                encoding: "utf-8",
                lang: "fr"
            }]
        });
        
        afficherToast(`✅ Tag équipement ${equipId} écrit (${validation.taille} bytes)`, 'success', 4000);
        console.log(`📝 Tag écrit: ${message} (${validation.taille} bytes)`);
        
    } catch (error) {
        console.error('❌ Erreur écriture NFC:', error);
        afficherToast('Erreur écriture NFC: ' + error.message, 'error');
    }
}

// LIRE ET TRAITER TAG NFC
async function demarrerScanNFC() {
    // Vérifier compatibilité
    if (!('NDEFReader' in window)) {
        afficherToast(
            '❌ NFC non disponible. Nécessite Chrome Android 89+ en HTTPS',
            'error',
            6000
        );
        
        // Proposer mode simulation pour tests
        if (confirm('Voulez-vous activer le MODE SIMULATION pour tester ?')) {
            simulerScanNFC();
        }
        return;
    }
    
    try {
        const ndef = new NDEFReader();
        await ndef.scan();
        
        afficherToast('📱 Scan NFC activé. Approchez un tag...', 'info', 5000);
        console.log('🔍 Scan NFC démarré');
        
        ndef.addEventListener('reading', ({ message, serialNumber }) => {
            console.log('📡 Tag NFC détecté:', serialNumber);
            
            for (const record of message.records) {
                const decoder = new TextDecoder(record.encoding || 'utf-8');
                const data = decoder.decode(record.data);
                const taille = new Blob([data]).size;
                
                console.log(`📄 Données lues: "${data}" (${taille} bytes)`);
                
                // Parser format compact
                if (data.startsWith('C:')) {
                    // Tag CASIER : "C:CI-042"
                    const casierId = data.substring(2);
                    traiterScanCasier(casierId);
                    
                } else if (data.startsWith('E:')) {
                    // Tag ÉQUIPEMENT : "E:M-1234" ou "E:M-1234:CI-042"
                    const parts = data.substring(2).split(':');
                    const equipId = parts[0];
                    const casierId = parts[1] || null;
                    traiterScanEquipement(equipId, casierId);
                    
                } else {
                    console.warn('⚠️ Format tag inconnu:', data);
                    afficherToast('Format tag non reconnu', 'warning');
                }
            }
        });
        
        ndef.addEventListener('readingerror', () => {
            console.error('❌ Erreur lecture NFC');
            afficherToast('Erreur lors de la lecture du tag', 'error');
        });
        
    } catch (error) {
        console.error('❌ Erreur scan NFC:', error);
        
        if (error.name === 'NotAllowedError') {
            afficherToast('Permission NFC refusée. Autorisez l\'accès NFC.', 'error');
        } else if (error.name === 'NotSupportedError') {
            afficherToast('NFC non supporté sur cet appareil', 'error');
        } else {
            afficherToast('Erreur NFC: ' + error.message, 'error');
        }
    }
}

// TRAITER SCAN CASIER
function traiterScanCasier(casierId) {
    console.log(`🏷️ Casier scanné: ${casierId}`);
    
    const casier = casiers.find(c => c.id === casierId);
    
    if (!casier) {
        afficherToast(`❌ Casier ${casierId} non trouvé`, 'error');
        return;
    }
    
    if (casier.statut === 'LIBRE') {
        // Casier libre → Ouvrir assignation
        afficherToast(`✅ Casier ${casierId} scanné - Mode assignation`, 'success');
        ouvrirAssignationNFC(casier);
        
    } else if (casier.statut === 'OCCUPÉ' || casier.statut === 'EN ATTENTE') {
        // Casier occupé → Afficher info
        afficherToast(`ℹ️ Casier ${casierId} occupé par ${casier.prenom} ${casier.nom}`, 'info', 4000);
        afficherInfoCasierNFC(casier);
        
    } else {
        afficherToast(`⚠️ Casier ${casierId} inactif`, 'warning');
    }
}

// OUVRIR MODAL ASSIGNATION APRÈS SCAN CASIER
function ouvrirAssignationNFC(casier) {
    // Pré-remplir les champs
    document.getElementById('prenomAssignation').value = '';
    document.getElementById('nomAssignation').value = '';
    
    // Pré-sélection intelligente équipements selon plateforme
    const isPlatefomeCI = casier.platform === 'CI';
    
    // CI = Masque + Tuyau seulement
    // CA = Masque + Tuyau + Batterie + Moteur
    const checkMasque = document.getElementById('checkMasque');
    const checkTuyau = document.getElementById('checkTuyau');
    const checkBatterie = document.getElementById('checkBatterie');
    const checkMoteur = document.getElementById('checkMoteur');
    
    if (checkMasque) checkMasque.checked = true;
    if (checkTuyau) checkTuyau.checked = true;
    if (checkBatterie) checkBatterie.checked = !isPlatefomeCI;
    if (checkMoteur) checkMoteur.checked = !isPlatefomeCI;
    
    // Focus sur prénom
    setTimeout(() => {
        document.getElementById('prenomAssignation')?.focus();
    }, 300);
    
    // Afficher modal (utiliser la fonction existante ou créer)
    // Pour l'instant, on simule avec un prompt
    const prenom = prompt(`Casier ${casier.id} scanné\n\nPrénom de l'utilisateur:`);
    if (!prenom) return;
    
    const nom = prompt('Nom de l\'utilisateur:');
    if (!nom) return;
    
    // Assigner le casier
    casier.prenom = prenom;
    casier.nom = nom;
    casier.statut = 'OCCUPÉ';
    casier.dateAssignation = new Date().toISOString();
    
    // Équipements (TODO: gérer la sélection)
    casier.equipements = {
        masque: true,
        tuyau: true,
        batterie: !isPlatefomeCI,
        moteur: !isPlatefomeCI
    };
    
    // Sauvegarder
    saveCasiers();
    renderCasiers();
    
    afficherToast(
        `✅ Casier ${casier.id} assigné à ${prenom} ${nom}`,
        'success',
        4000
    );
    
    console.log(`✅ Assignation NFC: ${casier.id} → ${prenom} ${nom}`);
}

// AFFICHER INFO CASIER OCCUPÉ
function afficherInfoCasierNFC(casier) {
    const info = `
🏷️ CASIER ${casier.id}
━━━━━━━━━━━━━━━━━━
👤 Propriétaire: ${casier.prenom} ${casier.nom}
📅 Assigné le: ${new Date(casier.dateAssignation || Date.now()).toLocaleDateString('fr-FR')}
📊 Statut: ${casier.statut}
🎯 Plateforme: ${casier.platform}
    `;
    
    alert(info);
    console.log('ℹ️ Info casier:', casier);
}

// TRAITER SCAN ÉQUIPEMENT
function traiterScanEquipement(equipId, casierId) {
    console.log(`🛠️ Équipement scanné: ${equipId}${casierId ? ' (casier: ' + casierId + ')' : ''}`);
    
    // Chercher l'équipement (masque, tuyau, batterie, moteur)
    let equip = null;
    let type = '';
    let collection = null;
    
    if (equipId.startsWith('M-')) {
        type = 'Masque';
        collection = masques;
    } else if (equipId.startsWith('T-')) {
        type = 'Tuyau';
        collection = tuyaux;
    } else if (equipId.startsWith('B-')) {
        type = 'Batterie';
        collection = batteries;
    } else if (equipId.startsWith('MOT-')) {
        type = 'Moteur';
        collection = moteurs;
    }
    
    if (collection) {
        equip = collection.find(e => e.reference === equipId);
    }
    
    if (!equip) {
        afficherToast(`❌ Équipement ${equipId} non trouvé`, 'error');
        return;
    }
    
    afficherToast(`✅ ${type} ${equipId} scanné`, 'success');
    afficherInfoEquipementNFC(equip, type);
}

// AFFICHER INFO ÉQUIPEMENT
function afficherInfoEquipementNFC(equip, type) {
    const info = `
🛠️ ${type.toUpperCase()} ${equip.reference}
━━━━━━━━━━━━━━━━━━
👤 Propriétaire: ${equip.assigneA || 'Non assigné'}
🏷️ Casier: ${equip.casier || '-'}
📅 Date assignation: ${equip.dateAssignation ? new Date(equip.dateAssignation).toLocaleDateString('fr-FR') : '-'}
📊 État: ${equip.etat || 'BON'}
🔄 Dernière MAJ: ${equip.derniereMaj || 'Jamais'}
    `;
    
    alert(info);
    console.log(`ℹ️ Info ${type}:`, equip);
    
    // TODO: Ajouter bouton Export PDF
}

// MODE SIMULATION (pour tests sans NFC)
function simulerScanNFC() {
    afficherToast('🧪 MODE SIMULATION activé', 'info', 3000);
    
    const choix = prompt(
        'SIMULATION NFC\n\n' +
        '1. Scanner casier CI-001\n' +
        '2. Scanner casier CA-A-05\n' +
        '3. Scanner masque M-1234\n' +
        '4. Scanner tuyau T-5678\n\n' +
        'Votre choix (1-4):'
    );
    
    switch(choix) {
        case '1':
            traiterScanCasier('CI-001');
            break;
        case '2':
            traiterScanCasier('CA-A-05');
            break;
        case '3':
            traiterScanEquipement('M-1234', null);
            break;
        case '4':
            traiterScanEquipement('T-5678', 'CI-042');
            break;
        default:
            afficherToast('Simulation annulée', 'info');
    }
}

// UTILITAIRES NFC
function programmerTousLesCasiers() {
    if (!confirm(`Voulez-vous programmer ${casiers.length} tags casiers ?\n\nAppuyez sur OK puis approchez un tag à chaque bip.`)) {
        return;
    }
    
    let index = 0;
    
    async function programmerProchain() {
        if (index >= casiers.length) {
            afficherToast('✅ Tous les casiers ont été programmés!', 'success', 5000);
            return;
        }
        
        const casier = casiers[index];
        await ecrireTagCasier(casier.id);
        
        index++;
        
        // Attendre 3 secondes avant le prochain
        setTimeout(() => {
            if (confirm(`Tag ${index}/${casiers.length} écrit.\n\nContinuer avec le prochain (${casiers[index]?.id}) ?`)) {
                programmerProchain();
            }
        }, 3000);
    }
    
    programmerProchain();
}

// ============================================
// 🎬 POPUP ANIMÉE NFC
// ============================================
function afficherPopupNFC(titre, message, icone, couleur) {
    const modal = document.getElementById('modal-assignation');
    const overlay = document.getElementById('modal-overlay');
    
    modal.innerHTML = `
        <div style="text-align:center;padding:30px;animation:slideIn 0.3s ease-out;">
            <style>
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
            
            <div style="font-size:5em;margin-bottom:20px;animation:pulse 2s infinite;">${icone}</div>
            <h2 style="color:${couleur};margin:0 0 15px 0;font-size:1.8em;font-weight:800;">${titre}</h2>
            <p style="color:#64748b;font-size:1.2em;margin:0 0 25px 0;line-height:1.5;">${message}</p>
            
            <div style="background:linear-gradient(135deg,${couleur}15 0%,${couleur}05 100%);border:3px dashed ${couleur};border-radius:15px;padding:25px;margin-bottom:20px;">
                <div style="font-size:3em;animation:spin 3s linear infinite;">📱</div>
                <p style="color:${couleur};font-weight:700;font-size:1.1em;margin:10px 0 0 0;">Approchez le tag maintenant...</p>
            </div>
            
            <div style="display:flex;gap:5px;justify-content:center;margin-top:20px;">
                <div style="width:12px;height:12px;background:${couleur};border-radius:50%;animation:pulse 1s infinite;"></div>
                <div style="width:12px;height:12px;background:${couleur};border-radius:50%;animation:pulse 1s infinite 0.2s;"></div>
                <div style="width:12px;height:12px;background:${couleur};border-radius:50%;animation:pulse 1s infinite 0.4s;"></div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
}

function fermerPopupNFC() {
    const modal = document.getElementById('modal-assignation');
    const overlay = document.getElementById('modal-overlay');
    modal.style.display = 'none';
    overlay.style.display = 'none';
}

// ============================================
// 📱 FORMAT 1: ÉCRIRE TAG APRÈS VALIDATION OCCUPATION
// Format: "Nom Prenom | Masque:REF | Tuyau:REF"
// ============================================
async function ecrireTagOccupation(locker) {
    if (!('NDEFReader' in window)) {
        alert('❌ NFC non disponible. Chrome Android 89+ requis.');
        return;
    }
    
    try {
        // Construire message optimisé (< 100 bytes)
        const nom = (locker.nom || '').substring(0, 15);
        const prenom = (locker.prenom || '').substring(0, 15);
        const masque = (locker.refMasque || 'N/A').substring(0, 12);
        const tuyau = (locker.refTuyau || 'N/A').substring(0, 12);
        
        const message = `${nom} ${prenom}|M:${masque}|T:${tuyau}`;
        
        // Valider taille
        const validation = validerTailleMessage(message);
        if (!validation.valide) {
            alert(`❌ Données trop longues: ${validation.taille} bytes (max 100)`);
            return;
        }
        
        // 🎬 AFFICHER POPUP ANIMÉE
        afficherPopupNFC(
            '📝 METTRE LE TAG',
            `Programmation du casier ${locker.id}\npour ${nom} ${prenom}`,
            '📱',
            '#667eea'
        );
        
        console.log(`📝 En attente du tag pour écriture...`);
        
        // Écrire sur le tag
        const ndef = new NDEFReader();
        await ndef.write({
            records: [{
                recordType: "text",
                data: message,
                encoding: "utf-8",
                lang: "fr"
            }]
        });
        
        // Fermer popup
        fermerPopupNFC();
        
        // Confirmation de succès
        afficherToast(
            `✅ Tag NFC écrit avec succès!\n${message}\n(${validation.taille}/100 bytes)`,
            'success',
            6000
        );
        
        setTimeout(() => {
            alert(`✅ TAG PROGRAMMÉ\n\nCasier: ${locker.id}\nUtilisateur: ${nom} ${prenom}\nMasque: ${masque}\nTuyau: ${tuyau}\n\nTaille: ${validation.taille} bytes`);
        }, 500);
        
        console.log(`📝 Tag occupation écrit: "${message}" (${validation.taille} bytes)`);
        
    } catch (error) {
        fermerPopupNFC();
        console.error('❌ Erreur écriture NFC:', error);
        
        let messageErreur = '❌ ERREUR PROGRAMMATION TAG\n\n';
        if (error.name === 'NotAllowedError') {
            messageErreur += 'Permission refusée. Activez NFC dans les paramètres.';
        } else if (error.name === 'AbortError') {
            messageErreur += 'Opération annulée. Maintenez le tag plus longtemps.';
        } else {
            messageErreur += error.message;
        }
        
        alert(messageErreur);
    }
}

// ============================================
// 📱 FORMAT 2: LIRE TAG POUR IDENTIFIER PROPRIÉTAIRE
// Affiche: Nom Prenom + Références équipements
// ============================================
window.lireTagIdentification = async function() {
    if (!('NDEFReader' in window)) {
        alert('❌ NFC non disponible.\n\nNécessite Chrome Android 89+ en HTTPS.\n\nPour tester en local: https://localhost');
        return;
    }
    
    try {
        const ndef = new NDEFReader();
        await ndef.scan();
        
        afficherToast(
            '📱 SCAN NFC ACTIVÉ\n\nApprochez le tag du casier pour identifier le propriétaire...',
            'info',
            10000
        );
        
        console.log('🔍 Mode identification: Scan NFC démarré');
        
        ndef.addEventListener('reading', ({ message, serialNumber }) => {
            console.log('📡 Tag détecté:', serialNumber);
            
            for (const record of message.records) {
                const decoder = new TextDecoder(record.encoding || 'utf-8');
                const data = decoder.decode(record.data);
                const taille = new Blob([data]).size;
                
                console.log(`📄 Données: "${data}" (${taille} bytes)`);
                
                // Afficher l'information
                afficherInfoTag(data, serialNumber);
                break;
            }
        });
        
        ndef.addEventListener('readingerror', () => {
            console.error('❌ Erreur lecture NFC');
            afficherToast('❌ Erreur de lecture du tag', 'error', 3000);
        });
        
    } catch (error) {
        console.error('❌ Erreur scan NFC:', error);
        alert(`❌ Erreur NFC:\n\n${error.message}\n\nVérifiez que NFC est activé dans les paramètres Android.`);
    }
};

// Afficher modal avec info du tag
function afficherInfoTag(data, serialNumber) {
    const modal = document.getElementById('modal-assignation');
    const overlay = document.getElementById('modal-overlay');
    
    // DÉTECTION DU TYPE DE TAG
    
    // Format CASIER: "Nom Prenom|M:REF|T:REF"
    if (data.includes('|')) {
        const parts = data.split('|');
        const nomComplet = parts[0] || 'Inconnu';
        const masque = parts[1] || 'N/A';
        const tuyau = parts[2] || 'N/A';
        
        modal.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <div style="font-size:4em;margin-bottom:15px;">🗄️</div>
                <h2 style="color:#667eea;margin:0 0 20px 0;font-size:1.5em;">Tag CASIER Identifié</h2>
                
                <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;text-align:left;">
                    <div style="margin-bottom:15px;padding-bottom:15px;border-bottom:2px solid #e2e8f0;">
                        <div style="color:#64748b;font-size:0.85em;margin-bottom:5px;">👤 Propriétaire</div>
                        <div style="color:#1e293b;font-size:1.3em;font-weight:700;">${nomComplet}</div>
                    </div>
                    
                    <div style="margin-bottom:15px;padding-bottom:15px;border-bottom:2px solid #e2e8f0;">
                        <div style="color:#64748b;font-size:0.85em;margin-bottom:5px;">😷 Masque</div>
                        <div style="color:#1e293b;font-size:1.1em;font-weight:600;">${masque}</div>
                    </div>
                    
                    <div style="margin-bottom:15px;">
                        <div style="color:#64748b;font-size:0.85em;margin-bottom:5px;">💨 Tuyau</div>
                        <div style="color:#1e293b;font-size:1.1em;font-weight:600;">${tuyau}</div>
                    </div>
                    
                    <div style="background:#dbeafe;border-radius:8px;padding:10px;margin-top:15px;">
                        <div style="color:#1e40af;font-size:0.75em;">Serial: ${serialNumber}</div>
                        <div style="color:#1e40af;font-size:0.75em;">Taille: ${new Blob([data]).size} bytes</div>
                    </div>
                </div>
                
                <button onclick="closeModal()" style="width:100%;padding:15px;border:none;background:#667eea;color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
                    ✅ Fermer
                </button>
            </div>
        `;
        
        afficherToast(`✅ Casier identifié: ${nomComplet}`, 'success', 4000);
    }
    // Format ÉQUIPEMENT: "TYPE:REF:CASIER" (ex: "M:M-1234:CI-042")
    else if (data.includes(':')) {
        const parts = data.split(':');
        const type = parts[0];
        const ref = parts[1] || 'N/A';
        const casier = parts[2] || 'Non affecté';
        
        // Icônes selon le type
        const icons = {
            'M': '😷',
            'T': '💨',
            'MOT': '⚙️',
            'BAT': '🔋'
        };
        
        const noms = {
            'M': 'MASQUE',
            'T': 'TUYAU',
            'MOT': 'MOTEUR',
            'BAT': 'BATTERIE'
        };
        
        const icon = icons[type] || '📦';
        const nomType = noms[type] || 'ÉQUIPEMENT';
        
        modal.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <div style="font-size:4em;margin-bottom:15px;">${icon}</div>
                <h2 style="color:#667eea;margin:0 0 20px 0;font-size:1.5em;">Tag ÉQUIPEMENT Identifié</h2>
                
                <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;text-align:left;">
                    <div style="margin-bottom:15px;padding-bottom:15px;border-bottom:2px solid #e2e8f0;">
                        <div style="color:#64748b;font-size:0.85em;margin-bottom:5px;">📦 Type</div>
                        <div style="color:#1e293b;font-size:1.3em;font-weight:700;">${icon} ${nomType}</div>
                    </div>
                    
                    <div style="margin-bottom:15px;padding-bottom:15px;border-bottom:2px solid #e2e8f0;">
                        <div style="color:#64748b;font-size:0.85em;margin-bottom:5px;">🔢 Référence</div>
                        <div style="color:#1e293b;font-size:1.1em;font-weight:600;">${ref}</div>
                    </div>
                    
                    <div style="margin-bottom:15px;padding-bottom:15px;border-bottom:2px solid ${casier === 'Non affecté' ? '#fecaca' : '#e2e8f0'};">
                        <div style="color:#64748b;font-size:0.85em;margin-bottom:5px;">🗄️ Casier affecté</div>
                        <div style="color:${casier === 'Non affecté' ? '#dc2626' : '#10b981'};font-size:1.1em;font-weight:600;">${casier}</div>
                    </div>
                    
                    <div style="background:#dbeafe;border-radius:8px;padding:10px;margin-top:15px;">
                        <div style="color:#1e40af;font-size:0.75em;">Serial: ${serialNumber}</div>
                        <div style="color:#1e40af;font-size:0.75em;">Taille: ${new Blob([data]).size} bytes</div>
                        <div style="color:#1e40af;font-size:0.75em;">Format: ${data}</div>
                    </div>
                </div>
                
                <button onclick="closeModal()" style="width:100%;padding:15px;border:none;background:#667eea;color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
                    ✅ Fermer
                </button>
            </div>
        `;
        
        afficherToast(`✅ ${nomType} ${ref} - Casier: ${casier}`, 'success', 5000);
    }
    // Format LIBRE
    else {
        modal.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <div style="font-size:4em;margin-bottom:15px;">✅</div>
                <h2 style="color:#10b981;margin:0 0 20px 0;font-size:1.5em;">Tag LIBRE</h2>
                
                <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
                    <p style="color:#64748b;margin:0;font-size:1.1em;">${data}</p>
                </div>
                
                <button onclick="closeModal()" style="width:100%;padding:15px;border:none;background:#667eea;color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;">
                    ✅ Fermer
                </button>
            </div>
        `;
        
        afficherToast(`✅ Tag libre: ${data}`, 'success', 3000);
    }
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
}

// ============================================
// 🗑️ EFFACER TAG NFC (Remise à zéro pour nouveau utilisateur)
// ============================================
async function effacerTagNFC(casierId) {
    if (!('NDEFReader' in window)) {
        alert('❌ NFC NON DISPONIBLE\n\nCette fonctionnalité nécessite:\n- Chrome Android 89+\n- HTTPS (ou localhost)\n- NFC activé dans les paramètres');
        return;
    }
    
    try {
        // Message de reset
        const messageReset = `LIBRE:${casierId}`;
        
        const validation = validerTailleMessage(messageReset);
        if (!validation.valide) {
            alert('❌ Erreur: Message trop grand');
            return;
        }
        
        // 🎬 AFFICHER POPUP ANIMÉE "REMISE À ZÉRO"
        afficherPopupNFC(
            '🗑️ REMISE À ZÉRO',
            `Effacement du tag du casier ${casierId}\nPréparation pour la prochaine personne`,
            '🔄',
            '#ef4444'
        );
        
        console.log(`🗑️ Démarrage effacement tag pour casier ${casierId}`);
        console.log(`✍️ Tentative écriture: "${messageReset}"`);
        
        const ndef = new NDEFReader();
        
        // ÉCRIRE SUR LE TAG (attend que l'utilisateur approche le tag)
        await ndef.write({
            records: [{
                recordType: "text",
                data: messageReset,
                encoding: "utf-8",
                lang: "fr"
            }]
        });
        
        console.log(`✅ Tag effacé avec succès: "${messageReset}" (${validation.taille} bytes)`);
        
        // Fermer popup
        fermerPopupNFC();
        
        // ✅ MESSAGE DE CONFIRMATION "TAG OK VIERGE"
        afficherToast(
            `✅ TAG OK VIERGE\n\nCasier ${casierId} réinitialisé et prêt`,
            'success',
            6000
        );
        
        // Confirmation visuelle détaillée
        setTimeout(() => {
            alert(`✅ TAG OK VIERGE\n\nCasier ${casierId} a été réinitialisé avec succès.\n\nFormat écrit: ${messageReset}\nTaille: ${validation.taille} bytes\n\n✅ Le tag est VIERGE et prêt pour la prochaine personne.`);
        }, 1000);
        
    } catch (error) {
        fermerPopupNFC();
        console.error('❌ ERREUR EFFACEMENT NFC:', error);
        
        // Message d'erreur détaillé
        let messageErreur = '❌ ERREUR REMISE À ZÉRO\n\n';
        
        if (error.name === 'NotAllowedError') {
            messageErreur += 'Permission refusée.\nVérifiez que NFC est activé dans les paramètres Android.';
        } else if (error.name === 'NotSupportedError') {
            messageErreur += 'NFC non supporté sur cet appareil.';
        } else if (error.name === 'AbortError') {
            messageErreur += 'Opération annulée.\nEssayez de maintenir le tag plus longtemps près du téléphone.';
        } else {
            messageErreur += `${error.name}: ${error.message}`;
        }
        
        alert(messageErreur);
    }
}

// ============================================
// 📦 ÉCRIRE TAG ÉQUIPEMENT INDIVIDUEL
// Format: "TYPE:REF:CASIER" (ex: "M:M-1234:CI-042")
// ============================================
window.ecrireTagEquipementIndividuel = async function(type, reference, casierId = null) {
    if (!('NDEFReader' in window)) {
        afficherToast('❌ NFC non disponible. Chrome Android 89+ requis.', 'error', 5000);
        return;
    }
    
    try {
        // Format optimisé
        const message = casierId ? `${type}:${reference}:${casierId}` : `${type}:${reference}:Non affecté`;
        
        // Valider taille < 100 bytes
        const validation = validerTailleMessage(message);
        if (!validation.valide) {
            afficherToast(`❌ Message trop grand: ${validation.taille} bytes (max 100)`, 'error', 6000);
            return;
        }
        
        // Écrire sur le tag
        const ndef = new NDEFReader();
        await ndef.write({
            records: [{
                recordType: "text",
                data: message,
                encoding: "utf-8",
                lang: "fr"
            }]
        });
        
        const noms = {
            'M': 'Masque',
            'T': 'Tuyau',
            'MOT': 'Moteur',
            'BAT': 'Batterie'
        };
        
        afficherToast(
            `✅ Tag ${noms[type] || 'Équipement'} écrit (${validation.taille}/100 bytes)\n${message}`,
            'success',
            5000
        );
        
        console.log(`📝 Tag équipement écrit: "${message}" (${validation.taille} bytes)`);
        
    } catch (error) {
        console.error('❌ Erreur écriture NFC:', error);
        afficherToast('❌ Erreur NFC: ' + error.message, 'error', 5000);
    }
};

// ============================================
// 📱 MENU PROGRAMMATION ÉQUIPEMENTS
// ============================================
window.ouvrirMenuProgrammationEquipements = function() {
    const modal = document.getElementById('modal-assignation');
    const overlay = document.getElementById('modal-overlay');
    
    modal.innerHTML = `
        <div style="padding:20px;">
            <h2 style="color:#667eea;margin:0 0 20px 0;font-size:1.5em;text-align:center;">📦 Programmer Tag Équipement</h2>
            
            <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#64748b;font-size:0.9em;margin-bottom:5px;">Type d'équipement</label>
                    <select id="type-equip" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                        <option value="M">😷 Masque</option>
                        <option value="T">💨 Tuyau</option>
                        <option value="MOT">⚙️ Moteur</option>
                        <option value="BAT">🔋 Batterie</option>
                    </select>
                </div>
                
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#64748b;font-size:0.9em;margin-bottom:5px;">Référence</label>
                    <input type="text" id="ref-equip" placeholder="Ex: M-1234" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                </div>
                
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#64748b;font-size:0.9em;margin-bottom:5px;">Casier affecté (optionnel)</label>
                    <input type="text" id="casier-equip" placeholder="Ex: CI-042 (laisser vide si non affecté)" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:1em;">
                </div>
            </div>
            
            <button onclick="programmerEquipementMaintenant()" style="width:100%;padding:15px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.4);margin-bottom:10px;">
                📱 Programmer le Tag NFC
            </button>
            
            <button onclick="closeModal()" style="width:100%;padding:12px;border:2px solid #e2e8f0;background:white;color:#64748b;font-size:1em;font-weight:600;border-radius:12px;cursor:pointer;">
                Annuler
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
};

window.programmerEquipementMaintenant = function() {
    const type = document.getElementById('type-equip').value;
    const ref = document.getElementById('ref-equip').value.trim();
    const casier = document.getElementById('casier-equip').value.trim() || null;
    
    if (!ref) {
        alert('❌ Veuillez saisir une référence');
        return;
    }
    
    closeModal();
    ecrireTagEquipementIndividuel(type, ref, casier);
};

// ========== SYSTÈME D'ADMINISTRATION ==========

// Variables globales admin
let adminClicks = 0;
let adminClickTimer = null;
// Code admin hashé en SHA-256 (pour ne pas l'exposer en clair)
// Hash de "ADMIN123" = 483c9754cba44a5c82d1f6dfe5eef320ba02bbf2c5d1d881a85d8e59d5d0e44e
const ADMIN_CODE_HASH = '483c9754cba44a5c82d1f6dfe5eef320ba02bbf2c5d1d881a85d8e59d5d0e44e';
const ADMIN_SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 heures

// Fonction pour hasher le code saisi
async function hashAdminCode(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Vérifier si admin connecté
function isAdminAuthenticated() {
    const auth = sessionStorage.getItem('adminAuth');
    const expiry = sessionStorage.getItem('adminExpiry');
    
    if (auth === 'true' && expiry) {
        const now = Date.now();
        if (now < parseInt(expiry)) {
            return true;
        } else {
            // Session expirée
            deconnecterAdmin();
            return false;
        }
    }
    return false;
}

// Triple clic sur le logo pour ouvrir auth
document.addEventListener('DOMContentLoaded', () => {
    const logo = document.getElementById('app-title-logo');
    if (logo) {
        logo.addEventListener('click', function() {
            adminClicks++;
            
            if (adminClickTimer) {
                clearTimeout(adminClickTimer);
            }
            
            if (adminClicks === 3) {
                adminClicks = 0;
                if (isAdminAuthenticated()) {
                    ouvrirDashboardAdmin();
                } else {
                    ouvrirAuthAdmin();
                }
            }
            
            adminClickTimer = setTimeout(() => {
                adminClicks = 0;
            }, 1000);
        });
    }
    
    // Vérifier si admin déjà authentifié
    if (isAdminAuthenticated()) {
        afficherBadgeAdmin();
    }
});

// Ouvrir modal authentification admin
function ouvrirAuthAdmin() {
    const html = `
        <div style="max-height:80vh;overflow-y:auto;padding-right:10px;">
            <div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:white;padding:30px;border-radius:20px 20px 0 0;text-align:center;">
                <div style="font-size:4em;margin-bottom:15px;">🔐</div>
                <h2 style="margin:0;font-size:2em;font-weight:800;">Authentification</h2>
                <p style="margin:10px 0 0 0;opacity:0.9;font-size:0.95em;">Accès Administrateur</p>
            </div>
            
            <div style="padding:30px;">
                <div style="background:#fef3c7;border:2px solid #f59e0b;padding:15px;border-radius:10px;margin-bottom:25px;">
                    <div style="display:flex;align-items:center;gap:10px;color:#92400e;">
                        <div style="font-size:1.5em;">⚠️</div>
                        <div style="font-size:0.9em;line-height:1.5;">
                            L'accès administrateur permet de <strong>modifier, supprimer et réinitialiser</strong> toutes les données du système.
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom:25px;">
                    <label style="display:block;margin-bottom:10px;font-weight:700;color:#1f2937;font-size:1.1em;">
                        🔑 Code d'accès:
                    </label>
                    <input type="password" id="admin-code-input" placeholder="Entrez le code administrateur" 
                        style="width:100%;padding:15px;border:3px solid #e2e8f0;border-radius:10px;font-size:1.1em;font-weight:700;text-align:center;letter-spacing:4px;"
                        maxlength="20" autocomplete="off">
                    <div id="admin-error" style="display:none;color:#ef4444;font-size:0.9em;margin-top:10px;font-weight:700;">
                        ❌ Code invalide. Veuillez réessayer.
                    </div>
                </div>
                
                <div style="display:flex;gap:12px;">
                    <button onclick="validerCodeAdmin()" style="flex:1;padding:16px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;font-size:1.1em;font-weight:800;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.3);">
                        ✅ VALIDER
                    </button>
                    <button onclick="closeModal()" style="padding:16px 24px;border:2px solid #64748b;background:white;color:#64748b;font-size:1em;font-weight:700;border-radius:12px;cursor:pointer;">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal-assignation').style.display = 'block';
    
    // Focus sur l'input
    setTimeout(() => {
        const input = document.getElementById('admin-code-input');
        if (input) {
            input.focus();
            // Valider avec Entrée
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    validerCodeAdmin();
                }
            });
        }
    }, 100);
}

// Valider le code admin
window.validerCodeAdmin = async function() {
    const input = document.getElementById('admin-code-input');
    const error = document.getElementById('admin-error');
    const code = input.value.trim();
    
    // Hasher le code saisi et comparer avec le hash stocké
    const codeHash = await hashAdminCode(code);
    
    if (codeHash === ADMIN_CODE_HASH) {
        // Authentification réussie
        const now = Date.now();
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminLoginTime', now.toString());
        sessionStorage.setItem('adminExpiry', (now + ADMIN_SESSION_DURATION).toString());
        
        afficherBadgeAdmin();
        closeModal();
        
        afficherToast('✅ Bienvenue Administrateur', 'success');
        
        setTimeout(() => {
            ouvrirDashboardAdmin();
        }, 500);
    } else {
        // Code invalide
        error.style.display = 'block';
        input.value = '';
        input.style.borderColor = '#ef4444';
        input.style.animation = 'shake 0.5s';
        setTimeout(() => {
            input.style.borderColor = '#e2e8f0';
            input.style.animation = '';
        }, 500);
    }
};

// Afficher badge admin
function afficherBadgeAdmin() {
    const badge = document.getElementById('admin-badge');
    const btnAdmin = document.getElementById('btn-admin');
    
    if (badge) badge.style.display = 'block';
    if (btnAdmin) btnAdmin.style.display = 'block';
    
    // Rafraîchir les boutons de la section équipements si elle est affichée
    if (currentSection === 'equipements') {
        renderEquipActions();
    }
}

// Déconnecter admin
function deconnecterAdmin() {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminLoginTime');
    sessionStorage.removeItem('adminExpiry');
    
    const badge = document.getElementById('admin-badge');
    const btnAdmin = document.getElementById('btn-admin');
    
    if (badge) badge.style.display = 'none';
    if (btnAdmin) btnAdmin.style.display = 'none';
    
    afficherToast('🚪 Déconnexion administrateur', 'info');
    
    // Rafraîchir les boutons de la section équipements si elle est affichée
    if (currentSection === 'equipements') {
        renderEquipActions();
    }
    
    if (currentSection === 'admin') {
        showSection('casiers');
    }
}

// Dashboard administrateur
window.ouvrirDashboardAdmin = function() {
    if (!isAdminAuthenticated()) {
        ouvrirAuthAdmin();
        return;
    }
    
    // Calculer statistiques globales
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    const masques = JSON.parse(localStorage.getItem(STORAGE_KEYS.masques)) || [];
    const tuyaux = JSON.parse(localStorage.getItem(STORAGE_KEYS.tuyaux)) || [];
    const moteurs = JSON.parse(localStorage.getItem(STORAGE_KEYS.moteurs)) || [];
    const batteries = JSON.parse(localStorage.getItem(STORAGE_KEYS.batteries)) || [];
    
    const casiersOccupes = lockers.filter(l => l.statut === 'OCCUPÉ').length;
    const totalEquip = masques.length + tuyaux.length + moteurs.length + batteries.length;
    const utilisateursActifs = lockers.filter(l => l.prenom && l.nom).length;
    
    let alertesConsommables = 0;
    let valeurStock = 0;
    if (typeof getAlerteStockBas !== 'undefined') {
        alertesConsommables = getAlerteStockBas().length;
        valeurStock = calculerValeurStock().total;
    }
    
    const html = `
        <div style="max-height:85vh;overflow-y:auto;padding-right:10px;">
            <!-- EN-TÊTE ADMIN -->
            <div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:white;padding:30px;border-radius:20px 20px 0 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;">
                    <div>
                        <div style="font-size:2.5em;font-weight:800;margin-bottom:8px;">⚙️ Dashboard Administrateur</div>
                        <div style="font-size:0.95em;opacity:0.9;">Gestion complète du système</div>
                    </div>
                    <button onclick="deconnecterAdmin();closeModal();" style="background:rgba(255,255,255,0.2);color:white;border:none;border-radius:10px;padding:12px 24px;font-weight:700;cursor:pointer;font-size:1em;">
                        🚪 Déconnexion
                    </button>
                </div>
            </div>
            
            <div style="padding:30px;">
                <!-- STATISTIQUES GLOBALES -->
                <div style="background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border:3px solid #3b82f6;padding:25px;border-radius:15px;margin-bottom:30px;">
                    <h3 style="margin:0 0 20px 0;font-size:1.4em;color:#1e40af;font-weight:800;">📊 Vue d'Ensemble</h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;">
                        <div style="background:white;padding:20px;border-radius:12px;text-align:center;border:2px solid #10b981;">
                            <div style="font-size:2.5em;font-weight:800;color:#10b981;">${lockers.length}</div>
                            <div style="font-size:0.85em;color:#64748b;margin-top:5px;">Total Casiers</div>
                            <div style="font-size:0.75em;color:#10b981;margin-top:5px;font-weight:700;">${casiersOccupes} occupés</div>
                        </div>
                        <div style="background:white;padding:20px;border-radius:12px;text-align:center;border:2px solid #3b82f6;">
                            <div style="font-size:2.5em;font-weight:800;color:#3b82f6;">${totalEquip}</div>
                            <div style="font-size:0.85em;color:#64748b;margin-top:5px;">Équipements</div>
                            <div style="font-size:0.75em;color:#3b82f6;margin-top:5px;font-weight:700;">${masques.length}M ${tuyaux.length}T ${moteurs.length}MOT ${batteries.length}BAT</div>
                        </div>
                        <div style="background:white;padding:20px;border-radius:12px;text-align:center;border:2px solid#8b5cf6;">
                            <div style="font-size:2.5em;font-weight:800;color:#8b5cf6;">${utilisateursActifs}</div>
                            <div style="font-size:0.85em;color:#64748b;margin-top:5px;">Utilisateurs</div>
                            <div style="font-size:0.75em;color:#8b5cf6;margin-top:5px;font-weight:700;">Actifs</div>
                        </div>
                        ${typeof getAlerteStockBas !== 'undefined' ? `
                        <div style="background:white;padding:20px;border-radius:12px;text-align:center;border:2px solid ${alertesConsommables > 0 ? '#ef4444' : '#10b981'};">
                            <div style="font-size:2.5em;font-weight:800;color:${alertesConsommables > 0 ? '#ef4444' : '#10b981'};">${valeurStock.toLocaleString('fr-FR')}€</div>
                            <div style="font-size:0.85em;color:#64748b;margin-top:5px;">Valeur Stock</div>
                            <div style="font-size:0.75em;color:${alertesConsommables > 0 ? '#ef4444' : '#10b981'};margin-top:5px;font-weight:700;">${alertesConsommables} alertes</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- GESTION DES DONNÉES -->
                <div style="margin-bottom:30px;">
                    <h3 style="margin:0 0 20px 0;font-size:1.4em;color:#1f2937;font-weight:800;">📋 Gestion des Données</h3>
                    <div style="display:grid;gap:15px;">
                        <button onclick="ouvrirConsommables()" style="padding:18px;border:none;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(139,92,246,0.3);text-align:left;display:flex;justify-content:space-between;align-items:center;">
                            <span>📦 Gérer les Consommables</span>
                            <span style="opacity:0.8;">→</span>
                        </button>
                        <button onclick="ouvrirPrixAccessoires()" style="padding:18px;border:none;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(245,158,11,0.3);text-align:left;display:flex;justify-content:space-between;align-items:center;">
                            <span>💰 Configuration Prix Accessoires</span>
                            <span style="opacity:0.8;">→</span>
                        </button>
                        <button onclick="genererFeuilleAudit()" style="padding:18px;border:none;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;font-size:1.1em;font-weight:700;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(102,126,234,0.3);text-align:left;display:flex;justify-content:space-between;align-items:center;">
                            <span>📋 Générer Feuille d'Audit</span>
                            <span style="opacity:0.8;">→</span>
                        </button>
                    </div>
                </div>
                
                <!-- ACTIONS CRITIQUES -->
                <div style="background:#fee2e2;border:3px solid #ef4444;padding:25px;border-radius:15px;margin-bottom:30px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
                        <div style="font-size:2em;">⚠️</div>
                        <div>
                            <h3 style="margin:0;font-size:1.4em;color:#991b1b;font-weight:800;">Actions Critiques</h3>
                            <p style="margin:5px 0 0 0;color:#7f1d1d;font-size:0.9em;">Ces actions sont irréversibles et nécessitent une double confirmation</p>
                        </div>
                    </div>
                    <div style="display:grid;gap:12px;">
                        <button onclick="reinitialiserCasiers()" style="padding:16px;border:2px solid #ef4444;background:white;color:#ef4444;font-size:1em;font-weight:700;border-radius:10px;cursor:pointer;text-align:left;">
                            🔄 Réinitialiser tous les Casiers (280 unités)
                        </button>
                        <button onclick="reinitialiserConsommables()" style="padding:16px;border:2px solid #ef4444;background:white;color:#ef4444;font-size:1em;font-weight:700;border-radius:10px;cursor:pointer;text-align:left;">
                            🔄 Réinitialiser les Consommables
                        </button>
                        <button onclick="reinitialiserPrixAccessoires();ouvrirPrixAccessoires();" style="padding:16px;border:2px solid #ef4444;background:white;color:#ef4444;font-size:1em;font-weight:700;border-radius:10px;cursor:pointer;text-align:left;">
                            🔄 Réinitialiser les Prix par Défaut
                        </button>
                        <button onclick="purgerToutesLesDonnees()" style="padding:16px;border:none;background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);color:white;font-size:1em;font-weight:700;border-radius:10px;cursor:pointer;box-shadow:0 4px 15px rgba(220,38,38,0.5);text-align:left;">
                            🗑️ PURGER TOUTES LES DONNÉES
                        </button>
                    </div>
                </div>
                
                <!-- INFO SESSION -->
                <div style="background:#fef3c7;border:2px solid #f59e0b;padding:15px;border-radius:12px;text-align:center;">
                    <div style="color:#92400e;font-size:0.9em;">
                        <strong>Session Administrateur</strong> • Expire dans ${Math.round((parseInt(sessionStorage.getItem('adminExpiry')) - Date.now()) / 1000 / 60)} minutes
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-assignation').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('modal-assignation').style.display = 'block';
};

// Purger toutes les données (super critique)
window.purgerToutesLesDonnees = function() {
    if (!confirm('⚠️⚠️⚠️ DANGER EXTRÊME ⚠️⚠️⚠️\n\nCette action va SUPPRIMER DÉFINITIVEMENT:\n• TOUS les casiers\n• TOUS les équipements\n• TOUS les utilisateurs\n• TOUS les consommables\n• TOUS les prix personnalisés\n• TOUT l\'historique\n\nCette action est TOTALEMENT IRRÉVERSIBLE.\n\nVoulez-vous VRAIMENT continuer ?')) {
        return;
    }
    
    if (!confirm('❗❗❗ DERNIÈRE CHANCE ❗❗❗\n\nVous êtes sur le point d\'effacer TOUTES LES DONNÉES.\n\nTapez OUI en majuscules dans la prochaine fenêtre pour confirmer.')) {
        return;
    }
    
    const confirmation = prompt('Tapez "OUI" en majuscules pour confirmer la purge totale :');
    if (confirmation !== 'OUI') {
        afficherToast('❌ Purge annulée', 'info');
        return;
    }
    
    // Purger tout
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    localStorage.removeItem('consommables_masques');
    
    afficherToast('🗑️ Toutes les données ont été purgées', 'success');
    
    setTimeout(() => {
        closeModal();
        location.reload();
    }, 1500);
};

console.log('✅ Gestion Masques Ventilés Digit 2.0 chargé avec succès !');
console.log('📱 Système NFC prêt (< 100 bytes garantis)');
console.log('📱 Format 1: Écriture casier après validation occupation');
console.log('📱 Format 2: Lecture identification (casiers + équipements)');
console.log('🗑️ Format 3: Effacement tag lors du passage INACTIF → LIBRE');
console.log('📦 Format 4: Écriture tag équipements individuels (M/T/MOT/BAT)');
console.log('🔐 Système Admin activé - Triple clic sur logo pour accès');
