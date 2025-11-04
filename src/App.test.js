import { render, screen } from '@testing-library/react';
import App from './App';

test('renders APTIVM2 app without crashing', () => {
  render(<App />);
  // Check if the app renders without throwing errors
  expect(screen.getByText(/APTIVM2/i)).toBeInTheDocument();
});
