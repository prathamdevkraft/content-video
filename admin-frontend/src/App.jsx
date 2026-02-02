import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { Database, FileText, CheckCircle, AlertCircle, Play, Server, Clock, Search, BarChart2 } from 'lucide-react';
import NavigationButton from './components/NavigationButton';
import RefreshButton from './components/RefreshButton';
import NewsFeed from './components/NewsFeed';
import ScriptEditor from './components/ScriptEditor';
import VideoPlayer from './components/VideoPlayer';
import PerformanceDashboard from './components/PerformanceDashboard';

const AppWrapper = styled.div`
  min-height: 100vh;
  background-color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Header = styled.header`
  width: 100%;
  max-width: 1200px;
  background: #ffffff;
  border: 4px solid #000000;
  box-shadow: 8px 8px 0 #000000;
  padding: 24px;
  margin-bottom: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    margin-bottom: 24px;
    text-align: center;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #000000;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: -1px;
`;

const StatusBadge = styled.div`
  background: #4ade80;
  border: 2px solid #000000;
  padding: 4px 12px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 2px 2px 0 #000000;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
  width: 100%;
  max-width: 1200px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const Card = styled.div`
  background: #ffffff;
  border: 4px solid #000000;
  box-shadow: 12px 12px 0 #000000;
  padding: 32px;
  transition: transform 0.2s;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
  height: 100%;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 14px 14px 0 #000000;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 4px solid #000000;
  padding-bottom: 16px;
`;

const CardTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  margin: 0;
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 32px;
  font-weight: 500;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #3b82f6;
  color: white;
  border: 4px solid #000000;
  box-shadow: 6px 6px 0 #000000;
  font-weight: 800;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.1s;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 #000000;
    background: #2563eb;
  }

  &:active {
    transform: translate(4px, 4px);
    box-shadow: 0 0 0 #000000;
  }
  
  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: 4px 4px 0 #000000;
  }

  @media (max-width: 768px) {
    padding: 12px;
    font-size: 16px;
  }
`;

const LogBox = styled.pre`
  background: #1e293b;
  color: #00ff00;
  padding: 24px;
  border: 4px solid #000000;
  box-shadow: 8px 8px 0 #000000;
  margin-top: 32px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  overflow-x: auto;
  min-height: 100px;
  max-height: 200px;
`;

const Table = styled.table`
  width: 100%;
  min-width: 600px; /* Force scroll on mobile */
  border-collapse: collapse;
  margin-top: 24px;
  background: white;
  border: 4px solid black;
  
  th, td {
    border: 2px solid black;
    padding: 12px;
    text-align: left;
    font-family: 'Inter', sans-serif;
  }
  
  th {
     background-color: #efefef;
     font-weight: 800;
     text-transform: uppercase;
  }
  
  tr:hover {
     background-color: #f9fafe;
  }
`;

const StatusTag = styled.span`
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  border: 2px solid #000;
  font-weight: 700;
  font-size: 12px;
