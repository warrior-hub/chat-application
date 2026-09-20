import { useEffect, useRef, useState } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  User,
} from "lucide-react";

import socket from "../services/socket";
import { useAuth } from "../context/AuthContext";

const VideoCall = ({
  selectedUser,
  incomingCall: incomingCallProp,
  onClose,
}) => {
  const { user } = useAuth();

  // =====================================================
  // REFS
  // =====================================================

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // ICE candidates received before remote description
  const pendingCandidatesRef = useRef([]);

  // Current call target
  const callTargetRef = useRef(null);

  // Latest call state
  const callStateRef = useRef("idle");

  // =====================================================
  // STATE
  // =====================================================

  const [callState, setCallState] = useState("idle");

  const [incomingCall, setIncomingCall] =
    useState(incomingCallProp || null);

  const [muted, setMuted] = useState(false);

  const [cameraOff, setCameraOff] = useState(false);

  // =====================================================
  // CURRENT USER
  // =====================================================

  const currentUserId = user?.id || user?._id;

  // =====================================================
  // UPDATE CALL STATE
  // =====================================================

  const updateCallState = (state) => {
    callStateRef.current = state;
    setCallState(state);
  };

  // =====================================================
  // SYNC INCOMING CALL FROM CHAT.JSX
  // =====================================================

  useEffect(() => {
    if (incomingCallProp) {
      console.log(
        "VideoCall received incoming call:",
        incomingCallProp
      );

      callTargetRef.current =
        incomingCallProp.callerId;

      pendingCandidatesRef.current = [];

      setIncomingCall(incomingCallProp);
      updateCallState("incoming");

      return;
    }

    setIncomingCall(null);
  }, [incomingCallProp]);

  // =====================================================
  // START CAMERA + MICROPHONE
  // =====================================================

  const startLocalStream = async () => {
    try {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error(
        "Camera/microphone error:",
        error
      );

      alert(
        "Camera aur microphone permission allow karein."
      );

      return null;
    }
  };

  // =====================================================
  // FLUSH QUEUED ICE CANDIDATES
  // =====================================================

  const flushPendingCandidates = async () => {
    const peerConnection =
      peerConnectionRef.current;

    if (!peerConnection) {
      return;
    }

    if (!peerConnection.remoteDescription) {
      return;
    }

    const candidates =
      pendingCandidatesRef.current;

    if (!candidates.length) {
      return;
    }

    console.log(
      "Adding queued ICE candidates:",
      candidates.length
    );

    for (const candidate of candidates) {
      try {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error(
          "Queued ICE candidate error:",
          error
        );
      }
    }

    pendingCandidatesRef.current = [];
  };

  // =====================================================
  // CREATE PEER CONNECTION
  // =====================================================

  const createPeerConnection = () => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection =
      new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
          {
            urls: "stun:stun1.l.google.com:19302",
          },
        ],
      });

    peerConnectionRef.current =
      peerConnection;

    // ---------------------------------------------------
    // LOCAL TRACKS
    // ---------------------------------------------------

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          peerConnection.addTrack(
            track,
            localStreamRef.current
          );
        });
    }

    // ---------------------------------------------------
    // REMOTE TRACK
    // ---------------------------------------------------

    peerConnection.ontrack = (event) => {
      console.log(
        "Remote video/audio received"
      );

      const remoteStream =
        event.streams?.[0];

      if (
        remoteStream &&
        remoteVideoRef.current
      ) {
        remoteVideoRef.current.srcObject =
          remoteStream;

        remoteVideoRef.current
          .play()
          .catch(() => {});
      }
    };

    // ---------------------------------------------------
    // ICE CANDIDATE
    // ---------------------------------------------------

    peerConnection.onicecandidate =
      (event) => {
        if (!event.candidate) {
          return;
        }

        const targetUserId =
          callTargetRef.current;

        if (
          !targetUserId ||
          !currentUserId
        ) {
          return;
        }

        console.log(
          "Sending ICE candidate"
        );

        socket.emit("ice-candidate", {
          senderId: currentUserId,
          receiverId: targetUserId,
          candidate: event.candidate,
        });
      };

    // ---------------------------------------------------
    // CONNECTION STATE
    // ---------------------------------------------------

    peerConnection.onconnectionstatechange =
      () => {
        const state =
          peerConnection.connectionState;

        console.log(
          "WebRTC connection state:",
          state
        );

        if (state === "connected") {
          updateCallState("connected");
        }

        if (state === "failed") {
          console.error(
            "WebRTC connection failed"
          );

          endCall(false);
        }

        if (state === "closed") {
          updateCallState("idle");
        }
      };

    // ---------------------------------------------------
    // ICE CONNECTION STATE
    // ---------------------------------------------------

    peerConnection.oniceconnectionstatechange =
      () => {
        console.log(
          "ICE state:",
          peerConnection.iceConnectionState
        );

        if (
          peerConnection.iceConnectionState ===
          "failed"
        ) {
          console.error(
            "ICE connection failed"
          );
        }
      };

    return peerConnection;
  };

  // =====================================================
  // START OUTGOING CALL
  // =====================================================

  const startCall = async () => {
    try {
      if (!selectedUser?._id) {
        return;
      }

      if (!currentUserId) {
        return;
      }

      if (!socket.connected) {
        alert(
          "Socket connected nahi hai."
        );
        return;
      }

      console.log(
        "Starting video call:",
        selectedUser.name
      );

      updateCallState("calling");

      callTargetRef.current =
        selectedUser._id;

      pendingCandidatesRef.current = [];

      const stream =
        await startLocalStream();

      if (!stream) {
        updateCallState("idle");
        return;
      }

      const peerConnection =
        createPeerConnection();

      const offer =
        await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

      await peerConnection.setLocalDescription(
        offer
      );

      socket.emit("call-user", {
        callerId: currentUserId,
        receiverId: selectedUser._id,
        callerName:
          user?.name || "User",
        callerImage:
          user?.profileImage || "",
        offer,
      });

      console.log(
        "Call offer sent"
      );
    } catch (error) {
      console.error(
        "Start call error:",
        error
      );

      endCall(false);
    }
  };

  // =====================================================
  // ACCEPT INCOMING CALL
  // =====================================================

  const acceptCall = async () => {
    try {
      if (!incomingCall) {
        return;
      }

      if (!currentUserId) {
        return;
      }

      console.log(
        "Accepting call from:",
        incomingCall.callerName
      );

      // IMPORTANT:
      // Do NOT clear pendingCandidates here.
      // Caller ke ICE candidates already queue ho sakte hain.

      callTargetRef.current =
        incomingCall.callerId;

      const stream =
        await startLocalStream();

      if (!stream) {
        return;
      }

      const peerConnection =
        createPeerConnection();

      // -------------------------------------------------
      // SET CALLER OFFER
      // -------------------------------------------------

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(
          incomingCall.offer
        )
      );

      console.log(
        "Remote offer applied"
      );

      // -------------------------------------------------
      // ADD QUEUED ICE
      // -------------------------------------------------

      await flushPendingCandidates();

      // -------------------------------------------------
      // CREATE ANSWER
      // -------------------------------------------------

      const answer =
        await peerConnection.createAnswer();

      await peerConnection.setLocalDescription(
        answer
      );

      // -------------------------------------------------
      // SEND ANSWER
      // -------------------------------------------------

      socket.emit("accept-call", {
        callerId:
          incomingCall.callerId,

        receiverId:
          currentUserId,

        answer,
      });

      setIncomingCall(null);

      updateCallState("connecting");

      console.log(
        "Answer sent"
      );
    } catch (error) {
      console.error(
        "Accept call error:",
        error
      );

      endCall(false);
    }
  };

  // =====================================================
  // REJECT CALL
  // =====================================================

  const rejectCall = () => {
    if (!incomingCall) {
      return;
    }

    console.log(
      "Rejecting call"
    );

    socket.emit("reject-call", {
      callerId:
        incomingCall.callerId,

      receiverId:
        currentUserId,
    });

    setIncomingCall(null);

    callTargetRef.current = null;

    pendingCandidatesRef.current = [];

    updateCallState("idle");

    if (onClose) {
      onClose();
    }
  };

  // =====================================================
  // END CALL
  // =====================================================

  const endCall = (
    notify = true
  ) => {
    try {
      const targetUserId =
        callTargetRef.current ||
        incomingCall?.callerId ||
        selectedUser?._id;

      if (
        notify &&
        targetUserId &&
        currentUserId
      ) {
        socket.emit("end-call", {
          callerId: currentUserId,
          receiverId: targetUserId,
        });
      }

      // -------------------------------------------------
      // STOP CAMERA + MICROPHONE
      // -------------------------------------------------

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        localStreamRef.current = null;
      }

      // -------------------------------------------------
      // CLOSE WEBRTC
      // -------------------------------------------------

      if (peerConnectionRef.current) {
        peerConnectionRef.current.ontrack =
          null;

        peerConnectionRef.current.onicecandidate =
          null;

        peerConnectionRef.current.onconnectionstatechange =
          null;

        peerConnectionRef.current.oniceconnectionstatechange =
          null;

        peerConnectionRef.current.close();

        peerConnectionRef.current = null;
      }

      // -------------------------------------------------
      // CLEAR VIDEOS
      // -------------------------------------------------

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject =
          null;
      }

      // -------------------------------------------------
      // CLEAR CALL DATA
      // -------------------------------------------------

      pendingCandidatesRef.current = [];

      callTargetRef.current = null;

      setIncomingCall(null);

      setMuted(false);

      setCameraOff(false);

      updateCallState("idle");

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error(
        "End call error:",
        error
      );
    }
  };

  // =====================================================
  // MUTE
  // =====================================================

  const toggleMute = () => {
    if (!localStreamRef.current) {
      return;
    }

    const audioTracks =
      localStreamRef.current.getAudioTracks();

    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setMuted((prev) => !prev);
  };

  // =====================================================
  // CAMERA
  // =====================================================

  const toggleCamera = () => {
    if (!localStreamRef.current) {
      return;
    }

    const videoTracks =
      localStreamRef.current.getVideoTracks();

    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setCameraOff((prev) => !prev);
  };

  // =====================================================
  // SOCKET EVENTS
  // IMPORTANT:
  // incoming-call is handled by Chat.jsx
  // =====================================================

  useEffect(() => {
    // ---------------------------------------------------
    // CALL ACCEPTED
    // ---------------------------------------------------

    const handleCallAccepted = async (
      data
    ) => {
      try {
        console.log(
          "Call accepted:",
          data
        );

        const peerConnection =
          peerConnectionRef.current;

        if (!peerConnection) {
          console.error(
            "Peer connection missing"
          );

          return;
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(
            data.answer
          )
        );

        console.log(
          "Remote answer applied"
        );

        await flushPendingCandidates();

        updateCallState("connecting");
      } catch (error) {
        console.error(
          "Call accepted error:",
          error
        );
      }
    };

    // ---------------------------------------------------
    // ICE CANDIDATE
    // ---------------------------------------------------

    const handleIceCandidate = async (
      data
    ) => {
      try {
        if (!data?.candidate) {
          return;
        }

        const peerConnection =
          peerConnectionRef.current;

        // Peer connection not ready
        if (!peerConnection) {
          console.log(
            "Peer not ready, queueing ICE candidate"
          );

          pendingCandidatesRef.current.push(
            data.candidate
          );

          return;
        }

        // Remote description not ready
        if (
          !peerConnection.remoteDescription
        ) {
          console.log(
            "Remote description not ready, queueing ICE candidate"
          );

          pendingCandidatesRef.current.push(
            data.candidate
          );

          return;
        }

        await peerConnection.addIceCandidate(
          new RTCIceCandidate(
            data.candidate
          )
        );

        console.log(
          "ICE candidate added"
        );
      } catch (error) {
        console.error(
          "ICE candidate error:",
          error
        );
      }
    };

    // ---------------------------------------------------
    // CALL REJECTED
    // ---------------------------------------------------

    const handleCallRejected = () => {
      console.log(
        "Call rejected"
      );

      alert(
        "User ne call reject kar di."
      );

      endCall(false);
    };

    // ---------------------------------------------------
    // CALL ENDED
    // ---------------------------------------------------

    const handleCallEnded = () => {
      console.log(
        "Remote user ended call"
      );

      endCall(false);
    };

    // ---------------------------------------------------
    // CALL FAILED
    // ---------------------------------------------------

    const handleCallFailed = (
      data
    ) => {
      console.log(
        "Call failed:",
        data
      );

      alert(
        data?.reason ||
          "User available nahi hai."
      );

      endCall(false);
    };

    socket.on(
      "call-accepted",
      handleCallAccepted
    );

    socket.on(
      "ice-candidate",
      handleIceCandidate
    );

    socket.on(
      "call-rejected",
      handleCallRejected
    );

    socket.on(
      "call-ended",
      handleCallEnded
    );

    socket.on(
      "call-failed",
      handleCallFailed
    );

    return () => {
      socket.off(
        "call-accepted",
        handleCallAccepted
      );

      socket.off(
        "ice-candidate",
        handleIceCandidate
      );

      socket.off(
        "call-rejected",
        handleCallRejected
      );

      socket.off(
        "call-ended",
        handleCallEnded
      );

      socket.off(
        "call-failed",
        handleCallFailed
      );
    };
  }, []);

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">

            {selectedUser?.profileImage ||
            incomingCall?.callerImage ? (
              <img
                src={
                  selectedUser?.profileImage ||
                  incomingCall?.callerImage
                }
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={20} />
            )}

          </div>

          <div>
            <h2 className="font-semibold text-sm">
              {selectedUser?.name ||
                incomingCall?.callerName ||
                "Video Call"}
            </h2>

            <p className="text-xs text-slate-500">
              {callState === "calling"
                ? "Calling..."
                : callState === "incoming"
                ? "Incoming call"
                : callState === "connecting"
                ? "Connecting..."
                : callState === "connected"
                ? "Connected"
                : "Video call"}
            </p>
          </div>

        </div>

        {callState === "connected" && (
          <div className="text-xs text-emerald-400">
            ● Live
          </div>
        )}

      </div>

      {/* =================================================
          VIDEO AREA
      ================================================= */}

      <div className="relative flex-1 bg-black overflow-hidden">

        {/* REMOTE VIDEO */}

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* PLACEHOLDER */}

        {callState !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-2xl shadow-indigo-500/20">

              {selectedUser?.profileImage ||
              incomingCall?.callerImage ? (
                <img
                  src={
                    selectedUser?.profileImage ||
                    incomingCall?.callerImage
                  }
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} />
              )}

            </div>

            <h3 className="mt-5 text-xl font-semibold">
              {selectedUser?.name ||
                incomingCall?.callerName ||
                "User"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {callState === "calling"
                ? "Calling..."
                : callState === "incoming"
                ? "Incoming video call..."
                : callState === "connecting"
                ? "Connecting..."
                : "Ready for video call"}
            </p>

          </div>
        )}

        {/* LOCAL VIDEO */}

        <div className="absolute right-4 top-4 w-28 sm:w-40 aspect-video rounded-2xl overflow-hidden border border-white/20 bg-slate-900 shadow-2xl">

          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {cameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">

              <VideoOff
                size={22}
                className="text-slate-400"
              />

            </div>
          )}

        </div>

        {/* =================================================
            INCOMING CALL
        ================================================= */}

        {callState === "incoming" && (
          <div className="absolute inset-x-4 bottom-8 flex justify-center">

            <div className="w-full max-w-md p-5 rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl">

              <div className="flex items-center gap-4 mb-5">

                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">

                  {incomingCall?.callerImage ? (
                    <img
                      src={
                        incomingCall.callerImage
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} />
                  )}

                </div>

                <div>

                  <p className="text-xs text-slate-500">
                    Incoming video call
                  </p>

                  <h3 className="font-semibold text-lg">
                    {incomingCall?.callerName ||
                      "Someone"}
                  </h3>

                </div>

              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={rejectCall}
                  className="flex-1 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition flex items-center justify-center gap-2"
                >
                  <PhoneOff size={18} />
                  Reject
                </button>

                <button
                  type="button"
                  onClick={acceptCall}
                  className="flex-1 h-12 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-400 transition flex items-center justify-center gap-2"
                >
                  <Phone size={18} />
                  Accept
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* =================================================
          CONTROLS
      ================================================= */}

      <div className="h-24 flex items-center justify-center gap-3 bg-slate-950 border-t border-white/10">

        {/* MUTE + CAMERA */}

        {callState === "connected" && (
          <>

            <button
              type="button"
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition ${
                muted
                  ? "bg-white text-slate-900 border-white"
                  : "bg-white/10 text-white border-white/10 hover:bg-white/15"
              }`}
              title={
                muted
                  ? "Unmute"
                  : "Mute"
              }
            >
              {muted ? (
                <MicOff size={19} />
              ) : (
                <Mic size={19} />
              )}
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition ${
                cameraOff
                  ? "bg-white text-slate-900 border-white"
                  : "bg-white/10 text-white border-white/10 hover:bg-white/15"
              }`}
              title={
                cameraOff
                  ? "Turn camera on"
                  : "Turn camera off"
              }
            >
              {cameraOff ? (
                <VideoOff size={19} />
              ) : (
                <Video size={19} />
              )}
            </button>

          </>
        )}

        {/* END CALL */}

        {(callState === "calling" ||
          callState === "connecting" ||
          callState === "connected") && (
          <button
            type="button"
            onClick={() =>
              endCall(true)
            }
            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition shadow-lg shadow-red-500/20"
            title="End call"
          >
            <PhoneOff size={21} />
          </button>
        )}

        {/* START CALL */}

        {callState === "idle" &&
          selectedUser && (
            <button
              type="button"
              onClick={startCall}
              className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition shadow-xl shadow-emerald-500/20"
              title="Start video call"
            >
              <Video size={21} />
            </button>
          )}

      </div>

    </div>
  );
};

export default VideoCall;
