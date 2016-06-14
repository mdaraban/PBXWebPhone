function startRingTone() {
    try {
        bell.play();
    } catch (e) {
    }
}

function stopRingTone() {
    try {
        bell.pause();
    } catch (e) {
    }
}

function getUserMediaFailure(e) {
    window.console.error('getUserMedia failed:', e);
}

function getUserMediaSuccess(stream) {
    Stream = stream;
}
function setState(newState) {
    try {
        state.innerHTML = newState.toString();
    } catch (e) {
    }
}
function newSession(newSess) {

    newSess.displayName = newSess.remoteIdentity.displayName || newSess.remoteIdentity.uri.user;

    var status;

    if (newSess.direction === 'incoming') {
        status = "Incoming: " + newSess.displayName;
        startRingTone();
    } else {
        status = "Trying: " + newSess.displayName;
        startRingbackTone();
    }

    setStatus(status);

    // EVENT CALLBACKS

    newSess.on('progress', function (e) {
        if (e.direction === 'outgoing') {
            setStatus('Calling...');
        }
    });

    newSess.on('connecting', function (e) {
        if (e.direction === 'outgoing') {
            setStatus('Connecting...');
        }
    });

    newSess.on('accepted', function (e) {
        // If there is another active call, hold it
        if (callActiveID && callActiveID !== newSess.ctxid) {
            // phoneHoldButtonPressed(callActiveID);
        }

        stopRingbackTone();
        stopRingTone();
        setStatus('Answered');

        callActiveID = newSess.ctxid;
    });

    newSess.on('hold', function (e) {
        callActiveID = null;

    });

    newSess.on('unhold', function (e) {

        callActiveID = newSess.ctxid;
    });

    newSess.on('muted', function (e) {
        Sessions[newSess.ctxid].isMuted = true;
        setStatus("Muted");
    });

    newSess.on('unmuted', function (e) {
        Sessions[newSess.ctxid].isMuted = false;
        setStatus("Answered");
    });

    newSess.on('cancel', function (e) {
        stopRingTone();
        stopRingbackTone();
        setStatus("Canceled");
        if (this.direction === 'outgoing') {
            callActiveID = null;
            newSess = null;

        }
    });

    newSess.on('bye', function (e) {
        stopRingTone();
        stopRingbackTone();
        setStatus("");

        callActiveID = null;
        newSess = null;
    });

    newSess.on('failed', function (e) {
        stopRingTone();
        stopRingbackTone();
        setStatus('Terminated');
    });

    newSess.on('rejected', function (e) {
        stopRingTone();
        stopRingbackTone();
        setStatus('Rejected');
        callActiveID = null;

        newSess = null;
    });

    newSess.accept({
        media: {
            stream: Stream,
            constraints: {audio: true, video: false},
            render: {
                remote: document.getElementById('audioRemote')
            },
            RTCConstraints: {"optional": [{'DtlsSrtpKeyAgreement': 'true'}]}
        }
    });

}

$(document).ready(function () {

    var phone = new SIP.UA(config);
    phone.on('connected', function (e) {
        setState("Connected");
    });
    phone.on('registered', function (e) {

        setState("Ready");

        // Get the userMedia and cache the stream
        if (SIP.WebRTC.isSupported()) {
            SIP.WebRTC.getUserMedia({audio: true, video: false}, getUserMediaSuccess, getUserMediaFailure);
        }
    });

    phone.on('invite', function (incomingSession) {

        var s = incomingSession;

        s.direction = 'incoming';
        newSession(s);


    });


});