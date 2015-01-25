var Drive = {
    
    CLIENT_ID : '532576963484-s109668ql6rlhj96dhsup5bouk0sca18.apps.googleusercontent.com',
    SCOPES : 'https://www.googleapis.com/auth/drive', // 'https://www.googleapis.com/auth/drive.file

    /** Called when the client library is loaded to start the auth flow. */
    onLoad: function () {
        window.setTimeout(Drive.authImmediate, 1);
    },

    /** Check if the current user has authorized the application. */
    auth: function (immediate) {
        gapi.auth.authorize(
            {'client_id': Drive.CLIENT_ID, 'scope': Drive.SCOPES, 'immediate': immediate || false},
            Drive.onAuth);
    },
    
    authImmediate: function () {
        Drive.auth(true);
    },

    /**
     * Called when authorization server replies.
     *
     * @param {Object} authResult Authorization result.
     */
    onAuth: function (authResult) {
        console.log('Drive.onAuth: ', authResult);
    }
};
