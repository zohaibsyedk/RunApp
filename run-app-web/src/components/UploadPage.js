import './UploadPage.css';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AudioRecorder from './AudioRecorder';

const UploadPage = () => {
    const shareId = useParams().share_id;
    const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";
    const [formData, setFormData] = useState({
        senderName: '',
        triggerType: 'distance',
        triggerValue: '',
        audioFile: null, 
    });
    const [uploadStatus, setUploadStatus] = useState('idle'); //idle, uploading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [pageData, setPageData] = useState({
        user: null,
        event: null,
        status: 'loading', // loading, success, error
        errorMessage: '',
    });

    useEffect(() => {
        console.log("using effect", shareId);
        if (!shareId) {
            setPageData({
                user: null,
                event: null,
                status: 'error',
                errorMessage: 'No share link ID found in the URL.',
            });
            return;
        }

        const fetchPageData = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/sessions/${shareId}`);

                if (response.data && response.data.success) {
                    setPageData({
                        user: response.data.user,
                        event: response.data.event,
                        status: 'success',
                        errorMessage: '',
                    });
                } else {
                    throw new Error(response.data.error || 'Failed to retrieve data.');
                }
            } catch (error) {
                console.error('Failed to fetch page data:', error);
                setPageData({
                    user: null,
                    event: null,
                    status: 'error',
                    errorMessage: error.response?.data?.error || 'This share link may be invalid or expired.',
                });
            }
        };

        fetchPageData();
    }, [shareId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAudioRecording = (audioBlob) => {
        setFormData(prev => ({ ...prev, audioFile: audioBlob }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.audioFile) {
            setErrorMessage('Please record a voice message before sending.');
            setUploadStatus('error');
            return;
        }

        setUploadStatus('uploading');
        setErrorMessage('');
        const submissionData = new FormData();
        submissionData.append('senderName', formData.senderName);
        submissionData.append('triggerType', formData.triggerType);
        if (formData.triggerType === 'distance') {
            submissionData.append('triggerValue', (formData.triggerValue*1609.34));
        } else {
            submissionData.append('triggerValue', (formData.triggerValue));
        }
        submissionData.append('audioFile', formData.audioFile, 'cheer-recording.webm');

        try {
            const response = await axios.post(`${API_URL}/api/events/${shareId}/upload`, submissionData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Upload successful:', response.data);
            setUploadStatus('success');
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            setErrorMessage(error.response?.data?.message || 'Failed to upload message. Please try again.');
        }
    };

    if (uploadStatus === 'success') {
        return (
            <div className="successPage">
                <h2>Thank You!</h2>
                <p>Your voice message has been successfully sent to {pageData?.user?.displayName || "the Runner"}! 🎉</p>
            </div>
        );
    }

    return (
        <div className='uploadForm'>
            <h1>Send a Cheer to {pageData?.user?.displayName || "the Runner"}!</h1>
            <p>Record a voice message to motivate your friend during their run:{" '"+(pageData?.event?.name || "Run")+"' "}.</p>

            <form onSubmit={handleSubmit}>
                <div className="formGroup">
                    <label htmlFor="senderName">Your Name:</label>
                    <input type="text" id="senderName" name="senderName" value={formData.senderName} onChange={handleInputChange} placeholder="Enter your name" required />
                </div>
                <div className="formGroup">
                    <label>Play this message at:</label>
                    <div className="triggerInputGroup">
                        <select id="triggerType" name="triggerType" value={formData.triggerType} onChange={handleInputChange}>
                            <option value="distance">A specific distance</option>
                            <option value="time">A specific time</option>
                        </select>
                        <input type="number" name="triggerValue" value={formData.triggerValue} onChange={handleInputChange} step={formData.triggerType === 'distance' ? "0.1" : "1"} placeholder={formData.triggerType === 'distance' ? "0.5" : "30"} required />
                        <span>{formData.triggerType === 'distance' ? 'miles' : 'seconds'}</span>
                    </div>
                </div>

                <div className="formGroup">
                    <label>Voice Message:</label>
                    <AudioRecorder onRecordingComplete={handleAudioRecording} />
                </div>

                <button className="submitButton" type="submit" disabled={uploadStatus === 'uploading' || !formData.audioFile}>
                    {uploadStatus === 'uploading' ? 'Sending...' : 'Send Cheer!'}
                </button>
            </form>

            {uploadStatus === 'error' && (
                <div className="errorMessage">
                    <p><strong>Error:</strong> {errorMessage}</p>
                </div>
            )}
        </div>
    );
}

export default UploadPage;
