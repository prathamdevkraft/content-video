import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Check, AlertTriangle, PlayCircle, Save } from 'lucide-react';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  height: calc(100vh - 200px);
  min-height: 600px;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Card = styled.div`
  background: white;
  border: 4px solid black;
  box-shadow: 8px 8px 0 black;
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 16px 0;
  border-bottom: 2px solid #eee;
  padding-bottom: 12px;
`;

const Label = styled.label`
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: block;
  color: #666;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 16px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  border: 2px solid #000;
  background: #f9f9f9;
  min-height: 100px;
  resize: vertical;
  margin-bottom: 24px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    background: #fff;
  }
`;

const ActionButton = styled.button`
  background: #16a34a; /* Green-600 */
  color: white;
  border: 4px solid black;
  box-shadow: 6px 6px 0 black;
  padding: 20px;
  font-weight: 800;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: auto;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 black;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ComplianceBox = styled.div`
  background: #fef2f2;
  border: 2px solid #ef4444;
  padding: 16px;
  margin-bottom: 24px;
`;

const ScriptEditor = ({ job, onApprove }) => {
    const [script, setScript] = useState({
        hook: "",
        body: "",
        cta: ""
    });
    const [metadata, setMetadata] = useState({
        caption: "",
        hashtags: ""
    });

    useEffect(() => {
        if (job?.script_content) {
            setScript({
                hook: job.script_content.hook || "",
                body: job.script_content.body || "",
                cta: job.script_content.cta || ""
            });
        }
        setMetadata({
            caption: job?.social_caption || "",
            hashtags: Array.isArray(job?.hashtags) ? job.hashtags.join(" ") : (job?.hashtags || "")
        });
    }, [job]);

    const handleSave = () => {
        onApprove({
            id: job.id,
            script_content: script,
            social_caption: metadata.caption,
            hashtags: metadata.hashtags.split(" ").filter(t => t.startsWith("#"))
        });
    };

    return (
        <Container>
            {/* LEFT COLUMN: CONTEXT & METADATA */}
            <Column>
                <Card>
                    <Title>Source Context</Title>
                    <div style={{ marginBottom: '20px' }}>
                        <Label>Topic</Label>
                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{job?.topic}</div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <Label>Source URL</Label>
                        <a href={job?.source_url} target="_blank" style={{ color: 'blue' }}>
                            {job?.source_url}
                        </a>
                    </div>

                    <ComplianceBox>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 'bold', marginBottom: '8px' }}>
                            <AlertTriangle size={20} /> Compliance Check
                        </div>
                        <p style={{ fontSize: '14px', margin: 0 }}>
                            Ensure NO financial advice is given. Cite EStG paragraphs where possible.
                            Verify facts against source URL.
                        </p>
                    </ComplianceBox>

                    <Label>Social Caption</Label>
                    <TextArea
                        value={metadata.caption}
                        onChange={(e) => setMetadata({ ...metadata, caption: e.target.value })}
                        style={{ minHeight: '80px' }}
                    />

                    <Label>Hashtags</Label>
                    <TextArea
                        value={metadata.hashtags}
                        onChange={(e) => setMetadata({ ...metadata, hashtags: e.target.value })}
                        style={{ minHeight: '60px' }}
                    />
                </Card>
            </Column>

            {/* RIGHT COLUMN: SCRIPT EDITING */}
            <Column>
                <Card>
                    <Title>Script Editor (AI Draft)</Title>

                    <Label>1. The Hook (0-5s) - Grab Attention</Label>
                    <TextArea
                        value={script.hook}
                        onChange={(e) => setScript({ ...script, hook: e.target.value })}
                    />

                    <Label>2. The Body (5-45s) - Value & Info</Label>
                    <TextArea
                        value={script.body}
                        onChange={(e) => setScript({ ...script, body: e.target.value })}
                        style={{ minHeight: '200px' }}
                    />

                    <Label>3. Call to Action (45-60s) - Next Step</Label>
                    <TextArea
                        value={script.cta}
                        onChange={(e) => setScript({ ...script, cta: e.target.value })}
                        style={{ minHeight: '60px' }}
                    />

                    <ActionButton onClick={handleSave}>
                        <Check size={24} strokeWidth={3} /> APPROVE & RENDER VIDEO
                    </ActionButton>
                </Card>
            </Column>
        </Container>
    );
};

export default ScriptEditor;
