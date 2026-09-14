import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteMarkdownRenderer } from '../NoteMarkdownRenderer';
import { NoteAnnotation } from '@/types/annotation';

describe('NoteMarkdownRenderer', () => {
  it('should render nothing when content is null or empty', () => {
    const { container } = render(<NoteMarkdownRenderer content="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render headings, lists, bold text and paragraphs', () => {
    const markdown = [
      '## Main Heading',
      '### Sub Heading',
      '#### Minor Heading',
      '- Bullet point with **bold** text',
      'Normal paragraph text',
    ].join('\n');

    render(<NoteMarkdownRenderer content={markdown} />);

    expect(screen.getByText('Main Heading')).toBeInTheDocument();
    expect(screen.getByText('Sub Heading')).toBeInTheDocument();
    expect(screen.getByText('Minor Heading')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('Normal paragraph text')).toBeInTheDocument();
  });

  it('should render annotations with highlight and handle clicks', () => {
    const markdown = 'This is a sample text with important insights inside.';
    const mockAnnotation: NoteAnnotation = {
      id: 'ann-1',
      noteId: 'note-1',
      text: 'important insights',
      comment: 'Key concept to remember',
      color: 'amber',
      createdAt: new Date().toISOString(),
    };

    const handleAnnotationClick = jest.fn();

    render(
      <NoteMarkdownRenderer
        content={markdown}
        annotations={[mockAnnotation]}
        onAnnotationClick={handleAnnotationClick}
      />,
    );

    const highlightedText = screen.getByText('important insights');
    expect(highlightedText).toBeInTheDocument();

    const markElement = highlightedText.closest('mark');
    expect(markElement).toBeInTheDocument();

    if (markElement) {
      fireEvent.click(markElement);
      expect(handleAnnotationClick).toHaveBeenCalledWith(
        mockAnnotation,
        expect.anything(),
      );
    }
  });
});
