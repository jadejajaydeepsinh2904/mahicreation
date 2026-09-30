import {handle} from '../server/vercel-handler.js';
export default {fetch: (request: Request) => handle(request, '/api/upload')};
