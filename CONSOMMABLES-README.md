# 📦 SYSTÈME DE GESTION DES CONSOMMABLES

## 🎯 Objectif
Système de suivi des consommables et pièces détachées pour les masques ventilés.  
**Mode caché** pour le moment - sera activé en mode admin ultérieurement.

---

## 📁 Architecture

### Fichier : `consommables-masques.js`
Structure de données prête à l'emploi avec :
- 7 catégories de consommables
- 23 références prédéfinies
- Système de stock et alertes
- Historique des consommations
- Fonctions de gestion complètes

---

## 🗂️ Catégories de Consommables

| Catégorie | Icon | Items | Exemples |
|-----------|------|-------|----------|
| **Filtres** | 🔍 | 3 | P3, ABEK, CO |
| **Membranes & Valves** | ⚙️ | 3 | Expiration, Inspiration, Sécurité |
| **Joints & Étanchéité** | 🔧 | 3 | Visière, Raccord, Tuyau |
| **Visières** | 👓 | 3 | Standard, Anti-buée, Dorée |
| **Sangles & Harnais** | 🎯 | 3 | Tête, Complet, Clips |
| **Nettoyage** | 🧼 | 3 | Désinfectant, Lingettes, Brosses |
| **Protection** | 🛡️ | 3 | Cagoule, Film protecteur, Sac |

**Total : 23 consommables prédéfinis**

---

## 💾 Structure des Données

### Item Consommable
```javascript
{
    ref: 'FIL-P3-001',           // Référence unique
    nom: 'Filtre P3 Standard',   // Nom descriptif
    prix: 45,                     // Prix unitaire (€)
    stock: 0,                     // Quantité en stock
    seuilAlerte: 20,              // Seuil d'alerte stock bas
    unite: 'unité'                // Unité de mesure
}
```

### Historique
Chaque opération est tracée :
```javascript
{
    date: '2025-12-19T10:30:00Z',
    type: 'consommation',         // ou 'modification_stock', 'ajout_consommable'
    categorie: 'filtres',
    item: 'Filtre P3 Standard',
    ref: 'FIL-P3-001',
    quantite: 5,
    stockRestant: 15,
    utilisateur: 'Jean Dupont',
    masqueRef: 'M-1234',
    prixTotal: 225
}
```

---

## 🔧 Fonctions Disponibles

### Initialisation
```javascript
initConsommablesData()
// Initialise les données dans localStorage (une seule fois)
```

### Lecture
```javascript
getConsommablesData()
// Récupère toutes les données

getAlerteStockBas()
// Liste des items avec stock <= seuil

calculerValeurStock()
// Valeur totale du stock actuel

getStatistiquesConsommation(dateDebut, dateFin)
// Statistiques de consommation sur période
```

### Écriture
```javascript
updateStockConsommable(categorieId, itemRef, nouveauStock)
// Met à jour le stock d'un item

enregistrerConsommation(categorieId, itemRef, quantite, utilisateur, masqueRef)
// Enregistre une consommation (décrémente le stock)

ajouterConsommable(categorieId, newItem)
// Ajoute un nouveau consommable à une catégorie
```

---

## 🚀 Intégration Future (Mode Admin)

### Phase 1 : Interface Consultation (à développer)
```javascript
// Bouton dans la section Équipements
<button onclick="ouvrirConsommables()">
    📦 Consommables & Pièces
</button>

// Modal de visualisation
function ouvrirConsommables() {
    // Afficher toutes les catégories
    // Liste des items avec stock actuel
    // Alertes stock bas en rouge
    // Historique des 30 derniers jours
}
```

### Phase 2 : Gestion des Stocks (à développer)
```javascript
// Interface admin pour modifier les stocks
function modifierStockConsommable(ref) {
    // Modal avec input quantité
    // Validation et historique
    // Notification si stock bas
}
```

### Phase 3 : Suivi Consommation (à développer)
```javascript
// Lier consommation à un masque
function enregistrerMaintenanceMasque(masqueRef) {
    // Sélection des consommables utilisés
    // Quantités
    // Enregistrement automatique
    // Décrémentation des stocks
}
```

### Phase 4 : Statistiques & Reporting (à développer)
```javascript
// Dashboard de consommation
function afficherDashboardConsommables() {
    // Graphique consommation mensuelle
    // Top 10 consommables les plus utilisés
    // Prévisions de commande
    // Export Excel historique
}
```

---

