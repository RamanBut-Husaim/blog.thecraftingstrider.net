import {
  getAssetFromKV
} from '@cloudflare/kv-asset-handler'

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false

addEventListener('fetch', event => {
  try {
    let response = handleEvent(event);
    return sendResponse(event, response);
  } catch (e) {
    if (DEBUG) {
      let response = new Response(e.message || e.toString(), {
        status: 500,
        headers: new Headers()
      });

      return sendResponse(event, wrapResponseInPromise(response));
    }

    let response = new Response('Internal Error', {
      status: 500,
      headers: new Headers()
    });

    return sendResponse(event, wrapResponseInPromise(response));
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  let options = {}

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  // options.mapRequestToAsset = handlePrefix(/^\/docs/)

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      }
    }
    return await getAssetFromKV(event, options)
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404
        })
      } catch (e) { }
    }

    return new Response(e.message || e.toString(), {
      status: 500,
      headers: new Headers()
    })
  }
}

/**
 * Wraps response in promise to unify the processing.
 *
 * @param {Response} response a response object
 * @returns {Promise} a promise of the response
 * */
function wrapResponseInPromise(response) {
  return new Promise((resolve, _) => {
    return resolve(response);
  });
}

/**
 * Perform post processing and send response.
 *
 * @param {event} event the fetch event of the triggered request
 * @param {Promise} response a promise for a response object
 * */
function sendResponse(event, response) {
  let responseWithSecurityHeaders = enrichWithSecurityHeaders(response);

  return event.respondWith(responseWithSecurityHeaders);
}

/**
 * Add security headers to the response.
 *
 * @param {Promise} response a promise for a response object
 * @returns {Promise} A promise with the response enriched with security headers.
 * */
function enrichWithSecurityHeaders(response) {
  return response.then(resp => {
    if (resp.headers) {
      resp.headers.set("X-Frame-Options", "sameorigin");
      resp.headers.set("X-XSS-Protection", "1; mode=block");
      resp.headers.set("X-Content-Type-Options", "nosniff");
      resp.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      resp.headers.set("Feature-Policy", "accelerometer 'none'; autoplay 'self'; camera 'none'; geolocation 'none'; gyroscope 'none'; magnetometer 'none'; microphone 'none'; midi 'none'; payment 'none'; speaker 'none'; usb 'none'");
      resp.headers.set("Content-Security-Policy", "default-src 'self'; font-src 'self' https://kit-free.fontawesome.com https://fonts.gstatic.com; frame-src 'none'; media-src 'none'; object-src 'none'; style-src 'unsafe-inline' 'self' https://kit-free.fontawesome.com https://cdnjs.cloudflare.com https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https://ajax.cloudflare.com https://kit.fontawesome.com; worker-src 'none'");
    }

    return resp;
  });
}
