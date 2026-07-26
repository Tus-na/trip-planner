import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import EventCard from '../components/EventCard';
import EventFormModal from '../components/EventFormModal';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { supabase } from '../lib/supabaseClient';

const EventsPage = () => {
  const { user, userProfile } = useAuth();
  const { tripEvents, setTripEvents } = useTrip();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            profiles!events_created_by_fkey(id, name, role),
            payer:profiles!events_payer_id_fkey(id, name)
          `)
          .eq('is_approved', true) // Only fetch approved events for initial display
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

    fetchEvents();

    // Realtime subscription (basic example, needs refinement)
    const eventSubscription = supabase
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, payload => {
        console.log('Change received!', payload);
        // Re-fetch or update state based on payload
        fetchEvents(); // Simple re-fetch for now
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventSubscription);
    };
  }, [setTripEvents]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
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
    if (!userProfile) return false;
    // Lead has full control
    if (userProfile.role === 'LEAD') return true;
    // Member can edit/delete their own unapproved events
    return userProfile.id === event.created_by && event.status === 'Chờ duyệt';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg text-gray-600">Đang tải sự kiện...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-lg text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Lịch Trình Chuyến Đi</h1>
        <button
          onClick={handleAddEvent}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm Event
        </button>
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

      {isModalOpen && (
        <EventFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventToEdit={editingEvent}
          onSave={(newEvent) => {
            if (editingEvent) {
              setTripEvents(prevEvents => prevEvents.map(e => e.id === newEvent.id ? newEvent : e));
            } else {
              setTripEvents(prevEvents => [...prevEvents, newEvent]);
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default EventsPage;