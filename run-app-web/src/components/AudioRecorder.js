import React, { useState, useRef, useEffect } from 'react';
import './AudioRecorder.css';

const AudioRecorder = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        return () => {
            if (audioURL) {
                URL.revokeObjectURL(audioURL);
            }
        };
    }, [audioURL]);

    const handleRecordClick = async () => {
        if (isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                const supportedTypes = [
                    'audio/mp4',
                    'audio/webm;codecs=opus',
                    'audio/webm',
                ];

                const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));

                if (!mimeType) {
                    alert("No supported audio format found for recording.");
                    return;
                }

                const options = { mimeType, audioBitsPerSecond: 128000 };
                mediaRecorderRef.current = new MediaRecorder(stream, options);

                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType });
                    const url = URL.createObjectURL(audioBlob);
                    setAudioURL(url);
                    onRecordingComplete(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error("Error accessing microphone:", error);
                alert("Could not access microphone. Please check your browser permissions.");
            }
        }
    };

    return (
        <div className="audioRecorderContainer">
            <button
                type="button"
                onClick={handleRecordClick}
                className={`recordButton ${isRecording ? 'recording' : ''}`}
            >
                <div className="recordIcon"></div>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            {audioURL && (
                <div className="audioPreview">
                    <p>Your recording:</p>
                    <audio src={audioURL} controls />
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;

