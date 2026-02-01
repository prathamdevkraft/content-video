import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { Database, FileText, CheckCircle, AlertCircle, Play, Server, Clock, Search } from 'lucide-react';
import NavigationButton from './components/NavigationButton';

const AppWrapper = styled.div`
  min-height: 100vh;
  background-color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 32px;
  width: 100%;
  max-width: 1200px;
`;

const Card = styled.div`
  background: #ffffff;
  border: 4px solid #000000;
  box-shadow: 12px 12px 0 #000000;
  padding: 32px;
  transition: transform 0.2s;
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

// API URL (Auto-switches based on env, but hardcoded to IP for now as per previous step)
const API_BASE = 'http://13.200.99.186:8020';

function App() {
  const [view, setView] = useState('home'); // 'home' | 'dashboard'
  const [loading, setLoading] = useState(false);
  const [seedLogs, setSeedLogs] = useState(null);
  const [ingestionLogs, setIngestionLogs] = useState(null);
  const [queueData, setQueueData] = useState([]);

  // Seeding
  const handleSeed = async () => {
    setLoading(true);
    setSeedLogs("Initiating Knowledge Base Seeding...\nConnecting to Supabase...");
    try {
      const response = await axios.post(`${API_BASE}/seed-knowledge`);
      setSeedLogs((prev) => prev + "\n" + (response.data.output || "Success!"));
    } catch (error) {
      setSeedLogs((prev) => prev + "\n❌ Error: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Trigger n8n
  const handleTriggerN8n = async () => {
    setLoading(true);
    setIngestionLogs("Triggering n8n Ingestion Workflow...");
    try {
      const response = await axios.post(`${API_BASE}/trigger-n8n`, { workflow_id: 'production' });
      setIngestionLogs((prev) => prev + "\n✅ Triggered! " + JSON.stringify(response.data));
      // Wait a bit then refresh queue
      setTimeout(fetchQueue, 2000);
    } catch (error) {
      setIngestionLogs((prev) => prev + "\n❌ Error: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch Queue
  const fetchQueue = async () => {
    try {
      const response = await axios.get(`${API_BASE}/active-queue`);
      setQueueData(response.data || []);
    } catch (e) {
      console.error("Failed to fetch queue", e);
    }
  };

  useEffect(() => {
    if (view === 'dashboard') {
      fetchQueue();
      const interval = setInterval(fetchQueue, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [view]);

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
          <StatusBadge>V2.1 LIVE</StatusBadge>
        </div>
      </Header>

      {view === 'home' ? (
        <MainGrid>
          <Card>
            <CardHeader>
              <Database size={32} color="#000000" strokeWidth={3} />
              <CardTitle>Knowledge Base</CardTitle>
            </CardHeader>

            <Description>
              Manage the Vector Search database (RAG).
              Generate embeddings for the core German Tax Laws (EStG) to populate 'tax_laws'.
            </Description>

            <ActionButton onClick={handleSeed} disabled={loading} style={{ background: '#3b82f6' }}>
              {loading ? 'Processing...' : (
                <><Play size={24} strokeWidth={3} /> SEED DATABASE</>
              )}
            </ActionButton>

            {seedLogs && <LogBox>{seedLogs}</LogBox>}
          </Card>

          <Card>
            <CardHeader>
              <Clock size={32} color="#000000" strokeWidth={3} />
              <CardTitle>Ingestion Trigger</CardTitle>
            </CardHeader>
            <Description>
              Manually trigger the daily news ingestion workflow (n8n).
              Useful for testing the pipeline on-demand.
            </Description>

            <ActionButton onClick={handleTriggerN8n} disabled={loading} style={{ background: '#f59e0b' }}>
              <Play size={24} strokeWidth={3} /> RUN PIPELINE
            </ActionButton>

            {ingestionLogs && <LogBox>{ingestionLogs}</LogBox>}
          </Card>
        </MainGrid>
      ) : (
        /* DASHBOARD VIEW */
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          <Card style={{ minHeight: '600px' }}>
            <CardHeader>
              <FileText size={32} color="#000000" strokeWidth={3} />
              <CardTitle>Content Queue (Live)</CardTitle>
            </CardHeader>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <Description>Real-time view of generated video scripts.</Description>
              <NavigationButton
                label="REFRESH"
                onClick={fetchQueue}
                width="160px"
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Platform</th>
                    <th>Confidence</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {queueData.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No items in queue yet.</td></tr>
                  ) : (
                    queueData.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: '600' }}>{row.topic}</td>
                        <td>{row.platform}</td>
                        <td>{row.compliance_score}%</td>
                        <td><StatusTag>{row.status || 'PENDING'}</StatusTag></td>
                        <td>{new Date(row.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </AppWrapper>
  );
}

export default App;
