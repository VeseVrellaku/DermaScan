import { useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import VoiceAssistant from "./VoiceAssistant";

const LiveKitModal = ({ setShowSupport }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const connect = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/getToken");
      const data = await response.json();

      setToken(data.token);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={() => setShowSupport(false)}>&times;</button>
        <div className="support-room">
          {token ? (
            <LiveKitRoom
              serverUrl={import.meta.env.VITE_LIVEKIT_URL}
              token={token}
              connect={true}
              video={false}
              audio={true}
              onDisconnected={() => {
                setShowSupport(false);
                setToken(null);
              }}
            >
              <RoomAudioRenderer />
              <VoiceAssistant />
            </LiveKitRoom>
          ) : (
            <button onClick={connect} disabled={loading}>
              {loading ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveKitModal;