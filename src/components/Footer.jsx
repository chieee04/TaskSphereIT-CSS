import React from 'react';
import { Link } from "react-router-dom";
// ...
<Link to="/TermsOfService" className="hover:underline">Terms of Service</Link>

 
// NOTE: This component assumes its parent container uses a layout system (like Flexbox or Grid) 
// to push it to the very bottom of the screen when content is short.
const Footer = () => {
    return (
        // The main container for the footer content. It will be pushed down by the main content area.
        <div style={{ flexShrink: 0 }}>
            {/* The separator line */}
            <div
                style={{
                    backgroundColor: '#3B0304',
                    height: '2px',
                    margin: '0 0.3in',
                    borderRadius: '4px',
                }}
            />
 
            <footer className="bg-white py-3">
                <div
                    // The content container that handles the spacing and alignment
                    style={{
                        paddingLeft: '0.3in',
                        paddingRight: '0.3in',
                        display: 'flex', // Use Flexbox for internal content alignment
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Copyright Text */}
                    <p
                        style={{ 
                            color: '#3B0304', 
                            fontSize: '14px', 
                            margin: 0, // Reset default margin
                        }}
                    >
                        ©2025 TaskSphere IT - All Rights Reserved
                    </p>
 
                    {/* Terms of Service Link */}
                    <a
                        href="#"
                        style={{ 
                            color: '#3B0304', 
                            fontSize: '14px',
                            textDecoration: 'none', // Remove underline from link
                        }}
                    >
                        Terms of Service
                    </a>
                </div>
            </footer>
        </div>
    );
};
 
export default Footer;