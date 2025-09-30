import React from 'react';
 
const Footer = () => {
    return (
        <div
            className="w-100" // ✨ Ensure footer takes full width
            style={{
                paddingLeft: '70px', // ✨ Initial padding to clear the collapsed sidebar
                transition: 'padding-left 0.3s'
            }}
        >
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
                    className="d-flex flex-column flex-md-row align-items-center"
                    style={{
                        paddingLeft: '0.3in',
                        paddingRight: '0.3in',
                        justifyContent: 'space-between',
                    }}
                >
                    <p
                        className="mb-0 text-center text-md-start"
                        style={{ color: '#3B0304', fontSize: '14px' }}
                    >
                        ©2025 TaskSphere IT - All Rights Reserved
                    </p>
                    <a
                        href="#"
                        className="text-decoration-none text-center text-md-end mt-2 mt-md-0"
                        style={{ color: '#3B0304', fontSize: '14px' }}
                    >
                        Terms of Service
                    </a>
                </div>
            </footer>
        </div>
    );
};
 
export default Footer;