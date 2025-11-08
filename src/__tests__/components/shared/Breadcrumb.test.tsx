/**
 * Component Tests for Breadcrumb
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Breadcrumb, generateBreadcrumbSegments } from '../../../components/shared/Breadcrumb';

describe('Breadcrumb Component', () => {
  describe('Component Rendering', () => {
    it('should render breadcrumb segments', () => {
      const segments = [
        { label: 'All', path: null },
        { label: 'Frameworks', path: 'Frameworks' },
        { label: 'MyFramework.framework', path: 'Frameworks/MyFramework.framework' },
      ];
      const onSegmentClick = vi.fn();

      render(<Breadcrumb segments={segments} onSegmentClick={onSegmentClick} />);

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Frameworks')).toBeInTheDocument();
      expect(screen.getByText('MyFramework.framework')).toBeInTheDocument();
    });

    it('should render separators between segments', () => {
      const segments = [
        { label: 'All', path: null },
        { label: 'Frameworks', path: 'Frameworks' },
      ];
      const onSegmentClick = vi.fn();

      const { container } = render(
        <Breadcrumb segments={segments} onSegmentClick={onSegmentClick} />
      );

      const separators = container.querySelectorAll('span[aria-hidden="true"]');
      expect(separators.length).toBe(1); // One separator between two segments
    });

    it('should disable the last segment', () => {
      const segments = [
        { label: 'All', path: null },
        { label: 'Current', path: 'Current' },
      ];
      const onSegmentClick = vi.fn();

      render(<Breadcrumb segments={segments} onSegmentClick={onSegmentClick} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).not.toBeDisabled(); // First segment (All)
      expect(buttons[1]).toBeDisabled(); // Last segment (Current)
    });

    it('should render nothing when segments array is empty', () => {
      const onSegmentClick = vi.fn();

      const { container } = render(
        <Breadcrumb segments={[]} onSegmentClick={onSegmentClick} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Click Handling', () => {
    it('should call onSegmentClick when clickable segment is clicked', () => {
      const segments = [
        { label: 'All', path: null },
        { label: 'Frameworks', path: 'Frameworks' },
        { label: 'Current', path: 'Frameworks/Current' },
      ];
      const onSegmentClick = vi.fn();

      render(<Breadcrumb segments={segments} onSegmentClick={onSegmentClick} />);

      const allButton = screen.getByText('All');
      fireEvent.click(allButton);

      expect(onSegmentClick).toHaveBeenCalledWith(null);
    });

    it('should call onSegmentClick with correct path', () => {
      const segments = [
        { label: 'All', path: null },
        { label: 'Frameworks', path: 'Frameworks' },
        { label: 'Current', path: 'Frameworks/Current' },
      ];
      const onSegmentClick = vi.fn();

      render(<Breadcrumb segments={segments} onSegmentClick={onSegmentClick} />);

      const frameworksButton = screen.getByText('Frameworks');
      fireEvent.click(frameworksButton);

      expect(onSegmentClick).toHaveBeenCalledWith('Frameworks');
    });

    it('should not call onSegmentClick when last segment is clicked', () => {
      const segments = [
        { label: 'All', path: null },
        { label: 'Current', path: 'Current' },
      ];
      const onSegmentClick = vi.fn();

      render(<Breadcrumb segments={segments} onSegmentClick={onSegmentClick} />);

      const currentButton = screen.getByText('Current');
      fireEvent.click(currentButton);

      expect(onSegmentClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      const segments = [
        { label: 'All', path: null },
        { label: 'Current', path: 'Current' },
      ];
      const onSegmentClick = vi.fn();

      render(<Breadcrumb segments={segments} onSegmentClick={onSegmentClick} />);

      const nav = screen.getByRole('navigation', { name: 'Hierarchy navigation' });
      expect(nav).toBeInTheDocument();
    });

    it('should mark last segment with aria-current', () => {
      const segments = [
        { label: 'All', path: null },
        { label: 'Current', path: 'Current' },
      ];
      const onSegmentClick = vi.fn();

      render(<Breadcrumb segments={segments} onSegmentClick={onSegmentClick} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[1]).toHaveAttribute('aria-current', 'page');
    });
  });
});

describe('generateBreadcrumbSegments', () => {
  it('should generate segments for null path (root only)', () => {
    const segments = generateBreadcrumbSegments(null, 'All');

    expect(segments).toEqual([{ label: 'All', path: null }]);
  });

  it('should generate segments for single-level path', () => {
    const segments = generateBreadcrumbSegments('Frameworks', 'All');

    expect(segments).toEqual([
      { label: 'All', path: null },
      { label: 'Frameworks', path: 'Frameworks' },
    ]);
  });

  it('should generate segments for multi-level path', () => {
    const segments = generateBreadcrumbSegments(
      'Frameworks/MyFramework.framework/Resources',
      'All'
    );

    expect(segments).toEqual([
      { label: 'All', path: null },
      { label: 'Frameworks', path: 'Frameworks' },
      { label: 'MyFramework.framework', path: 'Frameworks/MyFramework.framework' },
      { label: 'Resources', path: 'Frameworks/MyFramework.framework/Resources' },
    ]);
  });

  it('should use custom root label', () => {
    const segments = generateBreadcrumbSegments('Frameworks', 'Root');

    expect(segments[0]?.label).toBe('Root');
  });
});
