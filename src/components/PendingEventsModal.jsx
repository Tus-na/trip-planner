import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const PendingEventsModal = ({ isOpen, onClose, onEventApprovedOrRejected }) => {
  const { currentUser } = useAuth();
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingEventId, setSubmittingEventId] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser?.role === 'LEAD') {
      fetchPendingEvents();
    }
  }, [isOpen, currentUser]);

  const fetchPendingEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator:profiles!events_created_by_fkey(id, full_name),
        payer:profiles!events_payer_id_fkey(id, full_name)
      `)
      .eq('approval_status', 'PENDING');

    if (error) {
      console.error('Error fetching pending events:', error.message);
    } else {
      setPendingEvents(data);
    }
    setLoading(false);
  };

  const handleApprove = async (eventId) => {
    setSubmittingEventId(eventId);
    const { error } = await supabase
      .from('events')
      .update({ approval_status: 'APPROVED' })
      .eq('id', eventId);

    if (error) {
      console.error('Error approving event:', error.message);
      alert('Lỗi khi duyệt sự kiện.');
    } else {
      alert('Sự kiện đã được duyệt thành công!');
      onEventApprovedOrRejected(); // Notify parent to refresh events
      fetchPendingEvents(); // Refresh pending events list
    }
    setSubmittingEventId(null);
  };

  const handleReject = async (eventId) => {
    setSubmittingEventId(eventId);
    // Option 1: Delete the event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      console.error('Error rejecting (deleting) event:', deleteError.message);
      alert('Lỗi khi từ chối sự kiện.');
    } else {
      alert('Sự kiện đã được từ chối và xóa.');
      onEventApprovedOrRejected(); // Notify parent to refresh events
      fetchPendingEvents(); // Refresh pending events list
    }

    // Option 2: Update status to 'REJECTED' (if you want to keep a record)
    /*
    const { error: updateError } = await supabase
      .from('events')
      .update({ approval_status: 'REJECTED' })
      .eq('id', eventId);

    if (updateError) {
      console.error('Error rejecting event:', updateError.message);
      alert('Lỗi khi từ chối sự kiện.');
    } else {
      alert('Sự kiện đã được từ chối.');
      onEventApprovedOrRejected(); // Notify parent to refresh events
      fetchPendingEvents(); // Refresh pending events list
    }
    */
    setSubmittingEventId(null);
  };

  if (!isOpen || currentUser?.role !== 'LEAD') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Duyệt Sự Kiện Đang Chờ</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              <p className="ml-2 text-gray-600">Đang tải sự kiện chờ duyệt...</p>
            </div>
          ) : pendingEvents.length === 0 ? (
            <p className="text-center text-gray-600">Không có sự kiện nào đang chờ duyệt.</p>
          ) : (
            <ul className="space-y-4">
              {pendingEvents.map((event) => (
                <li key={event.id} className="border rounded-lg p-4 shadow-sm bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                      <p className="text-sm text-gray-600">
                        {dayjs(event.start_time).format('HH:mm DD/MM/YYYY')} - {dayjs(event.end_time).format('HH:mm DD/MM/YYYY')}
                      </p>
                      {event.location && <p className="text-sm text-gray-600">Địa điểm: {event.location}</p>}
                      {event.cost > 0 && <p className="text-sm text-gray-600">Chi phí: {event.cost.toLocaleString('vi-VN')} VNĐ</p>}
                      {event.creator && (
                        <p className="text-sm text-gray-600">Người tạo: {event.creator.full_name}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(event.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        disabled={submittingEventId === event.id}
                      >
                        {submittingEventId === event.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReject(event.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        disabled={submittingEventId === event.id}
                      >
                        {submittingEventId === event.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-1" />}
                        Từ chối
                      </button>
                    </div>
                  </div>
                  {event.description && <p className="text-sm text-gray-700 mt-2">{event.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingEventsModal;