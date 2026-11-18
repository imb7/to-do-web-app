import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import TaskModal from './components/TaskModal';
import { taskAPI } from './services/api';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CompletedTasks from './pages/CompletedTasks';
import TaskHistory from './pages/TaskHistory';

// Layout wrapper for authenticated pages
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleQuickAddSave = async (taskData) => {
    setLoading(true);
    try {
      await taskAPI.createTask(taskData);
      setQuickAddOpen(false);
      // Reload current page state or dispatch event
      window.dispatchEvent(new CustomEvent('task-added'));
      // Reload page to reflect new task across views
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="main-wrapper">
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onQuickAdd={() => setQuickAddOpen(true)}
        />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/completed" element={<CompletedTasks />} />
          <Route path="/history" element={<TaskHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <TaskModal 
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSave={handleQuickAddSave}
        isLoading={loading}
      />
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AppLayout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
