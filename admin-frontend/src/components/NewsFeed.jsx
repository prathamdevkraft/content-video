import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { Plus, TrendingUp, RefreshCw, Send, Globe } from 'lucide-react';

const Container = styled.div`
  max-width: 1200px;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
`;

const NewsCard = styled.div`
  background: white;
  border: 3px solid black;
  box-shadow: 6px 6px 0 black;
  padding: 24px;
  transition: transform 0.2s;
  cursor: pointer;
  position: relative;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 black;
  }
`;

const Tag = styled.span`
  background: #fef08a; /* Yellow-200 */
  border: 2px solid black;
  padding: 4px 8px;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  margin-right: 8px;
`;

const Source = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
`;

const TopicInput = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
  background: white;
  padding: 24px;
  border: 4px solid black;
  box-shadow: 8px 8px 0 black;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 16px;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 16px;
  font-size: 18px;
  border: 3px solid black;
  font-family: 'Inter', sans-serif;
  font-weight: 600;

  &:focus {
    outline: none;
    box-shadow: 4px 4px 0 #4ade80; /* Green shadow on focus */
  }
`;

const Button = styled.button`
  background: #000;
  color: #fff;
  border: none;
  padding: 0 32px;
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #333;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

// Mock Current Trends (simulating Google Trends / API)
const MOCK_TRENDS = [
  { id: 1, topic: "New Kindergeld Rules 2026", source: "Bundesfinanzministerium", url: "https://bundesfinanzministerium.de", tag: "HOT" },
  { id: 2, topic: "Home Office Pauschale Increase", source: "Tagesschau", url: "https://tagesschau.de", tag: "TRENDING" },
  { id: 3, topic: "Crypto Tax Exemption Changes", source: "Handelsblatt", url: "https://handelsblatt.com", tag: "NEW" },
  { id: 4, topic: "Student Loan Interest Deductions", source: "Spiegel", url: "https://spiegel.de", tag: "GUIDE" },
];

const NewsFeed = ({ onGenerate }) => {
  const [customTopic, setCustomTopic] = useState("");
  const [generating, setGenerating] = useState(null); // ID or 'custom'
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get('http://13.200.99.186:8020/news');
        // Map DB columns to UI format
        const items = res.data.map(item => ({
          id: item.id,
          topic: item.topic,
          source: "Ingestion System",
          url: item.source_url || "#",
          tag: item.platform || "NEW"
        }));
        setTrends(items);
      } catch (e) { console.error("Failed to fetch news", e); }
    };
    fetchNews();
  }, []);

  const handleGenerate = async (topic, sourceUrl = "https://taxfix.de", id = 'custom') => {
    setGenerating(id);
    // Call parent handler
    await onGenerate({ topic, source_url: sourceUrl });
    setGenerating(null);
    if (id === 'custom') setCustomTopic("");
  };

  return (
    <Container>
      <SectionTitle>
        <Plus size={32} /> Create from Topic
      </SectionTitle>

      <TopicInput>
        <Input
          placeholder="e.g. 'Tax changes for freelancers in 2025'..."
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
        />
        <Button
          onClick={() => handleGenerate(customTopic)}
          disabled={!customTopic.trim() || generating === 'custom'}
        >
          {generating === 'custom' ? <RefreshCw className="spin" size={20} /> : <Send size={20} />}
          Generate
        </Button>
      </TopicInput>

      <SectionTitle>
        <TrendingUp size={32} /> Trending Now
      </SectionTitle>

      <Grid>
        {trends.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>No pending news items found. Trigger the pipeline!</p>}
        {trends.map((item) => (
          <NewsCard key={item.id} onClick={() => handleGenerate(item.topic, item.url, item.id)}>
            <div style={{ marginBottom: '12px' }}>
              <Tag>{item.tag}</Tag>
            </div>
            <h3 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>{item.topic}</h3>
            <Source>
              <Globe size={14} /> {item.source}
            </Source>
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontWeight: 800, fontSize: '14px', textDecoration: 'underline' }}>
                {generating === item.id ? 'GENERATING...' : 'CREATE SCRIPT →'}
              </span>
            </div>
          </NewsCard>
        ))}
      </Grid>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </Container>
  );
};

export default NewsFeed;
