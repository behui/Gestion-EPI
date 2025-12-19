// ============================================
// TABLEAU CONSOMMABLES MASQUES VENTILÉS
// Système de suivi des consommables et pièces détachées
// Mode Admin - Non visible dans l'interface principale
// ============================================

// Structure de données pour les consommables
const CONSOMMABLES_DATA = {
    // Catégories de consommables
    categories: {
        filtres: {
            label: 'Filtres',
            icon: '🔍',
            items: [
                { ref: 'FIL-P3-001', nom: 'Filtre P3 Standard', prix: 45, stock: 0, seuilAlerte: 20, unite: 'unité' },
                { ref: 'FIL-ABEK-001', nom: 'Filtre ABEK', prix: 52, stock: 0, seuilAlerte: 15, unite: 'unité' },
                { ref: 'FIL-CO-001', nom: 'Filtre CO', prix: 38, stock: 0, seuilAlerte: 10, unite: 'unité' }
            ]
        },
        membranes: {
            label: 'Membranes & Valves',
            icon: '⚙️',
            items: [
                { ref: 'MEM-EXH-001', nom: 'Membrane expiration', prix: 12, stock: 0, seuilAlerte: 30, unite: 'unité' },
                { ref: 'VAL-INSP-001', nom: 'Valve inspiration', prix: 18, stock: 0, seuilAlerte: 25, unite: 'unité' },
                { ref: 'VAL-SECU-001', nom: 'Valve sécurité', prix: 22, stock: 0, seuilAlerte: 15, unite: 'unité' }
            ]
        },
        joints: {
            label: 'Joints & Étanchéité',
            icon: '🔧',
            items: [
                { ref: 'JNT-VIS-001', nom: 'Joint de visière', prix: 8, stock: 0, seuilAlerte: 40, unite: 'unité' },
                { ref: 'JNT-RAC-001', nom: 'Joint de raccord', prix: 6, stock: 0, seuilAlerte: 50, unite: 'unité' },
                { ref: 'JNT-TUY-001', nom: 'Joint tuyau', prix: 5, stock: 0, seuilAlerte: 60, unite: 'unité' }
            ]
        },
        visieres: {
            label: 'Visières',
            icon: '👓',
            items: [
                { ref: 'VIS-STD-001', nom: 'Visière standard claire', prix: 35, stock: 0, seuilAlerte: 15, unite: 'unité' },
                { ref: 'VIS-ANTI-001', nom: 'Visière anti-buée', prix: 42, stock: 0, seuilAlerte: 12, unite: 'unité' },
                { ref: 'VIS-GOLD-001', nom: 'Visière dorée (soudure)', prix: 48, stock: 0, seuilAlerte: 8, unite: 'unité' }
            ]
        },
        sangles: {
            label: 'Sangles & Harnais',
            icon: '🎯',
            items: [
                { ref: 'SAN-TETE-001', nom: 'Sangle de tête', prix: 15, stock: 0, seuilAlerte: 20, unite: 'unité' },
                { ref: 'HAR-COMP-001', nom: 'Harnais complet', prix: 28, stock: 0, seuilAlerte: 10, unite: 'unité' },
                { ref: 'CLIP-FIX-001', nom: 'Clips de fixation', prix: 3, stock: 0, seuilAlerte: 80, unite: 'lot de 10' }
            ]
        },
        nettoyage: {
            label: 'Nettoyage & Entretien',
            icon: '🧼',
            items: [
                { ref: 'NET-DESI-001', nom: 'Solution désinfectante 500ml', prix: 12, stock: 0, seuilAlerte: 25, unite: 'flacon' },
                { ref: 'NET-LINGE-001', nom: 'Lingettes nettoyantes', prix: 8, stock: 0, seuilAlerte: 30, unite: 'boîte' },
                { ref: 'NET-BRSH-001', nom: 'Kit de brosses', prix: 18, stock: 0, seuilAlerte: 5, unite: 'kit' }
            ]
        },
        protection: {
            label: 'Protection & Accessoires',
            icon: '🛡️',
            items: [
                { ref: 'PRO-CAP-001', nom: 'Cagoule de protection', prix: 25, stock: 0, seuilAlerte: 15, unite: 'unité' },
                { ref: 'PRO-FIL-001', nom: 'Film protecteur visière', prix: 5, stock: 0, seuilAlerte: 50, unite: 'lot de 5' },
                { ref: 'PRO-SAC-001', nom: 'Sac de transport', prix: 20, stock: 0, seuilAlerte: 10, unite: 'unité' }
            ]
        }
    },
    
    // Historique des consommations (vide au départ)
    historique: [],
    
    // Configuration
    config: {
        alerteStockBas: true,
        notificationSeuilAtteint: true,
        suiviConsommationActif: false, // Désactivé par défaut
        modeAdmin: false // Réservé pour future interface admin
    }
};

