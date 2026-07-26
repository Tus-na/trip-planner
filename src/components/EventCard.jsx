import React from 'react';
import dayjs from 'dayjs';
import { MapPin, Calendar, Tag, DollarSign, Users, Edit, Trash2 } from 'lucide-react';

const EventCard = ({ event, onEdit, onDelete, canModify }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Sắp tới':
        return 'bg-blue-100 text-blue-800';
      case 'Đang diễn ra':
        return 'bg-green-100 text-green-800';
      case 'Đã xong':
        return 'bg-gray-100 text-gray-800';
      case 'Hủy':
        return 'bg-red-100 text-red-800';
      case 'Tạm hoãn':
        return 'bg-yellow-100 text-yellow-800';
      case 'Chờ duyệt':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between border border-gray-200">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(event.status)}`}>
            {event.status}
          </span>
        </div>
        <p className="text-gray-600 mb-4 text-sm">{event.description}</p>

        <div className="space-y-2 text-gray-700 text-sm">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <span>
              {dayjs(event.start_time).format('HH:mm DD/MM/YYYY')} - {dayjs(event.end_time).format('HH:mm DD/MM/YYYY')}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.location}</span>
            </div>
          )}
          {event.category && (
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.category}</span>
            </div>
          )}
          {event.cost > 0 && (
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
              <span>Chi phí: {event.cost.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}
          {event.payer && (
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              <span>Người trả: {event.payer.name}</span>
            </div>
          )}
          {event.assigned_members && event.assigned_members.length > 0 && (
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              <span>Tham gia: {event.assigned_members.map(member => member.name).join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {canModify && (
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={() => onEdit(event)}
            className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-200"
            title="Chỉnh sửa"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
            title="Xóa"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCard;