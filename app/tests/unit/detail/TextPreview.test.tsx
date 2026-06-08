import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TextPreview } from '@/features/detail/preview/TextPreview';

vi.mock('@/lib/shikiHighlighter', () => ({
  highlightCode: vi.fn().mockRejectedValue(new Error('highlight failed')),
}));

describe('TextPreview', () => {
  it('falls back to raw text when highlighting fails', async () => {
    const blob = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    render(
      <TextPreview blob={blob} keyName="test.txt" contentType="text/plain" />,
    );

    await waitFor(() => {
      expect(screen.getByText('hello world')).toBeInTheDocument();
    });
  });
});
