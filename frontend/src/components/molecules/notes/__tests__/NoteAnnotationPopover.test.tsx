import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteAnnotationPopover } from '../NoteAnnotationPopover';
import { NoteAnnotation } from '@/types/annotation';

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      if (key === 'common.close') return 'Đóng';
      if (key === 'common.save') return 'Lưu';
      if (key === 'common.delete') return 'Xóa';
      if (key === 'common.cancel') return 'Hủy';
      return key;
    },
  }),
}));

describe('NoteAnnotationPopover', () => {
  const defaultPosition = { top: 200, left: 300 };

  it('should render create mode with selected text', () => {
    const handleSave = jest.fn();
    const handleClose = jest.fn();

    render(
      <NoteAnnotationPopover
        position={defaultPosition}
        selectedText="Selected phrase"
        onSave={handleSave}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText('Thêm ghi chú cho đoạn')).toBeInTheDocument();
    expect(screen.getByText(/Selected phrase/)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(
      'Viết suy nghĩ, ghi chú hoặc phân tích của bạn...',
    );
    fireEvent.change(textarea, { target: { value: 'My custom comment' } });

    const saveButton = screen.getByRole('button', { name: 'Lưu ghi chú' });
    fireEvent.click(saveButton);

    expect(handleSave).toHaveBeenCalledWith({
      text: 'Selected phrase',
      comment: 'My custom comment',
      color: 'amber',
    });
  });

  it('should render edit mode with existing annotation and handle update and delete', () => {
    const existingAnnotation: NoteAnnotation = {
      id: 'ann-1',
      noteId: 'note-1',
      text: 'Quoted phrase',
      comment: 'Old comment',
      color: 'blue',
      createdAt: new Date().toISOString(),
    };

    const handleUpdate = jest.fn();
    const handleDelete = jest.fn();
    const handleClose = jest.fn();

    render(
      <NoteAnnotationPopover
        position={defaultPosition}
        selectedText="Quoted phrase"
        existingAnnotation={existingAnnotation}
        onSave={jest.fn()}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText('Chi tiết ghi chú')).toBeInTheDocument();
    const textarea = screen.getByDisplayValue('Old comment');
    fireEvent.change(textarea, { target: { value: 'New updated comment' } });

    const updateButton = screen.getByRole('button', { name: 'Lưu' });
    fireEvent.click(updateButton);

    expect(handleUpdate).toHaveBeenCalledWith('ann-1', {
      comment: 'New updated comment',
      color: 'blue',
    });

    const deleteButton = screen.getByRole('button', { name: 'Xóa' });
    fireEvent.click(deleteButton);
    expect(handleDelete).toHaveBeenCalledWith('ann-1');
  });
});
