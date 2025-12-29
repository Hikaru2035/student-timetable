import './TaskTable.css';

export function TaskTable({ tasks, selectedTaskIds, onToggleTask, onToggleStatus }) {

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <div className="task-table-wrapper">
      <table className="task-table">
        <thead>
          <tr>
            <th className="checkbox-column"></th>
            <th>Task Name</th>
            <th>Deadline</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty-state">
                No tasks found
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(task.id)}
                    onChange={() => onToggleTask(task.id)}
                    className="task-checkbox"
                  />
                </td>
                <td className="task-name">{task.name}</td>
                <td className="task-deadline">
                  {formatDate(task.deadline)}
                </td>

                <td>
                  <button
                    onClick={() => onToggleStatus(task.id)}
                    className={`status-badge ${task.status}`}
                  >
                    {task.status === 'done' ? 'Done' : 'To Do'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}