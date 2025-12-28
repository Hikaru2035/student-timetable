import { Plus, Trash, Pencil } from 'lucide-react';
import './ActionButtons.css';

export function ActionButtons({ hasSelection, canUpdate, onAdd, onUpdate, onDelete }) {
  return (
    <div className="action-buttons">
      {!hasSelection ? (
        <button onClick={onAdd} className="action-button add">
          <Plus />
          Add New Task
        </button>
      ) : (
        <>
          <button onClick={onDelete} className="action-button delete">
            <Trash />
            Delete
          </button>
          {canUpdate && (
            <button onClick={onUpdate} className="action-button update">
              <Pencil />
              Update
            </button>
          )}
        </>
      )}
    </div>
  );
}
