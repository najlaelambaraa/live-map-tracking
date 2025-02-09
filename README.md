# Suivi-App
Cette application permet de suivre la position des utilisateurs en temps réel via WebSocket, d'afficher leurs positions sur une carte interactive et de démarrer une visioconférence avec WebRTC. Elle utilise également l'API de géolocalisation pour enrichir l'expérience utilisateur. Actuellement, la fonctionnalité de visioconférence ne fonctionne pas correctement.

## 1. Architecture de l'application

L'application est composée de deux parties principales :
- **Backend (Node.js, Express, WebSocket)** : Gère les connexions WebSocket, les mises à jour de position et les interactions entre les utilisateurs.
- **Frontend (JavaScript, WebRTC, Leaflet.js, WebSocket)** : Interface utilisateur permettant d'afficher la carte, gérer la visioconférence et interagir avec les autres utilisateurs en temps réel.

### **1.1 Gestion des connexions WebSocket**
- Le serveur WebSocket est attaché au serveur Express.
- Une **Map `clients`** stocke les connexions actives et leur position.
- Lorsqu'un utilisateur se connecte, un **identifiant unique** lui est attribué.
- Lorsqu'un utilisateur envoie sa position, elle est diffusée aux autres clients.

### **1.2 Mise en place de WebRTC**
- Utilisation de `navigator.mediaDevices.getUserMedia()` pour capturer la vidéo/audio de l'utilisateur.
- Utilisation d’un serveur STUN `stun:stun.l.google.com:19302` pour établir les connexions.
- Stockage des connexions WebRTC dans `peerConnections` pour gérer les appels.

### **1.3 Utilisation des APIs Géolocalisation**
- **Géolocalisation** : `navigator.geolocation.watchPosition()` permet de suivre la position de l’utilisateur en temps réel.

## 2. Installation et lancement

### **2.1 Installation des dépendances**
L'application utilise Node.js et npm. Installez les dépendances avec :

```sh
cd server
npm install
```

### **2.2 Lancer l'application en local**
Démarrer le serveur Express et WebSocket :

```sh
npm start
```

Le serveur tourne sur `http://localhost:3000`.

### **2.3 Déploiement sur un VPS**
- **Ouvrir les ports** : Le port 3000 doit être ouvert.
- **Activer SSL (HTTPS)** : Pour utiliser WebRTC en production, configurez un certificat SSL.
- **Utiliser `pm2`** pour exécuter le serveur en arrière-plan :

```sh
npm install -g pm2
pm2 start server.js --name suivi-app
```

## 3. Parcours utilisateur

### **3.1 Étapes principales**
1. **Autorisation de la géolocalisation** : L’utilisateur doit autoriser l’accès à sa position.
2. **Affichage sur la carte** : Sa position est affichée sur OpenStreetMap.
3. **Mise à jour en temps réel** : La position se met à jour via WebSocket.
4. **Démarrer une visioconférence** : L’utilisateur peut initier un appel vidéo.

### **3.2 Interactions avec l’interface**
- **Carte** : L’utilisateur voit les autres utilisateurs en temps réel.
- **Bouton "Démarrer l’appel"** : Permet d’initier un appel vidéo.
