import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { shortenUrl, fetchMyUrls } from '../api/urls';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IUrl } from '@repo/types';

function HomePage() {
  const { isAuthenticated, token, logout, user } = useAuth();
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState<IUrl | null>(null);
  const queryClient = useQueryClient();

  const shortenMutation = useMutation({
    mutationFn: (url: string) => shortenUrl({ originalUrl: url }, token),
    onSuccess: (data) => {
      setShortenedUrl(data.data || null);
      setOriginalUrl(''); // Clear input after shortening
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['myUrls', user?.userId] }); // Invalidate user's URLs
      }
    },
    onError: (error) => {
      alert(`Failed to shorten URL: ${error.message}`);
    },
  });

  const {
    data: myUrlsData,
    isLoading: isLoadingMyUrls,
    isError: isErrorMyUrls,
  } = useQuery<IUrl[]>({
    queryKey: ['myUrls', user?.userId],
    queryFn: () => fetchMyUrls(token!).then((res) => res.data!),
    enabled: isAuthenticated && !!token && !!user?.userId, // Only fetch if authenticated
  });

  const handleShortenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    shortenMutation.mutate(originalUrl);
  };

  return (
    <div className="font-inter flex min-h-screen flex-col items-center bg-gray-100 p-4">
      <nav className="mt-4 flex w-full max-w-4xl items-center justify-between rounded-lg bg-white px-6 py-4 shadow-md">
        <h2 className="text-2xl font-bold text-gray-800">URL Shortener</h2>
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.email}!</span>
            <Button onClick={logout} variant="secondary">
              Logout
            </Button>
          </div>
        ) : (
          <Button onClick={() => (window.location.href = '/login')}>Login / Register</Button>
        )}
      </nav>

      <main className="mt-8 flex w-full max-w-4xl flex-col gap-8 rounded-lg bg-white p-8 shadow-xl md:flex-row">
        {/* URL Shortener Section */}
        <div className="flex-1">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">Shorten a URL</h2>
          <form onSubmit={handleShortenSubmit} className="space-y-4">
            <div>
              <Label htmlFor="originalUrl">Original URL</Label>
              <Input
                id="originalUrl"
                type="url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="[https://www.example.com/very/long/url](https://www.example.com/very/long/url)"
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={shortenMutation.isPending}>
              {shortenMutation.isPending ? 'Shortening...' : 'Shorten URL'}
            </Button>
          </form>

          {shortenedUrl && (
            <div className="mt-8 rounded-md border border-blue-200 bg-blue-50 p-4 text-left">
              <p className="mb-2 text-gray-700">Your shortened URL:</p>
              <a
                href={`http://localhost:5000/${shortenedUrl.shortCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium break-all text-blue-600 hover:underline"
              >
                {`http://localhost:5000/${shortenedUrl.shortCode}`}
              </a>
              <Button
                onClick={() =>
                  navigator.clipboard.writeText(`http://localhost:5000/${shortenedUrl.shortCode}`)
                }
                className="mt-3 w-full bg-green-500 hover:bg-green-600"
              >
                Copy to Clipboard
              </Button>
              <p className="mt-2 text-sm text-gray-500">Clicks: {shortenedUrl.clicks}</p>
            </div>
          )}
        </div>

        {/* My URLs Section */}
        {isAuthenticated && (
          <div className="flex-1 border-t border-gray-200 pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">My Shortened URLs</h2>
            {isLoadingMyUrls && <p>Loading your URLs...</p>}
            {isErrorMyUrls && <p className="text-red-500">Error loading URLs. Please try again.</p>}
            {!isLoadingMyUrls && !isErrorMyUrls && myUrlsData?.length === 0 && (
              <p className="text-gray-600">You haven't shortened any URLs yet.</p>
            )}
            <ul className="space-y-4">
              {myUrlsData?.map((url) => (
                <li key={url._id} className="rounded-md bg-gray-50 p-4 shadow-sm">
                  <p className="max-w-prose truncate text-sm text-gray-500">{url.originalUrl}</p>
                  <a
                    href={`http://localhost:5000/api/urls/${url.shortCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium break-all text-blue-600 hover:underline"
                  >
                    {`http://localhost:5000/${url.shortCode}`}
                  </a>
                  <p className="mt-1 text-xs text-gray-500">
                    Clicks: {url.clicks} | Created: {new Date(url.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;
