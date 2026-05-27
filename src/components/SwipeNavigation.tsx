import { useSwipeable } from 'react-swipeable';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Define the order of pages for swipe navigation
const PAGES = ['/feelings', '/', '/tasks', '/divinity'];

interface SwipeNavigationProps {
  children: React.ReactNode;
}

export const SwipeNavigation = ({ children }: SwipeNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get current page index
  const currentIndex = PAGES.indexOf(location.pathname);

  // Don't enable swipe if not in main pages
  if (currentIndex === -1) {
    return <>{children}</>;
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Swipe left -> go to previous page
      if (currentIndex > 0) {
        navigate(PAGES[currentIndex - 1]);
      }
    },
    onSwipedRight: () => {
      // Swipe right -> go to next page
      if (currentIndex < PAGES.length - 1) {
        navigate(PAGES[currentIndex + 1]);
      }
    },
    trackMouse: true, // Enable swipe with mouse for desktop testing
    trackTouch: true, // Enable swipe with touch for mobile
    delta: 50, // Minimum swipe distance to trigger navigation
  });

  return (
    <div {...handlers} className="w-full min-h-screen bg-background">
      {children}
    </div>
  );
};
