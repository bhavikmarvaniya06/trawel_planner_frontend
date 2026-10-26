import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import api from './services/api';

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

jest.mock('./services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
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
  const mainNavigation = within(screen.getByRole('navigation', { name: /main navigation/i }));
  expect(mainNavigation.getByRole('link', { name: /^explore$/i })).toHaveAttribute('href', '/explore');
  expect(mainNavigation.getByRole('link', { name: /our story/i })).toHaveAttribute('href', '/about');
  expect(screen.getByRole('heading', { name: /a calmer, more personal way to plan/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /get to know tripai/i })).toHaveAttribute('href', '/about');
  expect(screen.getByRole('link', { name: /see all/i })).toHaveAttribute('href', '/explore');
  expect(screen.getByRole('link', { name: /plan a trip to goa/i })).toHaveAttribute(
    'href',
    '/planner?destination=Goa'
  );
  expect(screen.getByRole('heading', { name: /your first ai trip is free/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /start planning/i })).toHaveAttribute(
    'href',
    '/planner'
  );
});

test('Explore shows every destination and image fallback', async () => {
  api.get.mockResolvedValue({ data: { destinations: [] } });
  window.history.replaceState({}, '', '/explore');
  render(<App />);

  expect(await screen.findByRole('heading', { name: /discover your next adventure/i }, { timeout: 5000 })).toBeInTheDocument();

  const destinationImages = screen.getAllByRole('img');
  expect(destinationImages).toHaveLength(44);
  fireEvent.error(destinationImages[0]);
  expect(destinationImages[0]).toHaveAttribute('src', '/destination-fallback.svg');
  expect(screen.getAllByRole('link', { name: /plan a trip/i })[0]).toHaveAttribute(
    'href',
    '/planner?destination=Goa'
  );
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

  expect(await screen.findByLabelText(/destination \(optional for ai ideas\)/i, {}, { timeout: 5000 })).toHaveValue('Bali');
  mockUser = null;
}, 15000);

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
