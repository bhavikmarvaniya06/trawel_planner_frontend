import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

let mockUser = null;
let mockLogin = jest.fn(async () => {
  mockUser = { role: 'traveler' };
  return { user: mockUser };
});

jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: mockLogin,
    register: jest.fn(),
    requestOtp: jest.fn(),
    loginWithOtp: jest.fn(),
    logout: jest.fn(),
  }),
}));

test('opens the login page at the root URL', async () => {
  window.history.replaceState({}, '', '/');
  render(<App />);

  expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
});

test('shows the public home page at /home', async () => {
  window.history.replaceState({}, '', '/home');
  render(<App />);

  expect(await screen.findByRole('heading', { name: /discover the world/i }, { timeout: 5000 })).toBeInTheDocument();

  const destinationImages = screen.getAllByRole('img');
  expect(destinationImages).toHaveLength(9);
  fireEvent.error(destinationImages[0]);
  expect(destinationImages[0]).toHaveAttribute('src', '/destination-fallback.svg');
  expect(screen.getByRole('link', { name: /see all/i })).toHaveAttribute('href', '/explore');
});

test('Explore shows every destination and image fallback', async () => {
  window.history.replaceState({}, '', '/explore');
  render(<App />);

  expect(await screen.findByRole('heading', { name: /discover your next adventure/i }, { timeout: 5000 })).toBeInTheDocument();

  const destinationImages = screen.getAllByRole('img');
  expect(destinationImages).toHaveLength(44);
  fireEvent.error(destinationImages[0]);
  expect(destinationImages[0]).toHaveAttribute('src', '/destination-fallback.svg');
});

test('shows destination suggestions while typing on the home page', async () => {
  window.history.replaceState({}, '', '/home');
  render(<App />);

  const input = await screen.findByLabelText(/where do you want to go/i);
  fireEvent.change(input, { target: { value: 'Pa' } });

  expect(await screen.findByRole('option', { name: /paris/i })).toBeInTheDocument();
});

test('passes the searched destination into the planner form', async () => {
  mockUser = { role: 'traveler' };
  window.history.replaceState({}, '', '/home');
  render(<App />);

  fireEvent.change(await screen.findByLabelText(/search destinations/i), {
    target: { value: 'Bali' },
  });
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(await screen.findByLabelText(/destination \(optional for ai ideas\)/i)).toHaveValue('Bali');
  mockUser = null;
});

test('returns a signed-out search to the planner after login', async () => {
  mockUser = null;
  mockLogin.mockImplementation(async () => {
    mockUser = { role: 'traveler' };
    return { user: mockUser };
  });
  window.history.replaceState({}, '', '/home');
  render(<App />);

  fireEvent.change(await screen.findByLabelText(/search destinations/i), {
    target: { value: 'Bali' },
  });
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
    target: { value: 'traveler@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
    target: { value: 'password' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

  expect(await screen.findByLabelText(/destination \(optional for ai ideas\)/i)).toHaveValue('Bali');
});

test('sends the AI planner button through login to the planner', async () => {
  mockUser = null;
  mockLogin.mockImplementation(async () => {
    mockUser = { role: 'traveler' };
    return { user: mockUser };
  });
  window.history.replaceState({}, '', '/home');
  render(<App />);

  fireEvent.click(await screen.findByRole('button', { name: /plan my trip with ai/i }));
  expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
    target: { value: 'traveler@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
    target: { value: 'password' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

  expect(await screen.findByLabelText(/destination \(optional for ai ideas\)/i)).toBeInTheDocument();
  mockUser = null;
});
