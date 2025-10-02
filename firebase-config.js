// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Auth instance
const auth = firebase.auth();
// Firestore instance
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Handle Auth State Changes
auth.onAuthStateChanged((user) => {
    const loginBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    if (user) {
        // User is signed in
        loginBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userAvatar.src = user.photoURL || 'default-avatar.png';
        userName.textContent = user.displayName || user.email;
        
        // Sync history with cloud
        syncHistory(user.uid);
    } else {
        // User is signed out
        loginBtn.style.display = 'flex';
        userMenu.style.display = 'none';
    }
});

// Login with Google
async function loginWithGoogle() {
    try {
        await auth.signInWithPopup(googleProvider);
    } catch (error) {
        console.error('Error during login:', error);
        alert('Failed to login. Please try again.');
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Error during logout:', error);
        alert('Failed to logout. Please try again.');
    }
}

// Sync history with cloud
async function syncHistory(userId) {
    try {
        // Get local history
        const localHistory = JSON.parse(localStorage.getItem('qrHistory') || '[]');
        
        // Get cloud history
        const cloudHistoryDoc = await db.collection('users').doc(userId).get();
        const cloudHistory = cloudHistoryDoc.exists ? cloudHistoryDoc.data().history : [];
        
        // Merge histories (remove duplicates and sort by timestamp)
        const mergedHistory = [...localHistory, ...cloudHistory]
            .reduce((acc, current) => {
                const x = acc.find(item => item.content === current.content);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, [])
            .sort((a, b) => b.timestamp - a.timestamp);
        
        // Update local storage
        localStorage.setItem('qrHistory', JSON.stringify(mergedHistory));
        
        // Update cloud storage
        await db.collection('users').doc(userId).set({
            history: mergedHistory
        });
        
        // Update UI
        updateHistoryView();
    } catch (error) {
        console.error('Error syncing history:', error);
    }
}