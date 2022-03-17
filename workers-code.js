// HTML to be shown on the / path. (Could be split into different files)
const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Zaraz Take Home Test</title>
    <meta charset="utf-8">
  </head>
  <body>
    <p>Welcome to my take home test! :)</p>
    <p>Please check the console output.</p>

    <script>
      const name = "Tom Klein";
      const quote = 'I own yourname.xyz';

      window.name = name;
      window.quote = quote;
    </script>

    <script defer src="/script.js"></script>
  </body>
</html>
`;

// JS to be shown on /script.js. (Again, could be split into different files)
const javascript = `
  /* Helper function to read non-HTTP-only cookie (as they are not 
   * accessible from client-side JS otherwise).
   */
  function readCookie(name) {
    const safeName = encodeURIComponent(name);
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(safeName + '='));

    if (!cookie) {
      return false;
    }

    return cookie.split('=')[1];
  }

  // Read name/quote cookies
  if (readCookie('name') && readCookie('quote')) {
    console.log(readCookie('name'), readCookie('quote'));
  } else {
    // CORS Header on endpoint would be needed if the endpoint is on a different (sub-)domain
    fetch('https://cf-zaraz-take-home-test.klein.workers.dev/post-me', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          name: window.name,
          quote: window.quote,
      }),
    }).then(async (response) => {
      console.log(await response.json());
    });
  }
`;

// Handle Request
async function handleRequest(request) {
  // Get Pathname from requested URL
  const { pathname } = new URL(request.url);

  if (pathname === '/') {
    // Return HTML
    return new Response(html, {
      headers: {
        'content-type': 'text/html',
      },
    });
  } else if (pathname === '/script.js') {
    // Return JS
    return new Response(javascript, {
      headers: {
        'content-type': 'text/javascript',
      },
    });
  } else if (pathname === '/post-me') {
    // POST request endpoint
    if (request.method === 'POST') {
      let responseBody = await request.json();

      return new Response(JSON.stringify({
        name: responseBody.name || 'N/A',
        quote: responseBody.quote || 'N/A',
        ip: request.headers.get('cf-connecting-ip'), // Expected to always be set
      }), { 
        headers: {
          'content-type': 'application/json',
          'set-cookie': [
            `name=${responseBody.name}; Expires=${2**31-1}`,
            `quote=${responseBody.quote}; Expires=${2**31-1}`,
          ]
        }
      });  
    } else {
      return new Response('405 Method Not Allowed', { status: 405 });  
    }
  } else {
    // You certainly know what it does :P
    return new Response('404 Page Not Found', { status: 404 });
  }
}

addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request));
});