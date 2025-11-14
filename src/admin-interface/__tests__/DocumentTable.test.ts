import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DocTable from '@/components/DocTable';
import { useRouter } from 'next/router';
import { useSearchParams, usePathname } from 'next/navigation';
import { useDocsStore, useTagsStore } from '@/lib/useStore';

jest.mock('next/navigation', () => ({
    useSearchParams: jest.fn(),
    usePathname: jest.fn(),
  }));
  
  jest.mock('next/router', () => ({
    useRouter: jest.fn(),
  }));
  
  jest.mock('../stores', () => ({
    useDocsStore: jest.fn(),
    useTagsStore: jest.fn(),
  }));
  
  const mockDocs = [
    { id: 1, title: 'Document 1', topic: 'Topic A', tag: 'Tag 1', ownerImgUrl: '', ownerName: 'Owner 1', size: 2, createdAt: '2021-01-01' },
    { id: 2, title: 'Document 2', topic: 'Topic B', tag: 'Tag 2', ownerImgUrl: '', ownerName: 'Owner 2', size: 3, createdAt: '2021-02-01' },
  ];
  
  const mockTags = ['Tag 1', 'Tag 2'];
  
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
  };
  
  const mockUseSearchParams = {
    get: jest.fn(),
    set: jest.fn(),
    toString: jest.fn(),
  };
  
  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    useSearchParams.mockReturnValue(mockUseSearchParams);
    usePathname.mockReturnValue('/documents');
    useDocsStore.mockReturnValue({
      docs: mockDocs,
      setDocs: jest.fn(),
    });
    useTagsStore.mockReturnValue({
      tags: mockTags,
      setTags: jest.fn(),
    });
  
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          payload: { docs: mockDocs, docsCount: mockDocs.length, userInFilter: null },
        }),
      })
    );
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders DocTable and displays documents', async () => {
    render(<DocTable adminTags={mockTags} search="" currentPage={1} numberOfDocs={2} />);
  
    expect(screen.getByPlaceholderText(/search by title or topic/i)).toBeInTheDocument();
    expect(await screen.findByText(/document 1/i)).toBeInTheDocument();
    expect(screen.getByText(/document 2/i)).toBeInTheDocument();
  });
  
  test('handles search input and updates URL', async () => {
    render(<DocTable adminTags={mockTags} search="" currentPage={1} numberOfDocs={2} />);
  
    const searchInput = screen.getByPlaceholderText(/search by title or topic/i);
    fireEvent.change(searchInput, { target: { value: 'Document 1' } });
  
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/documents?search=Document 1&page=1');
    });
  });
  
  test('handles selecting and deselecting items', async () => {
    render(<DocTable adminTags={mockTags} search="" currentPage={1} numberOfDocs={2} />);
  
    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(firstCheckbox);
  
    expect(firstCheckbox).toBeChecked();
  
    const selectAllCheckbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(selectAllCheckbox);
  
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });
  
  test('handles pagination', async () => {
    render(<DocTable adminTags={mockTags} search="" currentPage={1} numberOfDocs={2} />);
  
    const nextPageButton = screen.getByText(/caret right icon/i);
    fireEvent.click(nextPageButton);
  
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/documents?page=2&n=2');
    });
  });
