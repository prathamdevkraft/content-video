import { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { Database, FileText, CheckCircle, AlertCircle, Play, Server } from 'lucide-react';

// --- STYLED COMPONENTS (Retro-Modern / Neubrutalism) ---

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
box - shadow: 12px 12px 0 #000000;
padding: 32px;
transition: transform 0.2s;

  &:hover {
  transform: translate(-2px, -2px);
  box - shadow: 14px 14px 0 #000000;
}
`;

const CardHeader = styled.div`
display: flex;
align - items: center;
gap: 16px;
margin - bottom: 24px;
border - bottom: 4px solid #000000;
padding - bottom: 16px;
`;

const CardTitle = styled.h2`
font - size: 24px;
font - weight: 800;
margin: 0;
`;

const Description = styled.p`
font - size: 16px;
line - height: 1.6;
color: #333;
margin - bottom: 32px;
font - weight: 500;
`;

const ActionButton = styled.button`
width: 100 %;
padding: 16px;
background: #3b82f6;
color: white;
border: 4px solid #000000;
box - shadow: 6px 6px 0 #000000;
font - weight: 800;
font - size: 18px;
cursor: pointer;
display: flex;
align - items: center;
justify - content: center;
gap: 12px;
transition: all 0.1s;

  &:hover {
  transform: translate(-2px, -2px);
  box - shadow: 8px 8px 0 #000000;
  background: #2563eb;
}

  &:active {
  transform: translate(4px, 4px);
  box - shadow: 0 0 0 #000000;
}
  
  &:disabled {
  background: #94a3b8;
  cursor: not - allowed;
  transform: none;
  box - shadow: 4px 4px 0 #000000;
}
`;

const LogBox = styled.pre`
background: #1e293b;
color: #00ff00;
padding: 24px;
border: 4px solid #000000;
box - shadow: 8px 8px 0 #000000;
margin - top: 32px;
font - family: 'JetBrains Mono', monospace;
font - size: 14px;
overflow - x: auto;
min - height: 100px;
`;

function App() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState(null);

  const handleSeed = async () => {
    setLoading(true);
    setLogs("Initiating Knowledge Base Seeding...\nConnecting to Supabase...");
    try {
      const response = await axios.post('http://13.200.99.186:8020/seed-knowledge');
      setLogs((prev) => prev + "\n" + (response.data.output || "Success!"));
    } catch (error) {
      setLogs((prev) => prev + "\n❌ Error: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppWrapper>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Server size={32} color="#000000" strokeWidth={3} />
          <Title>Taxfix Admin</Title>
        </div>
        <StatusBadge>V2.0 LIVE</StatusBadge>
      </Header>

      <MainGrid>
        <Card>
          <CardHeader>
            <Database size={32} color="#000000" strokeWidth={3} />
            <CardTitle>Knowledge Base</CardTitle>
          </CardHeader>

          <Description>
            Manage the Vector Search database (RAG).
            This action will generate embeddings for the core German Tax Laws (EStG)
            and populate the 'tax_laws' table in Supabase.
          </Description>

          <ActionButton onClick={handleSeed} disabled={loading}>
            {loading ? (
              <>Processing...</>
            ) : (
              <>
                <Play size={24} strokeWidth={3} />
                SEED DATABASE
              </>
            )}
          </ActionButton>

          {logs && (
            <LogBox>
              {logs}
            </LogBox>
          )}
        </Card>

        {/* Placeholder for future Content Queue UI */}
        <Card style={{ opacity: 0.6 }}>
          <CardHeader>
            <FileText size={32} color="#000000" strokeWidth={3} />
            <CardTitle>Content Queue</CardTitle>
          </CardHeader>
          <Description>
            View and manage pending social media posts.
            (Coming Soon in Admin V2)
          </Description>
        </Card>
      </MainGrid>
    </AppWrapper>
  );
}

export default App;
