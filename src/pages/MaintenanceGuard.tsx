import React, { useState, useEffect, ReactNode } from 'react';
interface MaintenanceGuardProps {
  children: ReactNode;
}

const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
  const [isLocked, setIsLocked] = useState<boolean>(true);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const targetDate = new Date('2026-04-14T20:00:00+07:00');
      if (now >= targetDate) {
        setIsLocked(false);
      } else {
        setIsLocked(true);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 30000);
    return () => clearInterval(interval);
  }, []);
  if (isLocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8f9fa', color: '#333', textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>🛠️ Server Under Maintenance</h1>
        <p style={{ fontSize: '1.2rem', color: '#666', lineHeight: '1.5' }}>
          Hệ thống đang được nâng cấp luồng xử lý. <br />
          Sẽ tự động mở lại vào đúng <b>20:00 - Thứ 3 (14/04)</b>. Mong quý khách hàng thông cảm!
        </p>
        <p style={{ fontSize: '1.1rem', color: '#555', marginTop: '20px' }}>
          Mọi chi tiết về show diễn quý khách vui lòng liên hệ qua fanpage:{' '}
          <a 
            href="https://www.facebook.com/chamshowmusic"
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}
          >
            Chạm Khoảnh Khắc
          </a>
        </p>
      </div>
    );
  }
  return <>{children}</>;
};

export default MaintenanceGuard;