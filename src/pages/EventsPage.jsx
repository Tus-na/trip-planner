import React, { useState, useEffect } from 'react';
import { Plus, BellRing, User } from 'lucide-react'; // Added BellRing and User icon
import EventCard from '../components/EventCard';
import EventFormModal from '../components/EventFormModal';
import PendingEventsModal from '../components/PendingEventsModal'; // Import PendingEventsModal
import MemberManagementModal from '../components/MemberManagementModal'; // Import MemberManagementModal
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { supabase } from '../lib/supabaseClient';

const EventsPage = () => {
  const { currentUser, loading: authLoading } = useAuth(); // Use currentUser and authLoading
  const { tripEvents, setTripEvents } = useTrip();
  const [isEventFormModalOpen, setIsEventFormModalOpen] = useState(false); // Renamed for clarity
  const [isPendingEventsModalOpen, setIsPendingEventsModalOpen] = useState(false); // State for pending events modal
  const [isMemberManagementModalOpen, setIsMemberManagementModalOpen] = useState(false); // State for member management modal
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingEventsCount, setPendingEventsCount] = useState(0); // State to hold pending events count

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles!events_created_by_fkey(id, full_name, role),
          payer:profiles!events_payer_id_fkey(id, full_name)
        `)
        .eq('approval_status', 'APPROVED') // Only fetch approved events for initial display
        .order('start_time', { ascending: true });

      if (error) throw error;
      setTripEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err.message);
      setError("Không thể tải danh sách sự kiện.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Realtime subscription (basic example, needs refinement)
    const eventSubscription = supabase
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, payload => {
        console.log('Change received!', payload);
        // Re-fetch or update state based on payload
        fetchEvents(); // Simple re-fetch for now
        fetchPendingEventsCount(); // Also update pending count on change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventSubscription);
    };
  }, [setTripEvents]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsEventFormModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsEventFormModalOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setTripEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      alert("Sự kiện đã được xóa thành công!");
    } catch (err) {
      console.error("Error deleting event:", err.message);
      alert("Không thể xóa sự kiện: " + err.message);
    }
  };

  const canEditOrDelete = (event) => {
    if (!currentUser) return false;
    // Lead has full control
    if (currentUser.role === 'LEAD') return true;
    // Member can edit/delete their own unapproved events
    return currentUser.id === event.created_by && event.approval_status === 'PENDING';
  };

  useEffect(() => {
    if (currentUser?.role === 'LEAD') {
      fetchPendingEventsCount();
    }
  }, [currentUser]);

  const fetchPendingEventsCount = async () => {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'PENDING');

    if (error) {
      console.error('Error fetching pending events count:', error.message);
    } else {
      setPendingEventsCount(count);
    }
  };

  if (loading || authLoading) { // Added authLoading
    return <div className="flex justify-center items-center h-screen text-lg text-gray-600">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-lg text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Lịch Trình Chuyến Đi</h1>
        <div className="flex items-center space-x-4">
          {currentUser?.role === 'LEAD' && (
            <>
              <button
                onClick={() => setIsMemberManagementModalOpen(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-200"
              >
                <User className="w-5 h-5 mr-2" />
                Quản lý thành viên
              </button>
              <button
                onClick={() => setIsPendingEventsModalOpen(true)}
                className="relative flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200"
              >
                <BellRing className="w-5 h-5 mr-2" />
                Duyệt sự kiện
                {pendingEventsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingEventsCount}
                  </span>
                )}
              </button>
            </>
          )}
          <button
            onClick={handleAddEvent}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm Event
          </button>
        </div>
      </div>

      {tripEvents.length === 0 ? (
        <div className="text-center text-gray-500 text-lg mt-10">
          Chưa có sự kiện nào được duyệt. Hãy thêm một sự kiện mới!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tripEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              canModify={canEditOrDelete(event)}
            />
          ))}
        </div>
      )}

      {isEventFormModalOpen && (
        <EventFormModal
          isOpen={isEventFormModalOpen}
          onClose={() => setIsEventFormModalOpen(false)}
          eventToEdit={editingEvent}
          onSave={(newEvent) => {
            // If the new event is approved, add it to the main list
            if (newEvent.approval_status === 'APPROVED') {
              if (editingEvent) {
                setTripEvents(prevEvents => prevEvents.map(e => e.id === newEvent.id ? newEvent : e));
              } else {
                setTripEvents(prevEvents => [...prevEvents, newEvent]);
              }
            }
            // If it's a pending event, update the count
            if (newEvent.approval_status === 'PENDING') {
              fetchPendingEventsCount();
            }
            setIsEventFormModalOpen(false);
          }}
        />
      )}

      {currentUser?.role === 'LEAD' && isPendingEventsModalOpen && (
        <PendingEventsModal
          isOpen={isPendingEventsModalOpen}
          onClose={() => {
            setIsPendingEventsModalOpen(false);
            fetchEvents(); // Re-fetch approved events after closing modal
            fetchPendingEventsCount(); // Update pending count
          }}
          onEventApprovedOrRejected={() => {
            fetchEvents(); // Re-fetch approved events after an event is approved/rejected
            fetchPendingEventsCount(); // Update pending count after an event is approved/rejected
          }}
        />
      )}

      {currentUser?.role === 'LEAD' && isMemberManagementModalOpen && (
        <MemberManagementModal
          isOpen={isMemberManagementModalOpen}
          onClose={() => setIsMemberManagementModalOpen(false)}
        />
      )}
    </div>
  );
};

export default EventsPage;