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

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 PPVE Digit 2.0 - Chargement...');
    console.log('DOM chargé, initialisation des données...');
    
    initData();
    console.log('✅ Données initialisées');
    
    renderDashboard();
    console.log('✅ Dashboard rendu');
    
    renderEquipementsApp();
    console.log('✅ Application équipements rendue');
    
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

    // Initialiser les équipements si inexistants
    ['masques', 'tuyaux', 'moteurs', 'batteries'].forEach(type => {
        if (!localStorage.getItem(STORAGE_KEYS[type])) {
            localStorage.setItem(STORAGE_KEYS[type], JSON.stringify([]));
        }
    });
}

// ========== DASHBOARD (STYLE VITRINEMASQUE) ==========
function renderDashboard() {
    const lockers = JSON.parse(localStorage.getItem(STORAGE_KEYS.lockers)) || [];
    
    // STATS PLATEFORMES
    renderStatsPlateforme(lockers);
    
    // STATS STATUTS
    renderStatsStatuts(lockers);
    
    // GRILLE CASIERS
    renderCasiersGrid(lockers);
}

function renderStatsPlateforme(lockers) {
    const stats = {
        tous: lockers.length,
        'CI': lockers.filter(l => l.platform === 'CI').length,
        'CA-A': lockers.filter(l => l.platform === 'CA-A').length,
        'CA-B': lockers.filter(l => l.platform === 'CA-B').length,
        'CA-C': lockers.filter(l => l.platform === 'CA-C').length
    };

    const icons = {
        tous: '🌐',
        'CI': '🏢',
        'CA-A': '🏗️',
        'CA-B': '🏭',
        'CA-C': '⚙️'
    };

    let html = '';
    Object.keys(stats).forEach(key => {
        const isActive = currentPlatformFilter === key ? 'active' : '';
        html += `
            <div class="stat-card ${isActive}" onclick="filterByPlatform('${key}')" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:20px 15px;border-radius:15px;cursor:pointer;text-align:center;box-shadow:0 4px 15px rgba(102,126,234,0.3);transition:all 0.3s;${isActive ? 'transform:scale(1.05);box-shadow:0 10px 30px rgba(102,126,234,0.6);border:3px solid white;' : ''}">
                <div style="font-size:1.8rem;margin-bottom:8px;">${icons[key]}</div>
                <div style="font-size:2rem;font-weight:800;margin-bottom:5px;">${stats[key]}</div>
                <div style="font-size:0.85rem;opacity:0.95;font-weight:600;">${key === 'tous' ? 'Tous' : key}</div>
            </div>
        `;
    });
    document.getElementById('stats-plateformes').innerHTML = html;
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

    // Filtrer par recherche
    if (currentSearchTerm) {
        filtered = filtered.filter(l =>
            l.id.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
            l.prenom.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
            l.nom.toLowerCase().includes(currentSearchTerm.toLowerCase())
        );
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
    renderDashboard();
};

window.setCasiersSearch = function(term) {
    currentSearchTerm = term;
    renderDashboard();
};

window.showCasierDetail = function(lockerId) {
    alert(`Détail du casier ${lockerId}\n\n(Modal d'attribution/validation/restitution/remise en service à développer selon vos besoins)`);
};

// ========== GESTION ÉQUIPEMENTS (STYLE PIKA) ==========
function renderEquipementsApp() {
    const html = `
        <div style="background:white;border-radius:20px;padding:25px;box-shadow:0 4px 15px rgba(0,0,0,0.08);margin-bottom:20px;">
            <h2 style="color:#667eea;font-size:1.8em;font-weight:800;margin-bottom:15px;">📦 Gestion des Équipements</h2>
            <p style="color:#64748b;margin-bottom:20px;">Suivi des masques, tuyaux, moteurs et batteries</p>
            
            <div id="equip-nav" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:20px;"></div>
            <div id="equip-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;"></div>
            <div id="equip-actions" style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;"></div>
            <div id="equip-list"></div>
        </div>
    `;
    document.getElementById('equipements-app').innerHTML = html;
    renderEquipNav();
    renderEquipStats();
    renderEquipActions();
    renderEquipList();
}

let currentEquipType = 'masques';

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
    const stock = data.filter(e => e.statut === 'stock').length;
    const utilisation = data.filter(e => e.statut === 'utilisation').length;

    document.getElementById('equip-stats').innerHTML = `
        <div style="background:linear-gradient(135deg,#f0f4ff 0%,#e0e7ff 100%);padding:20px;border-radius:12px;text-align:center;border:3px solid #667eea;">
            <div style="font-size:0.85rem;color:#667eea;font-weight:700;text-transform:uppercase;margin-bottom:8px;">📦 Total</div>
            <div style="font-size:2.5rem;font-weight:800;color:#667eea;">${data.length}</div>
        </div>
        <div style="background:linear-gradient(135deg,#fef3c7 0%,#fed7aa 100%);padding:20px;border-radius:12px;text-align:center;border:3px solid #f59e0b;">
            <div style="font-size:0.85rem;color:#d97706;font-weight:700;text-transform:uppercase;margin-bottom:8px;">🟠 Stock</div>
            <div style="font-size:2.5rem;font-weight:800;color:#f59e0b;">${stock}</div>
        </div>
        <div style="background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);padding:20px;border-radius:12px;text-align:center;border:3px solid #3b82f6;">
            <div style="font-size:0.85rem;color:#2563eb;font-weight:700;text-transform:uppercase;margin-bottom:8px;">🔵 Utilisation</div>
            <div style="font-size:2.5rem;font-weight:800;color:#3b82f6;">${utilisation}</div>
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

function renderEquipList() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    
    if (data.length === 0) {
        document.getElementById('equip-list').innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px;">Aucun équipement enregistré</p>';
        return;
    }

    let html = '<div style="display:grid;gap:15px;">';
    data.forEach(item => {
        const isStock = item.statut === 'stock';
        const bgColor = isStock ? '#fef3c7' : '#dbeafe';
        const borderColor = isStock ? '#f59e0b' : '#3b82f6';
        
        html += `
            <div style="background:${bgColor};padding:20px;border-radius:12px;border-left:5px solid ${borderColor};transition:all 0.3s;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
                    <div style="font-size:1.2em;font-weight:700;color:#1f2937;">${item.reference || '?'}</div>
                    <div style="padding:6px 16px;border-radius:20px;font-size:0.85em;font-weight:700;text-transform:uppercase;background:${borderColor};color:white;">
                        ${isStock ? '🟠 Stock' : '🔵 Utilisation'}
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:15px;padding:12px;background:white;border-radius:8px;">
                    <div><strong style="color:#6b7280;font-size:0.75em;text-transform:uppercase;">Date achat:</strong><br><span style="color:#1f2937;font-weight:700;">${item.dateAchat ? new Date(item.dateAchat).toLocaleDateString('fr-FR') : '-'}</span></div>
                    ${item.dateControle ? `<div><strong style="color:#6b7280;font-size:0.75em;text-transform:uppercase;">Dernier contrôle:</strong><br><span style="color:#1f2937;font-weight:700;">${new Date(item.dateControle).toLocaleDateString('fr-FR')}</span></div>` : ''}
                    ${item.utilisateur ? `<div><strong style="color:#6b7280;font-size:0.75em;text-transform:uppercase;">Utilisateur:</strong><br><span style="color:#1f2937;font-weight:700;">${item.utilisateur}</span></div>` : ''}
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    ${isStock ? `<button onclick="mettreEnService(${item.id})" style="padding:8px 16px;font-size:0.85em;border-radius:8px;border:none;background:#3b82f6;color:white;font-weight:700;cursor:pointer;">🔵 Mise en service</button>` : `<button onclick="mettreEnMaintenance(${item.id})" style="padding:8px 16px;font-size:0.85em;border-radius:8px;border:none;background:#f59e0b;color:white;font-weight:700;cursor:pointer;">🟠 Maintenance</button>`}
                    <button onclick="voirHistorique(${item.id})" style="padding:8px 16px;font-size:0.85em;border-radius:8px;border:none;background:#6366f1;color:white;font-weight:700;cursor:pointer;">📜 Historique</button>
                    <button onclick="supprimerEquipement(${item.id})" style="padding:8px 16px;font-size:0.85em;border-radius:8px;border:none;background:#ef4444;color:white;font-weight:700;cursor:pointer;">🗑️ Supprimer</button>
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
    const ref = prompt('Référence de l\'équipement:');
    if (!ref) return;
    
    const dateAchat = prompt('Date d\'achat (AAAA-MM-JJ):') || new Date().toISOString().split('T')[0];
    const statut = confirm('En utilisation ? (OK = Utilisation, Annuler = Stock)') ? 'utilisation' : 'stock';
    
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    data.push({
        id: Date.now(),
        reference: ref,
        dateAchat: dateAchat,
        dateControle: null,
        statut: statut,
        utilisateur: null,
        remarques: '',
        historique: [{
            date: new Date().toISOString(),
            action: 'Création',
            statut: statut,
            remarques: 'Équipement ajouté'
        }]
    });
    
    localStorage.setItem(STORAGE_KEYS[currentEquipType], JSON.stringify(data));
    renderEquipStats();
    renderEquipList();
    alert('✅ Équipement ajouté avec succès !');
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

window.supprimerEquipement = function(id) {
    if (!confirm('⚠️ Supprimer cet équipement ?')) return;
    
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[currentEquipType])) || [];
    const filtered = data.filter(e => e.id !== id);
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
    renderDashboard();
    renderEquipStats();
    renderEquipList();
});

window.showSection = function(section) {
    alert(`Navigation vers: ${section}\n\n(À développer: masquer le dashboard-vitrine et afficher la section appropriée)`);
};

console.log('✅ PPVE Digit 2.0 chargé avec succès !');
