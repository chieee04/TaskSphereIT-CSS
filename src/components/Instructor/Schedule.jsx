import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { GiArchiveRegister } from 'react-icons/gi';
import { MdOutlineRecordVoiceOver } from 'react-icons/md';
import { BsCalendar2Check } from 'react-icons/bs';

const Schedule = ({ setActivePage }) => {
  const items = [
    {
      title: 'Title Defense',
      icon: <FaCalendarAlt size={36} color="#3B0304" />,
      onClick: () => setActivePage('Title Defense'), 
    },
    {
      title: 'Manuscript Submission',
      icon: <GiArchiveRegister size={36} color="#3B0304" />,
      onClick: () => setActivePage('ManuScript'),
    },
    {
      title: 'Oral Defense',
      icon: <MdOutlineRecordVoiceOver size={36} color="#3B0304" />,
      onClick: () => setActivePage('Oral Defense'),
    },
    {
      title: 'Final Defense',
      icon: <BsCalendar2Check size={36} color="#3B0304" />,
      onClick: () => setActivePage('Final Defense'),
    },
  ];

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex align-items-center mb-2" style={{ color: '#3B0304' }}>
        <i className="bi bi-calendar-event me-2"></i>
        <strong>Schedule</strong>
      </div>

      <hr style={{ borderTop: '2px solid #3B0304', marginTop: 0, marginBottom: '1.5rem' }} />

      <div className="d-flex flex-wrap gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="d-flex flex-column align-items-center justify-content-center"
            style={{
              width: '130px',
              height: '150px',
              borderRadius: '12px',
              background: 'white',
              borderLeft: '12px solid #3B0304',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
            onClick={item.onClick}
          >
            <div className="mb-2">{item.icon}</div>
            <div
              className="text-center px-2"
              style={{ fontSize: '13px', fontWeight: 600, color: '#3B0304' }}
            >
              {item.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Schedule;
