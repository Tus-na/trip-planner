import React, { useEffect, useState } from 'react';
import { X, User, Edit, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const MemberManagementModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [assignedRole, setAssignedRole] = useState('');
  const [submittingMemberId, setSubmittingMemberId] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser?.role === 'LEAD') {
      fetchMembers();
    }
  }, [isOpen, currentUser]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, assigned_role');

    if (error) {
      console.error('Error fetching members:', error.message);
    } else {
      setMembers(data);
    }
    setLoading(false);
  };

  const handleEditClick = (member) => {
    setEditingMemberId(member.id);
    setAssignedRole(member.assigned_role || '');
  };

  const handleSaveAssignedRole = async (memberId) => {
    setSubmittingMemberId(memberId);
    const { error } = await supabase
      .from('profiles')
      .update({ assigned_role: assignedRole })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating assigned role:', error.message);
      alert('Lỗi khi cập nhật mô tả công việc.');
    } else {
      alert('Mô tả công việc đã được cập nhật!');
      setEditingMemberId(null);
      fetchMembers(); // Refresh member list
    }
    setSubmittingMemberId(null);
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;

    setSubmittingMemberId(memberId);

    // Check if member is a payer for any event
    const { data: payerEvents, error: payerError } = await supabase
      .from('events')
      .select('id, title')
      .eq('payer_id', memberId);

    if (payerError) {
      console.error('Error checking payer events:', payerError.message);
      alert('Lỗi khi kiểm tra sự kiện của thành viên.');
      setSubmittingMemberId(null);
      return;
    }

    if (payerEvents && payerEvents.length > 0) {
      alert(`Không thể xóa thành viên này vì họ đang là người trả tiền cho các sự kiện: ${payerEvents.map(e => e.title).join(', ')}. Vui lòng thay đổi người trả tiền trước khi xóa.`);
      setSubmittingMemberId(null);
      return;
    }

    // If not a payer, proceed with deletion
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Error deleting member:', deleteError.message);
      alert('Lỗi khi xóa thành viên.');
    } else {
      alert('Thành viên đã được xóa thành công!');
      fetchMembers(); // Refresh member list
    }
    setSubmittingMemberId(null);
  };

  if (!isOpen || currentUser?.role !== 'LEAD') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Thành viên</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              <p className="ml-2 text-gray-600">Đang tải danh sách thành viên...</p>
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-gray-600">Không có thành viên nào.</p>
          ) : (
            <ul className="space-y-4">
              {members.map((member) => (
                <li key={member.id} className="border rounded-lg p-4 shadow-sm bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <User className="w-6 h-6 mr-3 text-gray-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{member.full_name} ({member.role})</h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {editingMemberId === member.id ? (
                        <button
                          onClick={() => handleSaveAssignedRole(member.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          disabled={submittingMemberId === member.id}
                        >
                          {submittingMemberId === member.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                          Lưu
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditClick(member)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Sửa
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        disabled={submittingMemberId === member.id}
                      >
                        {submittingMemberId === member.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-1" />}
                        Xóa
                      </button>
                    </div>
                  </div>
                  {editingMemberId === member.id ? (
                    <div className="mt-2">
                      <label htmlFor={`assigned_role-${member.id}`} className="block text-sm font-medium text-gray-700">Mô tả công việc:</label>
                      <input
                        type="text"
                        id={`assigned_role-${member.id}`}
                        value={assignedRole}
                        onChange={(e) => setAssignedRole(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 mt-2">Mô tả công việc: {member.assigned_role || 'Chưa có'}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberManagementModal;