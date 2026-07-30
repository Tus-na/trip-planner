import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { DollarSign, Users, Wallet } from 'lucide-react';

const ExpensesPage = () => {
  const { currentUser } = useAuth();
  const { tripEvents } = useTrip();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenseSummary, setExpenseSummary] = useState({
    totalTripCost: 0,
    memberBalances: {}, // { profileId: { paid: 0, owed: 0, balance: 0, name: '' } }
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) {
        console.error('Error fetching profiles:', error.message);
        setError('Không thể tải danh sách thành viên.');
      } else {
        setProfiles(data);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length > 0 && tripEvents.length > 0) {
      calculateExpenses();
    } else if (profiles.length > 0 && tripEvents.length === 0) {
      // If no events, reset expenses
      const initialBalances = profiles.reduce((acc, profile) => {
        acc[profile.id] = { paid: 0, owed: 0, balance: 0, name: profile.full_name };
        return acc;
      }, {});
      setExpenseSummary({
        totalTripCost: 0,
        memberBalances: initialBalances,
      });
      setLoading(false);
    }
  }, [profiles, tripEvents]);

  const calculateExpenses = () => {
    setLoading(true);
    let totalTripCost = 0;
    const memberBalances = profiles.reduce((acc, profile) => {
      acc[profile.id] = { paid: 0, owed: 0, balance: 0, name: profile.full_name };
      return acc;
    }, {});

    tripEvents.forEach(event => {
      // Only consider approved events for expense calculation
      if (event.approval_status !== 'APPROVED') return;

      const cost = event.cost || 0;
      totalTripCost += cost;

      const assignedMembers = event.assigned_members || [];
      const payerId = event.payer_id;

      if (cost > 0) {
        // Payer pays the cost
        if (payerId && memberBalances[payerId]) {
          memberBalances[payerId].paid += cost;
        }

        // Cost is split among assigned members. If assignedMembers is empty, split among all profiles.
        const membersToSplit = assignedMembers.length > 0 ? assignedMembers : profiles.map(p => p.id);

        if (membersToSplit.length > 0) {
          const costPerMember = cost / membersToSplit.length;
          membersToSplit.forEach(memberId => {
            if (memberBalances[memberId]) {
              memberBalances[memberId].owed += costPerMember;
            }
          });
        }
      }
    });

    // Calculate balance for each member
    Object.keys(memberBalances).forEach(memberId => {
      const balance = memberBalances[memberId].paid - memberBalances[memberId].owed;
      memberBalances[memberId].balance = balance;
    });

    setExpenseSummary({
      totalTripCost,
      memberBalances,
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg text-gray-600">Đang tải dữ liệu chi tiêu...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-lg text-red-600">{error}</div>;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Quản Lý Chi Tiêu Chuyến Đi</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-500" />
          Tổng Quan Chi Phí
        </h2>
        <p className="text-2xl font-bold text-blue-600">
          Tổng chi phí chuyến đi: {formatCurrency(expenseSummary.totalTripCost)}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <Users className="w-6 h-6 mr-2 text-purple-500" />
          Chi Tiêu Theo Thành Viên
        </h2>
        {Object.keys(expenseSummary.memberBalances).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                    Thành viên
                  </th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                    Đã trả
                  </th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                    Phải trả
                  </th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                    Dư / Nợ
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.values(expenseSummary.memberBalances).map(member => (
                  <tr key={member.name}>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {member.name}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-green-600">
                      {formatCurrency(member.paid)}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-red-600">
                      {formatCurrency(member.owed)}
                    </td>
                    <td className={`py-2 px-4 border-b border-gray-200 text-sm ${member.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(member.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Chưa có dữ liệu chi tiêu theo thành viên.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <Wallet className="w-6 h-6 mr-2 text-blue-500" />
          Chi Tiết Các Khoản Chi
        </h2>
        {tripEvents.filter(event => event.approval_status === 'APPROVED' && event.cost > 0).length > 0 ? (
          <ul className="space-y-4">
            {tripEvents.filter(event => event.approval_status === 'APPROVED' && event.cost > 0).map(event => (
              <li key={event.id} className="p-4 border border-gray-200 rounded-md shadow-sm">
                <p className="font-medium text-gray-800">{event.title}</p>
                <p className="text-sm text-gray-600">
                  Chi phí: <span className="font-semibold">{formatCurrency(event.cost)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Người trả: <span className="font-semibold">{profiles.find(p => p.id === event.payer_id)?.full_name || 'N/A'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Thành viên tham gia: <span className="font-semibold">
                    {event.assigned_members && event.assigned_members.length > 0
                      ? event.assigned_members.map(memberId => profiles.find(p => p.id === memberId)?.full_name).join(', ')
                      : 'Tất cả thành viên'}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Chưa có khoản chi nào được ghi nhận.</p>
        )}
      </div>
    </div>
  );
};

export default ExpensesPage;