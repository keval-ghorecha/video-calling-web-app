import { useState, useEffect, useRef } from "react";
import "./App.css";
import io from "socket.io-client";
import { nanoid } from "nanoid";
import Peer from "peerjs";

const socket = io("https://webrtckgserver.herokuapp.com", { secure: true });

const initialRoomId = nanoid(4);

let myPeer = new Peer(
  (initialRoomId,
  {
    host: "webrtckgserver.herokuapp.com",
    port: "443",
    path: "/peerjs",
    secure: true,
  })
);

// let userId = null;
const VideoStream = ({ item, index, size }) => {
  const videoRef = useRef();
  useEffect(() => {
    videoRef.current.srcObject = item.stream;
  }, [videoRef]);
  return (
    <video
      className="video"
      muted={index === 0}
      width={size}
      height={size}
      autoPlay
      ref={videoRef}
    />
  );
};
function App() {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [roomIdText, setRoomIdText] = useState("");
  const [userId, setUserId] = useState("");
  const [videos, setVideos] = useState([]);
  const [stream, setStream] = useState(null);
  const [size, setSize] = useState("60%");

  useEffect(() => {
    myPeer.on("open", (id) => {
      setUserId(id);

      socket.emit("join-room", { roomId, userId: id });
    });
  }, []);

  useEffect(() => {
    if (userId) {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then((stream) => {
          setStream(stream);
          setVideos([{ userId: userId, stream: stream }]);
        });
    }
    return () => {};
  }, [userId]);

  useEffect(() => {
    if (stream) {
      myPeer.on("call", (call) => {
        console.log("..............................................");
        console.log("on call");
        console.log({ call });
        console.log("..............................................");

        call.answer(stream);

        call.on("stream", (userVideoStream) => {
          console.log("..............................................");
          console.log("on call on stream");
          console.log({ userId, userVideoStream });
          console.log("..............................................");

          const dummy = [...videos];
          console.log(dummy);
          dummy.push({ userId: userId, stream: userVideoStream });
          setVideos(dummy);
        });
      });

      socket.on("user-connected", (payload) => {
        const call = myPeer.call(payload, stream);
        console.log("..............................................");
        console.log("on user connect call to ", payload);
        console.log({ call });
        console.log("..............................................");

        call.on("stream", (userVideoStream) => {
          console.log("..............................................");
          console.log("on user connected on stream");

          console.log({ payload, userVideoStream });
          console.log("..............................................");

          const dummy = [...videos];
          console.log(dummy);
          dummy.push({ userId: payload, stream: userVideoStream });
          setVideos(dummy);
        });
      });

      socket.on("close", () => {});
    }

    socket.on("user-disconnected", ({ userId }) => {
      const tempArray = videos.filter((item) => item.userId !== userId);
      setVideos([...tempArray]);
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [stream, videos]);

  useEffect(() => {
    socket.emit("join-room", { roomId, userId });
    setRoomIdText(roomId);
  }, [roomId]);

  const joinRoom = (e) => {
    e.preventDefault();
    setRoomId(roomIdText);
  };

  useEffect(() => {
    const videoLength = videos.length;
    if (videoLength === 1) setSize("60%");
    else if (videoLength === 2) setSize("46%");
    else if (videoLength > 2) setSize("30%");
    else setSize("60%");
    console.log("..............................................");
    console.log("videos changed");
    console.log({ videos });
    console.log("..............................................");
  }, [videos]);

  return (
    <>
      <div className="App">
        <div className="header">
          <div>
            <h3>Your RoomId: {roomId}</h3>
            <h3>Your userId: {userId}</h3>
          </div>
          <form className="text-field-container" onSubmit={joinRoom}>
            <input
              type="text"
              name="join-room"
              placeholder="roomId"
              value={roomIdText}
              onChange={(e) => setRoomIdText(e.target.value)}
              className="text-field"
            />
            <button className="btn-join" type="submit">
              join
            </button>
          </form>
        </div>
        <div className="video-container">
          {videos.length > 0 &&
            videos.map((item, index) => {
              return (
                <VideoStream
                  key={index}
                  item={item}
                  index={index}
                  size={size}
                />
              );
            })}
        </div>
      </div>
    </>
  );
}

export default App;
