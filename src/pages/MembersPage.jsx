import React, { useState, useEffect } from "react";
import { Trash2, Edit, Crown, Users, Briefcase, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../context/ToastContext";

// Modal cập nhật nhiệm vụ thành viên
const MemberFormModal = ({ isOpen, onClose, memberToEdit, onSave }) => {
  const [fullName, setFullName] = useState("");
  const [assignedRole, setAssignedRole] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (memberToEdit) {
      setFullName(memberToEdit.full_name || "");
      setAssignedRole(memberToEdit.assigned_role || "");
    }
  }, [memberToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberToEdit) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ assigned_role: assignedRole || null })
        .eq("id", memberToEdit.id)
        .select("id, full_name, avatar_url, role, assigned_role")
        .single();

      if (error) throw error;

      showToast("Cập nhật thành viên thành công!", "success");
      onSave(data);
      onClose();
    } catch (error) {
      showToast("Lỗi khi lưu thành viên: " + error.message, "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Chỉnh sửa thành viên</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Họ tên</label>
            <input type="text" value={fullName} disabled className="w-full rounded border px-3 py-2 text-gray-700 opacity-70" />
          </div>
          <div>
            <label htmlFor="assignedRole" className="mb-2 block text-sm font-bold text-gray-700">Vai trò/Nhiệm vụ</label>
            <input
              type="text"
              id="assignedRole"
              className="w-full rounded border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              placeholder="Ví dụ: Dẫn đoàn, Thủ quỹ, Chụp hình"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded bg-gray-300 px-4 py-2 font-bold text-gray-800 hover:bg-gray-400">Hủy</button>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Cập nhật</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MembersPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMemberFormModalOpen, setIsMemberFormModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);

  const isLead = currentUser?.role === 'LEAD';

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, assigned_role")
        .order("full_name", { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      showToast("Không thể tải danh sách thành viên.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleEditMember = (member) => {
    setMemberToEdit(member);
    setIsMemberFormModalOpen(true);
  };

  const handleSaveMember = (savedMember) => {
    setMembers((prev) => prev.map((m) => (m.id === savedMember.id ? savedMember : m)));
    setIsMemberFormModalOpen(false);
  };

  const handleDeleteMember = async (memberId) => {
    if (!isLead || memberId === currentUser.id || !window.confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;
    try {
      const { data: payerEvents } = await supabase.from('events').select('id').eq('payer_id', memberId);
      if (payerEvents?.length > 0) {
        showToast("Không thể xóa thành viên này vì họ đang là người chi trả cho sự kiện.", 'error');
        return;
      }
      const { error } = await supabase.from('profiles').delete().eq('id', memberId);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== memberId));
      showToast("Thành viên đã được xóa!", "success");
    } catch (err) {
      showToast("Không thể xóa thành viên.", "error");
    }
  };

  if (loading || authLoading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Quản lý Thành viên</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center">
              {member.role === "LEAD" ? <Crown className="mr-3 h-8 w-8 text-yellow-500" /> : <Users className="mr-3 h-8 w-8 text-blue-500" />}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{member.full_name || "Chưa có tên"}</h3>
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-700">Vai trò: {member.role === "LEAD" ? "Trưởng đoàn" : "Thành viên"}</p>
              <p className="text-sm text-gray-700">Nhiệm vụ: {member.assigned_role || "Chưa phân công"}</p>
            </div>
            {isLead && (
              <div className="mt-auto flex justify-end space-x-2">
                <button onClick={() => handleEditMember(member)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit className="h-5 w-5" /></button>
                {member.id !== currentUser.id && (
                  <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 className="h-5 w-5" /></button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {isMemberFormModalOpen && (
        <MemberFormModal isOpen={isMemberFormModalOpen} onClose={() => setIsMemberFormModalOpen(false)} memberToEdit={memberToEdit} onSave={handleSaveMember} />
      )}
    </div>
  );
};

export default MembersPage;