// ========== FONCTIONS DE GESTION (NON UTILISÉES POUR LE MOMENT) ==========

// Initialiser les données dans localStorage (appelé uniquement en mode admin)
function initConsommablesData() {
    if (!localStorage.getItem('consommables_masques')) {
        localStorage.setItem('consommables_masques', JSON.stringify(CONSOMMABLES_DATA));
        console.log('✅ Données consommables initialisées');
    }
}

// Obtenir toutes les données consommables
function getConsommablesData() {
    const data = localStorage.getItem('consommables_masques');
    return data ? JSON.parse(data) : CONSOMMABLES_DATA;
}

// Mettre à jour le stock d'un consommable
function updateStockConsommable(categorieId, itemRef, nouveauStock) {
    const data = getConsommablesData();
    const categorie = data.categories[categorieId];
    
    if (categorie) {
        const item = categorie.items.find(i => i.ref === itemRef);
        if (item) {
            const ancienStock = item.stock;
            item.stock = nouveauStock;
            
            // Enregistrer dans l'historique
            data.historique.push({
                date: new Date().toISOString(),
                type: 'modification_stock',
                categorie: categorieId,
                item: item.nom,
                ref: itemRef,
                ancienStock: ancienStock,
                nouveauStock: nouveauStock,
                difference: nouveauStock - ancienStock
            });
            
            localStorage.setItem('consommables_masques', JSON.stringify(data));
            console.log(`📦 Stock mis à jour: ${item.nom} - ${ancienStock} → ${nouveauStock}`);
            
            // Vérifier le seuil d'alerte
            if (nouveauStock <= item.seuilAlerte && data.config.alerteStockBas) {
                console.warn(`⚠️ ALERTE STOCK BAS: ${item.nom} (${nouveauStock} ${item.unite})`);
            }
            
            return true;
        }
    }
    return false;
}

// Enregistrer une consommation
function enregistrerConsommation(categorieId, itemRef, quantite, utilisateur = null, masqueRef = null) {
    const data = getConsommablesData();
    const categorie = data.categories[categorieId];
    
    if (categorie) {
        const item = categorie.items.find(i => i.ref === itemRef);
        if (item && item.stock >= quantite) {
            item.stock -= quantite;
            
            // Enregistrer dans l'historique
            data.historique.push({
                date: new Date().toISOString(),
                type: 'consommation',
                categorie: categorieId,
                item: item.nom,
                ref: itemRef,
                quantite: quantite,
                stockRestant: item.stock,
                utilisateur: utilisateur,
                masqueRef: masqueRef,
                prixTotal: item.prix * quantite
            });
            
            localStorage.setItem('consommables_masques', JSON.stringify(data));
            console.log(`✅ Consommation enregistrée: ${quantite}x ${item.nom}`);
            
            // Vérifier le seuil d'alerte
            if (item.stock <= item.seuilAlerte && data.config.alerteStockBas) {
                console.warn(`⚠️ ALERTE STOCK BAS: ${item.nom} (${item.stock} ${item.unite})`);
            }
            
            return true;
        } else {
            console.error(`❌ Stock insuffisant pour ${item?.nom || itemRef}`);
            return false;
        }
    }
    return false;
}

