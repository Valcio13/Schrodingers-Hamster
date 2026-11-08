// Cloudflare Pages Function: Proxy /api/* to the production Worker API
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const workerTarget = `https://schrodingers-hamster.valcio222.workers.dev${url.pathname}${url.search}`;
  
  // Forward request with all headers and body
  const forwardedRequest = new Request(workerTarget, context.request);
  return fetch(forwardedRequest);
};
