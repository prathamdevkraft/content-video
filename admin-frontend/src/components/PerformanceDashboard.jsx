import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, Activity, Globe, TrendingUp } from 'lucide-react';

const Container = styled.div`
  max-width: 1400px;
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h2`
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const KPIBox = styled.div`
  background: white;
  border: 4px solid black;
  box-shadow: 6px 6px 0 black;
  padding: 24px;
  flex: 1;
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const KPIValue = styled.div`
  font-size: 32px;
  font-weight: 900;
  margin: 8px 0;
  color: #000;
`;

const KPILabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: 32px;
  margin-bottom: 32px;
`;

const ChartCard = styled.div`
  background: white;
  border: 4px solid black;
  box-shadow: 8px 8px 0 black;
  padding: 24px;
  height: 400px;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 24px 0;
  border-bottom: 3px solid #eee;
  padding-bottom: 12px;
`;

// --- MOCK DATA BASED ON RFP ---

const MOCK_OUTPUT_DATA = [
    { name: 'Mon', TikTok: 12, Instagram: 15, YouTube: 8 },
    { name: 'Tue', TikTok: 18, Instagram: 20, YouTube: 10 },
    { name: 'Wed', TikTok: 15, Instagram: 18, YouTube: 12 },
    { name: 'Thu', TikTok: 22, Instagram: 25, YouTube: 15 },
    { name: 'Fri', TikTok: 20, Instagram: 22, YouTube: 14 },
    { name: 'Sat', TikTok: 8, Instagram: 10, YouTube: 5 },
    { name: 'Sun', TikTok: 10, Instagram: 12, YouTube: 6 },
];

const MOCK_AEO_DATA = [
    { name: 'Week 1', Share: 12 },
    { name: 'Week 2', Share: 15 },
    { name: 'Week 3', Share: 22 },
    { name: 'Week 4', Share: 28 },
    { name: 'Week 5', Share: 35 },
    { name: 'Week 6', Share: 42 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const PIE_DATA = [
    { name: 'Approved', value: 400 },
    { name: 'Rejected (Compliance)', value: 45 },
    { name: 'Pending Review', value: 120 },
];

const PerformanceDashboard = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://13.200.99.186:8020/analytics');
                setData(res.data);
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, []);

    const pieData = data ? data.status_distribution : PIE_DATA;
    const totalAssets = data ? data.total_assets : 0;

    return (
        <Container>
            <Header>
                <Title>
                    <Activity size={32} /> Command Center
                </Title>
                <p style={{ fontSize: '16px', color: '#666', marginTop: '8px' }}>Performance signals against RFP Goals (DE, UK, ES)</p>
            </Header>

            <KPIGrid>
                <KPIBox>
                    <ShieldCheck size={24} color="#16a34a" />
                    <KPIValue>{data ? data.compliance_rate : 98}%</KPIValue>
                    <KPILabel>Compliance Pass Rate</KPILabel>
                </KPIBox>
                <KPIBox>
                    <Globe size={24} color="#3b82f6" />
                    <KPIValue>DE, UK</KPIValue>
                    <KPILabel>Active Markets</KPILabel>
                </KPIBox>
                <KPIBox>
                    <TrendingUp size={24} color="#f59e0b" />
                    <KPIValue>+42%</KPIValue>
                    <KPILabel>AEO Answer Share (MoM)</KPILabel>
                </KPIBox>
                <KPIBox>
                    <div style={{ fontWeight: 900, fontSize: '24px' }}>{totalAssets} / 60</div>
                    <KPILabel>Daily Output Goal (Assets)</KPILabel>
                </KPIBox>
            </KPIGrid>

            <ChartGrid>
                <ChartCard>
                    <ChartTitle>Weekly Production Output (Target: 30-60/day)</ChartTitle>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={MOCK_OUTPUT_DATA}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="TikTok" stackId="a" fill="#000000" />
                            <Bar dataKey="Instagram" stackId="a" fill="#d62976" />
                            <Bar dataKey="YouTube" stackId="a" fill="#ff0000" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard>
                    <ChartTitle>AEO "Answer Share" Growth (Google/Perplexity)</ChartTitle>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={MOCK_AEO_DATA}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Share" stroke="#8884d8" strokeWidth={4} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </ChartGrid>

            <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
                <ChartCard style={{ flex: 1 }}>
                    <ChartTitle>Content Governance & Status</ChartTitle>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#16a34a', '#dc2626', '#fbbf24'][index % 3]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <div style={{ flex: 1 }}>
                    <ChartCard style={{ overflowY: 'auto' }}>
                        <ChartTitle>Recent Audit Trail (Governance)</ChartTitle>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid black' }}>
                                    <th style={{ padding: '8px' }}>Time</th>
                                    <th style={{ padding: '8px' }}>Action</th>
                                    <th style={{ padding: '8px' }}>User</th>
                                    <th style={{ padding: '8px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px 8px' }}>10:{10 + i} AM</td>
                                        <td style={{ padding: '12px 8px' }}>Approved Script #{1020 + i}</td>
                                        <td style={{ padding: '12px 8px' }}>Reviewer_1</td>
                                        <td style={{ padding: '12px 8px' }}><span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>COMPLIANT</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ChartCard>
                </div>
            </div>

        </Container>
    );
};

export default PerformanceDashboard;
