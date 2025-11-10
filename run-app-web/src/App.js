import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './components/UploadPage';

const App = () => {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/share/:share_id" element={<UploadPage />}/>
          <Route path="*" element={<div className="AppTest"><h1>Welcome to the Run App</h1><p>This link appears to be invalid.</p></div>}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