`;

// API URL
const API_BASE = 'http://13.200.99.186:8020';

function App() {
  const [view, setView] = useState('home'); // 'home', 'dashboard', 'news', 'editor', 'publish'
  const [loading, setLoading] = useState(false);
  const [seedLogs, setSeedLogs] = useState(null);
  const [ingestionLogs, setIngestionLogs] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // --- API HANDLERS ---
  const handleSeed = async () => {
    setLoading(true);
    setSeedLogs("Initiating Seeding...");
    try {
      const res = await axios.post(`${API_BASE}/seed-knowledge`);
      setSeedLogs(prev => prev + "\n" + (res.data.output || "Success!"));
    } catch (e) {
      setSeedLogs(prev => prev + "\nError: " + e.message);
    } finally { setLoading(false); }
  };

  const handleTriggerN8n = async () => {
    setLoading(true);
    setIngestionLogs("Triggering Ingestion...");
    try {
      await axios.post(`${API_BASE}/trigger-n8n`, { workflow_id: 'production' });
      setIngestionLogs(prev => prev + "\nTriggered!");
    } catch (e) {
      setIngestionLogs(prev => prev + "\nError: " + e.message);
    } finally { setLoading(false); }
  };

  const fetchQueue = async () => {
    try {
      const res = await axios.get(`${API_BASE}/active-queue`);
      setQueueData(res.data || []);
    } catch (e) { console.error(e); }
  };

  // --- NEW WORKFLOW HANDLERS ---

  const handleGenerateScript = async (payload) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/generate-script`, payload);
      alert(`Script Generation Started! Job ID: ${res.data.job.id}`);
      fetchQueue();
      setView('dashboard'); // Go back to see it pending
    } catch (e) {
      alert("Error: " + e.message);
    } finally { setLoading(false); }
  };

  const handleApproveScript = async (payload) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/approve-script`, payload);
      alert("Script Approved! Video rendering started.");
      fetchQueue();
      setView('dashboard');
    } catch (e) {
      alert("Error: " + e.message);
    } finally { setLoading(false); }
  };

  const handlePublishVideo = async (payload) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/publish-video`, payload);
      alert("Publishing Triggered!");
      fetchQueue();
      setView('dashboard');
    } catch (e) {
      alert("Error: " + e.message);
    } finally { setLoading(false); }
  };

  const openEditor = (job) => {
    setSelectedJob(job);
    setView('editor');
  };

  const openPlayer = (job) => {
    setSelectedJob(job);
    setView('publish');
  };

  useEffect(() => {
    if (view === 'dashboard') {
      fetchQueue();
      const interval = setInterval(fetchQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [view]);

  // --- RENDERERS ---

  const renderHome = () => (
    <MainGrid>
      <Card>
        <CardHeader>
          <Database size={32} color="#000000" strokeWidth={3} />
          <CardTitle>Knowledge Base</CardTitle>
        </CardHeader>
        <Description>Manage Vector Search (RAG).</Description>
        <ActionButton onClick={handleSeed} disabled={loading} style={{ background: '#3b82f6' }}>
          {loading ? '...' : 'SEED DATABASE'}
        </ActionButton>
        {seedLogs && <LogBox>{seedLogs}</LogBox>}
      </Card>

      <Card>
        <CardHeader>
          <Clock size={32} color="#000000" strokeWidth={3} />
          <CardTitle>News Ingestion</CardTitle>
        </CardHeader>
        <Description>Trigger daily RSS ingestion.</Description>
        <ActionButton onClick={handleTriggerN8n} disabled={loading} style={{ background: '#f59e0b' }}>
          RUN PIPELINE
        </ActionButton>
        {ingestionLogs && <LogBox>{ingestionLogs}</LogBox>}
      </Card>

      <Card onClick={() => setView('news')} style={{ cursor: 'pointer' }}>
        <CardHeader>
          <Search size={32} color="#000000" strokeWidth={3} />
          <CardTitle>Content Factory</CardTitle>
        </CardHeader>
        <Description>Discover topics and generate viral scripts.</Description>
        <ActionButton style={{ background: '#000' }}>
          OPEN NEW CONTENT
        </ActionButton>
      </Card>

      <Card>
        <CardHeader>
          <BarChart2 size={32} color="#000000" strokeWidth={3} />
          <CardTitle>Performance & KPIs</CardTitle>
        </CardHeader>
        <Description>
          Tracking 30-60/day output, AEO Answer Share, and Compliance Checks.
        </Description>
        <ActionButton onClick={() => setView('analytics')} style={{ background: '#8b5cf6' }}>
          OPEN COMMAND CENTER
        </ActionButton>
      </Card>
    </MainGrid>
  );

  const renderDashboard = () => (
    <div style={{ width: '100%', maxWidth: '1200px' }}>
      <Card style={{ minHeight: '600px' }}>
        <CardHeader>
          <FileText size={32} color="#000000" strokeWidth={3} />
          <CardTitle>Content Queue (Live)</CardTitle>
        </CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <ActionButton onClick={() => setView('news')} style={{ width: 'auto', padding: '12px 24px', background: '#000', fontSize: '14px' }}>
              + NEW TOPIC
            </ActionButton>
          </div>
          <RefreshButton onClick={fetchQueue} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {queueData.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No items.</td></tr>
              ) : (
                queueData.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: '600' }}>{row.topic}</td>
                    <td>{row.platform}</td>
                    <td><StatusTag>{row.status || 'PENDING'}</StatusTag></td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>
                      {/* Dynamic Actions based on Status */}
                      {row.status === 'PENDING_REVIEW' && (
                        <button onClick={() => openEditor(row)} style={{ fontWeight: 800, cursor: 'pointer', background: '#efefef', border: '2px solid black', padding: '6px 12px' }}>
                          REVIEW SCRIPT →
                        </button>
                      )}
                      {(row.status === 'READY_TO_PUBLISH' || row.status === 'PUBLISHED') && (
                        <button onClick={() => openPlayer(row)} style={{ fontWeight: 800, cursor: 'pointer', background: '#4ade80', border: '2px solid black', padding: '6px 12px' }}>
                          {row.status === 'PUBLISHED' ? 'VIEW RESULTS' : 'PUBLISH VIDEO →'}
                        </button>
                      )}
                      {/* Fallback for other statuses */}
                      {!['PENDING_REVIEW', 'READY_TO_PUBLISH', 'PUBLISHED'].includes(row.status) && (
                        <span style={{ color: '#999', fontSize: '12px' }}>Processing...</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );

  return (
    <AppWrapper>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Server size={32} color="#000000" strokeWidth={3} />
          <Title>Taxfix Admin</Title>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <NavigationButton
            label={view === 'home' ? 'DASHBOARD' : 'HOME'}
            onClick={() => setView(view === 'home' ? 'dashboard' : 'home')}
          />
          <StatusBadge>V4.0 FACTORY</StatusBadge>
        </div>
      </Header>

      {/* VIEW ROUTER */}
      {view === 'home' && renderHome()}
      {view === 'dashboard' && renderDashboard()}

      {view === 'news' && (
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          <div style={{ marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setView('dashboard')}>← Back to Dashboard</div>
          <NewsFeed onGenerate={handleGenerateScript} />
        </div>
      )}

      {view === 'editor' && selectedJob && (
        <div style={{ width: '100%', maxWidth: '1400px' }}>
          <div style={{ marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setView('dashboard')}>← Back to Dashboard</div>
          <ScriptEditor job={selectedJob} onApprove={handleApproveScript} />
        </div>
      )}

      {view === 'publish' && selectedJob && (
        <div style={{ width: '100%', maxWidth: '1000px' }}>
          <div style={{ marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setView('dashboard')}>← Back to Dashboard</div>
          <VideoPlayer job={selectedJob} onPublish={handlePublishVideo} />
        </div>
      )}

      {view === 'analytics' && (
        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setView('home')}>← Back to Home</div>
          <PerformanceDashboard />
        </div>
      )}

    </AppWrapper>
  );
}

export default App;
