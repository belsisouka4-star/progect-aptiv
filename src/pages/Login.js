import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components and Hooks
import { useNotification } from '../App';

// Styles
import '../styles/corporate.css';

const styles = `
/* === Global Styles === */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: white;
  min-height: 100vh;
  background: #000000af;
  background-size: 300% 300%;
}



/* === Center Layout === */
.app-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

/* === Login Box === */
.login-container {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 16px;
  padding: 40px;
  width: 450px;
  max-width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  text-align: center;
  animation: fadeIn 1s ease;
  border: 1px solid rgba(255,255,255,0.1);
}

/* === Title === */
.login-title {
  font-size: 3.2rem;
  background: linear-gradient(90deg, #ff7b00, #00aaff, #ff7b00);
  background-size: 200% 200%;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  font-weight: 900;
  letter-spacing: 2px;
  margin-bottom: 30px;
  text-shadow: 0 0 20px rgba(255, 123, 0, 0.5), 0 0 30px rgba(0, 170, 255, 0.5);
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes glow {
  /* Removed text-shadow animation to avoid performance issues */
}

/* === User & Admin Sections === */
.user-access-section,
.admin-access-section {
  margin-top: 25px;
}

.user-access-title,
.admin-access-title {
  color: #ffffffcc;
  margin-bottom: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.user-access-Partname {
  color: #ffffffa0;
  font-size: 1rem;
  margin-bottom: 15px;
}

/* === Buttons === */
.btn {
  background: linear-gradient(90deg, #cc6600, #005588);
  border: none;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
  padding: 16px 20px;
  border-radius: 10px;
  width: 100%;
  min-height: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 102, 153, 0.6), 0 0 15px rgba(204, 102, 0, 0.5);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 102, 153, 0.8), 0 0 25px rgba(204, 102, 0, 0.7);
}

/* === Input Fields === */
.form-input {
  width: 94%;
  padding: 14px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  background: rgba(0,0,0,0.4);
  color: white;
  outline: none;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  font-size: 1.2rem;
}

/* === Select Options === */
select option {
  color: black;
}

.form-input:focus {
  border-color: #005588;
  box-shadow: 0 0 10px rgba(0,85,136,0.6);
}

/* === Labels === */
.form-label {
  display: block;
  text-align: left;
  margin-bottom: 5px;
  color: #ffffffb5;
  font-size: 1.1rem;
}

/* === Fade In Animation === */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === Modal Styles === */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 16px;
  padding: 40px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  border: 1px solid rgba(255,255,255,0.1);
  text-align: center;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: #ff7b00;
}

/* === Mobile Responsiveness === */
@media (max-width: 480px) {
  .login-container {
    padding: 20px;
    width: 90%;
  }
  .login-title {
    font-size: 2.8rem;
  }
  .user-access-title,
  .admin-access-title {
    font-size: 1.3rem;
  }
  .form-input,
  .btn {
    font-size: 1.2rem;
    padding: 16px;
  }
  .modal-content {
    padding: 20px;
    width: 90%;
  }
}

/* === PC View Background === */
@media (min-width: 481px) {
  body {
    background-image: url('/hd-login-background.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
    -ms-interpolation-mode: nearest-neighbor;
  }
}
`;

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Reset passwords to defaults on load
  React.useEffect(() => {
    localStorage.setItem('adminPassword', 'aptivm2');
    localStorage.setItem('supervisorPassword', 'supervisor');
  }, []);

  // Check if user is already logged in and redirect accordingly
  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role) {
      if (user.role === 'admin') navigate('/manage-pieces');
      else navigate('/search');
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!selectedRole) {
      showNotification('Please select a role', 'error');
      return;
    }

    setLoading(true);

    // Simulate a brief delay for better UX
    setTimeout(() => {
      if (selectedRole === 'admin') {
        const adminPassword = localStorage.getItem('adminPassword') || 'aptivm2';
        if (password === adminPassword) {
          localStorage.setItem('user', JSON.stringify({ role: 'admin' }));
          navigate('/manage-pieces');
        } else {
          console.error('Incorrect admin password');
          setPassword(''); // Clear password field on failed attempt
          setLoading(false);
        }
      } else if (selectedRole === 'supervisor') {
        const supervisorPassword = localStorage.getItem('supervisorPassword') || 'supervisor';
        if (password === supervisorPassword) {
          localStorage.setItem('user', JSON.stringify({ role: 'supervisor' }));
          navigate('/search');
        } else {
          console.error('Incorrect supervisor password');
          setPassword(''); // Clear password field on failed attempt
          setLoading(false);
        }
      } else {
        localStorage.setItem('user', JSON.stringify({ role: selectedRole }));
        navigate('/search');
      }
    }, 300);
  };

  const handleChangePassword = () => {
    if (selectedRole === 'admin') {
      const currentPassword = localStorage.getItem('adminPassword') || 'aptivm2';
      if (oldPassword === currentPassword) {
        localStorage.setItem('adminPassword', newPassword);
        showNotification('Admin password changed successfully', 'success');
      } else {
        showNotification('Incorrect old password', 'error');
      }
    } else if (selectedRole === 'supervisor') {
      const currentPassword = localStorage.getItem('supervisorPassword') || 'supervisor';
      if (oldPassword === currentPassword) {
        localStorage.setItem('supervisorPassword', newPassword);
        showNotification('Supervisor password changed successfully', 'success');
      } else {
        showNotification('Incorrect old password', 'error');
      }
    }
    setShowModal(false);
    setOldPassword('');
    setNewPassword('');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="app-container">
        <div className="login-container">
          <h1 className="login-title">APTIVM2</h1>

          <form onSubmit={handleLogin}>
            <div className="user-access-section">
              <h2 className="user-access-title">Select Your Role</h2>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="form-input"
                style={{ width: '100%', minHeight: '50px', marginBottom: '15px', borderRadius: '10px', background: 'linear-gradient(90deg, #cc6600, #005588)', color: 'white', border: 'none', fontSize: '1.2rem', fontWeight: '600', padding: '16px 20px' }}
                title="Select your role"
                aria-label="Select your role"
                id="role-select"
                name="role"
              >
                <option value="">Select a role</option>
                <option value="technician">Maintenance Technician</option>
                <option value="warehouse">Warehouse Staff</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
              {(selectedRole === 'admin' || selectedRole === 'supervisor') && (
                <div>
                  <label className="form-label" htmlFor="password-input">{selectedRole === 'admin' ? 'Admin' : 'Supervisor'} Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`Enter ${selectedRole} password`}
                    disabled={loading}
                    id="password-input"
                    name="password"
                  />
                  <button type="submit" className="btn" style={{ marginTop: '10px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                  <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#ffffffb5', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowModal(true)}>
                    Change Password
                  </p>
                </div>
              )}
              {selectedRole && !(selectedRole === 'admin' || selectedRole === 'supervisor') && (
                <button type="submit" className="btn" style={{ marginTop: '10px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              )}
            </div>
          </form>
          {showModal && (
            <div className="modal-backdrop" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                <h3 style={{ color: 'white', marginBottom: '15px' }}>Change {selectedRole === 'admin' ? 'Admin' : 'Supervisor'} Password</h3>
                <label className="form-label" htmlFor="old-password-input">Old Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter old password"
                  id="old-password-input"
                  name="oldPassword"
                />
                <label className="form-label" htmlFor="new-password-input">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  id="new-password-input"
                  name="newPassword"
                />
                <button className="btn" onClick={handleChangePassword} style={{ marginTop: '10px', width: '48%', display: 'inline-block', marginRight: '4%' }}>
                  Change
                </button>
                <button className="btn" onClick={() => setShowModal(false)} style={{ marginTop: '10px', width: '48%', display: 'inline-block' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
