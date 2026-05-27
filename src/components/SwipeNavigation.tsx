import { useSwipeable } from 'react-swipeable';
import { useLocation, useNavigate } from 'react-router-dom';

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

  const isMainPage = currentIndex !== -1;

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMainPage && currentIndex > 0) {
        navigate(PAGES[currentIndex - 1]);
      }
    },
    onSwipedRight: () => {
      if (isMainPage && currentIndex < PAGES.length - 1) {
        navigate(PAGES[currentIndex + 1]);
      }
    },
    trackMouse: true,
    trackTouch: true,
    delta: 50,
  });

  if (!isMainPage) {
    return <>{children}</>;
  }

  return (
    <div {...handlers} className="w-full min-h-screen bg-background">
      {children}
    </div>
  );
};