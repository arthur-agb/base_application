import React from 'react';
import { Circle, CheckCircle, XCircle, Clock } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const statusStyles = {
        OPEN: { icon: Circle, text: 'Open', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
        IN_PROGRESS: { icon: Clock, text: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        COMPLETED: { icon: CheckCircle, text: 'Completed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
        ARCHIVED: { icon: XCircle, text: 'Archived', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    };
    const style = statusStyles[status] || statusStyles.OPEN;
    const Icon = style.icon;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.color}`}>
            <Icon className="mr-1.5 h-3 w-3" />
            {style.text}
        </span>
    );
}

export default StatusBadge;