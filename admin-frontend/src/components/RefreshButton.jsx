import React from 'react';
import styled from 'styled-components';

const RefreshButton = ({ onClick }) => {
    return (
        <StyledWrapper>
            <button className="cta" onClick={(e) => { e.preventDefault(); onClick && onClick(); }}>
                <span>REFRESH</span>
                <svg width="15px" height="10px" viewBox="0 0 13 10">
                    <path d="M1,5 L11,5" />
                    <polyline points="8 1 12 5 8 9" />
                </svg>
            </button>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  .cta {
    position: relative;
    margin: auto;
    padding: 12px 18px;
    transition: all 0.2s ease;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .cta:before {
    content: "";
    position: absolute;
    top: 50%; /* Center vertically */
    left: 0;
    transform: translateY(-50%); /* Center vertically */
    display: block;
    border-radius: 50px;
    background: #4ade80; /* Theme Green */
    width: 45px;
    height: 45px;
    transition: all 0.3s ease;
    border: 2px solid #000; /* Theme Border */
  }

  .cta span {
    position: relative;
    font-family: "Inter", sans-serif;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #000000;
    margin-left: 10px; /* Adjust for circle */
  }

  .cta svg {
    position: relative;
    top: 0;
    margin-left: 10px;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: #000000;
    stroke-width: 2;
    transform: translateX(-5px);
    transition: all 0.3s ease;
  }

  .cta:hover:before {
    width: 100%;
    background: #4ade80;
  }

  .cta:hover svg {
    transform: translateX(0);
  }

  .cta:active {
    transform: scale(0.95);
  }
`;

export default RefreshButton;