## 📊 Exemples d'Utilisation

### Vérifier les stocks bas
```javascript
const alertes = getAlerteStockBas();
if (alertes.length > 0) {
    console.log(`⚠️ ${alertes.length} items en stock bas`);
    alertes.forEach(item => {
        console.log(`- ${item.nom}: ${item.stock} ${item.unite} (seuil: ${item.seuilAlerte})`);
    });
}
```

### Enregistrer une réparation
```javascript
// Changement d'un filtre P3 sur le masque M-1234 par Jean Dupont
enregistrerConsommation(
    'filtres',           // Catégorie
    'FIL-P3-001',        // Référence du filtre
    2,                   // Quantité utilisée
    'Jean Dupont',       // Utilisateur
    'M-1234'             // Masque concerné
);
```

### Calculer la valeur du stock
```javascript
const valeur = calculerValeurStock();
console.log(`Valeur totale du stock: ${valeur.total}€`);
console.log('Détail par catégorie:');
Object.entries(valeur.details).forEach(([cat, data]) => {
    console.log(`- ${data.label}: ${data.valeur}€`);
});
```

### Statistiques du mois
```javascript
const debut = new Date('2025-12-01');
const fin = new Date('2025-12-31');
const stats = getStatistiquesConsommation(debut, fin);

console.log(`Consommations en décembre 2025:`);
console.log(`- ${stats.nbConsommations} opérations`);
console.log(`- Coût total: ${stats.coutTotal}€`);
```

---

## 🔐 Configuration

### Paramètres actuels
```javascript
config: {
    alerteStockBas: true,              // Activer alertes console
    notificationSeuilAtteint: true,     // Notifier quand seuil atteint
    suiviConsommationActif: false,      // Désactivé (pas d'interface)
    modeAdmin: false                    // Réservé interface admin
}
```

### Pour activer le système
1. Charger `consommables-masques.js` dans `index.html`
2. Appeler `initConsommablesData()` au démarrage
3. Développer l'interface admin dans `unified-app.js`
4. Activer `config.modeAdmin = true`

---

## 📈 Évolutions Possibles

### Court terme
- [ ] Bouton "📦 Consommables" dans section Équipements
- [ ] Modal de consultation en lecture seule
- [ ] Badge avec nombre d'alertes stock bas

### Moyen terme
- [ ] Interface de modification des stocks
- [ ] Association consommable → masque lors des maintenances
- [ ] Export CSV de l'historique

### Long terme
- [ ] Prévisions de commande basées sur historique
- [ ] Intégration avec fournisseurs (API)
- [ ] Scan de codes-barres pour consommables
- [ ] Tableau de bord analytique avec Chart.js
- [ ] Alertes email automatiques stock critique

---

## 🎨 Interface Prévue (Mockup)

```
┌─────────────────────────────────────────────────┐
│  📦 GESTION DES CONSOMMABLES                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⚠️ 3 items en stock bas                        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔍 FILTRES                      ▼          │ │
│  ├───────────────────────────────────────────┤ │
│  │ FIL-P3-001   Filtre P3 Standard  45€      │ │
│  │ Stock: 12 unités ⚠️ (seuil: 20)           │ │
│  │ [+] [-] [📝 Modifier]                      │ │
│  ├───────────────────────────────────────────┤ │
│  │ FIL-ABEK-001 Filtre ABEK        52€      │ │
│  │ Stock: 18 unités ✅                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [📊 Statistiques] [📥 Historique] [➕ Ajouter] │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 💡 Notes Importantes

- **Pas d'interface visible** : Le fichier est chargé mais aucune fonction n'est appelée
- **Données en localStorage** : `consommables_masques`
- **Prêt à l'emploi** : Toutes les fonctions sont testables en console
- **Extensible** : Facile d'ajouter de nouvelles catégories ou items
- **Sécurisé** : Validation des références et stocks avant opérations

---

## 🧪 Tests Console

```javascript
// Initialiser
initConsommablesData();

// Ajouter du stock
updateStockConsommable('filtres', 'FIL-P3-001', 50);

// Consommer
enregistrerConsommation('filtres', 'FIL-P3-001', 5, 'Test User', 'M-001');

// Vérifier alertes
console.log(getAlerteStockBas());

// Stats
console.log(getStatistiquesConsommation());
```

---

**Statut : 🟡 Développé mais non activé**  
**Version : 1.0 - Décembre 2025**  
**Prochaine étape : Interface admin de consultation**
