import { getThumbnailUrl } from './cloudinaryHelper';

describe('getThumbnailUrl', () => {
  it('should return original URL if not a string', () => {
    expect(getThumbnailUrl(null)).toBe(null);
    expect(getThumbnailUrl(undefined)).toBe(undefined);
    expect(getThumbnailUrl(123)).toBe(123);
  });

  it('should return original URL for Cloudinary URLs with /image/upload/', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v123/sample.jpg';
    const result = getThumbnailUrl(url, 400, null, 60);
    expect(result).toBe('https://res.cloudinary.com/demo/image/upload/w_400,c_fill,q_60,f_auto,fl_lossy/v123/sample.jpg');
  });

  it('should handle Cloudinary URLs with res.cloudinary.com', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v123/sample.jpg';
    const result = getThumbnailUrl(url, 400, 300, 80);
    expect(result).toBe('https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill,q_80,f_auto,fl_lossy/v123/sample.jpg');
  });

  it('should return original URL for non-Cloudinary URLs', () => {
    const url = 'https://example.com/image.jpg';
    expect(getThumbnailUrl(url)).toBe(url);
  });

  it('should return original URL for data URLs', () => {
    const url = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
    expect(getThumbnailUrl(url)).toBe(url);
  });

  it('should handle errors gracefully', () => {
    const mockUrl = {};
    mockUrl.toLowerCase = () => { throw new Error('Test error'); };
    expect(getThumbnailUrl(mockUrl)).toBe(mockUrl);
  });

  it('should use default parameters', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v123/sample.jpg';
    const result = getThumbnailUrl(url);
    expect(result).toBe('https://res.cloudinary.com/demo/image/upload/w_400,c_fill,q_60,f_auto,fl_lossy/v123/sample.jpg');
  });
});
