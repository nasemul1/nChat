import CRTOverlay from './components/CRTOverlay';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import './App.css';

function App() {
  return (
    <>
      <CRTOverlay />
      <div className="app">
        <Sidebar />
        <ChatArea />
      </div>
      <SettingsModal />
    </>
  );
}

export default App;
