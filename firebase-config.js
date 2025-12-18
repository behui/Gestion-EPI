// ============================================
// CONFIGURATION FIREBASE SÉCURISÉE
// ============================================
// Ce fichier charge la configuration depuis les variables d'environnement
// ou utilise les valeurs par défaut pour le développement

/**
 * Configuration Firebase
 * IMPORTANT: En production, utilisez les variables d'environnement
 * et configurez les restrictions de domaine dans la console Firebase
 */
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyClQt22Cl_LWWJMaV_HEzD3r-3BDlPf1kM",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "test-96fdb.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "test-96fdb",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "test-96fdb.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "112009525139",
    appId: process.env.FIREBASE_APP_ID || "1:112009525139:web:d9d95cb36fc22768e26f00"
};

/**
 * Configuration de sécurité
 */
const securityConfig = {
    // Domaines autorisés
    authorizedDomains: [
        'localhost',
        'test-96fdb.firebaseapp.com',
        'test-96fdb.web.app'
        // Ajoutez vos domaines personnalisés ici
    ],
    
    // Options d'authentification renforcée
    authSettings: {
        // Exiger email vérifié pour accès
        requireEmailVerification: true,
        
        // Durée de session (en secondes) - 24h par défaut
        sessionDuration: 86400,
        
        // Nombre maximum de tentatives de connexion
        maxLoginAttempts: 5,
        
        // Durée de blocage après échecs (minutes)
        lockoutDuration: 30
    }
};

/**
 * Initialisation Firebase avec vérifications de sécurité
 */
function initializeFirebaseSecure() {
    // Vérifier que nous sommes sur un domaine autorisé
    const currentDomain = window.location.hostname;
    const isAuthorized = securityConfig.authorizedDomains.some(domain => 
        currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
    
    if (!isAuthorized && window.location.protocol !== 'file:') {
        console.error('🔒 Domaine non autorisé:', currentDomain);
        throw new Error('Accès non autorisé depuis ce domaine');
    }
    
    // Initialiser Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialisé avec succès');
    }
    
    // Configurer la persistance de session
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch((error) => {
            console.error('Erreur configuration persistance:', error);
        });
    
    return {
        auth: firebase.auth(),
        db: firebase.firestore()
    };
}

/**
 * Vérifier l'email avant d'autoriser l'accès
 */
function requireEmailVerification(user) {
    if (!user) return false;
    
    if (securityConfig.authSettings.requireEmailVerification && !user.emailVerified) {
        console.warn('⚠️ Email non vérifié pour:', user.email);
        return false;
    }
    
    return true;
}

/**
 * Logger les tentatives de connexion (pour détection d'attaques)
 */
function logAuthAttempt(email, success, reason = '') {
    const attempt = {
        email: email,
        success: success,
        timestamp: new Date().toISOString(),
        ip: 'client-side', // En production, utilisez une fonction Cloud
        reason: reason
    };
    
    // Stocker localement (en production, envoyez à Firestore)
    const attempts = JSON.parse(localStorage.getItem('auth_attempts') || '[]');
    attempts.push(attempt);
    
    // Garder seulement les 100 dernières tentatives
    if (attempts.length > 100) {
        attempts.shift();
    }
    
    localStorage.setItem('auth_attempts', JSON.stringify(attempts));
    
    // Vérifier les tentatives échouées répétées
    checkBruteForce(email);
}

/**
 * Détecter les tentatives de force brute
 */
function checkBruteForce(email) {
    const attempts = JSON.parse(localStorage.getItem('auth_attempts') || '[]');
    const recentFails = attempts.filter(a => 
        a.email === email && 
        !a.success && 
        (new Date() - new Date(a.timestamp)) < 3600000 // Dernière heure
    );
    
    if (recentFails.length >= securityConfig.authSettings.maxLoginAttempts) {
        const lockUntil = new Date(Date.now() + securityConfig.authSettings.lockoutDuration * 60000);
        localStorage.setItem(`lockout_${email}`, lockUntil.toISOString());
        throw new Error(`Trop de tentatives échouées. Compte temporairement bloqué jusqu'à ${lockUntil.toLocaleTimeString()}`);
    }
}

/**
 * Vérifier si un compte est bloqué
 */
function isAccountLocked(email) {
    const lockUntil = localStorage.getItem(`lockout_${email}`);
    if (!lockUntil) return false;
    
    const unlockTime = new Date(lockUntil);
    if (new Date() < unlockTime) {
        return true;
    }
    
    // Débloquer si le temps est écoulé
    localStorage.removeItem(`lockout_${email}`);
    return false;
}

// Export pour utilisation
window.FirebaseSecure = {
    initialize: initializeFirebaseSecure,
    requireEmailVerification,
    logAuthAttempt,
    checkBruteForce,
    isAccountLocked,
    config: firebaseConfig,
    securityConfig
};
