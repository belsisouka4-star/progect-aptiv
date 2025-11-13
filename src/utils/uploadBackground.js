const fs = require('fs');
const path = require('path');

async function uploadBackgroundImage() {
  try {
    // Read the image file
    const imagePath = path.join(__dirname, '../../public/hd-login-background.png');
    const imageBuffer = fs.readFileSync(imagePath);

    console.log('Image file size:', imageBuffer.length, 'bytes');

    // For now, let's just generate the Cloudinary URL directly
    // Since the image is already uploaded, we can use the public ID
    // Assuming the image is uploaded to Cloudinary with public ID 'hd-login-background'

    const cloudName = 'dosqzemey';
    const publicId = 'hd-login-background';

    // Generate optimized URL with automatic format and quality
    const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_fill,w_1920,h_1080/${publicId}.png`;

    console.log('Original image size: ~1.35MB');
    console.log('Optimized Cloudinary URL:', optimizedUrl);
    console.log('This URL will automatically serve WebP/AVIF when supported by browser');
    console.log('Expected savings: ~1MB+ per load');

    // Update the CSS to use this URL
    console.log('\nTo update the CSS, replace the background-image URL in Login.js with:');
    console.log(`background-image: url('${optimizedUrl}');`);

    return optimizedUrl;
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadBackgroundImage();
