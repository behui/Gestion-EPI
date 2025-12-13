# 
#  AIDE - COMPTE UTILISATEUR FIREBASE
# 

##  ERREUR ACTUELLE
**Code:** auth/invalid-credential
**Message:** Firebase: Error (auth/invalid-credential)

##  DIAGNOSTIC
Cette erreur signifie que :
-  Le compte n'existe PAS dans Firebase Authentication, OU
-  Le mot de passe est incorrect

##  SOLUTION 1 : Créer le compte dans Firebase Console

### Étapes à suivre :

1. **Ouvrez Firebase Console**
    https://console.firebase.google.com/project/gestion-epi-4387a/authentication/users

2. **Cliquez sur "Add user" (Ajouter un utilisateur)**

3. **Remplissez les informations :**
   - Email : \Anthony.FERNANDEZ@axensgroup.com\
   - Mot de passe : \ADMINADMIN\ (ou celui de votre choix)
   -  Cliquez "Add user"

4. **Créez le profil Firestore** (IMPORTANT !)
   - Allez sur : https://console.firebase.google.com/project/gestion-epi-4387a/firestore/data
   - Collection : \users\
   - Document ID : \Anthony.FERNANDEZ@axensgroup.com\ (même email EXACT)
   - Champs à ajouter :
     `
     prenom: "Anthony"
     nom: "FERNANDEZ"
     email: "Anthony.FERNANDEZ@axensgroup.com"
     role: "admin"
     permissions: {
         editUsers: true,
         editEquipements: true,
         viewReports: true,
         manageLockers: true,
         debugTools: true
     }
     `
   -  Cliquez "Save"

5. **Retournez sur le site et connectez-vous**
   - Email : Anthony.FERNANDEZ@axensgroup.com
   - Mot de passe : ADMINADMIN (ou celui choisi)

---

##  SOLUTION 2 : Utiliser la page admin-test.html

Si vous avez DÉJÀ un compte admin qui fonctionne :

1. **Connectez-vous avec un compte admin existant**
2. **Allez sur admin-test.html**
3. **Créez le nouveau compte depuis l'interface**
   - Le profil Firestore sera créé automatiquement

---

##  SOLUTION 3 : Réinitialiser le mot de passe

Si le compte existe mais le mot de passe est oublié :

1. **Allez sur Firebase Console**
    https://console.firebase.google.com/project/gestion-epi-4387a/authentication/users

2. **Trouvez l'utilisateur dans la liste**

3. **Cliquez sur les 3 points "..." à droite**

4. **Sélectionnez "Reset password"**

5. **Choisissez un nouveau mot de passe**

6. **Retournez sur le site et connectez-vous**

---

##  VÉRIFIER SI LE COMPTE EXISTE

1. Allez sur : https://console.firebase.google.com/project/gestion-epi-4387a/authentication/users
2. Cherchez : \Anthony.FERNANDEZ@axensgroup.com\ dans la liste
3. Si absent  Utilisez SOLUTION 1
4. Si présent  Utilisez SOLUTION 3 (réinitialiser mot de passe)

---

##  COMPTE DE TEST POUR VÉRIFIER

Si vous voulez tester rapidement, créez un compte simple :

**Email:** \	est@test.com\
**Mot de passe:** \	est123\
**Rôle:** \dmin\

Créez-le dans Firebase Console (SOLUTION 1) pour vérifier que tout fonctionne.


 Une fois le compte créé, rechargez index.html et connectez-vous

