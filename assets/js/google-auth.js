/**
 * Google OAuth 2.0 Integration for Alba Space
 * 
 * Instructions:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project.
 * 3. Go to APIs & Services > Credentials.
 * 4. Create an OAuth 2.0 Client ID for a Web Application.
 * 5. Add your domain to "Authorized JavaScript origins".
 * 6. Replace 'YOUR_GOOGLE_CLIENT_ID' below with your actual Client ID.
 */

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // <--- REPLACE THIS

function handleCredentialResponse(response) {
    // Decode the JWT to get user info for UI-only display
    const payload = JSON.parse(atob(response.credential.split('.')[1]));

    // Store only non-sensitive user info in localStorage.
    // The raw ID token must not be persisted in browser storage.
    localStorage.setItem('user', JSON.stringify({
        name: payload.name,
        email: payload.email,
        picture: payload.picture
    }));

    // Redirect to profile page or refresh
    window.location.href = '/profile.html';
}

function initGoogleAuth() {
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
        console.warn("Google Auth: Please set your GOOGLE_CLIENT_ID in /assets/js/google-auth.js");
        return;
    }

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });

    const googleBtn = document.querySelector('.btn-google');
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            google.accounts.id.prompt(); // Also show the One Tap dialog
            
            // Trigger the standard Google Sign-In flow
            google.accounts.id.renderButton(
                googleBtn,
                { theme: "outline", size: "large", width: googleBtn.offsetWidth } 
            );
        });
    }
}

// Load Google Script dynamically
(function() {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleAuth;
    document.head.appendChild(script);
})();
