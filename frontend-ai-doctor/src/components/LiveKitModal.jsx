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
      const token = await response.text();

      setToken(token);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="support-room">
          {token ? (
            <LiveKitRoom
              serverUrl={import.meta.env.VITE_LIVEKIT_URL}
              token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODAxNDYzOTQsImlkZW50aXR5IjoibWF4eCIsImlzcyI6IkFQSXVQRFJTeUhSRnNnVCIsIm5iZiI6MTc4MDE0NTQ5NCwic3ViIjoibWF4eCIsInZpZGVvIjp7ImNhblB1Ymxpc2giOnRydWUsImNhblB1Ymxpc2hEYXRhIjp0cnVlLCJjYW5TdWJzY3JpYmUiOnRydWUsInJvb20iOiJyb29tMSIsInJvb21Kb2luIjp0cnVlfX0.1dHvhRfv2YgQTfKBvzgxh3Yg6vv5kKjd3GsTLYbqNiQ"
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