// Ajouter un nouveau consommable à une catégorie
function ajouterConsommable(categorieId, newItem) {
    const data = getConsommablesData();
    const categorie = data.categories[categorieId];
    
    if (categorie) {
        // Vérifier que la référence n'existe pas déjà
        const existe = categorie.items.some(i => i.ref === newItem.ref);
        if (!existe) {
            categorie.items.push({
                ref: newItem.ref,
                nom: newItem.nom,
                prix: newItem.prix || 0,
                stock: newItem.stock || 0,
                seuilAlerte: newItem.seuilAlerte || 10,
                unite: newItem.unite || 'unité'
            });
            
            data.historique.push({
                date: new Date().toISOString(),
                type: 'ajout_consommable',
                categorie: categorieId,
                item: newItem.nom,
                ref: newItem.ref
            });
            
            localStorage.setItem('consommables_masques', JSON.stringify(data));
            console.log(`✅ Consommable ajouté: ${newItem.nom}`);
            return true;
        } else {
            console.error(`❌ Référence ${newItem.ref} existe déjà`);
            return false;
        }
    }
    return false;
}

// Obtenir les items en alerte de stock
function getAlerteStockBas() {
    const data = getConsommablesData();
    const alertes = [];
    
    Object.entries(data.categories).forEach(([catId, categorie]) => {
        categorie.items.forEach(item => {
            if (item.stock <= item.seuilAlerte) {
                alertes.push({
                    categorie: categorie.label,
                    categorieId: catId,
                    ...item
                });
            }
        });
    });
    
    return alertes;
}

// Calculer le coût total du stock actuel
function calculerValeurStock() {
    const data = getConsommablesData();
    let valeurTotale = 0;
    let details = {};
    
    Object.entries(data.categories).forEach(([catId, categorie]) => {
        let valeurCategorie = 0;
        categorie.items.forEach(item => {
            valeurCategorie += item.prix * item.stock;
        });
        details[catId] = {
            label: categorie.label,
            valeur: valeurCategorie
        };
        valeurTotale += valeurCategorie;
    });
    
    return {
        total: valeurTotale,
        details: details
    };
}

// Obtenir les statistiques de consommation
function getStatistiquesConsommation(dateDebut = null, dateFin = null) {
    const data = getConsommablesData();
    const consommations = data.historique.filter(h => h.type === 'consommation');
    
    // Filtrer par date si spécifié
    let filtered = consommations;
    if (dateDebut) {
        filtered = filtered.filter(c => new Date(c.date) >= new Date(dateDebut));
    }
    if (dateFin) {
        filtered = filtered.filter(c => new Date(c.date) <= new Date(dateFin));
    }
    
    // Calculer les statistiques
    const stats = {
        nbConsommations: filtered.length,
        coutTotal: filtered.reduce((sum, c) => sum + (c.prixTotal || 0), 0),
        parCategorie: {},
        parMois: {}
    };
    
    filtered.forEach(conso => {
        // Par catégorie
        if (!stats.parCategorie[conso.categorie]) {
            stats.parCategorie[conso.categorie] = {
                nb: 0,
                cout: 0
            };
        }
        stats.parCategorie[conso.categorie].nb++;
        stats.parCategorie[conso.categorie].cout += conso.prixTotal || 0;
        
        // Par mois
        const mois = new Date(conso.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
        if (!stats.parMois[mois]) {
            stats.parMois[mois] = {
                nb: 0,
                cout: 0
            };
        }
        stats.parMois[mois].nb++;
        stats.parMois[mois].cout += conso.prixTotal || 0;
    });
    
    return stats;
}

// Export des fonctions (si besoin d'utiliser dans unified-app.js)
if (typeof window !== 'undefined') {
    window.CONSOMMABLES_DATA = CONSOMMABLES_DATA;
    window.initConsommablesData = initConsommablesData;
    window.getConsommablesData = getConsommablesData;
    window.updateStockConsommable = updateStockConsommable;
    window.enregistrerConsommation = enregistrerConsommation;
    window.ajouterConsommable = ajouterConsommable;
    window.getAlerteStockBas = getAlerteStockBas;
    window.calculerValeurStock = calculerValeurStock;
    window.getStatistiquesConsommation = getStatistiquesConsommation;
}

console.log('📦 Module consommables-masques.js chargé (mode silencieux)');
