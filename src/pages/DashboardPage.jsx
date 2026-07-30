import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CalendarCheck, ListTodo, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6666', '#66CC99'];

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [eventStatsByCategory, setEventStatsByCategory] = useState([]);
  const [eventStatsByStatus, setEventStatsByStatus] = useState([]);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all events for statistics
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('category, status, start_time, end_time')
          .eq('approval_status', 'APPROVED'); // Only approved events for dashboard

        if (eventsError) throw eventsError;

        // 1. Thống kê số lượng Event theo loại hoạt động
        const categoryCounts = events.reduce((acc, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1;
          return acc;
        }, {});
        setEventStatsByCategory(Object.entries(categoryCounts).map(([name, value]) => ({ name, value })));

        // 2. Thống kê theo trạng thái event
        const statusCounts = events.reduce((acc, event) => {
          acc[event.status] = (acc[event.status] || 0) + 1;
          return acc;
        }, {});
        setEventStatsByStatus(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

        // 3. Hiển thị sự kiện đang diễn ra
        const now = new Date();
        const inProgress = events.filter(event => {
          const startTime = new Date(event.start_time);
          const endTime = new Date(event.end_time);
          return now >= startTime && now <= endTime && event.status === 'IN_PROGRESS';
        });
        setCurrentEvents(inProgress);

      } catch (err) {
        console.error("Error fetching dashboard data:", err.message);
        setError("Không thể tải dữ liệu thống kê.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg text-gray-600">Đang tải dữ liệu thống kê...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-lg text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Bảng Điều Khiển & Thống Kê</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Thống kê số lượng Event theo loại hoạt động */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <ListTodo className="w-6 h-6 mr-2 text-blue-500" />
            Sự kiện theo loại hoạt động
          </h2>
          {eventStatsByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventStatsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {eventStatsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Chưa có dữ liệu sự kiện theo loại hoạt động.</p>
          )}
        </div>

        {/* Thống kê theo trạng thái event */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <CalendarCheck className="w-6 h-6 mr-2 text-green-500" />
            Sự kiện theo trạng thái
          </h2>
          {eventStatsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventStatsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#82ca9d"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {eventStatsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Chưa có dữ liệu sự kiện theo trạng thái.</p>
          )}
        </div>
      </div>

      {/* Hiển thị sự kiện đang diễn ra */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <CalendarCheck className="w-6 h-6 mr-2 text-orange-500" />
          Sự kiện đang diễn ra
        </h2>
        {currentEvents.length > 0 ? (
          <ul className="space-y-2">
            {currentEvents.map(event => (
              <li key={event.id} className="p-3 bg-blue-50 rounded-md shadow-sm">
                <p className="font-medium text-blue-800">{event.title}</p>
                <p className="text-sm text-gray-600">
                  {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Hiện không có sự kiện nào đang diễn ra.</p>
        )}
      </div>

      {/* Thống kê chi phí chi tiết (Link to ExpensesPage) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-red-500" />
          Thống kê chi phí chi tiết
        </h2>
        <p className="text-gray-600 mb-4">
          Để xem thống kê chi phí chi tiết của chuyến đi, bao gồm tổng chi phí, chi phí mỗi người đã trả và phải trả, vui lòng truy cập trang Chi tiêu.
        </p>
        <button
          onClick={() => window.location.href = '/expenses'} // Simple navigation for now
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          Xem Chi Tiêu Chi Tiết
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;