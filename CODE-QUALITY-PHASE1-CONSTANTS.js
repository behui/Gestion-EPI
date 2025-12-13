// ═══════════════════════════════════════════════════════════════
// 📋 CONSTANTS (Code Quality Improvement - Phase 1)
// ═══════════════════════════════════════════════════════════════

/**
 * Configuration des casiers (évite magic numbers)
 */
const LOCKER_CONFIG = {
    TOTAL: 288,
    PLATFORMS: {
        CI: { count: 78, prefix: 'C', name: 'CI' },
        CA_A: { count: 70, prefix: 'CAA', name: 'CA-A' },
        CA_B: { count: 70, prefix: 'CAB', name: 'CA-B' },
        CA_C: { count: 70, prefix: 'CAC', name: 'CA-C' }
    }
};

/**
 * Statuts possibles des casiers (énumération)
 */
const LOCKER_STATUS = {
    LIBRE: 'LIBRE',
    EN_ATTENTE: 'EN ATTENTE',
    OCCUPE: 'OCCUPÉ',
    INACTIF: 'INACTIF'
};

/**
 * Statuts possibles des équipements (énumération)
 */
const EQUIPMENT_STATUS = {
    EN_STOCK: 'EN STOCK',
    EN_UTILISATION: 'EN UTILISATION',
    EN_MAINTENANCE: 'EN MAINTENANCE',
    HORS_SERVICE: 'HORS SERVICE'
};

/**
 * Messages standardisés de l'application
 */
const MESSAGES = {
    SUCCESS: {
        ASSIGN: (lockerId, prenom, nom) => `🟠 Casier ${lockerId} mis EN ATTENTE pour ${prenom} ${nom}`,
        ACTIVATE: (lockerId, prenom, nom, masque, tuyau) => `✅ Casier ${lockerId} activé et OCCUPÉ par ${prenom} ${nom}\n\nÉquipements validés :\n🎭 ${masque}\n🔧 ${tuyau || 'Aucun'}\n🔐 ${lockerId}`,
        DEACTIVATE: (lockerId) => `⚫ Casier ${lockerId} → INACTIF (nettoyage)`,
        REACTIVATE: (lockerId) => `🟢 Casier ${lockerId} → LIBRE (disponible)`,
        SAVE: '✅ Données sauvegardées dans Firebase',
        LOAD: '✅ Données chargées depuis Firebase'
    },
    ERROR: {
        INVALID_NAME: '❌ Le prénom/nom doit contenir entre 2 et 50 caractères (lettres uniquement)',
        INVALID_MASQUE: '❌ La référence du masque est invalide',
        INVALID_TUYAU: '❌ La référence du tuyau est invalide',
        LOCKER_NOT_FOUND: '❌ Casier introuvable',
        PROFILE_NOT_FOUND: '❌ Profil utilisateur introuvable. Contactez un administrateur.',
        SAVE_ERROR: '⚠️ Erreur lors de la sauvegarde. Les données sont sauvegardées localement.',
        LOAD_ERROR: '❌ Erreur chargement profil.'
    },
    WARNING: {
        VALIDATION: 'En cochant ces cases, vous confirmez avoir reçu ces équipements et en acceptez la responsabilité.'
    },
    CONFIRM: {
        DEACTIVATE: (lockerId) => `Passer le casier ${lockerId} en INACTIF (nettoyage) ?`,
        REACTIVATE: (lockerId) => `Remettre le casier ${lockerId} en service (LIBRE) ?`
    }
};

// Usage examples:
// console.log(LOCKER_CONFIG.TOTAL); // 288
// console.log(LOCKER_CONFIG.PLATFORMS.CI.count); // 78
// console.log(LOCKER_STATUS.LIBRE); // 'LIBRE'
// alert(MESSAGES.SUCCESS.ASSIGN('C01', 'Jean', 'Dupont'));
// if (confirm(MESSAGES.CONFIRM.DEACTIVATE('C01'))) { ... }
