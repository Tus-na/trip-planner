import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';

const eventSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  description: z.string().optional(),
  start_time: z.string().refine(val => dayjs(val).isValid(), 'Thời gian bắt đầu không hợp lệ'),
  end_time: z.string().refine(val => dayjs(val).isValid(), 'Thời gian kết thúc không hợp lệ'),
  location: z.string().optional(),
  category: z.enum(['Ăn uống', 'Ngắm cảnh', 'Bonding', 'Khác'], {
    errorMap: () => ({ message: 'Vui lòng chọn loại hoạt động' }),
  }),
  assigned_members: z.array(z.string()).optional(), // Array of user IDs
  cost: z.preprocess(
    (val) => Number(val),
    z.number().min(0, 'Chi phí không thể âm').optional().default(0)
  ),
  payer_id: z.string().optional(),
}).refine((data) => dayjs(data.end_time).isAfter(dayjs(data.start_time)), {
  message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
  path: ['end_time'],
});

const EventFormModal = ({ isOpen, onClose, eventToEdit, onSave }) => {
  const { currentUser } = useAuth();
  const { tripEvents } = useTrip();
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
      end_time: dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      location: '',
      category: 'Khác',
      assigned_members: [],
      cost: 0,
      payer_id: '',
    },
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      const { data, error } = await supabase.from('profiles').select('id, name');
      if (error) {
        console.error('Error fetching profiles:', error.message);
      } else {
        setProfiles(data);
      }
      setLoadingProfiles(false);
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (eventToEdit) {
      reset({
        title: eventToEdit.title,
        description: eventToEdit.description || '',
        start_time: dayjs(eventToEdit.start_time).format('YYYY-MM-DDTHH:mm'),
        end_time: dayjs(eventToEdit.end_time).format('YYYY-MM-DDTHH:mm'),
        location: eventToEdit.location || '',
        category: eventToEdit.category,
        assigned_members: eventToEdit.assigned_members ? eventToEdit.assigned_members.map(m => m.id) : [],
        cost: eventToEdit.cost || 0,
        payer_id: eventToEdit.payer_id || '',
      });
    } else {
      reset();
    }
  }, [eventToEdit, reset]);

  const checkTimeOverlap = (newStartTime, newEndTime, currentEventId = null) => {
    const newStart = dayjs(newStartTime);
    const newEnd = dayjs(newEndTime);

    for (const event of tripEvents) {
      if (event.id === currentEventId) continue; // Skip the event being edited

      const existingStart = dayjs(event.start_time);
      const existingEnd = dayjs(event.end_time);

      // Check for overlap: (start1 < end2) && (end1 > start2)
      if (newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart)) {
        return true; // Overlap detected
      }
    }
    return false;
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      // Check for time overlap
      if (checkTimeOverlap(formData.start_time, formData.end_time, eventToEdit?.id)) {
        alert('Lỗi: Thời gian sự kiện bị trùng với một sự kiện khác.');
        setIsSubmitting(false);
        return;
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location,
        category: formData.category,
        assigned_members: formData.assigned_members,
        cost: formData.cost,
        payer_id: formData.payer_id || null,
        created_by: currentUser.id,
        is_approved: currentUser.role === 'LEAD', // Lead auto-approves
        status: currentUser.role === 'LEAD' ? 'Sắp tới' : 'Chờ duyệt', // Set initial status
      };

      let data, error;
      if (eventToEdit) {
        ({ data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', eventToEdit.id)
          .select());
      } else {
        ({ data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select());
      }

      if (error) throw error;

      // Assuming data is an array and we need the first item
      const savedEvent = data[0];

      // Enrich savedEvent with profile names for assigned_members and payer
      const enrichedEvent = {
        ...savedEvent,
        assigned_members: profiles.filter(p => savedEvent.assigned_members?.includes(p.id)),
        payer: profiles.find(p => p.id === savedEvent.payer_id),
        profiles: currentUser, // Add creator profile for display
      };

      onSave(enrichedEvent);
      alert(`Sự kiện đã được ${eventToEdit ? 'cập nhật' : 'tạo'} thành công!`);
      onClose();
    } catch (err) {
      console.error("Error saving event:", err.message);
      alert(`Không thể ${eventToEdit ? 'cập nhật' : 'tạo'} sự kiện: ` + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{eventToEdit ? 'Chỉnh sửa Event' : 'Thêm Event Mới'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="title"
              {...register('title')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              id="description"
              {...register('description')}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">Thời gian bắt đầu <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                id="start_time"
                {...register('start_time')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>}
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">Thời gian kết thúc <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                id="end_time"
                {...register('end_time')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>}
            </div>
          </div>
          {errors.root?.message && <p className="mt-1 text-sm text-red-600">{errors.root.message}</p>}


          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Địa điểm</label>
            <input
              type="text"
              id="location"
              {...register('location')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Loại hoạt động <span className="text-red-500">*</span></label>
            <select
              id="category"
              {...register('category')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Ăn uống">Ăn uống</option>
              <option value="Ngắm cảnh">Ngắm cảnh</option>
              <option value="Bonding">Bonding</option>
              <option value="Khác">Khác</option>
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
          </div>

          <div>
            <label htmlFor="assigned_members" className="block text-sm font-medium text-gray-700">Thành viên tham gia</label>
            {loadingProfiles ? (
              <p className="mt-1 text-gray-500">Đang tải danh sách thành viên...</p>
            ) : (
              <select
                id="assigned_members"
                {...register('assigned_members')}
                multiple
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 h-24"
              >
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
              </select>
            )}
            {errors.assigned_members && <p className="mt-1 text-sm text-red-600">{errors.assigned_members.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700">Chi phí (VNĐ)</label>
              <input
                type="number"
                id="cost"
                {...register('cost')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>}
            </div>
            <div>
              <label htmlFor="payer_id" className="block text-sm font-medium text-gray-700">Người đại diện trả tiền</label>
              {loadingProfiles ? (
                <p className="mt-1 text-gray-500">Đang tải danh sách thành viên...</p>
              ) : (
                <select
                  id="payer_id"
                  {...register('payer_id')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Chọn người trả</option>
                  {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                </select>
              )}
              {errors.payer_id && <p className="mt-1 text-sm text-red-600">{errors.payer_id.message}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : null}
              {eventToEdit ? 'Cập nhật Event' : 'Tạo Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormModal;