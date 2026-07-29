import React, { useState, useEffect } from 'react';
import { Plus, BellRing, User } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import EventCard from '../components/EventCard';
import EventFormModal from '../components/EventFormModal';
import PendingEventsModal from '../components/PendingEventsModal'; // Import PendingEventsModal
import MemberManagementModal from '../components/MemberManagementModal'; // Import MemberManagementModal
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext'; // Import useToast

// Helper object to map English status to Vietnamese and vice-versa
const STATUS_MAP = {
  UPCOMING: 'Sắp tới',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã xong',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  DELAYED: 'Tạm hoãn',
  CANCELLED: 'Hủy',
};

const mapEnglishToVietnamese = (englishStatus) => STATUS_MAP[englishStatus] || englishStatus;
const mapVietnameseToEnglish = (vietnameseStatus) => {
  for (const [english, vietnamese] of Object.entries(STATUS_MAP)) {
    if (vietnamese === vietnameseStatus) {
      return english;
    }
  }
  return vietnameseStatus; // Return original if not found
};

const EventsPage = () => {
  const { currentUser, loading: authLoading } = useAuth(); // Use currentUser and authLoading
  const { tripEvents, setTripEvents } = useTrip();
  const { showToast } = useToast(); // Use the toast context
  const [isEventFormModalOpen, setIsEventFormModalOpen] = useState(false); // Renamed for clarity
  const [isPendingEventsModalOpen, setIsPendingEventsModalOpen] = useState(false); // State for pending events modal
  const [isMemberManagementModalOpen, setIsMemberManagementModalOpen] = useState(false); // State for member management modal
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingEventsCount, setPendingEventsCount] = useState(0); // State to hold pending events count
  const [isReordering, setIsReordering] = useState(false); // New state for reordering mode
  const [originalTripEvents, setOriginalTripEvents] = useState([]); // To store events before reordering

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
        .eq('approval_status', 'APPROVED')
        .order('order_index', { ascending: true });

          if (error) throw error;
          // Map status to Vietnamese for display
          setTripEvents(data.map(event => ({
            ...event,
            status: mapEnglishToVietnamese(event.status)
          })));
          // Update statuses immediately after fetching events
          updateStatuses();
        } catch (err) {
          console.error("Error fetching events:", err.message);
      setError("Không thể tải danh sách sự kiện.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatuses = async () => {
    const now = dayjs();
    let hasChanges = false;
    const eventsToUpdateInDb = [];

    const updatedEvents = tripEvents.map(event => {
      // Get the English status from the currently displayed Vietnamese status
      const currentEnglishStatus = mapVietnameseToEnglish(event.status);

      // Skip automatic status updates for DELAYED or CANCELLED events
      if (currentEnglishStatus === 'DELAYED' || currentEnglishStatus === 'CANCELLED') {
        return event;
      }

      // Convert event times to local for comparison with local 'now'
      const eventStartTimeLocal = dayjs.utc(event.start_time).local();
      const eventEndTimeLocal = dayjs.utc(event.end_time).local();

      let newEnglishStatus = currentEnglishStatus; // Default to current status
      if (now.isBefore(eventStartTimeLocal)) {
        newEnglishStatus = 'UPCOMING';
      } else if (now.isAfter(eventStartTimeLocal) && now.isBefore(eventEndTimeLocal)) {
        newEnglishStatus = 'IN_PROGRESS';
      } else if (now.isAfter(eventEndTimeLocal)) {
        newEnglishStatus = 'COMPLETED';
      }

      if (currentEnglishStatus !== newEnglishStatus) {
        hasChanges = true;
        eventsToUpdateInDb.push({ id: event.id, status: newEnglishStatus });
        return { ...event, status: mapEnglishToVietnamese(newEnglishStatus) }; // Update local state with Vietnamese
      }
      return event;
    });

    if (hasChanges) {
      setTripEvents(updatedEvents); // Update local state immediately

      // Persist status changes to the database
      for (const update of eventsToUpdateInDb) {
        const { error } = await supabase
          .from('events')
          .update({ status: update.status })
          .eq('id', update.id);

        if (error) {
          console.error(`Error updating status for event ${update.id}:`, error.message);
        }
      }
    }
  };

  useEffect(() => {
    fetchEvents();
    // Realtime status update engine
    const interval = setInterval(async () => { // Make the callback async
      updateStatuses();
    }, 60000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array to run once on mount and cleanup on unmount

  useEffect(() => {
    const eventSubscription = supabase
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, payload => {
        // Directly update tripEvents based on the payload to avoid flickering
        setTripEvents(prevEvents => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.approval_status === 'APPROVED') {
              return [...prevEvents, { ...payload.new, status: mapEnglishToVietnamese(payload.new.status) }];
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.approval_status === 'APPROVED') {
              return prevEvents.map(event => event.id === payload.new.id ? { ...payload.new, status: mapEnglishToVietnamese(payload.new.status) } : event);
            } else {
              return prevEvents.filter(event => event.id !== payload.old.id);
            }
          } else if (payload.eventType === 'DELETE') {
            return prevEvents.filter(event => event.id !== payload.old.id);
          }
          return prevEvents;
        });
        fetchPendingEventsCount(); // Always update pending count
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventSubscription);
    };
  }, []);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsEventFormModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsEventFormModalOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    // Using a toast for confirmation is not ideal, a modal would be better.
    // For now, we'll proceed with deletion directly or implement a simple confirmation toast.
    // For this task, we'll assume direct deletion for simplicity or add a basic confirmation.
    // A proper confirmation modal would be a separate component.

    // For now, let's use a simple confirmation.
    if (!window.confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setTripEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      showToast("Sự kiện đã được xóa thành công!", "success");
    } catch (err) {
      console.error("Error deleting event:", err.message);
      showToast("Không thể xóa sự kiện: " + err.message, "error");
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    // If dropped outside the list
    if (destination.droppableId !== source.droppableId) {
      return;
    }

    const newTripEvents = Array.from(tripEvents);
    const [reorderedItem] = newTripEvents.splice(source.index, 1);
    newTripEvents.splice(destination.index, 0, reorderedItem); // Corrected: use 0 for insertion

    setTripEvents(newTripEvents);
    // The actual DB update will happen when "Lưu" is clicked
  };

  const handleSaveReorder = async () => {
    const updates = tripEvents.map((event, index) => ({
      id: event.id,
      order_index: index
    }));

    try {
      for (const update of updates) {
        await supabase
          .from('events')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
      showToast("Thứ tự sự kiện đã được lưu thành công!", "success");
      setIsReordering(false);
    } catch (err) {
      console.error("Error saving reorder:", err);
      showToast("Không thể lưu thứ tự sự kiện.", "error");
      // Revert to original order on error
      setTripEvents(originalTripEvents);
      setIsReordering(false);
    }
  };

  const handleCancelReorder = () => {
    setTripEvents(originalTripEvents); // Revert to the order before reordering started
    setIsReordering(false);
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
          {isReordering ? (
            <>
              <button
                onClick={handleSaveReorder}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
              >
                Lưu
              </button>
              <button
                onClick={handleCancelReorder}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200"
              >
                Hủy
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsReordering(true);
                  setOriginalTripEvents(tripEvents); // Save current order
                }}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200"
              >
                Sắp xếp
              </button>
              <button
                onClick={handleAddEvent}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm Event
              </button>
            </>
          )}
        </div>
      </div>

      {tripEvents.length === 0 ? (
        <div className="text-center text-gray-500 text-lg mt-10">
          Chưa có sự kiện nào được duyệt. Hãy thêm một sự kiện mới!
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="events">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4"> {/* Changed to single column layout */}
                {tripEvents.map((event, index) => (
                  <Draggable key={event.id} draggableId={event.id.toString()} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <EventCard
                          event={event}
                          onEdit={handleEditEvent}
                          onDelete={handleDeleteEvent}
                          canModify={canEditOrDelete(event)}
                          isReordering={isReordering} // Pass isReordering prop
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
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