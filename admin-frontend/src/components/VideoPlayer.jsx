import React, { useState } from 'react';
import styled from 'styled-components';
import { Share2, Download, ExternalLink, CheckCircle } from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
`;

const VideoWrapper = styled.div`
  width: 100%;
  aspect-ratio: 9/16;
  max-height: 70vh;
  background: black;
  border: 4px solid black;
  box-shadow: 12px 12px 0 black;
  margin-bottom: 32px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Controls = styled.div`
  width: 100%;
  background: white;
  border: 4px solid black;
  box-shadow: 8px 8px 0 black;
  padding: 24px;
`;

const Button = styled.button`
  background: #3b82f6;
  color: white;
  border: 4px solid black;
  box-shadow: 4px 4px 0 black;
  padding: 16px 32px;
  font-weight: 800;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: center;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 black;
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 black;
  }
`;

const PlatformGrid = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const PlatformCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  cursor: pointer;
  padding: 12px;
  border: 2px solid black;
  background: ${props => props.checked ? '#dbeafe' : 'white'};
  flex: 1;
`;

const VideoPlayer = ({ job, onPublish }) => {
    const [platforms, setPlatforms] = useState({
        TikTok: true,
        Instagram: true,
        YouTube: false
    });

    const handleToggle = (p) => {
        setPlatforms(prev => ({ ...prev, [p]: !prev[p] }));
    };

    const handlePublish = () => {
        const selected = Object.keys(platforms).filter(k => platforms[k]);
        onPublish({ id: job.id, platforms: selected });
    };

    if (!job) return null;

    return (
        <Container>
            <VideoWrapper>
                {job.video_url ? (
                    <video
                        src={job.video_url}
                        controls
                        style={{ height: '100%', width: 'auto', maxWidth: '100%' }}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>
                        <h3>Video Rendering...</h3>
                        <p>This may take 2-3 minutes.</p>
                    </div>
                )}
            </VideoWrapper>

            <Controls>
                <h3 style={{ marginTop: 0 }}>Publishing Options</h3>
                <PlatformGrid>
                    {['TikTok', 'Instagram', 'YouTube'].map(p => (
                        <PlatformCheckbox key={p} checked={platforms[p]}>
                            <input
                                type="checkbox"
                                checked={platforms[p]}
                                onChange={() => handleToggle(p)}
                                style={{ width: '20px', height: '20px' }}
                            />
                            {p}
                        </PlatformCheckbox>
                    ))}
                </PlatformGrid>

                <Button onClick={handlePublish}>
                    <Share2 size={24} /> PUBLISH TO SELECTED PLATFORMS
                </Button>
            </Controls>
        </Container>
    );
};

export default VideoPlayer;
