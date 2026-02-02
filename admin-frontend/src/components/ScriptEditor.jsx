import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Check, AlertTriangle, PlayCircle, Save, FileText, Video } from 'lucide-react';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  height: calc(100vh - 200px);
  min-height: 600px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    height: auto;
    min-height: auto;
  }
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const ToggleContainer = styled.div`
  display: flex;
  background: #eee;
  padding: 4px;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const ToggleButton = styled.button`
  flex: 1;
  padding: 8px;
  border: none;
  background: ${props => props.active ? 'white' : 'transparent'};
  box-shadow: ${props => props.active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};
  font-weight: ${props => props.active ? '800' : '500'};
  color: ${props => props.active ? 'black' : '#666'};
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
  
  @media (max-width: 768px) {
    width: 100%;
    margin-top: 24px;
  }
`;

const ComplianceBox = styled.div`
  background: #fef2f2;
  border: 2px solid #ef4444;
  padding: 16px;
  margin-bottom: 24px;
`;

const ScriptEditor = ({ job, onApprove }) => {
    const [mode, setMode] = useState('video'); // 'video' | 'blog'
    const [language, setLanguage] = useState('de'); // 'de' | 'en'

    // Video State
    const [script, setScript] = useState({
        de: { hook: "", body: "", cta: "" },
        en: { hook: "", body: "", cta: "" }
    });

    // Blog State
    const [blog, setBlog] = useState({
        de: { title: "", body: "", tags: "" },
        en: { title: "", body: "", tags: "" }
    });

    const [metadata, setMetadata] = useState({
        caption: "",
        hashtags: ""
    });

    useEffect(() => {
        // Init Video
        const scriptData = job?.script_structure || job?.script_content || {};
        const scriptDataEn = job?.script_structure_en || {};

        setScript({
            de: {
                hook: scriptData.hook || "",
                body: scriptData.body || "",
                cta: scriptData.cta || ""
            },
            en: {
                hook: scriptDataEn.hook || "",
                body: scriptDataEn.body || "",
                cta: scriptDataEn.cta || ""
            }
        });

        // Init Blog
        const blogContent = job?.blog_content || {};
        const blogContentEn = job?.blog_content_en || {};

        setBlog({
            de: {
                title: blogContent.title || "",
                body: blogContent.body || "",
                tags: Array.isArray(blogContent.tags) ? blogContent.tags.join(" ") : (blogContent.tags || "")
            },
            en: {
                title: blogContentEn.title || "",
                body: blogContentEn.body || "",
                tags: Array.isArray(blogContentEn.tags) ? blogContentEn.tags.join(" ") : (blogContentEn.tags || "")
            }
        });

        // Init Metadata
        const social = job?.social_metrics || {};
        setMetadata({
            caption: social.caption || "",
            hashtags: Array.isArray(social.hashtags) ? social.hashtags.join(" ") : (social.hashtags || "")
        });
    }, [job]);

    const handleAction = async (action) => {
        // Call the new Taxfix_3 workflow
        // In production, use axios or a service wrapper
        try {
            await fetch('https://n8n.taxfix.devkraft.in/webhook/process-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    payload: {
                        id: job.id,
                        language: language,
                        script_structure: script[language],
                        blog_content: blog[language],
                        topic: job.topic,
                        platform: job.platform
                    }
                })
            });
            alert(`Action '${action}' triggered! Reload page in a few seconds.`);
        } catch (e) {
            alert('Error triggering action: ' + e.message);
        }
    };

    const handleSave = () => {
        onApprove({
            id: job.id,
            script_structure: script.de,
            script_structure_en: script.en,
            blog_content: { ...blog.de, tags: blog.de.tags.split(" ").filter(t => t.startsWith("#")) },
            blog_content_en: { ...blog.en, tags: blog.en.tags.split(" ").filter(t => t.startsWith("#")) },
            social_metrics: {
                caption: metadata.caption,
                hashtags: metadata.hashtags.split(" ").filter(t => t.startsWith("#"))
            }
        });
    };

    const currentScript = script[language];
    const currentBlog = blog[language];

    const updateScript = (field, val) => {
        setScript(prev => ({
            ...prev,
            [language]: { ...prev[language], [field]: val }
        }));
    };

    const updateBlog = (field, val) => {
        setBlog(prev => ({
            ...prev,
            [language]: { ...prev[language], [field]: val }
        }));
    };

    return (
        <Container>
            {/* LEFT COLUMN: CONTEXT */}
            <Column>
                <Card>
                    <Title>Source Context</Title>
                    <div style={{ marginBottom: '20px' }}>
                        <Label>Topic</Label>
                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{job?.topic}</div>
                    </div>

                    <ComplianceBox>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 'bold', marginBottom: '8px' }}>
                            <AlertTriangle size={20} /> Compliance Check
                        </div>
                        <p style={{ fontSize: '14px', margin: 0 }}>
                            Ensure NO financial advice is given.
                        </p>
                    </ComplianceBox>

                    {/* METADATA SECTION with Generator */}
                    <Title>Social Metadata</Title>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => handleAction('generate_metadata')} style={{ cursor: 'pointer', background: '#ddd', border: '1px solid black', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>✨ Generate AI Metrics</button>
                    </div>

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

            {/* RIGHT COLUMN: EDITOR */}
            <Column>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Title style={{ border: 'none', margin: 0, padding: 0 }}>Content Editor</Title>
                        {/* LANGUAGE TOGGLE */}
                        <ToggleContainer style={{ marginBottom: 0, width: 'auto' }}>
                            <ToggleButton active={language === 'de'} onClick={() => setLanguage('de')}>DE</ToggleButton>
                            <ToggleButton active={language === 'en'} onClick={() => setLanguage('en')}>EN</ToggleButton>
                        </ToggleContainer>
                    </div>

                    <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                        <button onClick={() => handleAction('translate')} style={{ padding: '8px', cursor: 'pointer' }}>🌍 Auto-Translate to {language === 'de' ? 'English' : 'German'}</button>
                    </div>

                    <ToggleContainer>
                        <ToggleButton active={mode === 'video'} onClick={() => setMode('video')}>
                            <Video size={18} /> Video Script
                        </ToggleButton>
                        <ToggleButton active={mode === 'blog'} onClick={() => setMode('blog')}>
                            <FileText size={18} /> Blog Post
                        </ToggleButton>
                    </ToggleContainer>

                    {mode === 'video' ? (
                        <>
                            <Label>1. The Hook (0-5s)</Label>
                            <TextArea
                                value={currentScript.hook}
                                onChange={(e) => updateScript('hook', e.target.value)}
                            />

                            <Label>2. The Body (Script)</Label>
                            <TextArea
                                value={currentScript.body}
                                onChange={(e) => updateScript('body', e.target.value)}
                                style={{ minHeight: '200px' }}
                            />

                            <Label>3. Call to Action</Label>
                            <TextArea
                                value={currentScript.cta}
                                onChange={(e) => updateScript('cta', e.target.value)}
                                style={{ minHeight: '60px' }}
                            />
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Label>Headline</Label>
                                <button onClick={() => handleAction('regenerate_blog')} style={{ fontSize: '10px', marginBottom: '4px', cursor: 'pointer' }}>🔄 Regenerate from Script</button>
                            </div>
                            <TextArea
                                value={currentBlog.title}
                                onChange={(e) => updateBlog('title', e.target.value)}
                                style={{ minHeight: '60px', fontWeight: 'bold' }}
                            />

                            <Label>Article Body (Markdown)</Label>
                            <TextArea
                                value={currentBlog.body}
                                onChange={(e) => updateBlog('body', e.target.value)}
                                style={{ minHeight: '400px' }}
                            />
                        </>
                    )}

                    <ActionButton onClick={handleSave}>
                        <Save size={24} strokeWidth={3} /> SAVE & PUBLISH
                    </ActionButton>
                </Card>
            </Column>
        </Container>
    );
};

export default ScriptEditor;
